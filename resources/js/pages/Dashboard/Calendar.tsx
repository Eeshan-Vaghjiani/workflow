import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, EventApi, EventDropArg } from '@fullcalendar/core';
import { EventResizeDoneArg } from '@fullcalendar/interaction';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarIcon, RefreshCw, Settings, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';

interface Event {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay?: boolean;
    url?: string;
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    classNames?: string[];
    extendedProps: {
        assignment?: string;
        group: string;
        priority: string;
        status?: string;
        type?: string;
        isPastDue?: boolean;
    };
}

interface Props {
    events: Event[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Calendar',
        href: '/dashboard/calendar',
    },
];

export default function Calendar({ events }: Props) {
    const [eventInfo, setEventInfo] = useState<EventApi | null>(null);
    const [syncing, setSyncing] = useState(false);
    const { toast } = useToast();
    const calendarRef = useRef<FullCalendar>(null);
    const [localEvents, setLocalEvents] = useState<Event[]>(events);

    // Helper function to format task data into calendar event format
    const formatTaskForCalendar = (task: any): Event => {
        return {
            id: String(task.id),
            title: task.title,
            start: task.start_date,
            end: task.end_date || task.due_date,
            allDay: true,
            backgroundColor: getPriorityColor(task.priority),
            borderColor: getPriorityColor(task.priority),
            textColor: '#ffffff',
            extendedProps: {
                group: task.group || "Unknown",
                priority: task.priority || "medium",
                status: task.status || "pending",
                assignment: task.assignment?.title,
                type: "task"
            }
        };
    };

    // Helper function to get color based on priority
    const getPriorityColor = (priority: string): string => {
        switch (priority) {
            case 'high': return '#ef4444'; // Red
            case 'medium': return '#f59e0b'; // Amber
            case 'low': return '#10b981'; // Green
            default: return '#6b7280'; // Gray
        }
    };

    // Update events to mark past due items
    const processedEvents = localEvents.map(event => {
        const now = new Date();
        const endDate = new Date(event.end);

        // Check if the event is past due
        if (endDate < now && (!event.extendedProps.status || event.extendedProps.status !== 'completed')) {
            return {
                ...event,
                backgroundColor: '#ef4444', // Red for past due
                borderColor: '#ef4444',
                textColor: '#ffffff',
                classNames: ['past-due-event'],
                extendedProps: {
                    ...event.extendedProps,
                    isPastDue: true
                }
            };
        }

        return event;
    });

    // Function to handle event click
    const handleEventClick = (info: EventClickArg) => {
        // Prevent default to stop navigation when we want to show the modal
        if (!info.event.url) {
            info.jsEvent.preventDefault();
        }
        setEventInfo(info.event);
    };

    // Function to handle event hover
    const handleEventMouseEnter = (info: { event: EventApi }) => {
        setEventInfo(info.event);
    };

    // Function to handle event hover out
    const handleEventMouseLeave = () => {
        setEventInfo(null);
    };

    // Handler for event drag-n-drop
    const handleEventChange = async (info: EventDropArg | EventResizeDoneArg) => {
        const { event } = info;
        const id = event.id;
        const start = event.start ? new Date(event.start).toISOString().split('T')[0] : null;
        const end = event.end ? new Date(event.end).toISOString().split('T')[0] : start;

        if (!start) {
            console.error('Invalid start date');
            info.revert();
            return;
        }

        try {
            // Get CSRF token
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            if (!token) {
                console.error('CSRF token not found');
                toast({
                    title: "Authentication Error",
                    description: "Please refresh the page and try again.",
                    variant: "destructive"
                });
                info.revert();
                return;
            }

            // Extract required fields from the full event object
            // This ensures we're sending all the data the backend expects
            const payload = {
                start_date: start,
                end_date: end,
                due_date: end, // Add due_date field to match backend validation requirement
                title: event.title,
                // Include any extendedProps needed by the backend
                ...(event.extendedProps || {}),
                // Ensure we have the required fields for validation
                status: event.extendedProps?.status || 'pending',
                priority: event.extendedProps?.priority || 'medium',
            };

            console.log('Updating task with payload:', payload, 'for task ID:', id);

            // Update the task in the backend using the web route instead of API route
            const response = await axios.put(`/tasks/${id}`, payload, {
                headers: {
                    'X-CSRF-TOKEN': token,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                withCredentials: true
            });

            console.info('Task update response:', response.data);

            // Consider the update successful if either:
            // 1. response.data.success is true, OR
            // 2. response.data.message contains "Task updated successfully"
            const isSuccessful = response.data.success === true ||
                (response.data.message && response.data.message.includes('Task updated successfully'));

            if (isSuccessful) {
                // If server response contains the updated task, use that data
                if (response.data.task) {
                    const updatedEvent = formatTaskForCalendar(response.data.task);
                    setLocalEvents(prev =>
                        prev.map(e => e.id === id ? updatedEvent : e)
                    );
                    console.info('UI state successfully updated with server response.');
                } else {
                    // Fall back to our local state update if server doesn't return the task
                    setLocalEvents(prev => prev.map(e => {
                        if (e.id === id) {
                            return {
                                ...e,
                                start,
                                end: end || start
                            };
                        }
                        return e;
                    }));
                }

                // Show different message based on Google Calendar sync
                const syncMessage = response.data.google_sync
                    ? "Task dates updated and synced with Google Calendar."
                    : "Task dates updated successfully.";

                toast({
                    title: "Event Updated",
                    description: syncMessage,
                });
            } else {
                console.warn('Task update returned success: false', response.data);
                info.revert(); // Revert the UI change if the server reports failure
                throw new Error(response.data.message || 'Failed to update task');
            }
        } catch (error: any) {
            console.error('Error updating event:', error);
            info.revert();

            let errorMessage = "Failed to update task dates. Please try again.";

            if (error.response) {
                // Handle specific error responses
                console.error('Error response data:', error.response.data);
                if (error.response.status === 401) {
                    errorMessage = "You need to be logged in to update tasks. Please refresh the page.";
                } else if (error.response.status === 403) {
                    errorMessage = "You don't have permission to update this task.";
                } else if (error.response.status === 422) {
                    // Handle validation errors specifically
                    errorMessage = "Validation error: " +
                        (error.response.data?.errors ?
                            Object.values(error.response.data.errors).flat().join(", ") :
                            error.response.data.message || "Please check your input");
                } else if (error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast({
                title: "Update Failed",
                description: errorMessage,
                variant: "destructive"
            });
        }
    };

    // Helper function to safely format dates
    const formatDate = (date: Date | null) => {
        return date?.toLocaleDateString() ?? '';
    };

    // Sync with Google Calendar
    const syncWithGoogle = async () => {
        setSyncing(true);

        try {
            // Get CSRF token
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            if (!token) {
                console.error('CSRF token not found');
                toast({
                    title: "Authentication Error",
                    description: "Please refresh the page and try again.",
                    variant: "destructive"
                });
                return;
            }

            // Use the web route instead of API route
            const response = await axios.post('/calendar/sync', {}, {
                headers: {
                    'X-CSRF-TOKEN': token,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                withCredentials: true
            });

            if (response.data.success) {
                toast({
                    title: "Calendar Synced",
                    description: "Your tasks have been synchronized with Google Calendar.",
                });
            } else {
                throw new Error(response.data.message || 'Failed to sync with Google Calendar');
            }
        } catch (error: any) {
            console.error('Error syncing with Google Calendar:', error);

            // Check for specific error codes
            let errorMessage = "Failed to sync with Google Calendar. Please check your connection.";

            if (error.response) {
                if (error.response.status === 401) {
                    errorMessage = "You need to be logged in to sync calendars. Please refresh the page.";
                } else if (error.response.status === 403) {
                    errorMessage = "You don't have permission to sync this calendar.";
                } else if (error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                }

                if (error.response.data && error.response.data.error_code) {
                    const errorCode = error.response.data.error_code;
                    if (errorCode === 'calendar_not_connected') {
                        errorMessage = "Google Calendar is not connected. Please visit Settings to connect your account.";
                    } else if (errorCode === 'token_revoked' || errorCode === 'invalid_token') {
                        errorMessage = "Your Google Calendar connection needs to be renewed. Please visit Settings.";
                    }
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast({
                title: "Sync Failed",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setSyncing(false);
        }
    };



    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Calendar" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">Calendar View</h1>

                        <div className="flex space-x-2">
                            <Button onClick={syncWithGoogle} disabled={syncing}>
                                {syncing ? (
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                )}
                                Sync with Google
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={route('calendar.settings')}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="mb-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center mr-4">
                            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                            <span>Past Due</span>
                        </div>
                        <div className="flex items-center mr-4">
                            <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                            <span>High Priority</span>
                        </div>
                        <div className="flex items-center mr-4">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                            <span>Normal Priority</span>
                        </div>
                        <div className="text-xs ml-2">(Drag events to change dates)</div>
                    </div>

                    <div className="relative">
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay'
                            }}
                            events={processedEvents}
                            eventClick={handleEventClick}
                            eventMouseEnter={handleEventMouseEnter}
                            eventMouseLeave={handleEventMouseLeave}
                            height="auto"
                            editable={true}
                            eventDrop={handleEventChange}
                            eventResize={handleEventChange}
                            longPressDelay={0}
                        />

                        {eventInfo && (
                            <div className="absolute z-10 bg-white dark:bg-neutral-800 shadow-lg rounded-md p-4 border border-neutral-200 dark:border-neutral-700">
                                <h3 className="font-bold text-lg">{eventInfo.title}</h3>
                                <div className="mt-2 space-y-1">
                                    {eventInfo.extendedProps.assignment && (
                                        <p><span className="font-medium">Assignment:</span> {eventInfo.extendedProps.assignment}</p>
                                    )}
                                    <p><span className="font-medium">Group:</span> {eventInfo.extendedProps.group}</p>
                                    <p><span className="font-medium">Priority:</span> {eventInfo.extendedProps.priority}</p>
                                    {eventInfo.extendedProps.status && (
                                        <p><span className="font-medium">Status:</span> {eventInfo.extendedProps.status}</p>
                                    )}
                                    <p><span className="font-medium">Date:</span> {formatDate(eventInfo.start)} - {formatDate(eventInfo.end)}</p>

                                    {eventInfo.extendedProps.isPastDue && (
                                        <div className="mt-2 flex items-center text-red-500">
                                            <AlertTriangle className="h-4 w-4 mr-1" />
                                            <span>Past due</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
