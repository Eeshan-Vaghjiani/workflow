<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Kanban Debug Tool</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
        }
        h1, h2, h3 {
            color: #2c3e50;
        }
        .container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
            gap: 20px;
        }
        .card {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            padding: 20px;
            margin-bottom: 20px;
        }
        pre {
            background-color: #f8f8f8;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 10px;
            overflow: auto;
            max-height: 300px;
        }
        button {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
            font-size: 14px;
        }
        button:hover {
            background-color: #2980b9;
        }
        .success {
            color: #27ae60;
            font-weight: bold;
        }
        .error {
            color: #c0392b;
            font-weight: bold;
        }
        .endpoint-list {
            margin: 10px 0;
            padding: 0;
        }
        .endpoint-list li {
            list-style: none;
            margin-bottom: 5px;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-success {
            background-color: #2ecc71;
        }
        .status-error {
            background-color: #e74c3c;
        }
        .status-waiting {
            background-color: #f39c12;
        }
    </style>
</head>
<body>
    <h1>Kanban Authentication Debug Tool</h1>
    <p>Use this page to test and debug Kanban authentication and API endpoints.</p>

    <div class="container">
        <div class="card">
            <h2>Authentication Status</h2>
            <div id="auth-status">Checking...</div>
            <button onclick="checkAuthStatus()">Check Auth Status</button>
            <button onclick="refreshToken()">Refresh CSRF Token</button>
            <pre id="auth-details"></pre>
        </div>

        <div class="card">
            <h2>Create Test Board</h2>
            <div>
                <input type="text" id="board-name" placeholder="Board Name" value="Test Board">
                <button onclick="createTestBoard()">Create Board</button>
            </div>
            <pre id="create-result"></pre>
        </div>

        <div class="card">
            <h2>Test Endpoints</h2>
            <ul class="endpoint-list" id="endpoints-status">
                <li><span class="status-indicator status-waiting"></span> /api/auth-quick</li>
                <li><span class="status-indicator status-waiting"></span> /api/kanban/boards</li>
                <li><span class="status-indicator status-waiting"></span> /api/direct/kanban/boards</li>
                <li><span class="status-indicator status-waiting"></span> /web/kanban/boards</li>
            </ul>
            <button onclick="testAllEndpoints()">Test All Endpoints</button>
            <pre id="endpoint-details"></pre>
        </div>

        <div class="card">
            <h2>Test Specific Endpoint</h2>
            <div>
                <select id="endpoint-select">
                    <option value="/api/auth-quick">GET /api/auth-quick</option>
                    <option value="/api/kanban/boards">GET /api/kanban/boards</option>
                    <option value="/api/direct/kanban/boards">GET /api/direct/kanban/boards</option>
                    <option value="/web/kanban/boards">GET /web/kanban/boards</option>
                    <option value="/debug/kanban-auth">GET /debug/kanban-auth</option>
                </select>
                <button onclick="testSelectedEndpoint()">Test Endpoint</button>
            </div>
            <pre id="specific-endpoint-result"></pre>
        </div>
    </div>

    <script>
        // Update the CSRF token
        function getCsrfToken() {
            return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        }

        // Check authentication status
        async function checkAuthStatus() {
            const authStatusDiv = document.getElementById('auth-status');
            const authDetailsDiv = document.getElementById('auth-details');

            authStatusDiv.innerHTML = 'Checking...';
            authDetailsDiv.innerHTML = '';

            try {
                const response = await fetch('/debug/kanban-auth', {
                    headers: {
                        'X-CSRF-TOKEN': getCsrfToken(),
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'same-origin'
                });

                const data = await response.json();

                // Check if data and auth_info are available
                if (data && data.auth_info && data.auth_info.authenticated !== undefined) {
                    if (data.auth_info.authenticated) {
                        authStatusDiv.innerHTML = '<span class="success">Authenticated</span>';
                    } else {
                        authStatusDiv.innerHTML = '<span class="error">Not Authenticated</span>';
                    }
                } else {
                    authStatusDiv.innerHTML = '<span class="error">Invalid response format</span>';
                }

                authDetailsDiv.innerHTML = JSON.stringify(data, null, 2);
            } catch (error) {
                authStatusDiv.innerHTML = '<span class="error">Error checking auth</span>';
                authDetailsDiv.innerHTML = error.toString();
            }
        }

        // Refresh CSRF token
        async function refreshToken() {
            try {
                const response = await fetch('/sanctum/csrf-cookie', {
                    credentials: 'same-origin'
                });

                // Force refresh the page to get the new CSRF token
                window.location.reload();
            } catch (error) {
                console.error('Error refreshing CSRF token:', error);
            }
        }

        // Create a test kanban board
        async function createTestBoard() {
            const boardName = document.getElementById('board-name').value || 'Test Board';
            const createResultDiv = document.getElementById('create-result');

            createResultDiv.innerHTML = 'Creating board...';

            try {
                const response = await fetch('/api/kanban/boards', {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': getCsrfToken(),
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        name: boardName,
                        description: 'Created from debug tool',
                        is_active: true
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    createResultDiv.innerHTML = `<div class="success">Board created successfully!</div>` +
                                              JSON.stringify(data, null, 2);
                } else {
                    createResultDiv.innerHTML = `<div class="error">Failed to create board</div>` +
                                              JSON.stringify(data, null, 2);
                }
            } catch (error) {
                createResultDiv.innerHTML = `<div class="error">Error: ${error.toString()}</div>`;
            }
        }

        // Test all endpoints
        async function testAllEndpoints() {
            const endpointsDiv = document.getElementById('endpoints-status');
            const endpointDetailsDiv = document.getElementById('endpoint-details');

            endpointDetailsDiv.innerHTML = 'Testing all endpoints...';

            const endpoints = [
                '/api/auth-quick',
                '/api/kanban/boards',
                '/api/direct/kanban/boards',
                '/web/kanban/boards'
            ];

            const results = {};

            for (let i = 0; i < endpoints.length; i++) {
                const endpoint = endpoints[i];
                const statusItem = endpointsDiv.children[i].firstChild;

                statusItem.className = 'status-indicator status-waiting';

                try {
                    const startTime = performance.now();
                    const response = await fetch(endpoint, {
                        headers: {
                            'X-CSRF-TOKEN': getCsrfToken(),
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        credentials: 'same-origin'
                    });
                    const endTime = performance.now();

                    const responseTime = Math.round(endTime - startTime);
                    let data;

                    try {
                        data = await response.json();
                    } catch (e) {
                        data = { error: 'Invalid JSON response' };
                    }

                    results[endpoint] = {
                        status: response.status,
                        ok: response.ok,
                        time: responseTime + 'ms',
                        data
                    };

                    statusItem.className = 'status-indicator ' + (response.ok ? 'status-success' : 'status-error');
                } catch (error) {
                    results[endpoint] = {
                        error: error.toString()
                    };

                    statusItem.className = 'status-indicator status-error';
                }
            }

            endpointDetailsDiv.innerHTML = JSON.stringify(results, null, 2);
        }

        // Test a specific endpoint
        async function testSelectedEndpoint() {
            const endpoint = document.getElementById('endpoint-select').value;
            const resultDiv = document.getElementById('specific-endpoint-result');

            resultDiv.innerHTML = `Testing ${endpoint}...`;

            try {
                const startTime = performance.now();
                const response = await fetch(endpoint, {
                    headers: {
                        'X-CSRF-TOKEN': getCsrfToken(),
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'same-origin'
                });
                const endTime = performance.now();

                const responseTime = Math.round(endTime - startTime);

                let data;
                try {
                    data = await response.json();
                } catch (e) {
                    data = { error: 'Invalid JSON response' };
                }

                const result = {
                    url: endpoint,
                    status: response.status,
                    ok: response.ok,
                    time: responseTime + 'ms',
                    data
                };

                resultDiv.innerHTML = JSON.stringify(result, null, 2);
            } catch (error) {
                resultDiv.innerHTML = `Error: ${error.toString()}`;
            }
        }

        // Initialize by checking auth status
        window.onload = function() {
            checkAuthStatus();
        };
    </script>
</body>
</html>
