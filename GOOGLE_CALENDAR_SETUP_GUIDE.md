# Google Calendar Integration Guide

## Overview

This guide will help you set up the Google Calendar integration correctly in your workflow application. We've made two important changes:

1. Added a **Calendar ID field** to the Settings page
2. Improved error handling to better identify integration issues

## Initial Setup

### Step 1: Connect Your Google Account

1. Go to **Calendar Settings** (/calendar/settings)
2. Click the "Connect Google Calendar" button
3. Follow the Google authorization flow
4. Allow all requested permissions

### Step 2: Set Your Calendar ID

After connecting your Google account, you need to specify which calendar to use for syncing:

1. Go to your Google Calendar at https://calendar.google.com/
2. Find the calendar you want to use in the left sidebar
3. Click on the three dots (⋮) next to your calendar
4. Select "Settings and sharing"
5. Scroll down to the "Integrate calendar" section
6. Copy your **Calendar ID** (it looks like: `primary` or `something@group.calendar.google.com`)
7. Return to the Calendar Settings page in your workflow application
8. Paste this ID in the "Google Calendar ID" field
9. Click "Save Calendar ID"

## Using Your Primary Calendar

If you want to use your main Google Calendar, you can simply enter `primary` in the Calendar ID field.

## Troubleshooting Common Issues

### "Calendar ID not found" Error

This means the Calendar ID you entered doesn't exist or you don't have permission to access it.

**Solution:**

1. Double-check your Calendar ID for typos
2. Make sure you're using the exact ID from Google Calendar settings
3. Verify you have permission to access this calendar

### "No calendar ID specified" Error

You need to enter a Calendar ID in the settings page.

**Solution:**

1. Go to Calendar Settings
2. Enter your Calendar ID
3. Save the settings

### "Google Calendar not connected" Error

You need to connect your Google account before syncing.

**Solution:**

1. Go to Calendar Settings
2. Click "Connect Google Calendar"

### "Token revoked" or "Invalid token" Error

Your Google connection has been lost or expired.

**Solution:**

1. Go to Calendar Settings
2. Click "Reconnect Calendar"

## Getting Help

If you continue experiencing issues, please:

1. Check the application logs for more details
2. Verify your Google API credentials in the environment settings
3. Contact the administrator if problems persist
