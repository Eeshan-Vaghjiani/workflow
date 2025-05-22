import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Set up Axios
window.axios = axios;

// Set global headers
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true; // This is important for maintaining session cookies

// Get the CSRF token from the meta tag
const token = document.head.querySelector('meta[name="csrf-token"]');

if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
} else {
    console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
}

// Add a request interceptor to ensure CSRF token is always up-to-date
axios.interceptors.request.use(config => {
    const token = document.head.querySelector('meta[name="csrf-token"]');
    if (token) {
        config.headers['X-CSRF-TOKEN'] = token.content;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// Log configuration for debugging
console.log('Axios configuration:', {
    withCredentials: window.axios.defaults.withCredentials,
    hasCsrfToken: !!token,
    baseURL: window.axios.defaults.baseURL || window.location.origin
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
    
    window.Echo = new Echo({
        broadcaster: 'pusher',
        key: import.meta.env.VITE_PUSHER_APP_KEY || '17b1123fdac52c500a2b',
        cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
        forceTLS: true,
        // Enable WebSockets and disable stats to improve reliability
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
        // Simplified authorizer for debugging
        authEndpoint: '/broadcasting/auth',
        auth: {
            headers: {
                'X-CSRF-TOKEN': token ? token.content : '',
                'X-Requested-With': 'XMLHttpRequest'
            }
        }
    });
    
    console.log('Echo initialized successfully');
    
    // Test Echo connection
    window.Echo.connector.pusher.connection.bind('connected', () => {
        console.log('Successfully connected to Pusher');
    });
    
    window.Echo.connector.pusher.connection.bind('error', (err) => {
        console.error('Pusher connection error:', err);
    });
} catch (error) {
    console.error('Failed to initialize Echo:', error);
} 