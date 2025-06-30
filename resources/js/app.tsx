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
            try {
                return await resolvePageComponent(customRoute, import.meta.glob('./pages/**/*.tsx'));
            } catch (error) {
                console.error(`Failed to resolve custom route mapping for ${name}:`, error);
                // Continue with standard resolution if custom mapping fails
            }
        }

        const pages = import.meta.glob('./pages/**/*.tsx');
        console.log('Available pages:', Object.keys(pages));

        // Convert the page name to various casing formats for better matching
        const originalName = name;
        const nameLower = name.toLowerCase();
        const nameUpper = name.toUpperCase();
        const namePascal = name.split('/').map(part =>
            part.charAt(0).toUpperCase() + part.slice(1)
        ).join('/');

        console.log("Trying variations:", {
            original: originalName,
            lower: nameLower,
            upper: nameUpper,
            pascal: namePascal
        });

        // Try to find a matching page path with case insensitivity
        const availablePaths = Object.keys(pages);
        const normalizedPaths = availablePaths.map(path => path.toLowerCase());

        // Check if we can find a case-insensitive match
        const pathVariations = [
            `./pages/${originalName}.tsx`,
            `./pages/${namePascal}.tsx`,
            `./pages/${originalName}/Index.tsx`,
            `./pages/${namePascal}/Index.tsx`
        ];

        for (const pathAttempt of pathVariations) {
            const normalizedAttempt = pathAttempt.toLowerCase();
            const matchIndex = normalizedPaths.findIndex(p => p === normalizedAttempt);

            if (matchIndex >= 0) {
                const exactPath = availablePaths[matchIndex];
                console.log("Found case-insensitive match:", exactPath);
                return resolvePageComponent(exactPath, pages);
            }
        }

        // If no case-insensitive match found, try the standard resolution paths
        try {
            console.log("Trying standard path:", `./pages/${name}.tsx`);
            return await resolvePageComponent(
                `./pages/${name}.tsx`,
                import.meta.glob('./pages/**/*.tsx')
            );
        } catch (firstError) {
            console.log("First attempt failed:", firstError);
            try {
                console.log("Trying without extension:", `./pages/${name}`);
                return await resolvePageComponent(
                    `./pages/${name}`,
                    import.meta.glob('./pages/**/*.tsx')
                );
            } catch (secondError) {
                console.log("Second attempt failed:", secondError);
                try {
                    console.log("Trying with Index:", `./pages/${name}/Index.tsx`);
                    return await resolvePageComponent(
                        `./pages/${name}/Index.tsx`,
                        import.meta.glob('./pages/**/*.tsx')
                    );
                } catch (thirdError) {
                    console.log("Third attempt failed:", thirdError);
                    // Last attempt with Pascal case for each segment
                    console.log("Trying Pascal case:", `./pages/${namePascal}.tsx`);
                    return await resolvePageComponent(
                        `./pages/${namePascal}.tsx`,
                        import.meta.glob('./pages/**/*.tsx')
                    );
                }
            }
        }
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

    // Set default theme to 'system' if none is stored
    if (!storedTheme) {
        localStorage.setItem('theme', 'system');
    }

    // Set up a theme transition class for smoother transitions
    document.documentElement.classList.add('theme-transition');

    // Apply theme based on system preference if set to 'system'
    const effectiveTheme = storedTheme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        : storedTheme;

    // Remove any existing theme classes
    document.documentElement.classList.remove('light', 'dark');

    // Add the effective theme class
    document.documentElement.classList.add(effectiveTheme);

    // Listen for system preference changes when theme is set to 'system'
    if (storedTheme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = () => {
            const newTheme = mediaQuery.matches ? 'dark' : 'light';
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(newTheme);
        };

        // Add event listener
        mediaQuery.addEventListener('change', handleChange);
    }

    // Remove transition class after a delay to avoid initial transition
    setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
    }, 300);
}
