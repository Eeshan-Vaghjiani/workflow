/* Simplified Study Planner Schema */

/* Users Table */
CREATE TABLE users
(
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* Study Groups Table */
CREATE TABLE study_groups
(
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    owner_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

/* Group Memberships Table */
CREATE TABLE group_memberships
(
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES study_groups(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

/* Messages Table */
CREATE TABLE messages
(
    id INTEGER PRIMARY KEY,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NULL,
    group_id INTEGER NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (group_id) REFERENCES study_groups(id),
    CHECK (
        (receiver_id IS NULL AND group_id IS NOT NULL) OR
        (receiver_id IS NOT NULL AND group_id IS NULL)
    )
);

/* Tasks Table */
CREATE TABLE tasks
(
    id INTEGER PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    due_date TIMESTAMP NULL,
    status VARCHAR(15) DEFAULT 'pending',
    priority VARCHAR(10) DEFAULT 'medium',
    creator_id INTEGER NOT NULL,
    assignee_id INTEGER NULL,
    group_id INTEGER NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (assignee_id) REFERENCES users(id),
    FOREIGN KEY (group_id) REFERENCES study_groups(id)
);

/* Study Sessions Table */
CREATE TABLE study_sessions
(
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

/* Pomodoro Sessions Table */
CREATE TABLE pomodoro_sessions
(
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    task_id INTEGER NULL,
    session_type VARCHAR(15) DEFAULT 'work',
    start_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

/* User Settings Table */
CREATE TABLE user_settings
(
    user_id INTEGER PRIMARY KEY,
    work_duration_minutes INTEGER DEFAULT 25,
    short_break_minutes INTEGER DEFAULT 5,
    long_break_minutes INTEGER DEFAULT 15,
    your_generic_secreteak INTEGER DEFAULT 4,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

/* Subscriptions Table */
CREATE TABLE subscriptions
(
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    plan_name VARCHAR(50) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    payment_id VARCHAR(255) NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
