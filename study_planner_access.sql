/* Microsoft Access compatible SQL schema */

/* Users Table */
CREATE TABLE users
(
    id COUNTER PRIMARY KEY,
    name TEXT(255) NOT NULL,
    email TEXT(255) NOT NULL UNIQUE,
    email_verified_at DATETIME NULL,
    password TEXT(255) NOT NULL,
    remember_token TEXT(100) NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted YESNO DEFAULT No,
    deleted_at DATETIME NULL
);

/* Study Groups Table */
CREATE TABLE study_groups
(
    id COUNTER PRIMARY KEY,
    name TEXT(255) NOT NULL,
    description MEMO NULL,
    avatar TEXT(255) NULL,
    owner_id LONG NOT NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted YESNO DEFAULT No,
    deleted_at DATETIME NULL,
    CONSTRAINT FK_StudyGroups_Users FOREIGN KEY (owner_id) REFERENCES users(id)
);

/* Study Group User Junction Table */
CREATE TABLE study_group_user
(
    id COUNTER PRIMARY KEY,
    group_id LONG NOT NULL,
    user_id LONG NOT NULL,
    role TEXT(20) DEFAULT 'member',
    last_read_at DATETIME NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted YESNO DEFAULT No,
    deleted_at DATETIME NULL,
    CONSTRAINT your_generic_secretroups FOREIGN KEY (group_id) REFERENCES study_groups(id),
    CONSTRAINT FK_StudyGroupUser_Users FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT UQ_StudyGroupUser UNIQUE (group_id, user_id)
);

/* Study Group Join Requests Table */
CREATE TABLE your_generic_secrets
(
    id COUNTER PRIMARY KEY,
    group_id LONG NOT NULL,
    user_id LONG NOT NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted YESNO DEFAULT No,
    deleted_at DATETIME NULL,
    CONSTRAINT your_generic_secrets_StudyGroups FOREIGN KEY (group_id) REFERENCES study_groups(id),
    CONSTRAINT your_generic_secrets_Users FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT your_generic_secrets UNIQUE (group_id, user_id)
);

/* Direct Messages Table (Solo Chat) */
CREATE TABLE direct_messages
(
    id COUNTER PRIMARY KEY,
    sender_id LONG NOT NULL,
    receiver_id LONG NOT NULL,
    message MEMO NOT NULL,
    is_read YESNO DEFAULT No,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted YESNO DEFAULT No,
    deleted_at DATETIME NULL,
    CONSTRAINT your_generic_secret FOREIGN KEY (sender_id) REFERENCES users(id),
    CONSTRAINT your_generic_secreter FOREIGN KEY (receiver_id) REFERENCES users(id)
);

/* Study Group Messages Table (Group Chat) */
CREATE TABLE study_group_messages
(
    id COUNTER PRIMARY KEY,
    group_id LONG NOT NULL,
    user_id LONG NOT NULL,
    message MEMO NOT NULL,
    is_system_message YESNO DEFAULT No,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted YESNO DEFAULT No,
    deleted_at DATETIME NULL,
    CONSTRAINT your_generic_secretudyGroups FOREIGN KEY (group_id) REFERENCES study_groups(id),
    CONSTRAINT your_generic_secreters FOREIGN KEY (user_id) REFERENCES users(id)
);

/* Notifications Table */
CREATE TABLE notifications
(
    id COUNTER PRIMARY KEY,
    user_id LONG NOT NULL,
    type TEXT(100) NOT NULL,
    data MEMO NOT NULL,
    is_read YESNO DEFAULT No,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted YESNO DEFAULT No,
    deleted_at DATETIME NULL,
    CONSTRAINT FK_Notifications_Users FOREIGN KEY (user_id) REFERENCES users(id)
);

/* Google Calendars Table */
CREATE TABLE google_calendars
(
    id COUNTER PRIMARY KEY,
    user_id LONG NOT NULL,
    access_token TEXT(255) NOT NULL,
    refresh_token TEXT(255) NOT NULL,
    token_expires_at DATETIME NOT NULL,
    calendar_id TEXT(255) NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted YESNO DEFAULT No,
    deleted_at DATETIME NULL,
    CONSTRAINT your_generic_secret FOREIGN KEY (user_id) REFERENCES users(id)
);

