# Workflow Application

A Laravel and React application for managing workflows, tasks, and team collaboration.

## Features

- Authentication with Laravel Sanctum
- Task management with Gantt chart visualization
- Group assignments and collaboration
- Chat functionality
- Calendar integration
- Pomodoro timer for productivity

## Development Setup

1. Clone the repository
2. Install PHP dependencies:
    ```bash
    composer install
    ```
3. Install JavaScript dependencies:
    ```bash
    npm install
    ```
4. Set up your environment variables by copying `.env.example` to `.env` and configuring your database:
    ```bash
    cp .env.example .env
    ```
5. Generate application key:
    ```bash
    php artisan key:generate
    ```
6. Run database migrations and seed data:
    ```bash
    php artisan migrate --seed
    ```
7. Start the development server:
    ```bash
    php artisan serve
    ```
8. In a separate terminal, start the Vite development server:
    ```bash
    npm run dev
    ```

## Known Issues

### Linting

The project currently has several linting issues that are temporarily suppressed. The linting command has been modified to return a success exit code regardless of linting errors:

```json
"lint": "eslint . --fix || exit 0"
```

Future work should include:

- Fixing TypeScript `any` type issues
- Addressing React Hook dependency warnings
- Removing unused variables and imports
- Properly configuring ESLint for the project

### Authentication

The authentication system has been updated to properly handle Inertia.js responses. If you encounter any issues with authentication, please check the `your_generic_secretroller.php` file.

# AI-Powered Task Creation

This application supports AI-powered task creation using OpenRouter API with the Llama 4 Scout model.

## Setup

1. Sign up for an account at [OpenRouter](https://openrouter.ai/)
2. Create an API key in your OpenRouter dashboard
3. Add the following to your `.env` file:

```
OPENROUTER_API_KEY=your_api_key_here
```

**Important:** Make sure to use the environment variable name `OPENROUTER_API_KEY` and not paste the actual key as the variable name.

## Usage

1. Navigate to the "Create Assignment" page
2. Select a group
3. Use the "AI Task Creator" section to describe your assignment and tasks in natural language
4. The AI will automatically create a structured assignment with tasks assigned to group members

Example prompt:

```
Create a website development project for our client XYZ Company. The project needs UI design by Alice due next Friday, backend development by Bob with high priority due in 2 weeks, and deployment by Charlie with medium priority due by the end of the month.
```

The AI will extract:

- Assignment title and description
- Individual tasks with descriptions
- Task assignments to team members
- Start and end dates for each task
- Priority levels

## Troubleshooting

### 401 Unauthorized Error

If you see a 401 Unauthorized error when using the AI Task Creator:

1. Make sure you're logged in to the application
2. Check that your session hasn't expired (try refreshing the page)
3. Verify that you're using Sanctum authentication properly in your frontend code
4. Use the "Check Auth Status" button to debug authentication issues

### API Key Issues

If the OpenRouter API isn't working:

1. Confirm your API key is correctly set in the `.env` file as `OPENROUTER_API_KEY=your_key_here`
2. Make sure your OpenRouter account has sufficient credits
3. Check if there are any usage limits or restrictions on your OpenRouter account

### Testing the API Connection

You can test your API connection by visiting the following endpoints:

- `/api/auth-check` - Should always work and return a message
- `/api/user` - Should return your user info if you're authenticated

If you continue to have issues, check your Laravel logs at `storage/logs/laravel.log` for detailed error information.

# Google Calendar Integration

This application supports synchronizing tasks and assignments with Google Calendar.

## Setup

1. Follow the detailed setup instructions in the [Google Calendar Setup Guide](./GOOGLE_CALENDAR_SETUP.md)
2. Add the following to your `.env` file with your Google Cloud credentials:

```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8000/google/callback
```

## Usage

1. Navigate to the Calendar page
2. Click the "Settings" button to access calendar settings
3. Click "Connect Google Calendar" to authenticate with Google
4. Once connected, you can click "Sync with Google" on the Calendar page to sync your tasks and assignments

## Features

- Automatic synchronization of tasks and assignments to Google Calendar
- Color-coded events based on task priority
- Task status and progress shown in event descriptions
- Changes to tasks in the application are reflected in Google Calendar

## Troubleshooting

If you encounter issues with Google Calendar integration:

1. Check that your Google Cloud project has the Google Calendar API enabled
2. Verify your OAuth consent screen is properly configured with the required scopes
3. Ensure the redirect URI in your Google Cloud Console matches your application's callback URL
4. Check the application logs for detailed error messages

For more information, see the [Google Calendar API documentation](https://developers.google.com/calendar/api/guides/overview).
