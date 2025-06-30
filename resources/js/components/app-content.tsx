import { SidebarInset } from '@/components/ui/sidebar';
import * as React from 'react';

interface AppContentProps extends React.ComponentProps<'main'> {
    variant?: 'header' | 'sidebar';
}

export function AppContent({ variant = 'header', children, className = '', ...props }: AppContentProps) {
    if (variant === 'sidebar') {
        return (
            <SidebarInset
                className={`bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-900/80 dark:to-gray-800/80 backdrop-blur-sm pl-0 ${className}`}
                {...props}
            >
                {children}
            </SidebarInset>
        );
    }

    return (
        <main
            className={`flex h-full w-full flex-1 flex-col gap-3 rounded-xl p-3 bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-900/80 dark:to-gray-800/80 backdrop-blur-sm ${className}`}
            {...props}
        >
            {children}
        </main>
    );
}
