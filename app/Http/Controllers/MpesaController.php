<?php

namespace App\Http\Controllers;

use App\Models\MpesaTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class MpesaController extends Controller
{
    protected $consumerKey;
    protected $consumerSecret;
    protected $baseUrl;
    protected $callbackUrl;
    protected $shortcode;
    protected $passkey;
    protected $accountReference;
    protected $transactionDesc;

    public function __construct()
    {
        // Safaricom sandbox credentials
        $this->consumerKey = env('MPESA_CONSUMER_KEY', 'bASvJGfZynfXhMoEGeLaQEAORlMWETRhrA6qSPMFmBDGRt47');
        $this->consumerSecret = env('MPESA_CONSUMER_SECRET', 'Ozz7pIgqA64AOSl5NNjx3bgu5M6JDRLoEPS01FocG26xBQPnjc5hQIGGaKFxnpzH');
        $this->baseUrl = env('MPESA_BASE_URL', 'https://sandbox.safaricom.co.ke');
        // For callback, must be a publicly accessible URL
        $this->callbackUrl = env('MPESA_CALLBACK_URL', url('/api/mpesa/callback'));
        $this->shortcode = env('MPESA_SHORTCODE', '174379'); // Standard test shortcode
        $this->passkey = env('MPESA_PASSKEY', 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919');
        $this->accountReference = 'Pro Membership';
        $this->transactionDesc = 'Pro Membership Fee';
    }

    /**
     * Display the payment configuration
     */
    public function index()
    {
        return response()->json([
            'amount' => 1000, // Fixed amount for Pro Membership
            'logoUrl' => asset('images/mpesa-logo.png')
        ]);
    }

    /**
     * Get M-Pesa access token
     */
    private function getAccessToken()
    {
        try {
            $credentials = base64_encode($this->consumerKey . ':' . $this->consumerSecret);

            $response = Http::withOptions([
                'verify' => false, // Skip SSL verification for sandbox environment
            ])->withHeaders([
                'Authorization' => 'Basic ' . $credentials
            ])->get($this->baseUrl . '/oauth/v1/generate?grant_type=client_credentials');

            $result = $response->json();

            if (!$response->successful()) {
                Log::error('M-Pesa Access Token Error Response', $result);
                throw new \Exception('Failed to get access token: ' . ($result['errorMessage'] ?? 'Unknown error'));
            }

            Log::info('M-Pesa Access Token Response', [
                'status' => 'success',
                'token_received' => isset($result['access_token'])
            ]);

            if (isset($result['access_token'])) {
                return $result['access_token'];
            }

            throw new \Exception('Access token not found in response');
        } catch (\Exception $e) {
            Log::error('M-Pesa Access Token Error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Initiate STK Push transaction
     */
    public function stkPush(Request $request)
    {
        try {
            // Validate input
            $validated = $request->validate([
                'phoneNumber' => 'required|regex:/^254[0-9]{9}$/',
                'amount' => 'required|numeric|min:100', // Minimum 100 KES
            ]);

            // For testing, we'll use a fixed reference
            $accountReference = 'Pro Membership';
            $userId = null;

            // If user is logged in, get their ID for reference
            if (Auth::check()) {
                $user = Auth::user();
                $userId = $user->id;
                $accountReference = 'Pro Membership - ' . $user->id;
            }

            // Get current timestamp in YmdHis format (required by Safaricom)
            $timestamp = Carbon::now()->format('YmdHis');

            // Generate password (base64 of shortcode + passkey + timestamp)
            $password = base64_encode($this->shortcode . $this->passkey . $timestamp);

            // Get access token
            $accessToken = $this->getAccessToken();

            // Log the access token for debugging
            Log::info('M-Pesa Access Token', ['token' => $accessToken]);

            // Prepare the STK push request payload
            $stkPushData = [
                'BusinessShortCode' => $this->shortcode,
                'Password' => $password,
                'Timestamp' => $timestamp,
                'TransactionType' => 'CustomerPayBillOnline',
                'Amount' => (int)round($validated['amount']), // M-Pesa requires integer amounts
                'PartyA' => $validated['phoneNumber'],
                'PartyB' => $this->shortcode,
                'PhoneNumber' => $validated['phoneNumber'],
                'CallBackURL' => $this->callbackUrl,
                'AccountReference' => $accountReference,
                'TransactionDesc' => $this->transactionDesc,
            ];

            // Log the STK push request for debugging
            Log::info('M-Pesa STK Push Request', $stkPushData);

            // Make the STK push request
            $response = Http::withOptions([
                'verify' => false, // Skip SSL verification for sandbox environment
            ])->withHeaders([
                'Authorization' => 'Bearer ' . $accessToken,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/mpesa/stkpush/v1/processrequest', $stkPushData);

            $result = $response->json();

            // Log the full response
            Log::info('M-Pesa STK Push Response', $result);

            if (!$response->successful()) {
                Log::error('M-Pesa STK Push Error Response', $result);
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send STK push',
                    'error' => $result['errorMessage'] ?? 'Unknown error',
                ], 400);
            }

            // Store the checkout request ID for later reference
            if (isset($result['CheckoutRequestID'])) {
                // Create a transaction record
                MpesaTransaction::create([
                    'user_id' => $userId,
                    'phone_number' => $validated['phoneNumber'],
                    'amount' => $validated['amount'],
                    'checkout_request_id' => $result['CheckoutRequestID'],
                    'merchant_request_id' => $result['MerchantRequestID'] ?? null,
                    'status' => 'pending',
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'STK push sent successfully',
                    'data' => [
                        'CheckoutRequestID' => $result['CheckoutRequestID'],
                        'MerchantRequestID' => $result['MerchantRequestID'] ?? null,
                        'ResponseDescription' => $result['ResponseDescription'] ?? null
                    ],
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to send STK push',
                'error' => $result['errorMessage'] ?? 'Unknown error',
            ], 400);

        } catch (\Exception $e) {
            Log::error('M-Pesa STK Push Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to process payment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check payment status by CheckoutRequestID
     */
    public function checkStatus(Request $request)
    {
        try {
            $validated = $request->validate([
                'checkoutRequestId' => 'required|string',
            ]);

            // Get access token
            $accessToken = $this->getAccessToken();

            // Get timestamp
            $timestamp = Carbon::now()->format('YmdHis');

            // Generate password
            $password = base64_encode($this->shortcode . $this->passkey . $timestamp);

            // Make the status check request
            $response = Http::withOptions([
                'verify' => false, // Skip SSL verification for sandbox environment
            ])->withHeaders([
                'Authorization' => 'Bearer ' . $accessToken,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/mpesa/stkpushquery/v1/query', [
                'BusinessShortCode' => $this->shortcode,
                'Password' => $password,
                'Timestamp' => $timestamp,
                'CheckoutRequestID' => $validated['checkoutRequestId'],
            ]);

            $result = $response->json();

            // Log the response
            Log::info('M-Pesa Status Check Response', $result);

            // Check if there's a transaction in our database
            $transaction = MpesaTransaction::where('checkout_request_id', $validated['checkoutRequestId'])->first();

            if (!$transaction) {
                return response()->json([
                    'status' => 'failed',
                    'message' => 'Transaction not found',
                ], 404);
            }

            // Check if the response is successful
            if (isset($result['ResultCode'])) {
                if ($result['ResultCode'] == 0) {
                    // Transaction successful
                    $transaction->status = 'completed';
                    $transaction->result_code = $result['ResultCode'];
                    $transaction->result_desc = $result['ResultDesc'] ?? null;
                    $transaction->save();

                    // If user is authenticated, update their membership status
                    if ($transaction->user_id) {
                        $this->updateMembershipStatus($transaction->user_id);
                    }

                    return response()->json([
                        'status' => 'completed',
                        'message' => 'Payment completed successfully',
                    ]);
                } else {
                    // Transaction failed
                    $transaction->status = 'failed';
                    $transaction->result_code = $result['ResultCode'];
                    $transaction->result_desc = $result['ResultDesc'] ?? null;
                    $transaction->save();

                    return response()->json([
                        'status' => 'failed',
                        'message' => $result['ResultDesc'] ?? 'Payment failed',
                    ]);
                }
            }

            // If we have a pending transaction but no clear result yet
            return response()->json([
                'status' => 'pending',
                'message' => 'Payment is still being processed',
            ]);

        } catch (\Exception $e) {
            Log::error('M-Pesa Status Check Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to check payment status',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Handle M-Pesa callback
     */
    public function callback(Request $request)
    {
        try {
            // Log the entire callback for debugging
            Log::info('M-Pesa Callback Received', [
                'body' => $request->all(),
                'headers' => $request->header(),
            ]);

            // Get the callback body
            $callbackData = $request->all();

            // Check if the callback has the expected format
            if (!isset($callbackData['Body']) || !isset($callbackData['Body']['stkCallback'])) {
                Log::error('M-Pesa Callback: Invalid format', $callbackData);
                return response()->json(['status' => 'error', 'message' => 'Invalid callback format']);
            }

            $stkCallback = $callbackData['Body']['stkCallback'];
            $resultCode = $stkCallback['ResultCode'];
            $resultDesc = $stkCallback['ResultDesc'];
            $merchantRequestId = $stkCallback['MerchantRequestID'];
            $checkoutRequestId = $stkCallback['CheckoutRequestID'];

            // Find the transaction in our database
            $transaction = MpesaTransaction::where('checkout_request_id', $checkoutRequestId)->first();

            if (!$transaction) {
                Log::error('M-Pesa Callback: Transaction not found', ['checkoutRequestId' => $checkoutRequestId]);
                return response()->json(['status' => 'error', 'message' => 'Transaction not found']);
            }

            // Update the transaction status
            if ($resultCode == 0) {
                // Success
                $transaction->status = 'completed';

                // Get additional details if available
                if (isset($stkCallback['CallbackMetadata']) && isset($stkCallback['CallbackMetadata']['Item'])) {
                    $items = $stkCallback['CallbackMetadata']['Item'];

                    // Extract metadata values
                    foreach ($items as $item) {
                        if ($item['Name'] == 'MpesaReceiptNumber') {
                            $transaction->mpesa_receipt_number = $item['Value'] ?? null;
                        } else if ($item['Name'] == 'TransactionAmount') {
                            $transaction->confirmed_amount = $item['Value'] ?? null;
                        } else if ($item['Name'] == 'TransactionDate') {
                            $transaction->transaction_date = $item['Value'] ?? null;
                        } else if ($item['Name'] == 'PhoneNumber') {
                            $transaction->confirmed_phone_number = $item['Value'] ?? null;
                        }
                    }
                }

                // If user is authenticated, update their membership status
                if ($transaction->user_id) {
                    $this->updateMembershipStatus($transaction->user_id);
                }
            } else {
                // Failed
                $transaction->status = 'failed';
            }

            $transaction->result_code = $resultCode;
            $transaction->result_desc = $resultDesc;
            $transaction->save();

            Log::info('M-Pesa Callback Processed', [
                'status' => $transaction->status,
                'resultCode' => $resultCode,
                'resultDesc' => $resultDesc
            ]);

            // Always return a success response to M-Pesa
            return response()->json(['status' => 'success', 'message' => 'Callback received successfully']);

        } catch (\Exception $e) {
            Log::error('M-Pesa Callback Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            // Always acknowledge receipt to prevent retries
            return response()->json(['status' => 'error', 'message' => 'Error processing callback']);
        }
    }

    /**
     * Update user's membership status
     */
    private function updateMembershipStatus($userId)
    {
        try {
            // Get the user
            $user = \App\Models\User::find($userId);

            if (!$user) {
                Log::error('Failed to update membership status - User not found', ['userId' => $userId]);
                return;
            }

            // Update the user's membership status
            $user->is_pro = true;
            $user->pro_expires_at = Carbon::now()->addMonths(1); // Pro membership for 1 month
            $user->save();

            Log::info('User upgraded to Pro membership', ['userId' => $userId]);

            // Notify the user
            // You could send an email or push notification here
        } catch (\Exception $e) {
            Log::error('Error updating membership status: ' . $e->getMessage(), [
                'userId' => $userId,
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
        }
    }
}
