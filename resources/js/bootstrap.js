import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

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

// Function to refresh the CSRF token and session
async function refreshCSRFToken() {
    try {
        console.log('Refreshing CSRF token...');
        await axios.get('/sanctum/csrf-cookie');
        
        // Get the updated token from the meta tag
        const updatedToken = document.head.querySelector('meta[name="csrf-token"]');
        if (updatedToken) {
            window.axios.defaults.headers.common['X-CSRF-TOKEN'] = updatedToken.content;
            console.log('CSRF token refreshed successfully');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to refresh CSRF token:', error);
        return false;
    }
}

// Add a request interceptor to ensure CSRF token is always up-to-date
axios.interceptors.request.use(config => {
    // Refresh token on each request
    const token = document.head.querySelector('meta[name="csrf-token"]');
    if (token) {
        config.headers['X-CSRF-TOKEN'] = token.content;
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
        
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            console.error('Authentication error - attempting to refresh session', error.response);
            
            originalRequest._retry = true;
            
            // Try to refresh the CSRF token
            const tokenRefreshed = await refreshCSRFToken();
            
            if (tokenRefreshed) {
                // Retry the original request with the new token
                return axios(originalRequest);
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
    key: import.meta.env.VITE_PUSHER_APP_KEY || 'your_pusher_app_key',
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
    csrfToken: token ? 'Present' : 'Missing'
});

try {
    // Make sure cookies are sent with the request
    Pusher.logToConsole = true; // Enable Pusher logging for debugging
    
    window.Echo = new Echo({
        broadcaster: 'pusher',
        key: import.meta.env.VITE_PUSHER_APP_KEY || 'your_pusher_app_key',
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