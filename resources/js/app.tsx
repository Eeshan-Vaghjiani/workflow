import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: async (name) => {
        const pages = import.meta.glob('./pages/**/*.tsx');

        // Try lowercase-first version
        const normalizedName = name.charAt(0).toLowerCase() + name.slice(1);
        let path = `./pages/${normalizedName}.tsx`;

        if (!pages[path]) {
            // Fallback to original casing
            path = `./pages/${name}.tsx`;
        }

        // Debugging (optional: remove in production)
        console.log('Resolving page:', name);
        console.log('Available pages:', Object.keys(pages));
        console.log('Resolved path:', path);

        const page = await resolvePageComponent(path, pages);
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

// This will set light / dark mode on load...
initializeTheme();
