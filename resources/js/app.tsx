import '../css/app.css';
import './bootstrap.js';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

// Add CSRF import and setup
import axios from 'axios';

axios.defaults.withCredentials = true;  // Ensure cookies are sent with requests
axios.interceptors.request.use(config => {
    config.headers['X-XSRF-TOKEN'] = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    return config;
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: async (name) => {
        console.log('Resolving page:', name);

        // Get all pages
        const pages = import.meta.glob('./pages/**/*.tsx');
        console.log('Available pages:', Object.keys(pages));

        // Try multiple path variations
        const pathVariations = [
            `./pages/${name}.tsx`,                           // Exact match (e.g., Dashboard.tsx)
            `./pages/${name.toLowerCase()}.tsx`,             // All lowercase (e.g., dashboard.tsx)
            `./pages/${name.charAt(0).toUpperCase() + name.slice(1)}.tsx`, // Capitalized (e.g., Dashboard.tsx from dashboard)
        ];

        // Try to find a matching page
        let resolvedPath = null;
        for (const path of pathVariations) {
            if (pages[path]) {
                console.log('Found matching path:', path);
                resolvedPath = path;
                break;
            }
        }

        // If no direct match found, try to find a case-insensitive match
        if (!resolvedPath) {
            const nameLower = name.toLowerCase();
            const possibleMatch = Object.keys(pages).find(
                path => path.toLowerCase().includes(`/pages/${nameLower}.tsx`)
            );

            if (possibleMatch) {
                console.log('Found case-insensitive match:', possibleMatch);
                resolvedPath = possibleMatch;
            }
        }

        if (!resolvedPath) {
            console.error(`Could not find page: ${name}`);
            throw new Error(`Page not found: ${name}`);
        }

        console.log('Resolving with path:', resolvedPath);
        return resolvePageComponent(resolvedPath, pages);
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

// Initialize theme based on local storage or system preference
if (typeof window !== 'undefined') {
    // Get theme from localStorage or default to system preference
    const storedTheme = localStorage.getItem('theme') || 'system';
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    // Apply theme
    const theme = storedTheme === 'system' ? systemTheme : storedTheme;
    document.documentElement.classList.add(theme);
}
