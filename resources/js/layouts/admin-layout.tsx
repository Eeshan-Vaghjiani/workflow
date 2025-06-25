import React from 'react';
import { motion } from 'framer-motion';
import { AdminSidebar } from '../components/admin/admin-sidebar';
import { AdminHeader } from '../components/admin/admin-header';

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