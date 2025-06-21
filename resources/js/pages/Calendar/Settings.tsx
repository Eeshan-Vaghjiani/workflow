import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, CheckCircle, CalendarIcon } from 'lucide-react';
import axios, { AxiosError } from 'axios';

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
    const [isSaving, setIsSaving] = useState(false);
    const [calendarId, setCalendarId] = useState(googleCalendarInfo?.calendar_id || '');

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

    const handleSaveCalendarId = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!googleCalendarConnected) {
            toast({
                title: "Error",
                description: "You need to connect your Google account first.",
                variant: "destructive",
            });
            return;
        }

        setIsSaving(true);

        try {
            // Get CSRF token
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            const response = await axios.post(route('calendar.save-settings'), {
                calendar_id: calendarId
            }, {
                headers: {
                    'X-CSRF-TOKEN': token,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (response.data.success) {
                toast({
                    title: "Success",
                    description: "Google Calendar ID saved successfully.",
                    variant: "default",
                });
            } else {
                throw new Error(response.data.message || "Failed to save calendar ID");
            }
        } catch (error: unknown) {
            console.error("Error saving calendar ID:", error);
            let errorMessage = "Failed to save calendar ID";

            if (error instanceof AxiosError) {
                errorMessage = error.response?.data?.message || error.message;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
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

                                            <Separator className="my-4" />

                                            <form onSubmit={handleSaveCalendarId} className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="calendar-id">Google Calendar ID</Label>
                                                    <div className="flex items-center space-x-2">
                                                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                                                        <Input
                                                            id="calendar-id"
                                                            value={calendarId}
                                                            onChange={(e) => setCalendarId(e.target.value)}
                                                            placeholder="primary or your_calendar_id@group.calendar.google.com"
                                                            className="flex-1"
                                                        />
                                                    </div>
                                                    <p className="text-sm text-gray-500">
                                                        Use "primary" for your main calendar or enter a specific calendar ID.
                                                        You can find your calendar ID in Google Calendar settings.
                                                    </p>
                                                </div>

                                                <Button
                                                    type="submit"
                                                    disabled={isSaving || !calendarId}
                                                >
                                                    {isSaving ? 'Saving...' : 'Save Calendar ID'}
                                                </Button>
                                            </form>
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
                                                    <li>You'll need to specify which calendar to use for syncing</li>
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
