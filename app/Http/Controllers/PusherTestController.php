<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Events\NewDirectMessage;
use App\Models\DirectMessage;
use Illuminate\Support\Facades\Auth;

class PusherTestController extends Controller
{
    /**
     * Test the Pusher connection by sending a test message.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function testBroadcast(Request $request)
    {
        try {
            $testMessage = $request->input('message', 'Test message at ' . now());

            // Create a dummy message
            $message = new DirectMessage();
            $message->id = 9999;
            $message->sender_id = 1;
            $message->receiver_id = 1;
            $message->message = $testMessage;
            $message->created_at = now();

            // Prepare message data
            $messageData = [
                'id' => $message->id,
                'content' => $message->message,
                'message' => $message->message,
                'sender_id' => $message->sender_id,
                'receiver_id' => $message->receiver_id,
                'timestamp' => now()->format('g:i A'),
                'date' => now()->format('M j, Y'),
                'created_at' => now()->toISOString(),
                'user' => [
                    'id' => 1,
                    'name' => 'Test User',
                ]
            ];

            // Log before broadcasting
            Log::info('Broadcasting test message', [
                'channel' => 'chat',
                'event' => 'message.new',
                'data' => $messageData
            ]);

            // Broadcast the message
            broadcast(new NewDirectMessage($message, $messageData));

            return response()->json([
                'success' => true,
                'message' => 'Test broadcast sent',
                'data' => $messageData,
                'time' => now(),
                'pusher_env' => [
                    'app_id' => env('PUSHER_APP_ID'),
                    'app_key' => env('PUSHER_APP_KEY'),
                    'app_cluster' => env('PUSHER_APP_CLUSTER'),
                    'host' => env('PUSHER_HOST'),
                    'port' => env('PUSHER_PORT'),
                    'scheme' => env('PUSHER_SCHEME'),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error in test broadcast', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Show Pusher test page
     */
    public function showTestPage()
    {
        return view('debug.pusher-test', [
            'pusherKey' => env('PUSHER_APP_KEY'),
            'pusherCluster' => env('PUSHER_APP_CLUSTER'),
            'pusherScheme' => env('PUSHER_SCHEME')
        ]);
    }

    /**
     * Show the Pusher test page.
     */
    public function index()
    {
        return view('debug.pusher-test');
    }

    /**
     * Show the Echo debug console.
     */
    public function echoDebug()
    {
        return view('debug.echo-debug');
    }

    /**
     * Get the authenticated user status
     */
    public function authStatus(Request $request)
    {
        return response()->json([
            'authenticated' => Auth::check(),
            'user' => Auth::user(),
            'session' => $request->session()->all(),
            'csrf' => [
                'token' => csrf_token(),
                'meta_present' => !empty($request->header('X-CSRF-TOKEN')),
            ],
            'cookie_settings' => [
                'xsrf_cookie_present' => !empty($request->cookies->get('XSRF-TOKEN')),
                'laravel_session_present' => !empty($request->cookies->get(config('session.cookie'))),
                'session_cookie' => config('session.cookie'),
            ]
        ]);
    }

    /**
     * Send a test direct message for debugging.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendTestMessage(Request $request)
    {
        try {
            $sender = Auth::user();

            if (!$sender) {
                return response()->json([
                    'error' => 'Not authenticated',
                    'message' => 'You must be logged in to send messages'
                ], 401);
            }

            // Get recipient ID from query or use sender as recipient for self-test
            $recipientId = $request->input('recipient_id', $sender->id);
            $messageContent = $request->input('message', 'Test message sent at ' . now());

            // Create a direct message
            $message = new DirectMessage([
                'sender_id' => $sender->id,
                'receiver_id' => $recipientId,
                'message' => $messageContent,
                'read' => false
            ]);

            $message->save();
            $message->load('sender:id,name,avatar');

            // Format the message data
            $messageData = [
                'id' => $message->id,
                'content' => $message->message,
                'message' => $message->message,
                'timestamp' => $message->created_at->format('g:i A'),
                'date' => $message->created_at->format('M j, Y'),
                'created_at' => $message->created_at,
                'sender_id' => $sender->id,
                'receiver_id' => $recipientId,
                'user' => [
                    'id' => $sender->id,
                    'name' => $sender->name,
                    'avatar' => $sender->avatar
                ],
            ];

            // Broadcast the message to the chat channel
            broadcast(new NewDirectMessage($message, $messageData))->toOthers();

            return response()->json([
                'success' => true,
                'message' => 'Test message sent successfully',
                'data' => $messageData
            ]);
        } catch (\Exception $e) {
            report($e);

            return response()->json([
                'error' => 'Failed to send test message',
                'message' => $e->getMessage(),
                'trace' => app()->environment('local') ? $e->getTraceAsString() : null
            ], 500);
        }
    }
}
