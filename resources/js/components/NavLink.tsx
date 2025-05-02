import { Link } from '@inertiajs/react';

interface Props {
    href: string;
    active: boolean;
    children: React.ReactNode;
}

export default function NavLink({ href, active, children }: Props) {
    return (
        <Link
            href={href}
            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none ${active
                ? 'border-blue-500 text-gray-900 focus:border-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:text-gray-700 focus:border-gray-300'
                }`}
        >
            {children}
        </Link>
    );
} 