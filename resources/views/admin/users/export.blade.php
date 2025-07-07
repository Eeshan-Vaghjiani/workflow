<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Users Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .analytics {
            margin-bottom: 40px;
            padding: 20px;
            background-color: #f5f5f5;
            border-radius: 5px;
        }
        .analytics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
        }
        .stat-box {
            padding: 15px;
            background-color: white;
            border-radius: 5px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .stat-label {
            font-size: 14px;
            color: #666;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
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
        .status-active {
            color: green;
        }
        .status-deleted {
            color: red;
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
        <h1>User Management Report</h1>
        <p>Generated on {{ $date }}</p>
    </div>

    <div class="analytics">
        <h2>Analytics Overview</h2>
        <div class="analytics-grid">
            <div class="stat-box">
                <div class="stat-label">Total Users</div>
                <div class="stat-value">{{ $analytics['total_users'] }}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Active Users</div>
                <div class="stat-value">{{ $analytics['active_users'] }}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Deleted Users</div>
                <div class="stat-value">{{ $analytics['deleted_users'] }}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Admin Users</div>
                <div class="stat-value">{{ $analytics['admin_users'] }}</div>
            </div>
        </div>
    </div>

    <h2 class="section-title">Active Users</h2>
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Last Login</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($active_users as $user)
            <tr>
                <td>{{ $user['Name'] }}</td>
                <td>{{ $user['Email'] }}</td>
                <td>{{ $user['Role'] }}</td>
                <td>{{ $user['Created'] }}</td>
                <td>{{ $user['Last Login'] }}</td>
                <td class="status-active">Active</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <h2 class="section-title">Deleted Users</h2>
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Last Login</th>
                <th>Deleted At</th>
            </tr>
        </thead>
        <tbody>
            @foreach($deleted_users as $user)
            <tr>
                <td>{{ $user['Name'] }}</td>
                <td>{{ $user['Email'] }}</td>
                <td>{{ $user['Role'] }}</td>
                <td>{{ $user['Created'] }}</td>
                <td>{{ $user['Last Login'] }}</td>
                <td class="status-deleted">{{ $user['Deleted At'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>This report is system generated. For any queries, please contact the administrator.</p>
    </div>
</body>
</html> 