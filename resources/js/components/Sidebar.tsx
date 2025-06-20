import { Link } from '@inertiajs/react';

export default function Sidebar() {
    // Helper function to safely get routes
    const safeRoute = (name: string, params = {}) => {
        try {
            return route(name, params);
        } catch (error) {
            console.error(`Route error for ${name}:`, error);
            return '#'; // Fallback to a safe URL
        }
    };

    return (
        <nav className="flex flex-col gap-2 p-4 border-r min-h-screen bg-white dark:bg-neutral-900">
            <Link
                href={safeRoute('dashboard')}
                className="px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
                Dashboard
            </Link>
            <Link
                href={safeRoute('groups.index')}
                className="px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
                Groups
            </Link>
            <Link
                href="/assignments" // Use a direct path instead of a named route that requires parameters
                className="px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
                Assignments
            </Link>
            <Link
                href="/tasks" // Use a direct path instead of a named route that requires parameters
                className="px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
                Tasks
            </Link>
            {/* Add M-Pesa Pro Payment link */}
            <Link
                href={safeRoute('mpesa.index')}
                className="px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-green-600 font-medium"
            >
                Pro Membership
            </Link>
        </nav>
    );
}
