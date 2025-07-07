import React from 'react';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    Shield,
    BarChart3,
    UserCog,
    FileText
} from 'lucide-react';

const sidebarVariants = {
    hidden: {
        x: -300,
        opacity: 0
    },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            type: "spring" as const,
            stiffness: 100,
            damping: 20,
            when: "beforeChildren" as const,
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: {
        x: -20,
        opacity: 0
    },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            type: "spring" as const,
            stiffness: 100,
            damping: 10
        }
    }
};

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Groups', href: '/admin/groups', icon: Shield },
    { name: 'Assignments', href: '/admin/assignments', icon: FileText },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Profile', href: '/admin/profile', icon: UserCog },
];

export const AdminSidebar = () => {
    return (
        <motion.aside
            className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-sm flex-shrink-0 overflow-y-auto"
            initial="hidden"
            animate="visible"
            variants={sidebarVariants}
        >
            <div className="px-6 py-6">
                <Link href="/admin" className="flex items-center space-x-2">
                    <div className="bg-[#00887A] rounded-lg p-2 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">A</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</span>
                </Link>
            </div>

            <nav className="mt-5 px-4 space-y-1">
                {navigation.map((item) => (
                    <motion.div key={item.name} variants={itemVariants}>
                        <Link
                            href={item.href}
                            className="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-[#D3E3FC] dark:hover:bg-gray-800 hover:text-[#00887A] dark:hover:text-[#00ccb4]"
                        >
                            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                            <span>{item.name}</span>
                        </Link>
                    </motion.div>
                ))}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">

                    </p>
                </div>
            </div>
        </motion.aside>
    );
};
