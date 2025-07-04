<!DOCTYPE html>
<html>
<head>
    <title>Analytics Report</title>
    <style>
        body {
            font-family: sans-serif;
        }
        .report-container {
            padding: 20px;
        }
        h1 {
            text-align: center;
            margin-bottom: 30px;
        }
        .metric {
            margin-bottom: 15px;
            font-size: 18px;
        }
        .metric-label {
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="report-container">
        <h1>Analytics Report</h1>
        <div class="metric">
            <span class="metric-label">Total Users:</span> {{ $userCount }}
        </div>
        <div class="metric">
            <span class="metric-label">Total Groups:</span> {{ $groupCount }}
        </div>
        <div class="metric">
            <span class="metric-label">Active Users (Last 7 Days):</span> {{ $activeUsers }}
        </div>
        <div class="metric">
            <span class="metric-label">Active Groups (Last 7 Days):</span> {{ $activeGroups }}
        </div>
    </div>
</body>
</html>
