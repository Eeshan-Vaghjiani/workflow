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