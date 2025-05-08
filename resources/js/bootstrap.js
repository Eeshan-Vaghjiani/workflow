import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Set up Axios
window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Initialize Pusher and Echo
window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'pusher',
    key: 'your_pusher_app_key',
    cluster: 'mt1',
    forceTLS: true,
    // Disable stats which can cause issues
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
}); 