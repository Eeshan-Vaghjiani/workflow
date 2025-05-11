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
        // Make case insensitive page resolution to handle both Dashboard.tsx and dashboard.tsx
        const normalizedName = name.charAt(0).toLowerCase() + name.slice(1);

        let path = `./pages/${normalizedName}.tsx`;
        if (!pages[path]) {
            // If normalized (e.g. welcome.tsx) isn't found, try original (e.g. Welcome.tsx)
            path = `./pages/${name}.tsx`;
        }

        // If it's still not found, resolvePageComponent will throw an error as before.
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
