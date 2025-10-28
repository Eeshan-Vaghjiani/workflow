<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Pusher Test</title>
    <script src="{{ asset('js/app.js') }}" defer></script>
    <style>
        body {
            font-family: sans-serif;
            margin: 20px;
        }
        .card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
        }
        .result {
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
            margin-top: 10px;
        }
        button {
            background-color: #4a76a8;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <h1>Pusher Test</h1>

    <div class="card">
        <h2>Connection Status</h2>
        <div id="connectionStatus">Checking connection...</div>
    </div>

    <div class="card">
        <h2>Test Direct Message</h2>
        <p>Send a test direct message to see if broadcasting works.</p>

        @auth
            <form id="messageForm">
                <div>
                    <label for="receiverId">Recipient User ID:</label>
                    <input type="number" id="receiverId" value="{{ auth()->id() }}" required>
                </div>
                <div>
                    <label for="messageContent">Message:</label>
                    <input type="text" id="messageContent" value="Test message at {{ now() }}" required>
                </div>
                <button type="submit">Send Test Message</button>
            </form>
            <div class="result" id="messageResult"></div>
        @else
            <p>You need to be logged in to test messaging.</p>
        @endauth
    </div>

    <div class="card">
        <h2>Event Listener</h2>
        <p>Messages received will appear below:</p>
        <div id="events"></div>
        <button id="clearEvents">Clear Events</button>
    </div>

    <div class="card">
        <h2>Other Actions</h2>
        <button id="refreshToken">Refresh CSRF Token</button>
        <button id="checkAuth">Check Authentication</button>
    </div>

    <div class="card">
        <h2>Debug Info</h2>
        <div id="debugInfo"></div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const connectionStatus = document.getElementById('connectionStatus');
            const messageForm = document.getElementById('messageForm');
            const messageResult = document.getElementById('messageResult');
            const eventsContainer = document.getElementById('events');
            const clearEventsBtn = document.getElementById('clearEvents');
            const refreshTokenBtn = document.getElementById('refreshToken');
            const checkAuthBtn = document.getElementById('checkAuth');
            const debugInfo = document.getElementById('debugInfo');

            // Check for Echo initialization
            const checkEchoInterval = setInterval(() => {
                if (window.Echo) {
                    clearInterval(checkEchoInterval);
                    setupPusher();
                }
            }, 100);

            function setupPusher() {
                // Display connection info
                if (window.Echo && window.Echo.connector && window.Echo.connector.pusher) {
                    const pusher = window.Echo.connector.pusher;

                    // Show connection status
                    connectionStatus.textContent = `Connected: ${pusher.connection.state}`;

                    // Update status when connection changes
                    pusher.connection.bind('state_change', (states) => {
                        connectionStatus.textContent = `Connection changed from ${states.previous} to ${states.current}`;
                    });

                    // Show config details
                    const config = {
                        key: pusher.config.key,
                        cluster: pusher.config.cluster,
                        encrypted: pusher.config.encrypted,
                        enabledTransports: pusher.config.enabledTransports,
                        disabledTransports: pusher.config.disabledTransports,
                        socketId: pusher.connection.socket_id,
                    };

                    debugInfo.textContent = JSON.stringify(config, null, 2);

                    // Listen for direct messages on the public channel
                    window.Echo.channel('chat')
                        .listen('.message.new', (e) => {
                            logEvent('Received .message.new event on chat channel', e);
                        })
                        .listen('message.new', (e) => {
                            logEvent('Received message.new event on chat channel', e);
                        })
                        .listen('.NewDirectMessage', (e) => {
                            logEvent('Received .NewDirectMessage event on chat channel', e);
                        })
                        .listen('NewDirectMessage', (e) => {
                            logEvent('Received NewDirectMessage event on chat channel', e);
                        });

                } else {
                    connectionStatus.textContent = 'Echo not initialized properly';
                }
            }

            // Form submission for test message
            if (messageForm) {
                messageForm.addEventListener('submit', async (e) => {
                    e.preventDefault();

                    const receiverId = document.getElementById('receiverId').value;
                    const content = document.getElementById('messageContent').value;

                    messageResult.textContent = 'Sending message...';

                    try {
                        // Try multiple endpoints
                        let response;
                        try {
                            response = await fetch(`/web/direct-messages/${receiverId}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                                    'Accept': 'application/json',
                                },
                                body: JSON.stringify({ message: content }),
                            });
                        } catch (error) {
                            console.error('First attempt failed:', error);

                            response = await fetch(`/api/web/direct-messages/${receiverId}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                                    'Accept': 'application/json',
                                },
                                body: JSON.stringify({ message: content }),
                            });
                        }

                        const data = await response.json();
                        messageResult.textContent = `Message sent successfully! Response: ${JSON.stringify(data)}`;
                    } catch (error) {
                        console.error('Error sending message:', error);
                        messageResult.textContent = `Error: ${error.message}`;
                    }
                });
            }

            // Helper function to log events
            function logEvent(title, data) {
                const eventEl = document.createElement('div');
                eventEl.style.marginBottom = '10px';
                eventEl.style.padding = '10px';
                eventEl.style.backgroundColor = '#f0f0f0';
                eventEl.style.border = '1px solid #ddd';

                const time = new Date().toLocaleTimeString();
                eventEl.innerHTML = `
                    <div><strong>${time} - ${title}</strong></div>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                `;

                eventsContainer.appendChild(eventEl);
            }

            // Clear events button
            clearEventsBtn.addEventListener('click', () => {
                eventsContainer.innerHTML = '';
            });

            // Refresh CSRF token
            refreshTokenBtn.addEventListener('click', async () => {
                try {
                    const response = await fetch('/sanctum/csrf-cookie');
                    logEvent('CSRF Token refreshed', { success: true });
                } catch (error) {
                    console.error('Error refreshing token:', error);
                    logEvent('Error refreshing CSRF token', { error: error.message });
                }
            });

            // Check authentication
            checkAuthBtn.addEventListener('click', async () => {
                try {
                    const response = await fetch('/debug/auth-status');
                    const data = await response.json();
                    logEvent('Authentication status', data);
                } catch (error) {
                    console.error('Error checking auth:', error);
                    logEvent('Error checking authentication', { error: error.message });
                }
            });
        });
    </script>
</body>
</html>
