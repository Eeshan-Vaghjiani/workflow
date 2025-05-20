import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

// const navigation = [
//     { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
//     { name: 'Tasks', href: '/tasks', icon: CheckSquareIcon },
//     { name: 'Groups', href: '/groups', icon: UsersIcon },
//     { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
//     { name: 'Settings', href: '/settings', icon: SettingsIcon },
// ];

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        {children}
    </AppLayoutTemplate>
);
