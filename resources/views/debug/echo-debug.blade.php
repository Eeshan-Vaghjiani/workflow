<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Echo Debug Console</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <script src="{{ asset('js/app.js') }}" defer></script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f7f7f7;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1, h2 {
            margin-top: 0;
            color: #333;
        }
        .card {
            background-color: #fff;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .events {
            height: 500px;
            overflow-y: auto;
            background-color: #272822;
            color: #f8f8f2;
            padding: 10px;
            border-radius: 4px;
            font-family: 'Consolas', 'Monaco', monospace;
        }
        .event {
            margin-bottom: 10px;
            padding: 8px;
            border-bottom: 1px solid #444;
        }
        .event-time {
            color: #a6e22e;
            font-size: 0.9em;
        }
        .event-channel {
            color: #66d9ef;
        }
        .event-name {
            color: #f92672;
        }
        .event-data {
            color: #e6db74;
            white-space: pre-wrap;
        }
        .controls {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        button {
            background-color: #4a76a8;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background-color: #3a5a8a;
        }
        .user-info {
            background-color: #f0f0f0;
            padding: 10px;
            margin-bottom: 20px;
            border-radius: 4px;
        }
        .connection-status {
            padding: 8px;
            border-radius: 4px;
            margin-bottom: 10px;
            display: inline-block;
        }
        .connected {
            background-color: #4CAF50;
            color: white;
        }
        .disconnected {
            background-color: #F44336;
            color: white;
        }
        .connecting {
            background-color: #FF9800;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Echo Debug Console</h1>

        <div class="user-info">
            <h2>User Info</h2>
            @auth
                <p><strong>Authenticated as:</strong> {{ auth()->user()->name }} (ID: {{ auth()->user()->id }})</p>
                <p><strong>Email:</strong> {{ auth()->user()->email }}</p>
            @else
                <p><strong>Status:</strong> Not authenticated</p>
            @endauth
        </div>

        <div id="connectionStatus" class="connection-status disconnected">
            Disconnected
        </div>

        <div class="controls">
            <div>
                <button id="clearBtn">Clear Console</button>
                <button id="testEventBtn">Test Local Event</button>
            </div>
            <div>
                <button id="reconnectBtn">Reconnect</button>
            </div>
        </div>

        <div class="card">
            <h2>Channel Subscriptions</h2>
            <div id="channels"></div>
        </div>

        <div class="card">
            <h2>Events</h2>
            <div id="events" class="events"></div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const eventsContainer = document.getElementById('events');
            const channelsContainer = document.getElementById('channels');
            const connectionStatus = document.getElementById('connectionStatus');
            const clearBtn = document.getElementById('clearBtn');
            const reconnectBtn = document.getElementById('reconnectBtn');
            const testEventBtn = document.getElementById('testEventBtn');

            let activeChannels = [];

            // Wait for Echo to be initialized
            const checkEchoInterval = setInterval(() => {
                if (window.Echo) {
                    clearInterval(checkEchoInterval);
                    setupEchoDebugging();
                }
            }, 100);

            function setupEchoDebugging() {
                // Update connection status based on the Echo connector state
                updateConnectionStatus();

                // Monitor public chat channel
                window.Echo.channel('chat')
                    .listen('.message.new', (data) => {
                        logEvent('chat', '.message.new', data);
                        handleMessageEvent(data);
                    })
                    .listen('message.new', (data) => {
                        logEvent('chat', 'message.new', data);
                        handleMessageEvent(data);
                    })
                    .listen('.NewDirectMessage', (data) => {
                        logEvent('chat', '.NewDirectMessage', data);
                        handleMessageEvent(data);
                    })
                    .listen('NewDirectMessage', (data) => {
                        logEvent('chat', 'NewDirectMessage', data);
                        handleMessageEvent(data);
                    });

                // Add channel to active list
                activeChannels.push({
                    name: 'chat',
                    type: 'public'
                });

                // Also listen on presence channel with user id if logged in
                if (@json(auth()->check())) {
                    const userId = @json(optional(auth()->user())->id);

                    window.Echo.private(`App.Models.User.${userId}`)
                        .listen('.message.new', (data) => {
                            logEvent(`App.Models.User.${userId}`, '.message.new', data);
                            handleMessageEvent(data);
                        })
                        .listen('message.new', (data) => {
                            logEvent(`App.Models.User.${userId}`, 'message.new', data);
                            handleMessageEvent(data);
                        })
                        .listen('.NewDirectMessage', (data) => {
                            logEvent(`App.Models.User.${userId}`, '.NewDirectMessage', data);
                            handleMessageEvent(data);
                        })
                        .listen('NewDirectMessage', (data) => {
                            logEvent(`App.Models.User.${userId}`, 'NewDirectMessage', data);
                            handleMessageEvent(data);
                        });

                    activeChannels.push({
                        name: `App.Models.User.${userId}`,
                        type: 'private'
                    });
                }

                // Listen to connector events for connection status changes
                if (window.Echo.connector) {
                    window.Echo.connector.pusher.connection.bind('state_change', (states) => {
                        console.log('Pusher connection state changed:', states);
                        updateConnectionStatus();
                    });
                }

                updateChannelsView();
            }

            function updateConnectionStatus() {
                if (!window.Echo || !window.Echo.connector) {
                    connectionStatus.textContent = 'Echo not initialized';
                    connectionStatus.className = 'connection-status disconnected';
                    return;
                }

                const state = window.Echo.connector.pusher.connection.state;
                connectionStatus.textContent = `${state.charAt(0).toUpperCase() + state.slice(1)}`;

                if (state === 'connected') {
                    connectionStatus.className = 'connection-status connected';
                } else if (state === 'connecting' || state === 'unavailable') {
                    connectionStatus.className = 'connection-status connecting';
                } else {
                    connectionStatus.className = 'connection-status disconnected';
                }
            }

            function updateChannelsView() {
                channelsContainer.innerHTML = activeChannels.map(channel =>
                    `<div><strong>${channel.name}</strong> (${channel.type})</div>`
                ).join('');
            }

            function logEvent(channel, event, data) {
                const eventEl = document.createElement('div');
                eventEl.className = 'event';

                const now = new Date();
                const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

                eventEl.innerHTML = `
                    <div class="event-time">${time}</div>
                    <div><span class="event-channel">${channel}</span> → <span class="event-name">${event}</span></div>
                    <div class="event-data">${JSON.stringify(data, null, 2)}</div>
                `;

                eventsContainer.appendChild(eventEl);
                eventsContainer.scrollTop = eventsContainer.scrollHeight;
            }

            // Special function to handle message events and display them in a user-friendly way
            function handleMessageEvent(data) {
                const msgContainer = document.createElement('div');
                msgContainer.className = 'message-event';
                msgContainer.style.backgroundColor = '#4a4a4a';
                msgContainer.style.padding = '12px';
                msgContainer.style.marginTop = '10px';
                msgContainer.style.borderRadius = '6px';
                msgContainer.style.borderLeft = '5px solid #66d9ef';

                // Extract key message information
                const messageId = data.id || 'unknown';
                const content = data.content || data.message || 'No content';
                const senderId = data.sender_id || (data.user ? data.user.id : 'unknown');
                const receiverId = data.receiver_id || 'unknown';
                const groupId = data.group_id;
                const timestamp = data.timestamp || data.created_at || new Date().toLocaleTimeString();

                // Format based on message type
                const messageType = groupId ? 'Group Message' : 'Direct Message';
                const fromTo = groupId ?
                    `From: User ${senderId} → Group ${groupId}` :
                    `From: User ${senderId} → To: User ${receiverId}`;

                msgContainer.innerHTML = `
                    <div style="font-size: 14px; margin-bottom: 5px; color: #a6e22e;">${messageType} (#${messageId})</div>
                    <div style="font-size: 12px; margin-bottom: 5px; color: #e6db74;">${fromTo}</div>
                    <div style="background-color: #2d2d2d; padding: 8px; border-radius: 4px; margin: 5px 0;">
                        <strong style="color: #f92672;">Message:</strong>
                        <span style="color: #fff;">${content}</span>
                    </div>
                    <div style="font-size: 11px; color: #75715e; text-align: right;">${timestamp}</div>
                `;

                eventsContainer.insertBefore(msgContainer, eventsContainer.firstChild);
            }

            clearBtn.addEventListener('click', () => {
                eventsContainer.innerHTML = '';
            });

            reconnectBtn.addEventListener('click', () => {
                if (window.Echo && window.Echo.connector) {
                    window.Echo.connector.pusher.disconnect();
                    setTimeout(() => {
                        window.Echo.connector.pusher.connect();
                    }, 500);
                }
            });

            testEventBtn.addEventListener('click', () => {
                logEvent('local', 'test.event', {
                    message: 'This is a test local event',
                    timestamp: new Date().toISOString()
                });
            });
        });
    </script>
</body>
</html>
