<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auth Test</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            text-align: center;
        }
        .test-panel {
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .button {
            background-color: #4CAF50;
            border: none;
            color: white;
            padding: 10px 15px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
            margin: 4px 2px;
            cursor: pointer;
            border-radius: 4px;
        }
        pre {
            background-color: #fff;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
            margin-top: 10px;
            overflow: auto;
            max-height: 400px;
        }
    </style>
</head>
<body>
    <h1>Authentication Test</h1>

    <div class="test-panel">
        <h2>CSRF Token</h2>
        <div>
            <p><strong>Current CSRF Token:</strong> <span id="csrf-token">{{ csrf_token() }}</span></p>
            <button class="button" onclick="refreshCsrfToken()">Refresh CSRF Token</button>
        </div>
    </div>

    <div class="test-panel">
        <h2>Authentication Status</h2>
        <div>
            <button class="button" onclick="checkAuthStatus()">Check Auth Status</button>
            <pre id="auth-status-response">Click to check authentication status</pre>
        </div>
    </div>

    <div class="test-panel">
        <h2>Request Headers</h2>
        <div>
            <button class="button" onclick="showRequestHeaders()">Show Headers</button>
            <pre id="headers-info">Click to view headers that will be sent with requests</pre>
        </div>
    </div>

    <div class="test-panel">
        <h2>Test Endpoints</h2>
        <div>
            <button class="button" onclick="testEndpoint('/api/auth-quick')">Test /api/auth-quick</button>
            <button class="button" onclick="testEndpoint('/api/user')">Test /api/user</button>
            <button class="button" onclick="testEndpoint('/api/kanban/boards')">Test /api/kanban/boards</button>
            <pre id="endpoint-response">Select an endpoint to test</pre>
        </div>
    </div>

    <script>
        // CSRF token handling
        const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
        axios.defaults.withCredentials = true;

        // Refresh CSRF token
        async function refreshCsrfToken() {
            try {
                await axios.get('/sanctum/csrf-cookie');
                const newToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                document.getElementById('csrf-token').textContent = newToken;
                axios.defaults.headers.common['X-CSRF-TOKEN'] = newToken;
                alert('CSRF token refreshed!');
            } catch (error) {
                console.error('Error refreshing CSRF token:', error);
                alert('Failed to refresh CSRF token');
            }
        }

        // Check authentication status
        async function checkAuthStatus() {
            try {
                const response = await axios.get('/api/auth-quick');
                document.getElementById('auth-status-response').textContent = JSON.stringify(response.data, null, 2);
            } catch (error) {
                handleError(error, 'auth-status-response');
            }
        }

        // Show request headers
        function showRequestHeaders() {
            const headers = {
                'X-CSRF-TOKEN': axios.defaults.headers.common['X-CSRF-TOKEN'],
                'Content-Type': axios.defaults.headers.common['Content-Type'] || 'application/json',
                'Accept': axios.defaults.headers.common['Accept'] || 'application/json',
                'X-Requested-With': axios.defaults.headers.common['X-Requested-With'] || 'XMLHttpRequest',
                'withCredentials': axios.defaults.withCredentials
            };

            document.getElementById('headers-info').textContent = JSON.stringify(headers, null, 2);
        }

        // Test specific endpoint
        async function testEndpoint(url) {
            try {
                const response = await axios.get(url);
                document.getElementById('endpoint-response').textContent = JSON.stringify(response.data, null, 2);
            } catch (error) {
                handleError(error, 'endpoint-response');
            }
        }

        // Error handling
        function handleError(error, elementId) {
            console.error('API Error:', error);

            let errorMessage = 'An unknown error occurred';
            let errorDetails = {};

            if (error.response) {
                errorMessage = error.response.data.message || 'Server error';
                errorDetails = {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                };
            } else if (error.request) {
                errorMessage = 'No response received from server';
                errorDetails = {
                    request: 'Request was made but no response was received'
                };
            } else {
                errorMessage = error.message;
            }

            document.getElementById(elementId).textContent = JSON.stringify({
                error: errorMessage,
                details: errorDetails
            }, null, 2);
        }

        // Initialize - show headers
        showRequestHeaders();
    </script>
</body>
</html>
