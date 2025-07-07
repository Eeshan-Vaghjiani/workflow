<!DOCTYPE html>
<html>
<head>
    <title>Analytics Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .stats-container {
            display: flex;
            flex-wrap: wrap;
            margin-bottom: 40px;
        }
        .stat-box {
            width: 45%;
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f5f5f5;
            border-radius: 5px;
            margin-right: 5%;
        }
        .stat-label {
            font-size: 14px;
            color: #666;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f5f5f5;
        }
        .section-title {
            margin: 30px 0 15px;
            color: #333;
            border-bottom: 2px solid #eee;
            padding-bottom: 5px;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Analytics Report</h1>
        <p>Generated on {{ $date }}</p>
    </div>

    <h2 class="section-title">Key Metrics</h2>
    <div class="stats-container">
        <div class="stat-box">
            <div class="stat-label">Total Users</div>
            <div class="stat-value">{{ $stats['users']['total'] }}</div>
        </div>
        <div class="stat-box">
            <div class="stat-label">Active Users (Last 7 Days)</div>
            <div class="stat-value">{{ $stats['users']['active'] }}</div>
        </div>
        <div class="stat-box">
            <div class="stat-label">Total Groups</div>
            <div class="stat-value">{{ $stats['groups']['total'] }}</div>
        </div>
        <div class="stat-box">
            <div class="stat-label">Active Groups (Last 7 Days)</div>
            <div class="stat-value">{{ $stats['groups']['active'] }}</div>
        </div>
    </div>

    <h2 class="section-title">User Activity Summary</h2>
    <table>
        <thead>
            <tr>
                <th>Metric</th>
                <th>Count</th>
                <th>Percentage</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Active Users</td>
                <td>{{ $stats['users']['active'] }}</td>
                <td>{{ $stats['users']['total'] > 0 ? round(($stats['users']['active'] / $stats['users']['total']) * 100, 1) : 0 }}%</td>
            </tr>
            <tr>
                <td>Inactive Users</td>
                <td>{{ $stats['users']['total'] - $stats['users']['active'] }}</td>
                <td>{{ $stats['users']['total'] > 0 ? round((($stats['users']['total'] - $stats['users']['active']) / $stats['users']['total']) * 100, 1) : 0 }}%</td>
            </tr>
            <tr>
                <td>Active Groups</td>
                <td>{{ $stats['groups']['active'] }}</td>
                <td>{{ $stats['groups']['total'] > 0 ? round(($stats['groups']['active'] / $stats['groups']['total']) * 100, 1) : 0 }}%</td>
            </tr>
            <tr>
                <td>Inactive Groups</td>
                <td>{{ $stats['groups']['total'] - $stats['groups']['active'] }}</td>
                <td>{{ $stats['groups']['total'] > 0 ? round((($stats['groups']['total'] - $stats['groups']['active']) / $stats['groups']['total']) * 100, 1) : 0 }}%</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        <p>This report is system generated. For any queries, please contact the administrator.</p>
    </div>
</body>
</html>
