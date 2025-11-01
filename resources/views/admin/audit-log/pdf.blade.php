<!DOCTYPE html>
<html>
<head>
    <title>Audit Log PDF</title>
    <style>
        body {
            font-family: sans-serif;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
    </style>
</head>
<body>
    <h1>Audit Log</h1>
    <table>
        <thead>
            <tr>
                <th>User ID</th>
                <th>Action</th>
                <th>Timestamp</th>
            </tr>
        </thead>
        <tbody>
            @foreach($auditLog as $log)
                <tr>
                    <td>{{ $log->user_id }}</td>
                    <td>{{ $log->action }}</td>
                    <td>{{ $log->created_at }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
