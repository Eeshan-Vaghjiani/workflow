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
            <div class="stat-value">{{ $stats['users'] }}</div>
        </div>
        <div class="stat-box">
            <div class="stat-label">Total Groups</div>
            <div class="stat-value">{{ $stats['groups'] }}</div>
        </div>
        <div class="stat-box">
            <div class="stat-label">Total Messages</div>
            <div class="stat-value">{{ $stats['messages'] }}</div>
        </div>
        <div class="stat-box">
            <div class="stat-label">Total Tasks</div>
            <div class="stat-value">{{ $stats['tasks'] }}</div>
        </div>
    </div>

    <h2 class="section-title">Monthly User Growth</h2>
    <table>
        <thead>
            <tr>
                <th>Month</th>
                <th>New Users</th>
            </tr>
        </thead>
        <tbody>
            @foreach($monthlyGrowth as $month => $count)
            <tr>
                <td>{{ $month }}</td>
                <td>{{ $count }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <h2 class="section-title">Feature Usage</h2>
    <table>
        <thead>
            <tr>
                <th>Feature</th>
                <th>Usage Score</th>
            </tr>
        </thead>
        <tbody>
            @foreach($featureUsage as $feature)
            <tr>
                <td>{{ $feature['name'] }}</td>
                <td>{{ $feature['value'] }}%</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <h2 class="section-title">Top Users by Activity</h2>
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Tasks</th>
                <th>Groups</th>
            </tr>
        </thead>
        <tbody>
            @foreach($topUsers as $user)
            <tr>
                <td>{{ $user['name'] }}</td>
                <td>{{ $user['email'] }}</td>
                <td>{{ $user['tasks'] }}</td>
                <td>{{ $user['groups'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>This report is system generated. For any queries, please contact the administrator.</p>
    </div>
</body>
</html>
