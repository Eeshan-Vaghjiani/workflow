<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Assignments Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: {{ $primaryColor }};
            margin-bottom: 5px;
        }
        .header p {
            color: #666;
            margin-top: 0;
        }
        .stats {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 5px;
        }
        .stat-box {
            text-align: center;
            padding: 10px;
        }
        .stat-box h3 {
            margin: 0;
            color: {{ $primaryColor }};
        }
        .stat-box p {
            margin: 5px 0 0;
            font-size: 14px;
            color: #666;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: {{ $primaryColor }};
            color: white;
        }
        tr:nth-child(even) {
            background-color: #f2f2f2;
        }
        .deleted {
            background-color: #ffeeee;
            text-decoration: line-through;
            color: #999;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #999;
        }
        .page-break {
            page-break-after: always;
        }
        .priority {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        .priority-high {
            background-color: #ffe6e6;
            color: #cc0000;
        }
        .priority-medium {
            background-color: #fff3e6;
            color: #cc6600;
        }
        .priority-low {
            background-color: #e6ffe6;
            color: #006600;
        }
        .chart-container {
            margin: 20px 0;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Assignments Report</h1>
        <p>Generated on {{ date('F j, Y') }}</p>
    </div>

    <div class="stats">
        <div class="stat-box">
            <h3>{{ $stats['total'] }}</h3>
            <p>Total Assignments</p>
        </div>
        <div class="stat-box">
            <h3>{{ $stats['active'] }}</h3>
            <p>Active Assignments</p>
        </div>
        <div class="stat-box">
            <h3>{{ $stats['deleted'] }}</h3>
            <p>Deleted Assignments</p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Title</th>
                <th>Group</th>
                <th>Created By</th>
                <th>Due Date</th>
                <th>Tasks</th>
                <th>Priority</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($assignments as $assignment)
                <tr class="{{ $assignment->deleted_at ? 'deleted' : '' }}">
                    <td>{{ $assignment->title }}</td>
                    <td>{{ $assignment->group ? $assignment->group->name : 'N/A' }}</td>
                    <td>{{ $assignment->creator ? $assignment->creator->name : 'N/A' }}</td>
                    <td>{{ $assignment->due_date ? date('M j, Y', strtotime($assignment->due_date)) : 'No due date' }}</td>
                    <td>{{ $assignment->tasks_count }}</td>
                    <td>
                        <span class="priority priority-{{ $assignment->priority }}">
                            {{ ucfirst($assignment->priority) }}
                        </span>
                    </td>
                    <td>{{ $assignment->deleted_at ? 'Deleted' : 'Active' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>This report is automatically generated. All times are in server's timezone.</p>
        <p>Total Active Tasks: {{ $assignments->sum('tasks_count') }}</p>
    </div>
</body>
</html>
