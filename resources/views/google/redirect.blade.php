<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Redirecting to Google...</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
        }
        .redirect-container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 2rem;
            max-width: 500px;
            width: 90%;
        }
        h1 {
            color: #4f46e5;
            font-size: 1.5rem;
            margin-bottom: 1rem;
        }
        p {
            color: #4b5563;
            margin-bottom: 2rem;
        }
        .spinner {
            border: 3px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top: 3px solid #4f46e5;
            width: 24px;
            height: 24px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .btn {
            background-color: #4f46e5;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 0.5rem 1rem;
            cursor: pointer;
            font-size: 1rem;
            display: inline-block;
            text-decoration: none;
        }
        .btn:hover {
            background-color: #4338ca;
        }
    </style>
</head>
<body>
    <div class="redirect-container">
        <div class="spinner"></div>
        <h1>Redirecting to Google</h1>
        <p>{{ $message ?? 'You are being redirected to Google for authentication. This should happen automatically.' }}</p>
        <a href="{{ $url }}" class="btn" id="redirect-button">Click here if you are not redirected automatically</a>
    </div>

    <script>
        // Redirect automatically after a short delay
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
                window.location.href = "{{ $url }}";
            }, 1000);
        });
    </script>
</body>
</html>
