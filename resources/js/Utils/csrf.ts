import axios from 'axios';

/**
 * Get the current CSRF token from the meta tag
 */
export function getCsrfToken(): string | null {
    const token = document.head.querySelector('meta[name="csrf-token"]');
    return token ? token.getAttribute('content') : null;
}

/**
 * Refresh the CSRF token by making a request to the server
 */
export async function refreshCsrfToken(): Promise<boolean> {
    try {
        console.log('Refreshing CSRF token...');
        await axios.get('/sanctum/csrf-cookie');

        // Get the updated token from the meta tag
        const updatedToken = document.head.querySelector('meta[name="csrf-token"]');
        if (updatedToken) {
            window.axios.defaults.headers.common['X-CSRF-TOKEN'] = updatedToken.getAttribute('content');
            console.log('CSRF token refreshed successfully');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to refresh CSRF token:', error);
        return false;
    }
}

/**
 * Set up CSRF token refresh on page load
 */
export function setupCsrfRefresh(): void {
    document.addEventListener('DOMContentLoaded', async () => {
        await refreshCsrfToken();
    });
}

/**
 * Make an API request with CSRF token handling
 * This is a wrapper around axios that will automatically refresh the CSRF token if needed
 */
export async function csrfRequest<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: any,
    config?: any
): Promise<T> {
    try {
        // Get the current CSRF token
        const token = getCsrfToken();

        // Set up the request config
        const requestConfig = {
            ...config,
            headers: {
                ...config?.headers,
                'X-CSRF-TOKEN': token,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        // Make the request
        let response;
        if (method === 'get') {
            response = await axios.get(url, requestConfig);
        } else if (method === 'post') {
            response = await axios.post(url, data, requestConfig);
        } else if (method === 'put') {
            response = await axios.put(url, data, requestConfig);
        } else if (method === 'delete') {
            response = await axios.delete(url, requestConfig);
        } else {
            throw new Error(`Unsupported method: ${method}`);
        }

        return response.data;
    } catch (error: any) {
        // If we get a CSRF token mismatch error, refresh the token and try again
        if (error.response && error.response.status === 419) {
            console.log('CSRF token mismatch, refreshing token and retrying...');
            const refreshed = await refreshCsrfToken();
            if (refreshed) {
                return csrfRequest(method, url, data, config);
            }
        }
        throw error;
    }
}