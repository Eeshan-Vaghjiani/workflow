// Admin Settings

import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const SettingsIndex: React.FC = () => {
    return (
        <AdminLayout>
            <Head title="Settings" />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Settings</h1>
                        <p className="text-gray-500 dark:text-gray-400">Manage application settings and preferences.</p>
                    </div>
                </div>

                {/* General Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 mb-6">
                    <h2 className="text-xl font-semibold mb-4">General Settings</h2>
                    {/* Placeholder for general settings form */}
                    <p>General settings form will be displayed here.</p>
                    <Button className="mt-4">Save Changes</Button>
                </div>

                {/* Security Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
                    {/* Placeholder for security settings form */}
                    <p>Security settings form will be displayed here.</p>
                    <Button className="mt-4">Save Changes</Button>
                </div>

                {/* Notification Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
                    {/* Placeholder for notification settings form */}
                    <p>Notification settings form will be displayed here.</p>
                    <Button className="mt-4">Save Changes</Button>
                </div>
            </motion.div>
        </AdminLayout>
    );
};

export default SettingsIndex;
