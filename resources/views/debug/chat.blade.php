<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://js.pusher.com/8.0/pusher.min.js"></script>
</head>
<body class="bg-gray-100">
    <div class="container mx-auto p-4 max-w-3xl">
        <div class="bg-white p-6 rounded-lg shadow-md">
            <h1 class="text-2xl font-bold mb-4">Chat System Debug</h1>

            <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <h2 class="font-medium text-lg">Configuration</h2>
                <pre class="text-sm mt-2">{{ json_encode($config, JSON_PRETTY_PRINT) }}</pre>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h2 class="text-lg font-semibold mb-2">Test Private Channel</h2>
                    <div class="flex mb-2">
                        <input type="text" id="privateChannel" class="flex-1 px-2 py-1 border rounded-l" value="private-chat.{{ $config['user']['id'] ?? '1' }}" placeholder="Channel name">
                        <button id="subscribePrivate" class="bg-blue-500 text-white px-4 py-1 rounded-r">Subscribe</button>
                    </div>
                    <div id="privateStatus" class="mt-2 p-2 bg-gray-100 rounded text-sm">Not connected</div>
                </div>

                <div>
                    <h2 class="text-lg font-semibold mb-2">Test Presence Channel</h2>
                    <div class="flex mb-2">
                        <input type="text" id="presenceChannel" class="flex-1 px-2 py-1 border rounded-l" value="presence-group.1" placeholder="Channel name">
                        <button id="subscribePresence" class="bg-green-500 text-white px-4 py-1 rounded-r">Subscribe</button>
                    </div>
                    <div id="presenceStatus" class="mt-2 p-2 bg-gray-100 rounded text-sm">Not connected</div>
                    <div id="presenceMembers" class="mt-2 p-2 bg-gray-100 rounded text-sm hidden">Members: </div>
                </div>
            </div>

            <div class="mt-6">
                <h2 class="text-lg font-semibold mb-2">Send Test Message</h2>
                <div class="flex mb-2">
                    <input type="text" id="eventName" class="w-1/3 px-2 py-1 border rounded-l" value="new-message" placeholder="Event name">
                    <input type="text" id="messageContent" class="flex-1 px-2 py-1 border" placeholder="Message content">
                    <button id="sendMessage" class="bg-purple-500 text-white px-4 py-1 rounded-r">Send</button>
                </div>
                <div id="sendStatus" class="mt-2 p-2 bg-gray-100 rounded text-sm">No message sent</div>
            </div>

            <div class="mt-6">
                <h2 class="text-lg font-semibold mb-2">Events Log</h2>
                <div id="eventsLog" class="h-40 overflow-y-auto p-2 bg-gray-100 rounded text-sm">Waiting for events...</div>
            </div>
        </div>
    </div>

    <script>
        // Initialize Pusher
        const pusher = new Pusher('{{ $config["pusher_key"] }}', {
            cluster: '{{ $config["pusher_cluster"] }}',
            authEndpoint: '/broadcasting/auth',
            auth: {
                headers: {
                    'X-CSRF-TOKEN': '{{ $config["csrf_token"] }}',
                    'Accept': 'application/json'
                }
            }
        });

        // Log function
        function log(message) {
            const eventsLog = document.getElementById('eventsLog');
            const logEntry = document.createElement('div');
            logEntry.className = 'mb-1 pb-1 border-b border-gray-200';
            logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            eventsLog.prepend(logEntry);
        }

        // Private channel subscription
        document.getElementById('subscribePrivate').addEventListener('click', () => {
            const channelName = document.getElementById('privateChannel').value;
            const statusEl = document.getElementById('privateStatus');

            try {
                statusEl.textContent = 'Connecting...';
                statusEl.className = 'mt-2 p-2 bg-yellow-100 rounded text-sm';

                const channel = pusher.subscribe(channelName);

                channel.bind('pusher:subscription_succeeded', () => {
                    statusEl.textContent = `Connected to ${channelName}`;
                    statusEl.className = 'mt-2 p-2 bg-green-100 rounded text-sm';
                    log(`Successfully subscribed to ${channelName}`);

                    // Listen for events
                    channel.bind_global((event, data) => {
                        log(`Event on ${channelName}: ${event} with data: ${JSON.stringify(data)}`);
                    });
                });

                channel.bind('pusher:subscription_error', (error) => {
                    statusEl.textContent = `Error connecting to ${channelName}: ${JSON.stringify(error)}`;
                    statusEl.className = 'mt-2 p-2 bg-red-100 rounded text-sm';
                    log(`Failed to subscribe to ${channelName}: ${JSON.stringify(error)}`);
                });
            } catch (error) {
                statusEl.textContent = `Error: ${error.message}`;
                statusEl.className = 'mt-2 p-2 bg-red-100 rounded text-sm';
                log(`Error with ${channelName}: ${error.message}`);
            }
        });

        // Presence channel subscription
        document.getElementById('subscribePresence').addEventListener('click', () => {
            const channelName = document.getElementById('presenceChannel').value;
            const statusEl = document.getElementById('presenceStatus');
            const membersEl = document.getElementById('presenceMembers');

            try {
                statusEl.textContent = 'Connecting...';
                statusEl.className = 'mt-2 p-2 bg-yellow-100 rounded text-sm';
                membersEl.className = 'mt-2 p-2 bg-gray-100 rounded text-sm hidden';

                const channel = pusher.subscribe(channelName);

                channel.bind('pusher:subscription_succeeded', (data) => {
                    statusEl.textContent = `Connected to ${channelName} with ${Object.keys(data.members).length} members`;
                    statusEl.className = 'mt-2 p-2 bg-green-100 rounded text-sm';
                    log(`Successfully subscribed to ${channelName}`);

                    // Show members
                    membersEl.className = 'mt-2 p-2 bg-gray-100 rounded text-sm';
                    membersEl.textContent = 'Members: ' + Object.values(data.members).map(m => m.name).join(', ');

                    // Listen for events
                    channel.bind_global((event, data) => {
                        if (!event.startsWith('pusher:')) {
                            log(`Event on ${channelName}: ${event} with data: ${JSON.stringify(data)}`);
                        }
                    });
                });

                channel.bind('pusher:subscription_error', (error) => {
                    statusEl.textContent = `Error connecting to ${channelName}: ${JSON.stringify(error)}`;
                    statusEl.className = 'mt-2 p-2 bg-red-100 rounded text-sm';
                    log(`Failed to subscribe to ${channelName}: ${JSON.stringify(error)}`);
                });

                channel.bind('pusher:member_added', (member) => {
                    log(`Member joined ${channelName}: ${member.info.name}`);
                });

                channel.bind('pusher:member_removed', (member) => {
                    log(`Member left ${channelName}: ${member.info.name}`);
                });
            } catch (error) {
                statusEl.textContent = `Error: ${error.message}`;
                statusEl.className = 'mt-2 p-2 bg-red-100 rounded text-sm';
                log(`Error with ${channelName}: ${error.message}`);
            }
        });

        // Send message
        document.getElementById('sendMessage').addEventListener('click', async () => {
            const eventName = document.getElementById('eventName').value;
            const content = document.getElementById('messageContent').value;
            const statusEl = document.getElementById('sendStatus');

            if (!content) {
                statusEl.textContent = 'Please enter a message';
                statusEl.className = 'mt-2 p-2 bg-yellow-100 rounded text-sm';
                return;
            }

            try {
                statusEl.textContent = 'Sending...';
                statusEl.className = 'mt-2 p-2 bg-yellow-100 rounded text-sm';

                // Send to API
                const response = await fetch('/5a90cf232dedb766fb44', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': '{{ $config["csrf_token"] }}',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        event: eventName,
                        message: content
                    })
                });

                const data = await response.json();

                if (data.success) {
                    statusEl.textContent = `Message sent: ${content}`;
                    statusEl.className = 'mt-2 p-2 bg-green-100 rounded text-sm';
                    log(`Sent message: ${content} with event: ${eventName}`);
                } else {
                    statusEl.textContent = `Error: ${data.error}`;
                    statusEl.className = 'mt-2 p-2 bg-red-100 rounded text-sm';
                    log(`Failed to send message: ${data.error}`);
                }
            } catch (error) {
                statusEl.textContent = `Error: ${error.message}`;
                statusEl.className = 'mt-2 p-2 bg-red-100 rounded text-sm';
                log(`Error sending message: ${error.message}`);
            }
        });

        // Initialize with page load timestamp
        log('Page loaded');
    </script>
</body>
</html>
