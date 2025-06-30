import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import AuthDebugger from '@/components/AuthDebugger';
import { motion } from 'framer-motion';
import { Card3D } from '@/components/ui/card-3d';
import { GlassContainer } from '@/components/ui/glass-container';
import { containerVariants, itemVariants } from '@/lib/theme-constants';

export default function AuthDebug() {
    const breadcrumbs = [
        {
            title: 'Authentication Debug',
            href: '/auth-debug',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Authentication Debugger" />

            <motion.div
                className="flex h-full flex-1 flex-col gap-6 p-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants} className="mb-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Authentication Debugger</h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">Use this tool to diagnose authentication issues</p>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card3D className="p-6">
                        <AuthDebugger />
                    </Card3D>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <GlassContainer className="p-6" blurIntensity="sm" hoverEffect>
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Authentication Troubleshooting Guide</h2>

                        <div className="prose dark:prose-invert max-w-none">
                            <h3 className="text-primary-500 dark:text-neon-green">1. Check Your Login Status</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                First, make sure you are properly logged in. If the authentication debugger shows
                                "Not Authenticated", try logging in again.
                            </p>

                            <h3 className="text-primary-500 dark:text-neon-green">2. CSRF Token Issues</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Laravel uses CSRF tokens to prevent cross-site request forgery. If your requests are failing with
                                419 errors, you might need to refresh your CSRF token using the "Refresh CSRF Cookie" button.
                            </p>

                            <h3 className="text-primary-500 dark:text-neon-green">3. Session Cookie Problems</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                For Sanctum authentication to work properly, your browser needs to send the session cookie with
                                API requests. Make sure your requests include <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">credentials: 'include'</code> and that the
                                session cookie is present in the debugger's cookie list.
                            </p>

                            <h3 className="text-primary-500 dark:text-neon-green">4. Testing API Endpoints</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                You can test various API endpoints to check authentication:
                            </p>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                                <li><a href="/api/auth-check" target="_blank" className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">/api/auth-check</a> - Should always work (no auth required)</li>
                                <li><a href="/api/auth-status" target="_blank" className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">/api/auth-status</a> - Shows detailed auth information</li>
                                <li><a href="/api/user" target="_blank" className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">/api/user</a> - Should show user data if authenticated</li>
                            </ul>

                            <h3 className="text-primary-500 dark:text-neon-green">5. Browser Console</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Check your browser's developer tools console for additional error messages that might help
                                identify the problem.
                            </p>
                        </div>
                    </GlassContainer>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}
