<!DOCTYPE html>
<html>
<head>
    <title>Notifications Report</title>
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
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            font-size: 12px;
        }
        th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .section-title {
            margin: 30px 0 15px;
            color: #333;
            border-bottom: 2px solid #eee;
            padding-bottom: 5px;
        }
        .badge {
            display: inline-block;
            padding: 3px 6px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: bold;
        }
        .badge-read {
            background-color: #e5e5e5;
            color: #666;
        }
        .badge-unread {
            background-color: #d4edda;
            color: #155724;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Notifications Report</h1>
        <p>Generated on {{ $date }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>User</th>
                <th>Type</th>
                <th>Message</th>
                <th>Status</th>
                <th>Date</th>
            </tr>
        </thead>
        <tbody>
            @foreach($notifications as $notification)
            <tr>
                <td>{{ $notification->id }}</td>
                <td>{{ $notification->user ? $notification->user->name : 'System' }}</td>
                <td>{{ $notification->type }}</td>
                <td>
                    @if(isset($notification->data['message']))
                        {{ $notification->data['message'] }}
                    @elseif(isset($notification->data['title']))
                        {{ $notification->data['title'] }}
                    @else
                        {{ json_encode($notification->data) }}
                    @endif
                </td>
                <td>
                    @if($notification->read)
                        <span class="badge badge-read">Read</span>
                    @else
                        <span class="badge badge-unread">Unread</span>
                    @endif
                </td>
                <td>{{ $notification->created_at->format('Y-m-d H:i:s') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>This report is system generated. For any queries, please contact the administrator.</p>
    </div>
</body>
</html>
