import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
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
axios.interceptors.request.use(config => {
    // Get the latest token on each request
    const token = getCsrfToken();
    if (token) {
        config.headers['X-CSRF-TOKEN'] = token;
    }

    // Always include credentials for cross-origin requests
    config.withCredentials = true;

    // Always ensure these headers are set for Laravel to recognize it as an XHR
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    config.headers['Accept'] = 'application/json';

    // Log out HTTP requests for debugging
    console.log(`🚀 Making ${config.method?.toUpperCase()} request to ${config.url}`, {
        withCredentials: config.withCredentials,
        hasCsrfToken: !!token
    });

    return config;
}, error => {
    return Promise.reject(error);
});

// Add a response interceptor to handle auth errors
axios.interceptors.response.use(
    response => response,
    async error => {
        // Only retry once to prevent infinite loops
        const originalRequest = error.config;

        if (error.response && error.response.status === 419 && !originalRequest._retry) {
            console.error('CSRF token mismatch - attempting to refresh token', error.response);

            originalRequest._retry = true;

            // Try to refresh the CSRF token
            const tokenRefreshed = await refreshCsrfToken();

            if (tokenRefreshed) {
                // Retry the original request with the new token
                return axios(originalRequest);
            }
        }

        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            console.error('Authentication error - attempting to refresh session', error.response);

            originalRequest._retry = true;

            try {
                // First try to refresh auth status
                const authCheckResponse = await axios.get('/auth/status');
                console.log('Auth status check:', authCheckResponse.data);

                if (!authCheckResponse.data.authenticated) {
                    // Then try to refresh the CSRF token
                    const tokenRefreshed = await refreshCsrfToken();

                    if (tokenRefreshed) {
                        // Try refresh the session
                        await axios.get('/auth/refresh-session');

                        // Retry the original request with the new token
                        return axios(originalRequest);
                    }
                } else {
                    // If we are authenticated, just retry with the current session
                    return axios(originalRequest);
                }
            } catch (refreshError) {
                console.error('Failed to refresh authentication:', refreshError);
            }
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
    key: import.meta.env.VITE_PUSHER_APP_KEY || '17b1123fdac52c500a2b',
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
    csrfToken: token ? 'Present' : 'Missing'
});

try {
    // Make sure cookies are sent with the request
    Pusher.logToConsole = true; // Enable Pusher logging for debugging

    // Create a new Pusher instance with debug logging
    const pusherOptions = {
        cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
        forceTLS: true,
        enabledTransports: ['ws', 'wss'],
        disableStats: false,
        enableStats: true,
        authEndpoint: '/broadcasting/auth',
        auth: {
            headers: {
                'X-CSRF-TOKEN': getCsrfToken() || '',
                'X-Requested-With': 'XMLHttpRequest'
            }
        }
    };

    console.log('Pusher options:', pusherOptions);

    window.Echo = new Echo({
        broadcaster: 'pusher',
        key: import.meta.env.VITE_PUSHER_APP_KEY || '17b1123fdac52c500a2b',
        ...pusherOptions
    });

    console.log('Echo initialized successfully');

    // Test Echo connection
    window.Echo.connector.pusher.connection.bind('connected', () => {
        console.log('Successfully connected to Pusher');

        // Test subscribing to the public channel
        try {
            const channel = window.Echo.channel('chat');
            console.log('Successfully subscribed to chat channel');

            // Listen for events on the channel
            channel.listen('message.new', (data) => {
                console.log('Received message.new event on chat channel:', data);
            });

            channel.listen('message.deleted', (data) => {
                console.log('Received message.deleted event on chat channel:', data);
            });

            // Also listen for the raw event names
            channel.listen('.NewDirectMessage', (data) => {
                console.log('Received raw NewDirectMessage event:', data);
            });

            channel.listen('.MessageDeleted', (data) => {
                console.log('Received raw MessageDeleted event:', data);
            });
        } catch (channelError) {
            console.error('Error subscribing to chat channel:', channelError);
        }
    });

    window.Echo.connector.pusher.connection.bind('error', (err) => {
        console.error('Pusher connection error:', err);
    });

    // Add more connection state logging
    window.Echo.connector.pusher.connection.bind('state_change', (states) => {
        console.log('Pusher connection state changed from', states.previous, 'to', states.current);
    });

    window.Echo.connector.pusher.connection.bind('disconnected', () => {
        console.log('Disconnected from Pusher');
    });

    window.Echo.connector.pusher.connection.bind('connecting', () => {
        console.log('Connecting to Pusher...');
    });

    window.Echo.connector.pusher.connection.bind('reconnecting', () => {
        console.log('Reconnecting to Pusher...');
    });
} catch (error) {
    console.error('Failed to initialize Echo:', error);
}

// Add axios request and response interceptors for debugging
axios.interceptors.request.use(
    config => {
        console.log('Making request to:', config.url, config);
        return config;
    },
    error => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

axios.interceptors.response.use(
    response => {
        console.log('Response received:', response);
        return response;
    },
    error => {
        console.error('Response error:', error.response || error);
        return Promise.reject(error);
    }
);
