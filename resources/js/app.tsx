import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import routeMappings from './routes';

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
        console.log("Resolving page:", name);

        // First check our custom route mappings
        const customRoute = routeMappings[name];
        if (customRoute) {
            console.log("Using custom route mapping:", customRoute);
            return resolvePageComponent(customRoute, import.meta.glob('./pages/**/*.tsx'));
        }

        const pages = import.meta.glob('./pages/**/*.tsx');
        console.log('Available pages:', Object.keys(pages));

        // Try multiple path variations
        const page = await resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx')
        ).catch(() => {
            // Try without .tsx extension
            return resolvePageComponent(
                `./pages/${name}`,
                import.meta.glob('./pages/**/*.tsx')
            ).catch(() => {
                // Try with /Index.tsx
                return resolvePageComponent(
                    `./pages/${name}/Index.tsx`,
                    import.meta.glob('./pages/**/*.tsx')
                );
            });
        });

        console.log("Resolving with path:", `./pages/${name}.tsx`);
        return page;
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
