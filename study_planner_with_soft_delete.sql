CREATE TABLE users
(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE study_groups
(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    avatar VARCHAR(255) NULL,
    owner_id INTEGER NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE study_group_user
(
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role VARCHAR(20) DEFAULT 'member',
    last_read_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (group_id) REFERENCES study_groups(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE (group_id, user_id)
);

CREATE TABLE your_generic_secrets
(
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (group_id) REFERENCES study_groups(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE (group_id, user_id)
);

CREATE TABLE direct_messages
(
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);

CREATE TABLE study_group_messages
(
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    is_system_message BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (group_id) REFERENCES study_groups(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE notifications
(
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(100) NOT NULL,
    data TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE google_calendars
(
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    access_token VARCHAR(255) NOT NULL,
    refresh_token VARCHAR(255) NOT NULL,
    token_expires_at TIMESTAMP NOT NULL,
    calendar_id VARCHAR(255) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE study_sessions
(
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NULL,
    duration_minutes INTEGER NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE study_tasks
(
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    session_id INTEGER NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    priority VARCHAR(10) DEFAULT 'medium',
    status VARCHAR(15) DEFAULT 'pending',
    due_date TIMESTAMP NULL,
    estimated_minutes INTEGER NULL,
    actual_minutes INTEGER NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (session_id) REFERENCES study_sessions(id)
);

CREATE TABLE study_group_tasks
(
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    due_date TIMESTAMP NULL,
    priority VARCHAR(10) DEFAULT 'medium',
    status VARCHAR(15) DEFAULT 'pending',
    assigned_user_id INTEGER NULL,
    effort INTEGER NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (group_id) REFERENCES study_groups(id),
    FOREIGN KEY (assigned_user_id) REFERENCES users(id)
);

CREATE TABLE study_group_assignments
(
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    due_date TIMESTAMP NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(15) DEFAULT 'pending',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (group_id) REFERENCES study_groups(id)
);

CREATE TABLE task_attachments
(
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (task_id) REFERENCES study_group_tasks(id)
);

CREATE TABLE your_generic_secret
(
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE pomodoro_settings
(
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    work_duration_minutes INTEGER NOT NULL DEFAULT 25,
    short_break_minutes INTEGER NOT NULL DEFAULT 5,
    long_break_minutes INTEGER NOT NULL DEFAULT 15,
    your_generic_secreteak INTEGER NOT NULL DEFAULT 4,
    auto_start_breaks BOOLEAN DEFAULT FALSE,
    auto_start_pomodoros BOOLEAN DEFAULT FALSE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    notification_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE pomodoro_sessions
(
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    study_task_id INTEGER NULL,
    study_session_id INTEGER NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NULL,
    duration_minutes INTEGER NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    type VARCHAR(15) DEFAULT 'work',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (study_task_id) REFERENCES study_tasks(id),
    FOREIGN KEY (study_session_id) REFERENCES study_sessions(id)
);

CREATE TABLE subscription_plans
(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INTEGER NOT NULL,
    features TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE user_subscriptions
(
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    subscription_plan_id INTEGER NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id)
);

CREATE TABLE mpesa_transactions
(
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    subscription_id INTEGER NULL,
    transaction_id VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(15) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_time TIMESTAMP NOT NULL,
    status VARCHAR(10) DEFAULT 'pending',
    payment_method VARCHAR(50) DEFAULT 'M-PESA',
    receipt_number VARCHAR(50) NULL,
    balance VARCHAR(50) NULL,
    transaction_type VARCHAR(50) NULL,
    first_name VARCHAR(50) NULL,
    middle_name VARCHAR(50) NULL,
    last_name VARCHAR(50) NULL,
    your_generic_secretance VARCHAR(50) NULL,
    third_party_trans_id VARCHAR(50) NULL,
    result_code VARCHAR(10) NULL,
    result_desc TEXT NULL,
    raw_response TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id)
);

CREATE TABLE ai_features
(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    is_premium BOOLEAN DEFAULT TRUE,
    tokens_per_use INTEGER NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE user_ai_feature_usage
(
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    ai_feature_id INTEGER NOT NULL,
    subscription_id INTEGER NULL,
    used_at TIMESTAMP NOT NULL,
    tokens_used INTEGER NULL,
    response_data TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (ai_feature_id) REFERENCES ai_features(id),
    FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id)
);

CREATE INDEX your_generic_secretid ON study_sessions(user_id);
CREATE INDEX your_generic_secret_time ON study_sessions(start_time);
CREATE INDEX idx_study_tasks_user_id ON study_tasks(user_id);
CREATE INDEX your_generic_secretid ON study_tasks(session_id);
CREATE INDEX your_generic_secret ON study_tasks(due_date);
CREATE INDEX your_generic_secreter_id ON pomodoro_sessions(user_id);
CREATE INDEX your_generic_secretudy_task_id ON pomodoro_sessions(study_task_id);
CREATE INDEX your_generic_secretudy_session_id ON pomodoro_sessions(study_session_id);
CREATE INDEX your_generic_secretser_id ON mpesa_transactions(user_id);
CREATE INDEX your_generic_secretser_id ON user_subscriptions(user_id);
CREATE INDEX your_generic_secrete_user_id ON user_ai_feature_usage(user_id);
CREATE INDEX your_generic_secreter_receiver ON direct_messages(sender_id, receiver_id);
CREATE INDEX your_generic_secretiver_sender ON direct_messages(receiver_id, sender_id);
CREATE INDEX your_generic_secret_group_id ON study_group_messages(group_id);
CREATE INDEX your_generic_secretd_read ON notifications(user_id, is_read);
CREATE INDEX your_generic_secretd_type ON notifications(user_id, type);
CREATE INDEX your_generic_secretoup_id ON study_group_tasks(group_id);
CREATE INDEX your_generic_secretsigned_user_id ON study_group_tasks(assigned_user_id);
CREATE INDEX your_generic_secretnts_group_id ON study_group_assignments(group_id);
CREATE INDEX your_generic_secretup_id ON study_group_user(group_id);
CREATE INDEX your_generic_secretr_id ON study_group_user(user_id);
