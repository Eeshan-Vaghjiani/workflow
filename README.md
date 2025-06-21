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

### Setup Instructions

1. **Create Google API credentials:**

    - Visit [Google Cloud Console](https://console.cloud.google.com/)
    - Create a new project (or select an existing one)
    - Go to "APIs & Services" > "Library"
    - Enable "Google Calendar API"
    - Go to "APIs & Services" > "Credentials"
    - Create OAuth 2.0 Client ID credentials
    - Set authorized redirect URIs: `{your-app-url}/google/callback`
    - Save your Client ID and Client Secret

2. **Configure Environment Variables:**

    ```env
    GOOGLE_CLIENT_ID=your-client-id
    GOOGLE_CLIENT_SECRET=your-client-secret
    GOOGLE_REDIRECT_URI=http://your-app-url/google/callback
    ```

3. **Connect your Google Calendar:**

    - Log in to the application
    - Go to Calendar settings
    - Click "Connect Google Calendar"
    - Follow the OAuth flow
    - Grant the requested permissions

4. **Set Your Calendar ID:**
    - After connecting your Google account, you need to set which calendar to use
    - Go to your Google Calendar in a browser
    - Find the calendar you want to use in the left sidebar
    - Click the three dots (⋮) next to it and select "Settings and sharing"
    - Scroll down to "Integrate calendar" section
    - Copy the Calendar ID
    - Return to Calendar Settings in the application
    - Paste the ID in the "Google Calendar ID" field
    - Click "Save Calendar ID"
    - For your primary calendar, you can simply use "primary" as the ID

### Troubleshooting

If calendar sync is not working:

1. Check your Google Calendar connection in the settings page
2. Make sure you've set a valid Calendar ID
3. Verify that you have valid tokens in the database (google_calendars table)
4. Examine logs for sync errors
5. Test sync functionality with the command: `php test_google_calendar.php {user_id}`
6. Ensure your Google API credentials have Calendar API access enabled
7. Confirm that the redirect URIs in Google Cloud Console match your .env file setting

#### Common Error Messages

- **"No calendar ID specified"**: You need to set a Calendar ID in Calendar Settings
- **"Calendar ID not found"**: The Calendar ID you entered doesn't exist or you don't have access to it
- **"Google Calendar not connected"**: You need to connect your Google account first
- **"Token revoked"** or **"Invalid token"**: Your Google connection has expired, reconnect it

For comprehensive troubleshooting, see the [GOOGLE_CALENDAR_SETUP_GUIDE.md](GOOGLE_CALENDAR_SETUP_GUIDE.md)

## Features

- Automatic synchronization of tasks and assignments to Google Calendar
- Color-coded events based on task priority
- Task status and progress shown in event descriptions
- Changes to tasks in the application are reflected in Google Calendar

For more information, see the [Google Calendar API documentation](https://developers.google.com/calendar/api/guides/overview).
