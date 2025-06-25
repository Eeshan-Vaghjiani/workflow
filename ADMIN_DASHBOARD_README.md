# Admin Dashboard

This is a futuristic 2030-style animated admin dashboard built with React, Laravel, Tailwind CSS, and Framer Motion. It provides a comprehensive control center for managing users, groups, analytics, settings, and system monitoring.

## Features

- **Modern UI Design**: Clean, flat design with smooth transitions and animations
- **Role-based Authentication**: Secure access to admin features
- **Comprehensive User Management**: View, create, edit, and delete users
- **Group Management**: Manage groups and their members
- **Analytics Dashboard**: Visualize platform metrics and user engagement
- **Audit Logs**: Track system activity and user actions
- **System Settings**: Configure platform settings and preferences
- **Responsive Layout**: Works on all device sizes

## Tech Stack

- **Frontend**: React (SPA)
- **Backend**: Laravel
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Color Palette

- **Primary**: #00887A – used for CTA buttons, active nav items, save actions
- **Accent**: #FFCCBC – hover states, subtle backgrounds, notifications
- **Light**: #FFFFFF – main backgrounds, card backgrounds, text on dark
- **Soft Blue**: #D3E3FC – content section backgrounds, table headers
- **CTA Bright**: #77A6F7 – secondary actions, links, stat highlights, badges

## Pages

- **/admin**: Dashboard overview
- **/admin/users**: User management
- **/admin/groups**: Group management
- **/admin/analytics**: Analytics dashboard
- **/admin/settings**: System settings
- **/admin/audit**: Audit logs
- **/admin/profile**: Admin profile management

## Getting Started

1. Access the admin dashboard at `/admin`
2. Navigate through the sidebar to access different sections
3. Use the search bar to quickly find information
4. View real-time metrics on the dashboard

## Security

The admin dashboard is protected by middleware that ensures only authenticated users with appropriate permissions can access it. All actions are logged in the audit system for accountability.

## Animations

The dashboard uses Framer Motion for smooth animations:

- Page transitions
- Element entrance animations
- Interactive hover effects
- Staggered loading of elements
- Micro-interactions for better user experience
