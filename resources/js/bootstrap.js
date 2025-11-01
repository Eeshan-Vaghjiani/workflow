import axios from 'axios';
import Pusher from 'pusher-js';
import Echo from 'laravel-echo';
import { getCsrfToken, refreshCsrfToken, setupCsrfRefresh } from './Utils/csrf.js';

// Set up Axios
window.axios = axios;

// Set global headers
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true; // This is important for maintaining session cookies
window.axios.defaults.baseURL = window.location.origin; // Ensure same origin for requests

// Get the CSRF token from the meta tag
const token = document.head.querySelector('meta[name="csrf-token"]');

if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
} else {
    console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
}

// Make the CSRF utility functions available globally
window.getCsrfToken = getCsrfToken;
window.refreshCsrfToken = refreshCsrfToken;

// Set up CSRF token refresh on page load
setupCsrfRefresh();

// Add a request interceptor to ensure CSRF token is always up-to-date
window.axios.interceptors.request.use(config => {
    // Add CSRF token to every request
    const token = document.head.querySelector('meta[name="csrf-token"]');
    if (token) {
        config.headers['X-CSRF-TOKEN'] = token.content;
        config.hasCsrfToken = true;
    }

    // Log request details in development
    if (import.meta.env.DEV) {
        console.log(`🚀 Making ${config.method?.toUpperCase()} request to ${config.url}`, config);
    }

    return config;
}, error => {
    return Promise.reject(error);
});

// Add a response interceptor to handle auth errors
window.axios.interceptors.response.use(
    response => {
        // Log response in development
        if (import.meta.env.DEV) {
            console.log('Response received:', response);
        }
        return response;
    },
    error => {
        // Log error in development
        if (import.meta.env.DEV) {
            console.log(' Response error:', error);
        }
        return Promise.reject(error);
    }
);

// Log configuration for debugging
console.log('Axios configuration:', {
    withCredentials: window.axios.defaults.withCredentials,
    hasCsrfToken: !!token,
    baseURL: window.axios.defaults.baseURL || window.location.origin,
    headers: window.axios.defaults.headers
});

// Initialize Pusher and Echo
window.Pusher = Pusher;

// Log that we're initializing Echo
console.log('Initializing Echo with:', {
    key: import.meta.env.VITE_PUSHER_APP_KEY || '5a90cf232dedb766fb44',
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
    csrfToken: token ? 'Present' : 'Missing'
});

try {
    // Configure Pusher
    const pusherConfig = {
        broadcaster: 'pusher',
        key: import.meta.env.VITE_PUSHER_APP_KEY || '5a90cf232dedb766fb44',
        cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
        // Don't use custom WebSocket server for Pusher cloud
        // wsHost: window.location.hostname,
        // wsPort: 6001,
        forceTLS: true,
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
        authEndpoint: '/broadcasting/auth',
    };

    console.log('Pusher options:', pusherConfig);

    // Initialize Echo with Pusher
    window.Echo = new Echo({
        ...pusherConfig,
        namespace: '',
    });

    // Log connection status
    window.Echo.connector.pusher.connection.bind('connected', () => {
        console.log('✅ Successfully connected to Pusher!', {
            socketId: window.Echo.connector.pusher.connection.socket_id,
            state: window.Echo.connector.pusher.connection.state
        });
    });

    window.Echo.connector.pusher.connection.bind('connecting', () => {
        console.log('🔄 Connecting to Pusher...', {
            key: pusherConfig.key,
            cluster: pusherConfig.cluster,
            forceTLS: pusherConfig.forceTLS
        });
    });

    window.Echo.connector.pusher.connection.bind('disconnected', () => {
        console.log('❌ Disconnected from Pusher');
    });

    window.Echo.connector.pusher.connection.bind('failed', (error) => {
        console.error('❌ Failed to connect to Pusher:', error);
    });

    // Log connection state changes
    window.Echo.connector.pusher.connection.bind('state_change', (states) => {
        console.log('Pusher connection state changed from', states.previous, 'to', states.current);
    });

    // Subscribe to the public chat channel
    window.Echo.channel('chat')
        .listen('.message.new', (data) => {
            console.log('Received .message.new event:', data);
            // Event will be handled by components
        })
        .listen('.message.deleted', (data) => {
            console.log('Received .message.deleted event:', data);
            // Event will be handled by components
        })
        .listen('.user.typing', (data) => {
            console.log('Received .user.typing event:', data);
            // Event will be handled by components
        })
        .listen('.user.status', (data) => {
            console.log('Received .user.status event:', data);
            // Event will be handled by components
        })
        .listen('.NewDirectMessage', (data) => {
            console.log('Received .NewDirectMessage event:', data);
            // Event will be handled by components
        })
        .listen('.NewGroupMessage', (data) => {
            console.log('Received .NewGroupMessage event:', data);
            // Event will be handled by components
        })
        .listen('.MessageDeleted', (data) => {
            console.log('Received .MessageDeleted event:', data);
            // Event will be handled by components
        })
        .listen('.UserTyping', (data) => {
            console.log('Received .UserTyping event:', data);
            // Event will be handled by components
        })
        .listen('.UserStatusUpdated', (data) => {
            console.log('Received .UserStatusUpdated event:', data);
            // Event will be handled by components
        });

    // Successfully initialized Echo
    console.log('Echo initialized successfully');
} catch (error) {
    console.error('Failed to initialize Echo:', error);
}