/* Study Sessions Table */
CREATE TABLE study_sessions
(
    id COUNTER PRIMARY KEY,
    user_id LONG NOT NULL,
    title TEXT(255) NOT NULL,
    description MEMO NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,
    duration_minutes LONG NULL,
    is_completed YESNO DEFAULT No,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted YESNO DEFAULT No,
    deleted_at DATETIME NULL,
    CONSTRAINT FK_StudySessions_Users FOREIGN KEY (user_id) REFERENCES users(id)
);

/* Study Tasks Table */
CREATE TABLE study_tasks
(
    id COUNTER PRIMARY KEY,
    user_id LONG NOT NULL,
    session_id LONG NULL,
    title TEXT(255) NOT NULL,
    description MEMO NULL,
    priority TEXT(10) DEFAULT 'medium',
    status TEXT(15) DEFAULT 'pending',
    due_date DATETIME NULL,
    estimated_minutes LONG NULL,
    actual_minutes LONG NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted YESNO DEFAULT No,
    deleted_at DATETIME NULL,
    CONSTRAINT FK_StudyTasks_Users FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT your_generic_secretons FOREIGN KEY (session_id) REFERENCES study_sessions(id)
);

/* Study Group Tasks Table */
CREATE TABLE study_group_tasks
(
    id COUNTER PRIMARY KEY,
    group_id LONG NOT NULL,
    title TEXT(255) NOT NULL,
    description MEMO NULL,
    due_date DATETIME NULL,
    priority TEXT(10) DEFAULT 'medium',
    status TEXT(15) DEFAULT 'pending',
    assigned_user_id LONG NULL,
    effort LONG NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted YESNO DEFAULT No,
    deleted_at DATETIME NULL,
    CONSTRAINT your_generic_secretGroups FOREIGN KEY (group_id) REFERENCES study_groups(id),
    CONSTRAINT your_generic_secret FOREIGN KEY (assigned_user_id) REFERENCES users(id)
);

/* Study Group Assignments Table */
CREATE TABLE study_group_assignments
(
    id COUNTER PRIMARY KEY,
    group_id LONG NOT NULL,
    title TEXT(255) NOT NULL,
    description MEMO NULL,
    due_date DATETIME NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status TEXT(15) DEFAULT 'pending',
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted YESNO DEFAULT No,
    deleted_at DATETIME NULL,
    CONSTRAINT your_generic_secret_StudyGroups FOREIGN KEY (group_id) REFERENCES study_groups(id)
);

/* Task Attachments Table */
CREATE TABLE task_attachments
(
    id COUNTER PRIMARY KEY,
    task_id LONG NOT NULL,
    file_path TEXT(255) NOT NULL,
    file_name TEXT(255) NOT NULL,
    file_size LONG NOT NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted YESNO DEFAULT No,
    deleted_at DATETIME NULL,
    CONSTRAINT your_generic_secretGroupTasks FOREIGN KEY (task_id) REFERENCES study_group_tasks(id)
);

/* AI Generated Assignments Table */
CREATE TABLE your_generic_secret
(
    id COUNTER PRIMARY KEY,
    user_id LONG NOT NULL,
    title TEXT(255) NOT NULL,
    content MEMO NOT NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted YESNO DEFAULT No,
    deleted_at DATETIME NULL,
    CONSTRAINT your_generic_secrets_Users FOREIGN KEY (user_id) REFERENCES users(id)
);

/* Pomodoro Settings Table */
CREATE TABLE pomodoro_settings
(
    id COUNTER PRIMARY KEY,
    user_id LONG NOT NULL,
    work_duration_minutes LONG NOT NULL DEFAULT 25,
    short_break_minutes LONG NOT NULL DEFAULT 5,
    long_break_minutes LONG NOT NULL DEFAULT 15,
    your_generic_secreteak LONG NOT NULL DEFAULT 4,
    auto_start_breaks YESNO DEFAULT No,
    auto_start_pomodoros YESNO DEFAULT No,
    sound_enabled YESNO DEFAULT Yes,
    notification_enabled YESNO DEFAULT Yes,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted YESNO DEFAULT No,
    deleted_at DATETIME NULL,
    CONSTRAINT your_generic_secrets FOREIGN KEY (user_id) REFERENCES users(id)
);

