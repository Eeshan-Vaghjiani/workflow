import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import AppLayout from '@/layouts/app-layout';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface GoogleCalendarInfo {
    calendar_id: string;
    connected_at: string;
    expires_at: string | null;
}

interface PageProps {
    googleCalendarConnected: boolean;
    googleCalendarInfo: GoogleCalendarInfo | null;
    configValid?: boolean;
    googleAuthUrl?: string;
    error?: string;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Settings({
    googleCalendarConnected,
    googleCalendarInfo,
    configValid = true,
    googleAuthUrl,
    error,
    flash
}: PageProps) {
    const { toast } = useToast();
    const [isRedirecting, setIsRedirecting] = useState(false);

    React.useEffect(() => {
        if (flash?.success) {
            toast({
                title: "Success",
                description: flash.success,
                variant: "default",
            });
        }

        if (flash?.error) {
            toast({
                title: "Error",
                description: flash.error,
                variant: "destructive",
            });
        }

        if (error) {
            toast({
                title: "Error",
                description: error,
                variant: "destructive",
            });
        }
    }, [flash, error, toast]);

    const handleGoogleConnect = () => {
        // If we have a direct URL from the server, use it
        if (googleAuthUrl) {
            setIsRedirecting(true);
            window.location.href = googleAuthUrl;
            return;
        }

        // Fallback to the route if no direct URL is provided
        setIsRedirecting(true);
        window.location.href = route('google.auth');
    };

    const breadcrumbs = [
        {
            title: 'Calendar',
            href: '/dashboard/calendar',
        },
        {
            title: 'Settings',
            href: '/calendar/settings',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Calendar Settings" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h1 className="text-2xl font-semibold mb-6">Calendar Settings</h1>

                            {!configValid && (
                                <Alert className="mb-6 bg-amber-50 border-amber-200">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Configuration Warning</AlertTitle>
                                    <AlertDescription>
                                        Google Calendar integration is not properly configured. Please check your server's
                                        environment variables for GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Card>
                                <CardHeader>
                                    <CardTitle>Google Calendar Integration</CardTitle>
                                    <CardDescription>
                                        Connect your Google Calendar to sync tasks and assignments
                                    </CardDescription>
                                </CardHeader>

                                <CardContent>
                                    {googleCalendarConnected ? (
                                        <div className="space-y-4">
                                            <Alert className="bg-green-50 border-green-200">
                                                <CheckCircle className="h-4 w-4" />
                                                <AlertTitle>Connected</AlertTitle>
                                                <AlertDescription>
                                                    Your Google Calendar is connected and working properly.
                                                </AlertDescription>
                                            </Alert>

                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="font-medium">Calendar ID:</span>
                                                    <span className="text-gray-600">{googleCalendarInfo?.calendar_id}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium">Connected on:</span>
                                                    <span className="text-gray-600">{googleCalendarInfo?.connected_at}</span>
                                                </div>
                                                {googleCalendarInfo?.expires_at && (
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">Token expires:</span>
                                                        <span className="text-gray-600">{googleCalendarInfo.expires_at}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <Alert className="bg-blue-50 border-blue-200">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertTitle>Not Connected</AlertTitle>
                                                <AlertDescription>
                                                    Connect your Google Calendar to sync tasks and assignments automatically.
                                                </AlertDescription>
                                            </Alert>

                                            <p className="text-sm text-gray-600">
                                                When you connect your Google Calendar, we'll automatically create events for
                                                your tasks and assignments. Any changes you make to your tasks will be reflected
                                                in your calendar.
                                            </p>

                                            <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700">
                                                <h4 className="font-medium mb-2">What to expect:</h4>
                                                <ul className="list-disc list-inside text-sm space-y-1 text-gray-600 dark:text-gray-400">
                                                    <li>You'll be prompted to select which Google account to use</li>
                                                    <li>You can choose any Google account, not just the one you use to log in</li>
                                                    <li>Google will ask for permission to access your calendar</li>
                                                    <li>You'll be redirected back to this page after connecting</li>
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>

                                <CardFooter>
                                    {googleCalendarConnected ? (
                                        <div className="flex space-x-4">
                                            <Button
                                                onClick={handleGoogleConnect}
                                                variant="secondary"
                                                disabled={!configValid || isRedirecting}
                                            >
                                                {isRedirecting ? 'Redirecting...' : 'Reconnect Calendar'}
                                            </Button>
                                            <Button asChild variant="destructive" disabled={isRedirecting}>
                                                <Link href={route('google.disconnect')}>Disconnect</Link>
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={handleGoogleConnect}
                                            disabled={!configValid || isRedirecting}
                                        >
                                            {isRedirecting ? 'Redirecting...' : 'Connect Google Calendar'}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
