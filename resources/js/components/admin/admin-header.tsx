import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    Search,
    ChevronDown,
    User,
    Settings,
    LogOut
} from 'lucide-react';
import { Link } from '@inertiajs/react';

interface BreadcrumbItem {
    href: string;
    name: string;
}

interface AdminHeaderProps {
    breadcrumbs?: BreadcrumbItem[];
}

export const AdminHeader = ({ breadcrumbs = [] }: AdminHeaderProps) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    return (
        <motion.header
            className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-3 px-6 flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white mr-6">
                    Admin Control Center
                </h1>

                {breadcrumbs.length > 0 && (
                    <nav className="hidden md:flex">
                        <ol className="flex items-center space-x-2">
                            {breadcrumbs.map((breadcrumb, index) => (
                                <li key={breadcrumb.href} className="flex items-center">
                                    {index > 0 && (
                                        <span className="mx-2 text-gray-400">/</span>
                                    )}
                                    <Link
                                        href={breadcrumb.href}
                                        className={`text-sm ${index === breadcrumbs.length - 1
                                            ? 'font-medium text-[#00887A] dark:text-[#00ccb4]'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        {breadcrumb.name}
                                    </Link>
                                </li>
                            ))}
                        </ol>
                    </nav>
                )}
            </div>

            <div className="flex items-center space-x-4">
                <div className="relative hidden md:block">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="search"
                        className="block w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-[#00887A] focus:border-[#00887A] dark:focus:ring-[#00ccb4] dark:focus:border-[#00ccb4]"
                        placeholder="Search..."
                    />
                </div>

                <button className="p-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Bell className="h-5 w-5" />
                </button>

                <div className="relative">
                    <button
                        onClick={toggleDropdown}
                        className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    >
                        <div className="h-8 w-8 rounded-full bg-[#00887A] flex items-center justify-center text-white">
                            <span className="font-medium">A</span>
                        </div>
                        <span className="hidden md:block">Admin User</span>
                        <ChevronDown className="h-4 w-4" />
                    </button>

                    <AnimatePresence>
                        {dropdownOpen && (
                            <motion.div
                                className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Link
                                    href="/admin/profile"
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <User className="mr-3 h-4 w-4" />
                                    Profile
                                </Link>
                                <Link
                                    href="/admin/settings"
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <Settings className="mr-3 h-4 w-4" />
                                    Settings
                                </Link>
                                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                                <Link
                                    href="/logout"
                                    method="post"
                                    as="button"
                                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <LogOut className="mr-3 h-4 w-4" />
                                    Logout
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.header>
    );
};