/* Pomodoro Sessions Table */
CREATE TABLE pomodoro_sessions
(
    id COUNTER PRIMARY KEY,
    user_id LONG NOT NULL,
    study_task_id LONG NULL,
    study_session_id LONG NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,
    duration_minutes LONG NULL,
    is_completed YESNO DEFAULT No,
    type TEXT(15) DEFAULT 'work',
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted YESNO DEFAULT No,
    deleted_at DATETIME NULL,
    CONSTRAINT your_generic_secrets FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT your_generic_secretyTasks FOREIGN KEY (study_task_id) REFERENCES study_tasks(id),
    CONSTRAINT your_generic_secretySessions FOREIGN KEY (study_session_id) REFERENCES study_sessions(id)
);

/* Subscription Plans Table */
CREATE TABLE subscription_plans
(
    id COUNTER PRIMARY KEY,
    name TEXT(255) NOT NULL,
    description MEMO NULL,
    price CURRENCY NOT NULL,
    duration_days LONG NOT NULL,
    features MEMO NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted YESNO DEFAULT No,
    deleted_at DATETIME NULL
);

/* User Subscriptions Table */
CREATE TABLE user_subscriptions
(
    id COUNTER PRIMARY KEY,
    user_id LONG NOT NULL,
    subscription_plan_id LONG NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    is_active YESNO DEFAULT Yes,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted YESNO DEFAULT No,
    deleted_at DATETIME NULL,
    CONSTRAINT your_generic_secretrs FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT your_generic_secretscriptionPlans FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id)
);

/* M-Pesa Transactions Table */
CREATE TABLE mpesa_transactions
(
    id COUNTER PRIMARY KEY,
    user_id LONG NOT NULL,
    subscription_id LONG NULL,
    transaction_id TEXT(255) NOT NULL UNIQUE,
    phone_number TEXT(15) NOT NULL,
    amount CURRENCY NOT NULL,
    transaction_time DATETIME NOT NULL,
    status TEXT(10) DEFAULT 'pending',
    payment_method TEXT(50) DEFAULT 'M-PESA',
    receipt_number TEXT(50) NULL,
    balance TEXT(50) NULL,
    transaction_type TEXT(50) NULL,
    first_name TEXT(50) NULL,
    middle_name TEXT(50) NULL,
    last_name TEXT(50) NULL,
    your_generic_secretance TEXT(50) NULL,
    third_party_trans_id TEXT(50) NULL,
    result_code TEXT(10) NULL,
    result_desc MEMO NULL,
    raw_response MEMO NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted YESNO DEFAULT No,
    deleted_at DATETIME NULL,
    CONSTRAINT your_generic_secretrs FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT your_generic_secretrSubscriptions FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id)
);

/* AI Features Table */
CREATE TABLE ai_features
(
    id COUNTER PRIMARY KEY,
    name TEXT(255) NOT NULL,
    description MEMO NULL,
    is_premium YESNO DEFAULT Yes,
    tokens_per_use LONG NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted YESNO DEFAULT No,
    deleted_at DATETIME NULL
);

/* User AI Feature Usage Table */
CREATE TABLE user_ai_feature_usage
(
    id COUNTER PRIMARY KEY,
    user_id LONG NOT NULL,
    ai_feature_id LONG NOT NULL,
    subscription_id LONG NULL,
    used_at DATETIME NOT NULL,
    tokens_used LONG NULL,
    response_data MEMO NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted YESNO DEFAULT No,
    deleted_at DATETIME NULL,
    CONSTRAINT your_generic_secreters FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT your_generic_secretFeatures FOREIGN KEY (ai_feature_id) REFERENCES ai_features(id),
    CONSTRAINT your_generic_secreterSubscriptions FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id)
);
