import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AdminSidebar } from '../components/admin/admin-sidebar';
import { AdminHeader } from '../components/admin/admin-header';
import { useAppearance } from '@/hooks/use-appearance';

interface BreadcrumbItem {
    href: string;
    name: string;
}

interface AdminLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

const pageVariants = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
        transition: {
            duration: 0.5,
            ease: "easeInOut" as const
        }
    },
    exit: {
        opacity: 0,
        transition: {
            duration: 0.3,
            ease: "easeInOut" as const
        }
    }
};

export default function AdminLayout({ children, breadcrumbs = [] }: AdminLayoutProps) {
    // Initialize theme
    const { theme } = useAppearance();

    // Apply additional settings from localStorage
    useEffect(() => {
        // Apply color scheme
        const colorScheme = localStorage.getItem('colorScheme') || 'teal';
        const colorMap: Record<string, { primary: string, secondary: string }> = {
            teal: { primary: '#00887A', secondary: '#D3E3FC' },
            blue: { primary: '#2563EB', secondary: '#DBEAFE' },
            purple: { primary: '#7C3AED', secondary: '#EDE9FE' },
            emerald: { primary: '#059669', secondary: '#D1FAE5' },
            amber: { primary: '#D97706', secondary: '#FEF3C7' },
        };

        if (colorMap[colorScheme]) {
            document.documentElement.style.setProperty('--primary-color', colorMap[colorScheme].primary);
            document.documentElement.style.setProperty('--secondary-color', colorMap[colorScheme].secondary);
        }

        // Apply motion settings
        if (localStorage.getItem('reduceMotion') === 'true') {
            document.body.classList.add('reduce-motion');
        } else {
            document.body.classList.remove('reduce-motion');
        }
    }, []);

    return (
        <div className="flex h-screen bg-white dark:bg-gray-900">
            <AdminSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                <AdminHeader breadcrumbs={breadcrumbs} />
                <motion.main
                    className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#D3E3FC]/30 dark:bg-gray-800/30"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                >
                    <div className="mx-auto max-w-7xl">
                        {children}
                    </div>
                </motion.main>
            </div>
        </div>
    );
}
