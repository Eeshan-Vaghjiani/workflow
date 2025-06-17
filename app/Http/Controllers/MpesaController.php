<?php

namespace App\Http\Controllers;

use App\Models\MpesaTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class MpesaController extends Controller
{
    // Fixed amount in KES for all transactions
    protected $fixedAmount = 1000;

    // M-Pesa API configuration
    protected $consumerKey;
    protected $consumerSecret;
    protected $businessShortCode;
    protected $passkey;
    protected $baseUrl;

    public function __construct()
    {
        // Initialize M-Pesa API credentials
        $this->consumerKey = env('MPESA_CONSUMER_KEY', 'bASvJGfZynfXhMoEGeLaQEAORlMWETRhrA6qSPMFmBDGRt47');
        $this->consumerSecret = env('MPESA_CONSUMER_SECRET', 'Ozz7pIgqA64AOSl5NNjx3bgu5M6JDRLoEPS01FocG26xBQPnjc5hQIGGaKFxnpzH');
        $this->businessShortCode = env('MPESA_SHORTCODE', '174379');
        $this->passkey = env('MPESA_PASSKEY', 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919');
        $this->baseUrl = env('MPESA_BASE_URL', 'https://sandbox.safaricom.co.ke');

        // Log the configuration for debugging
        Log::info('M-Pesa Configuration', [
            'consumer_key' => substr($this->consumerKey, 0, 5) . '...',
            'consumer_secret' => substr($this->consumerSecret, 0, 5) . '...',
            'short_code' => $this->businessShortCode,
            'base_url' => $this->baseUrl
        ]);
    }

    /**
     * Display the payment form (for API, returns config data)
     */
    public function index()
    {
        // Always return consistent JSON response regardless of request type
        Log::info('M-Pesa index method called');

        return response()->json([
            'amount' => $this->fixedAmount,
            'logoUrl' => asset('images/mpesa-logo.png')
        ]);
    }

    /**
     * Initiate STK Push
     */
    public function stkPush(Request $request)
    {
        // Add detailed logging
        Log::info('M-Pesa STK Push Request:', $request->all());

        try {
            // Basic validation
            if (!$request->has('phone')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Phone number is required'
                ], 400);
            }

            // Get and clean phone number
            $phoneNumber = $request->phone;
            $phoneNumber = preg_replace('/\D/', '', $phoneNumber);

            // Format phone number if needed (convert 07... to 2547...)
            if (substr($phoneNumber, 0, 1) == '0') {
                $phoneNumber = '254' . substr($phoneNumber, 1);
            }

            Log::info('Formatted phone number for M-Pesa', ['phone' => $phoneNumber]);

            // Set timezone
            date_default_timezone_set('Africa/Nairobi');

            // Transaction details
            $amount = $this->fixedAmount;
            $timestamp = date('YmdHis');
            $password = base64_encode($this->businessShortCode . $this->passkey . $timestamp);
            $transactionDesc = 'Payment for ' . config('app.name');
            $accountReference = 'Account_' . (Auth::check() ? Auth::id() : rand(1000, 9999));

            // Debug flag - set to false to use sandbox
            $useSandboxMode = false;

            // SANDBOX TESTING - For development, create a dummy transaction and return success
            if ($useSandboxMode && app()->environment(['local', 'development', 'testing'])) {
                Log::info('SANDBOX MODE: Creating dummy transaction');

                // Create a mock transaction
                $transaction = MpesaTransaction::create([
                    'user_id' => Auth::check() ? Auth::id() : null,
                    'phone_number' => $phoneNumber,
                    'amount' => $amount,
                    'merchant_request_id' => 'sandbox_' . uniqid(),
                    'checkout_request_id' => 'sandbox_' . uniqid(),
                    'status' => 'pending',
                ]);

                // Return success response
                return response()->json([
                    'success' => true,
                    'message' => 'SANDBOX MODE: Payment request sent successfully. This is a test transaction.',
                    'transaction_id' => $transaction->id
                ]);
            }

            // Step 1: Get Access Token
            $accessToken = $this->getAccessToken();
            if (!$accessToken) {
                Log::error('Failed to get M-Pesa access token');
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to connect to M-Pesa API'
                ], 500);
            }

            Log::info('Successfully obtained M-Pesa access token');

            // Step 2: Initialize STK Push
            // Use a callback URL from the environment variables or a dummy one for local testing
            $callbackUrl = env('MPESA_CALLBACK_URL', route('mpesa.api.callback'));

            // For local testing without ngrok, use a dummy callback
            if (app()->environment(['local', 'development', 'testing']) &&
                (strpos($callbackUrl, 'localhost') !== false || strpos($callbackUrl, '127.0.0.1') !== false)) {
                $callbackUrl = 'https://example.com/callback';
                Log::info('LOCAL TESTING MODE: Using dummy callback URL: ' . $callbackUrl);
            } else {
                Log::info('Using callback URL: ' . $callbackUrl);
            }

            $stkUrl = $this->baseUrl . '/mpesa/stkpush/v1/processrequest';
            $stkHeaders = [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $accessToken
            ];

            // STK Push request data
            $stkData = [
                'BusinessShortCode' => $this->businessShortCode,
                'Password' => $password,
                'Timestamp' => $timestamp,
                'TransactionType' => 'CustomerPayBillOnline',
                'Amount' => $amount,
                'PartyA' => $phoneNumber,
                'PartyB' => $this->businessShortCode,
                'PhoneNumber' => $phoneNumber,
                'CallBackURL' => $callbackUrl,
                'AccountReference' => $accountReference,
                'TransactionDesc' => $transactionDesc
            ];

            Log::info('STK Push request data', $stkData);

            // Make STK Push request
            $curl = curl_init($stkUrl);
            $this->configureCurl($curl, $stkHeaders, true, $stkData);
            $response = curl_exec($curl);
            $httpStatus = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            $curlInfo = curl_getinfo($curl);

            if ($response === false) {
                $error = curl_error($curl);
                curl_close($curl);
                Log::error('M-Pesa API Error: ' . $error);
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to connect to M-Pesa API: ' . $error,
                    'debug_info' => [
                        'curl_error' => $error,
                        'url' => $stkUrl,
                        'headers' => $stkHeaders,
                        'data' => $stkData
                    ]
                ], 500);
            }

            curl_close($curl);
            Log::info('M-Pesa API Response: ' . $response);

            $result = json_decode($response);

            // Include full response for debugging
            $fullResponse = [
                'raw_response' => $response,
                'decoded' => $result,
                'http_status' => $httpStatus,
                'curl_info' => $curlInfo
            ];

            Log::info('Full M-Pesa API Response', $fullResponse);

            // Handle response
            if (isset($result->ResponseCode) && $result->ResponseCode == "0") {
                // Create transaction record
                $transaction = MpesaTransaction::create([
                    'user_id' => Auth::check() ? Auth::id() : null,
                    'phone_number' => $phoneNumber,
                    'amount' => $amount,
                    'merchant_request_id' => $result->MerchantRequestID,
                    'checkout_request_id' => $result->CheckoutRequestID,
                    'status' => 'pending',
                ]);

                // Return success response
                return response()->json([
                    'success' => true,
                    'message' => 'Payment request sent successfully. Please check your phone to complete the transaction.',
                    'transaction_id' => $transaction->id
                ]);
            } else {
                // Error from M-Pesa API
                $errorMessage = $result->errorMessage ?? ($result->ResponseDescription ?? 'Failed to initiate M-Pesa payment');
                Log::error('M-Pesa API Error: ' . $errorMessage);
                return response()->json([
                    'success' => false,
                    'message' => $errorMessage,
                    'debug_info' => $fullResponse
                ], 400);
            }
        } catch (\Exception $e) {
            Log::error('M-Pesa Exception: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An unexpected error occurred: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get M-Pesa access token
     */
    private function getAccessToken()
    {
        try {
            $url = $this->baseUrl . '/oauth/v1/generate?grant_type=client_credentials';
            Log::info('Getting M-Pesa access token', ['url' => $url]);

            $curl = curl_init($url);
            curl_setopt($curl, CURLOPT_HTTPHEADER, ['Content-Type: application/json; charset=utf8']);
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($curl, CURLOPT_HEADER, false);
            curl_setopt($curl, CURLOPT_USERPWD, $this->consumerKey . ':' . $this->consumerSecret);

            // Disable SSL verification in development environment
            if (app()->environment('local', 'development', 'testing')) {
                curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
            }

            $response = curl_exec($curl);
            $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            $error = curl_error($curl);

            // Log detailed info
            Log::info('M-Pesa access token response', [
                'status_code' => $status,
                'response' => $response,
                'error' => $error
            ]);

            if ($response === false) {
                Log::error('M-Pesa Access Token Error: ' . $error);
                curl_close($curl);
                return null;
            }

            curl_close($curl);
            $result = json_decode($response);

            if (!isset($result->access_token)) {
                Log::error('M-Pesa Access Token Error: Invalid response', ['response' => $response]);
                return null;
            }

            Log::info('M-Pesa access token obtained successfully');
            return $result->access_token;
        } catch (\Exception $e) {
            Log::error('M-Pesa Access Token Exception: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }

    /**
     * Handle the callback from M-Pesa
     */
    public function callback(Request $request)
    {
        // Log all incoming data
        Log::info('M-Pesa Callback Received', [
            'data' => $request->all(),
            'headers' => $request->header(),
            'ip' => $request->ip()
        ]);

        // For manual testing - if this is a test request, just return success
        if ($request->has('test')) {
            return response()->json([
                'ResultCode' => 0,
                'ResultDesc' => 'Test callback received successfully',
                'test_data' => $request->all()
            ]);
        }

        // Handle real M-Pesa callback
        try {
            $callbackData = $request->all();
            Log::info('M-Pesa callback data:', $callbackData);

            // Check if this is a validation request
            if (isset($callbackData['Body']) && isset($callbackData['Body']['stkCallback'])) {
                $callbackBody = $callbackData['Body']['stkCallback'];
                $checkoutRequestID = $callbackBody['CheckoutRequestID'];
                $resultCode = $callbackBody['ResultCode'];
                $resultDesc = $callbackBody['ResultDesc'];

                Log::info('STK Callback data', [
                    'checkout_request_id' => $checkoutRequestID,
                    'result_code' => $resultCode,
                    'result_desc' => $resultDesc
                ]);

                // Find transaction by checkout request ID
                $transaction = MpesaTransaction::where('checkout_request_id', $checkoutRequestID)->first();

                if ($transaction) {
                    // Update transaction
                    $transaction->result_code = $resultCode;
                    $transaction->result_description = $resultDesc;

                    // Set status based on result code
                    if ($resultCode == 0) {
                        $transaction->status = 'completed';

                        // Extract transaction details
                        if (isset($callbackBody['CallbackMetadata']) && isset($callbackBody['CallbackMetadata']['Item'])) {
                            $items = collect($callbackBody['CallbackMetadata']['Item']);

                            // Extract transaction code (M-Pesa receipt number)
                            $mpesaReceiptNumber = $items->where('Name', 'MpesaReceiptNumber')->first();
                            if ($mpesaReceiptNumber && isset($mpesaReceiptNumber['Value'])) {
                                $transaction->transaction_code = $mpesaReceiptNumber['Value'];
                            }

                            // Store all callback metadata
                            $transaction->transaction_details = $callbackBody['CallbackMetadata'];
                        }
                    } else {
                        $transaction->status = 'failed';
                    }

                    $transaction->save();
                } else {
                    Log::warning('Transaction not found for checkout request ID: ' . $checkoutRequestID);
                }
            } else {
                Log::warning('Unexpected callback format', $callbackData);
            }
        } catch (\Exception $e) {
            Log::error('Error processing M-Pesa callback: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'data' => $request->all()
            ]);
        }

        // Return response to M-Pesa
        return response()->json([
            'ResultCode' => 0,
            'ResultDesc' => 'Confirmation received successfully'
        ]);
    }

    /**
     * Get transaction status
     */
    public function status($id)
    {
        $transaction = MpesaTransaction::findOrFail($id);
        return response()->json([
            'status' => $transaction->status,
            'message' => $transaction->result_description,
        ]);
    }

    /**
     * Mark a transaction as dismissed when the prompt times out or is dismissed
     */
    public function markDismissed($id)
    {
        $transaction = MpesaTransaction::findOrFail($id);

        // Only update if still pending
        if ($transaction->status === 'pending') {
            $transaction->status = 'dismissed';
            $transaction->result_description = 'Payment prompt was dismissed or timed out';
            $transaction->save();

            Log::info('M-Pesa transaction marked as dismissed', [
                'transaction_id' => $id,
                'checkout_request_id' => $transaction->checkout_request_id
            ]);
        }

        return response()->json([
            'success' => true,
            'status' => $transaction->status,
            'message' => 'Transaction status updated'
        ]);
    }

    /**
     * Configure a cURL request with common options
     *
     * @param \CurlHandle $curl The cURL resource
     * @param array $headers HTTP headers to set
     * @param bool $isPost Whether this is a POST request
     * @param array|null $postData Data to POST (if applicable)
     * @return void
     */
    protected function configureCurl($curl, array $headers, bool $isPost = false, ?array $postData = null)
    {
        curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, false);

        if ($isPost) {
            curl_setopt($curl, CURLOPT_POST, true);
            if ($postData) {
                curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($postData));
            }
        }

        // Disable SSL verification in development environment
        if (app()->environment('local', 'development', 'testing')) {
            curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
        }
    }

    /**
     * Validate phone number format for M-Pesa
     *
     * @param string $phone The phone number to validate
     * @return bool Whether the phone number is valid
     */
    protected function isValidPhoneNumber($phone)
    {
        // Remove any non-digit characters
        $phone = preg_replace('/\D/', '', $phone);

        // Check if starts with 0, format to 254
        if (substr($phone, 0, 1) == '0') {
            $phone = '254' . substr($phone, 1);
        }

        // Check if it's a valid Kenyan phone number
        $pattern = '/^(254)[0-9]{9}$/';
        return preg_match($pattern, $phone) === 1;
    }
}
