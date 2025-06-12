import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import AuthDebugger from '@/components/AuthDebugger';

 
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

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold">Authentication Debugger</h1>
                    <p className="text-gray-500">Use this tool to diagnose authentication issues</p>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <AuthDebugger />
                </div>

                <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 mt-4">
                    <h2 className="text-xl font-bold mb-4">Authentication Troubleshooting Guide</h2>

                    <div className="prose dark:prose-invert max-w-none">
                        <h3>1. Check Your Login Status</h3>
                        <p>
                            First, make sure you are properly logged in. If the authentication debugger shows
                            "Not Authenticated", try logging in again.
                        </p>

                        <h3>2. CSRF Token Issues</h3>
                        <p>
                            Laravel uses CSRF tokens to prevent cross-site request forgery. If your requests are failing with
                            419 errors, you might need to refresh your CSRF token using the "Refresh CSRF Cookie" button.
                        </p>

                        <h3>3. Session Cookie Problems</h3>
                        <p>
                            For Sanctum authentication to work properly, your browser needs to send the session cookie with
                            API requests. Make sure your requests include <code>credentials: 'include'</code> and that the
                            session cookie is present in the debugger's cookie list.
                        </p>

                        <h3>4. Testing API Endpoints</h3>
                        <p>
                            You can test various API endpoints to check authentication:
                        </p>
                        <ul>
                            <li><a href="/api/auth-check" target="_blank" className="text-blue-500">/api/auth-check</a> - Should always work (no auth required)</li>
                            <li><a href="/api/auth-status" target="_blank" className="text-blue-500">/api/auth-status</a> - Shows detailed auth information</li>
                            <li><a href="/api/user" target="_blank" className="text-blue-500">/api/user</a> - Should show user data if authenticated</li>
                        </ul>

                        <h3>5. Browser Console</h3>
                        <p>
                            Check your browser's developer tools console for additional error messages that might help
                            identify the problem.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
