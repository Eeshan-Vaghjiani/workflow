import { Link } from '@inertiajs/react';

export default function Sidebar() {
    return (
        <nav className="flex flex-col gap-2 p-4 border-r min-h-screen bg-white dark:bg-neutral-900">
            <Link
                href={route('dashboard')}
                className="px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
                Dashboard
            </Link>
            <Link
                href={route('groups.index')}
                className="px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
                Groups
            </Link>
            <Link
                href={route('group-assignments.index')}
                className="px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
                Assignments
            </Link>
            <Link
                href={route('group-tasks.index')}
                className="px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
                Tasks
            </Link>
        </nav>
    );
}
