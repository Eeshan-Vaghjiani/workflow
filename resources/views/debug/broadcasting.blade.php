<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ $csrfToken }}">
    <title>Broadcasting Auth Debug</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://js.pusher.com/7.0/pusher.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
</head>
<body class="bg-gray-100 p-8">
    <div class="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 class="text-2xl font-bold mb-6">Broadcasting Authentication Debug</h1>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-gray-50 p-4 rounded border">
                <h2 class="text-lg font-semibold mb-3">Authentication Status</h2>
                <div class="space-y-2">
                    <p><span class="font-medium">Authenticated:</span> <span id="auth-status" class="{{ $isAuthenticated ? 'text-green-600' : 'text-red-600' }}">{{ $isAuthenticated ? 'Yes' : 'No' }}</span></p>
                    <p><span class="font-medium">User ID:</span> <span id="user-id">{{ $userId }}</span></p>
                    <p><span class="font-medium">CSRF Token:</span> <span class="text-xs" id="csrf-token">{{ substr($csrfToken, 0, 10) }}...</span></p>
                    <p><span class="font-medium">Socket ID:</span> <span id="socket-id">{{ $socketId }}</span></p>
                </div>
            </div>
            
            <div class="bg-gray-50 p-4 rounded border">
                <h2 class="text-lg font-semibold mb-3">Broadcasting Config</h2>
                <div class="space-y-2">
                    <p><span class="font-medium">Auth Endpoint:</span> <span class="text-xs break-all" id="auth-endpoint">{{ $authEndpoint }}</span></p>
                    <p><span class="font-medium">Channel Type:</span> <span id="channel-type">private</span></p>
                    <p><span class="font-medium">Channel Name:</span> <span id="channel-name">chat.{{ $userId }}</span></p>
                    <p><span class="font-medium">Event:</span> <span id="event-name">message.new</span></p>
                </div>
            </div>
        </div>
        
        <div class="mt-6 flex space-x-4">
            <div class="flex-1">
                <label class="block mb-2 font-medium text-sm">Channel Name</label>
                <div class="flex">
                    <select id="channel-prefix" class="px-3 py-2 border rounded-l-md">
                        <option value="private-">private-</option>
                        <option value="presence-">presence-</option>
                        <option value="">public</option>
                    </select>
                    <input type="text" id="channel-input" value="chat.{{ $userId }}" class="flex-1 px-3 py-2 border-t border-b border-r rounded-r-md">
                </div>
            </div>
            
            <div>
                <label class="block mb-2 font-medium text-sm">Event Name</label>
                <input type="text" id="event-input" value="message.new" class="w-full px-3 py-2 border rounded-md">
            </div>
        </div>
        
        <div class="mt-4 space-x-2">
            <button id="test-auth" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Test Auth</button>
            <button id="subscribe" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Subscribe</button>
            <button id="unsubscribe" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" disabled>Unsubscribe</button>
            <button id="send-message" class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700" disabled>Send Test Message</button>
        </div>
        
        <div class="mt-6">
            <h2 class="text-lg font-semibold mb-3">Events Log</h2>
            <div id="events-log" class="h-64 overflow-y-auto bg-gray-50 p-4 rounded border text-sm font-mono"></div>
        </div>
    </div>
    
    <script>
        // Utility functions
        function log(message, type = 'info') {
            const eventsLog = document.getElementById('events-log');
            const logEntry = document.createElement('div');
            logEntry.className = `mb-1 pb-1 border-b border-gray-200 ${type === 'error' ? 'text-red-600' : (type === 'success' ? 'text-green-600' : 'text-gray-800')}`;
            logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            eventsLog.prepend(logEntry);
        }
        
        log('Page loaded');
        
        // Variables
        let pusher = null;
        let channel = null;
        
        // Initialize Axios with CSRF token
        axios.defaults.headers.common['X-CSRF-TOKEN'] = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        axios.defaults.withCredentials = true;
        
        // Button handlers
        document.getElementById('test-auth').addEventListener('click', async () => {
            try {
                const socketId = document.getElementById('socket-id').textContent;
                const channelName = getFullChannelName();
                
                log(`Testing auth for channel: ${channelName} with socket ID: ${socketId}`);
                
                const response = await axios.post('{{ $authEndpoint }}', {
                    socket_id: socketId,
                    channel_name: channelName
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
                
                log(`Auth successful! Response: ${JSON.stringify(response.data)}`, 'success');
            } catch (error) {
                log(`Auth failed: ${error.response ? error.response.status + ' ' + JSON.stringify(error.response.data) : error.message}`, 'error');
                console.error('Full error:', error);
            }
        });
        
        document.getElementById('subscribe').addEventListener('click', () => {
            try {
                // Initialize Pusher if needed
                if (!pusher) {
                    log('Initializing Pusher');
                    
                    pusher = new Pusher('{{ env('PUSHER_APP_KEY', 'your_pusher_app_key') }}', {
                        cluster: '{{ env('PUSHER_APP_CLUSTER', 'mt1') }}',
                        authEndpoint: '{{ $authEndpoint }}',
                        auth: {
                            headers: {
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                                'Accept': 'application/json'
                            }
                        }
                    });
                    
                    pusher.connection.bind('connected', () => {
                        log('Connected to Pusher', 'success');
                        document.getElementById('socket-id').textContent = pusher.connection.socket_id;
                    });
                    
                    pusher.connection.bind('error', (err) => {
                        log(`Pusher connection error: ${JSON.stringify(err)}`, 'error');
                    });
                }
                
                const channelName = getFullChannelName();
                const eventName = document.getElementById('event-input').value;
                
                log(`Subscribing to channel: ${channelName}`);
                
                // Unsubscribe from existing channel if any
                if (channel) {
                    pusher.unsubscribe(channel.name);
                    log(`Unsubscribed from previous channel: ${channel.name}`);
                }
                
                // Subscribe to channel based on prefix
                const prefix = document.getElementById('channel-prefix').value;
                if (prefix === 'private-') {
                    channel = pusher.subscribe(channelName);
                } else if (prefix === 'presence-') {
                    channel = pusher.subscribe(channelName);
                } else {
                    channel = pusher.subscribe(channelName);
                }
                
                channel.bind(eventName, (data) => {
                    log(`Received event '${eventName}': ${JSON.stringify(data)}`, 'success');
                });
                
                channel.bind('pusher:subscription_succeeded', () => {
                    log(`Successfully subscribed to ${channelName}`, 'success');
                    document.getElementById('unsubscribe').disabled = false;
                    document.getElementById('send-message').disabled = false;
                });
                
                channel.bind('pusher:subscription_error', (error) => {
                    log(`Error subscribing to ${channelName}: ${JSON.stringify(error)}`, 'error');
                });
                
            } catch (error) {
                log(`Error: ${error.message}`, 'error');
                console.error('Full error:', error);
            }
        });
        
        document.getElementById('unsubscribe').addEventListener('click', () => {
            if (channel) {
                pusher.unsubscribe(channel.name);
                log(`Unsubscribed from channel: ${channel.name}`);
                channel = null;
                document.getElementById('unsubscribe').disabled = true;
                document.getElementById('send-message').disabled = true;
            }
        });
        
        document.getElementById('send-message').addEventListener('click', async () => {
            try {
                if (!channel) {
                    log('No active channel subscription', 'error');
                    return;
                }
                
                const eventName = document.getElementById('event-input').value;
                const channelName = getFullChannelName();
                
                log(`Sending test message to ${channelName} with event ${eventName}`);
                
                const response = await axios.post('/api/chat-test', {
                    event: eventName,
                    message: 'Test message sent at ' + new Date().toLocaleTimeString(),
                    channel_type: document.getElementById('channel-prefix').value === 'private-' ? 'private' : 'public',
                    user_id: {{ $userId }},
                });
                
                log(`Message sent: ${JSON.stringify(response.data)}`, 'success');
            } catch (error) {
                log(`Error sending message: ${error.response ? error.response.status + ' ' + JSON.stringify(error.response.data) : error.message}`, 'error');
                console.error('Full error:', error);
            }
        });
        
        // Update displayed channel info when inputs change
        document.getElementById('channel-prefix').addEventListener('change', updateChannelDisplay);
        document.getElementById('channel-input').addEventListener('input', updateChannelDisplay);
        document.getElementById('event-input').addEventListener('input', updateEventDisplay);
        
        function updateChannelDisplay() {
            document.getElementById('channel-type').textContent = 
                document.getElementById('channel-prefix').value === 'private-' ? 'private' : 
                document.getElementById('channel-prefix').value === 'presence-' ? 'presence' : 'public';
            
            document.getElementById('channel-name').textContent = 
                document.getElementById('channel-input').value;
        }
        
        function updateEventDisplay() {
            document.getElementById('event-name').textContent = 
                document.getElementById('event-input').value;
        }
        
        function getFullChannelName() {
            const prefix = document.getElementById('channel-prefix').value;
            const channelName = document.getElementById('channel-input').value;
            return prefix + channelName;
        }
    </script>
</body>
</html> 