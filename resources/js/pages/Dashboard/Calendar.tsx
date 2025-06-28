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
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { CalendarIcon, RefreshCw, Settings, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            when: "beforeChildren"
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};

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
                }
            }

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        }
    };

    // Format date for display
    const formatDate = (date: Date | null) => {
        if (!date) return 'N/A';
        return new Intl.DateTimeFormat('default', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        }).format(date);
    };

    // Sync with Google Calendar
    const syncWithGoogle = async () => {
        try {
            setSyncing(true);
            const response = await axios.post('/calendar/sync', {}, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                }
            });

            if (response.data.success) {
                toast({
                    title: "Sync Successful",
                    description: "Calendar synchronized with Google Calendar",
                    variant: "default",
                });

                // Update local events with the new data if provided
                if (response.data.events) {
                    // Format the events properly for the calendar
                    const formattedEvents = response.data.events.map(formatTaskForCalendar);
                    setLocalEvents(formattedEvents);
                }
            } else {
                throw new Error(response.data.message || "Sync failed");
            }
        } catch (error: any) {
            console.error('Error during sync:', error);
            toast({
                title: "Sync Failed",
                description: error.response?.data?.message || error.message || "Failed to sync with Google Calendar",
                variant: "destructive",
            });
        } finally {
            setSyncing(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Calendar" />
            <motion.div
                className="flex h-full flex-1 flex-col gap-6 p-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    className="grid grid-cols-1 gap-6"
                    variants={containerVariants}
                >
                    {/* Main Calendar */}
                    <motion.div
                        className="col-span-1"
                        variants={itemVariants}
                    >
                        <Card className="bg-background">
                            <div className="flex flex-row items-center justify-between p-6">
                                <div>
                                    <CardTitle className="text-2xl font-semibold text-foreground">Calendar</CardTitle>
                                    <CardDescription>View and manage your tasks and assignments</CardDescription>
                                </div>
                                <div className="flex space-x-2">
                                    <EnhancedButton
                                        onClick={syncWithGoogle}
                                        disabled={syncing}
                                        variant="secondary"
                                        size="sm"
                                        icon={syncing ?
                                            <RefreshCw className="h-4 w-4 animate-spin" /> :
                                            <CalendarIcon className="h-4 w-4" />
                                        }
                                        iconPosition="left"
                                        magnetic={true}
                                    >
                                        Sync with Google
                                    </EnhancedButton>
                                    <Link href={route('calendar.settings')}>
                                        <EnhancedButton
                                            variant="outline"
                                            size="sm"
                                            icon={<Settings className="h-4 w-4" />}
                                            iconPosition="left"
                                            magnetic={true}
                                        >
                                            Settings
                                        </EnhancedButton>
                                    </Link>
                                </div>
                            </div>
                            <CardContent className="p-0">
                                <div className={cn(
                                    "calendar-container",
                                    "dark:bg-background dark:text-foreground",
                                    "border-t border-border"
                                )}>
                                    <FullCalendar
                                        ref={calendarRef}
                                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                        initialView="dayGridMonth"
                                        events={processedEvents}
                                        editable={true}
                                        selectable={true}
                                        selectMirror={true}
                                        dayMaxEvents={true}
                                        weekends={true}
                                        eventClick={handleEventClick}
                                        eventMouseEnter={handleEventMouseEnter}
                                        eventMouseLeave={handleEventMouseLeave}
                                        eventDrop={handleEventChange}
                                        eventResize={handleEventChange}
                                        headerToolbar={{
                                            left: 'prev,next today',
                                            center: 'title',
                                            right: 'dayGridMonth,timeGridWeek,timeGridDay'
                                        }}
                                        buttonText={{
                                            today: 'Today',
                                            month: 'Month',
                                            week: 'Week',
                                            day: 'Day'
                                        }}
                                        themeSystem="standard"
                                        height="auto"
                                        contentHeight="auto"
                                        aspectRatio={2}
                                        expandRows={true}
                                        stickyHeaderDates={true}
                                        nowIndicator={true}
                                        dayHeaders={true}
                                        eventDisplay="block"
                                        eventTimeFormat={{
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            meridiem: 'short'
                                        }}
                                        slotLabelFormat={{
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true
                                        }}
                                        allDaySlot={true}
                                        allDayText="All Day"
                                        slotMinTime="06:00:00"
                                        slotMaxTime="22:00:00"
                                        slotDuration="00:30:00"
                                        slotLabelInterval="01:00"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Event Info */}
                    {eventInfo && (
                        <motion.div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setEventInfo(null)}
                        >
                            <motion.div
                                className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-xl"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="mb-4 flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">{eventInfo.title}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDate(eventInfo.start)} - {formatDate(eventInfo.end)}
                                        </p>
                                    </div>
                                    {eventInfo.extendedProps.isPastDue && (
                                        <div className="flex items-center text-destructive">
                                            <AlertTriangle className="mr-1 h-4 w-4" />
                                            <span className="text-sm">Past Due</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {eventInfo.extendedProps.assignment && (
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Assignment</p>
                                            <p className="text-sm text-muted-foreground">{eventInfo.extendedProps.assignment}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Group</p>
                                        <p className="text-sm text-muted-foreground">{eventInfo.extendedProps.group}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Priority</p>
                                        <p className="text-sm text-muted-foreground capitalize">{eventInfo.extendedProps.priority}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Status</p>
                                        <p className="text-sm text-muted-foreground capitalize">{eventInfo.extendedProps.status}</p>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <EnhancedButton
                                        onClick={() => setEventInfo(null)}
                                        variant="outline"
                                        size="sm"
                                        magnetic={true}
                                    >
                                        Close
                                    </EnhancedButton>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}
