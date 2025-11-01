import Heading from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren, useState, useEffect } from 'react';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: '/settings/profile',
        icon: undefined,
    },
    {
        title: 'Password',
        href: '/settings/password',
        icon: undefined,
    },
    {
        title: 'Appearance',
        href: '/settings/appearance',
        icon: undefined,
    },
    {
        title: 'Two-Factor Authentication',
        href: '/settings/two-factor-auth',
        icon: undefined,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const [isMounted, setIsMounted] = useState(false);
    const [currentPath, setCurrentPath] = useState('');

    // Handle client-side rendering
    useEffect(() => {
        setIsMounted(true);
        setCurrentPath(window.location.pathname);
    }, []);

    // When server-side rendering, we only render the layout on the client...
    if (!isMounted && typeof window === 'undefined') {
        return null;
    }

    return (
        <div className="px-4 py-6">
            <Heading title="Settings" description="Manage your profile and account settings" />

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-48">
                    <nav className="flex flex-col space-y-1 space-x-0">
                        {sidebarNavItems.map((item, index) => (
                            <Link
                                key={`${item.href}-${index}`}
                                href={item.href}
                                prefetch
                                className={cn(
                                    'inline-flex items-center justify-start px-3 py-1.5 text-xs font-medium rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00887A] dark:focus:ring-[#00ccb4] focus:ring-offset-white dark:focus:ring-offset-gray-900',
                                    'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border-transparent',
                                    'w-full justify-start',
                                    currentPath === item.href && 'bg-muted'
                                )}
                            >
                                {item.title}
                            </Link>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 md:hidden" />

                <div className="flex-1 md:max-w-2xl">
                    <section className="max-w-xl space-y-12">{children}</section>
                </div>
            </div>
        </div>
    );
}
