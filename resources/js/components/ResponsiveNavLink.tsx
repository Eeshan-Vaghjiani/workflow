import { Link } from '@inertiajs/react';

interface Props {
    href: string;
    active?: boolean;
    children: React.ReactNode;
    method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
    as?: string;
}

export default function ResponsiveNavLink({ href, active = false, method = 'get', as = 'a', children }: Props) {
    return (
        <Link
            href={href}
            method={method}
            as={as}
            className={`w-full flex items-start pl-3 pr-4 py-2 border-l-4 ${active
                ? 'border-blue-400 text-blue-700 bg-blue-50 focus:text-blue-800 focus:bg-blue-100 focus:border-blue-700'
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300'
                } text-base font-medium focus:outline-none transition duration-150 ease-in-out`}
        >
            {children}
        </Link>
    );
} 