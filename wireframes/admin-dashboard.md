# Admin Dashboard Wireframe

```mermaid
flowchart TD
    subgraph "Admin Dashboard"
        A[Header/Navigation] --> B[Admin Overview]
        B --> C[User Management]
        B --> D[Group Management]
        B --> E[System Stats]
        B --> F[Admin Actions]
    end
```

## Admin Dashboard Layout

```
+------------------------------------------------------+
|                                                      |
| LOGO                              Admin ▼ | Notif (5)|
|                                                      |
+------------------------------------------------------+
|                    |                                 |
| Dashboard          |  Admin Dashboard                |
| Users              |                                 |
| Groups             |  +----------------------------+ |
| Assignments        |  | SYSTEM OVERVIEW            | |
| Tasks              |  |                            | |
| Calendar           |  | Users: 125                 | |
| Settings           |  | Groups: 34                 | |
| Logs               |  | Active Tasks: 287          | |
|                    |  | Assignments: 56            | |
|                    |  +----------------------------+ |
|                    |                                 |
|                    |  +----------------------------+ |
|                    |  | RECENT USERS               | |
|                    |  |                            | |
|                    |  | • User 1 - 2 hours ago     | |
|                    |  | • User 2 - 5 hours ago     | |
|                    |  | • User 3 - Yesterday       | |
|                    |  +----------------------------+ |
|                    |                                 |
|                    |  +----------------------------+ |
|                    |  | GROUP ACTIVITY             | |
|                    |  |                            | |
|                    |  | • Group 1 - 15 new tasks   | |
|                    |  | • Group 2 - 8 new tasks    | |
|                    |  | • Group 3 - 3 new tasks    | |
|                    |  +----------------------------+ |
|                    |                                 |
|                    |  +----------------------------+ |
|                    |  | ADMIN ACTIONS              | |
|                    |  |                            | |
|                    |  | [Add User] [Create Group]  | |
|                    |  | [System Settings]          | |
|                    |  +----------------------------+ |
|                    |                                 |
+------------------------------------------------------+
```

## User Management View

```mermaid
flowchart TD
    subgraph "User Management"
        A[Header/Navigation] --> B[User List]
        B --> C[Search/Filter]
        B --> D[User Details]
        D --> E[Edit User]
    end
```

```
+------------------------------------------------------+
|                                                      |
| LOGO                              Admin ▼ | Notif (5)|
|                                                      |
+------------------------------------------------------+
|                    |                                 |
| Dashboard          |  User Management                |
| Users              |                                 |
| Groups             |  Search: [____________] [Filter▼]|
| Assignments        |                                 |
| Tasks              |  +----------------------------+ |
| Calendar           |  | USERS                      | |
| Settings           |  |                            | |
| Logs               |  | Name      | Email    | Role| |
|                    |  |-----------|----------|-----| |
|                    |  | User 1    | u1@ex.com| User| |
|                    |  | User 2    | u2@ex.com| User| |
|                    |  | User 3    | u3@ex.com| Admin|
|                    |  | User 4    | u4@ex.com| User| |
|                    |  | User 5    | u5@ex.com| User| |
|                    |  +----------------------------+ |
|                    |                                 |
|                    |  [Previous] 1 2 3 ... [Next]    |
|                    |                                 |
|                    |  +----------------------------+ |
|                    |  | USER DETAILS               | |
|                    |  |                            | |
|                    |  | Name: John Doe             | |
|                    |  | Email: john@example.com    | |
|                    |  | Role: User                 | |
|                    |  | Groups: 3                  | |
|                    |  | Tasks: 12                  | |
|                    |  |                            | |
|                    |  | [Edit] [Delete] [Reset PW] | |
|                    |  +----------------------------+ |
|                    |                                 |
+------------------------------------------------------+
```

## Group Management View

```mermaid
flowchart TD
    subgraph "Group Management"
        A[Header/Navigation] --> B[Group List]
        B --> C[Search/Filter]
        B --> D[Group Details]
        D --> E[Edit Group]
    end
```

```
+------------------------------------------------------+
|                                                      |
| LOGO                              Admin ▼ | Notif (5)|
|                                                      |
+------------------------------------------------------+
|                    |                                 |
| Dashboard          |  Group Management               |
| Users              |                                 |
| Groups             |  Search: [____________] [Filter▼]|
| Assignments        |                                 |
| Tasks              |  +----------------------------+ |
| Calendar           |  | GROUPS                     | |
| Settings           |  |                            | |
| Logs               |  | Name      | Members | Tasks| |
|                    |  |-----------|---------|------| |
|                    |  | Group 1   | 8       | 35   | |
|                    |  | Group 2   | 5       | 22   | |
|                    |  | Group 3   | 12      | 47   | |
|                    |  | Group 4   | 3       | 15   | |
|                    |  | Group 5   | 7       | 28   | |
|                    |  +----------------------------+ |
|                    |                                 |
|                    |  [Previous] 1 2 3 ... [Next]    |
|                    |                                 |
|                    |  +----------------------------+ |
|                    |  | GROUP DETAILS              | |
|                    |  |                            | |
|                    |  | Name: Project Alpha        | |
|                    |  | Created: Jan 15, 2023      | |
|                    |  | Members: 8                 | |
|                    |  | Tasks: 35                  | |
|                    |  | Assignments: 5             | |
|                    |  |                            | |
|                    |  | [Edit] [Delete] [View]     | |
|                    |  +----------------------------+ |
|                    |                                 |
+------------------------------------------------------+
```
