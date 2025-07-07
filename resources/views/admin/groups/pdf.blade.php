<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Groups Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header h1 {
            color: {{ $primaryColor }};
            font-size: 24px;
            margin-bottom: 5px;
        }
        .header p {
            color: #666;
            font-size: 14px;
            margin-top: 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        table th {
            background-color: {{ $primaryColor }};
            color: white;
            font-weight: bold;
            text-align: left;
            padding: 8px;
            border: 1px solid #ddd;
        }
        table td {
            padding: 8px;
            border: 1px solid #ddd;
        }
        .status-active {
            color: green;
            font-weight: bold;
        }
        .status-deleted {
            color: red;
            font-weight: bold;
        }
        .summary {
            margin-top: 20px;
            padding: 10px;
            background-color: #f9f9f9;
            border: 1px solid #ddd;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
        tr:nth-child(even) {
            background-color: #f2f2f2;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Groups Report</h1>
        <p>Generated on: {{ date('Y-m-d H:i:s') }}</p>
    </div>

    <div class="summary">
        <h3>Summary</h3>
        <p>Total Groups: {{ $stats['total'] }}</p>
        <p>Active Groups: {{ $stats['active'] }}</p>
        <p>Deleted Groups: {{ $stats['deleted'] }}</p>
    </div>

    <h3>All Groups</h3>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Owner</th>
                <th>Members</th>
                <th>Public</th>
                <th>Created</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($groups as $group)
                <tr>
                    <td>{{ $group->id }}</td>
                    <td>{{ $group->name }}</td>
                    <td>{{ $group->owner->name ?? 'N/A' }}</td>
                    <td>{{ $group->members_count }}</td>
                    <td>{{ $group->is_public ? 'Yes' : 'No' }}</td>
                    <td>{{ $group->created_at->format('Y-m-d') }}</td>
                    <td class="{{ $group->deleted_at ? 'status-deleted' : 'status-active' }}">
                        {{ $group->deleted_at ? 'Deleted' : 'Active' }}
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>© {{ date('Y') }} Workflow. All rights reserved.</p>
    </div>
</body>
</html>
