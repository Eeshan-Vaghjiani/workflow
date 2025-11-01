<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Debug Logs</title>
    <style>
        body {
            font-family: monospace;
            background: #f0f0f0;
            padding: 20px;
            margin: 0;
        }
        h1 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
        }
        .logs {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-size: 14px;
            line-height: 1.5;
            max-height: 80vh;
            overflow-y: auto;
        }
        .error { color: #f14c4c; }
        .warning { color: #e5e510; }
        .info { color: #3794ff; }
        .debug { color: #6dc066; }
    </style>
</head>
<body>
    <h1>Laravel Logs (Last 50 lines)</h1>
    
    <div class="logs">
        @if(empty($logs))
            No logs found.
        @else
            <pre>{{ $logs }}</pre>
        @endif
    </div>
    
    <div style="margin-top: 20px;">
        <button onclick="location.reload();">Refresh</button>
        <a href="/" style="margin-left: 10px;">Back to Home</a>
    </div>

    <script>
        // Highlight log levels
        document.addEventListener('DOMContentLoaded', function() {
            const pre = document.querySelector('pre');
            if (pre) {
                pre.innerHTML = pre.innerHTML
                    .replace(/\[ERROR\]/g, '<span class="error">[ERROR]</span>')
                    .replace(/\[WARN\]/g, '<span class="warning">[WARN]</span>')
                    .replace(/\[INFO\]/g, '<span class="info">[INFO]</span>')
                    .replace(/\[DEBUG\]/g, '<span class="debug">[DEBUG]</span>');
            }
            
            // Auto-scroll to bottom
            const logs = document.querySelector('.logs');
            logs.scrollTop = logs.scrollHeight;
        });
    </script>
</body>
</html> 