import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Set up Axios
window.axios = axios;

// Set global headers
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true; // This is important for maintaining session cookies

// Get the CSRF token from the meta tag
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

if (csrfToken) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
}

// Log configuration for debugging
console.log('Axios configuration:', {
    withCredentials: window.axios.defaults.withCredentials,
    hasCsrfToken: !!csrfToken,
    baseURL: window.axios.defaults.baseURL || window.location.origin
});

// Initialize Pusher and Echo
window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY || 'your_pusher_app_key',
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
    forceTLS: true,
    // Enable WebSockets and disable stats to improve reliability
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    // Ensure CSRF token is sent with authentication requests
    authEndpoint: '/broadcasting/auth',
    auth: {
        headers: {
            'X-CSRF-TOKEN': csrfToken,
            'Accept': 'application/json'
        }
    }
}); 