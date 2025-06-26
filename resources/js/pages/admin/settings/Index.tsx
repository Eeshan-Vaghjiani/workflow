// Admin Settings

import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { motion } from 'framer-motion';
import {
    Settings,
    User,
    Shield,
    Palette,
    Bell,
    Globe,
    ChevronRight
} from 'lucide-react';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring" as const,
            stiffness: 100,
            damping: 15
        }
    }
};

// Settings sections data
const settingsSections = [
    {
        id: 'profile',
        name: 'Profile',
        description: 'Update your personal information and settings',
        icon: User,
        href: '/admin/profile',
        color: 'text-sky-500',
        bgColor: 'bg-sky-100 dark:bg-sky-900/20'
    },
    {
        id: 'appearance',
        name: 'Appearance',
        description: 'Customize the look and feel of the admin panel',
        icon: Palette,
        href: '/admin/settings/appearance',
        color: 'text-purple-500',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
        id: 'security',
        name: 'Security',
        description: 'Configure security options and two-factor authentication',
        icon: Shield,
        href: '/admin/security',
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/20'
    },
    {
        id: 'notifications',
        name: 'Notifications',
        description: 'Manage your notification preferences and alerts',
        icon: Bell,
        href: '/admin/notifications',
        color: 'text-amber-500',
        bgColor: 'bg-amber-100 dark:bg-amber-900/20'
    },
    {
        id: 'language',
        name: 'Language & Region',
        description: 'Set your preferred language and regional settings',
        icon: Globe,
        href: '#',
        color: 'text-blue-500',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    }
];

export default function AdminSettings() {
    // The 3D effect that follows mouse movement
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 30;
        const rotateY = (centerX - x) / 30;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        card.style.transition = 'transform 0.5s ease';
    };

    return (
        <AdminLayout>
            <Head title="Admin Settings" />

            <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage your admin panel preferences and configuration</p>
            </motion.div>

            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {settingsSections.map((section) => (
                    <motion.div
                        key={section.id}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-all duration-300"
                        variants={itemVariants}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                    >
                        <Link
                            href={section.href}
                            className="flex items-center justify-between group"
                        >
                            <div className="flex items-start space-x-4">
                                <div className={`p-3 rounded-lg ${section.bgColor} ${section.color}`}>
                                    <section.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-[#00887A] dark:group-hover:text-[#00ccb4] transition-colors">
                                        {section.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {section.description}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#00887A] dark:group-hover:text-[#00ccb4] transition-all transform group-hover:translate-x-1" />
                        </Link>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div
                className="bg-[#D3E3FC]/30 dark:bg-[#1e3a60]/20 rounded-xl p-6 border border-[#D3E3FC] dark:border-[#1e3a60]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <div className="flex items-start space-x-4">
                    <div className="p-2 rounded-full bg-[#00887A]/10 text-[#00887A] dark:text-[#00ccb4]">
                        <Settings className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Advanced Settings</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Additional configuration options are available in the system settings files.
                            Please refer to the administrator documentation for more details.
                        </p>
                    </div>
                </div>
            </motion.div>
        </AdminLayout>
    );
}
