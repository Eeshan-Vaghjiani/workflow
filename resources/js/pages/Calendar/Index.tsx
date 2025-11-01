import { useState, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import axios from 'axios';
import { CalendarIcon, RefreshCw, Settings } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from '@inertiajs/react';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { containerVariants, itemVariants } from '@/lib/theme-constants';
import { cn } from '@/lib/utils';

// Define minimal types for event handlers
interface CalendarEventChangeArg {
    event: {
        id: string;
        start: Date | null;
        end: Date | null;
    };
    revert: () => void;
}

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    priority?: string;
    status?: string;
    progress?: number;
    groupName?: string;
    assignmentTitle?: string;
}

interface Props {
    events: CalendarEvent[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Calendar',
        href: '/calendar',
    },
];

export default function CalendarIndex({ events }: Props) {
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(events);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [syncing, setSyncing] = useState(false);
    const { toast } = useToast();
    const calendarRef = useRef<FullCalendar>(null);

    // Handle event click
    interface FullCalendarEventInfo {
        event: {
            id: string;
        };
    }

    const handleEventClick = (info: FullCalendarEventInfo) => {
        // Find the full event data including our custom fields
        const event = calendarEvents.find(event => event.id === info.event.id);
        setSelectedEvent(event || null);
    };

    // Handle event drag-n-drop
    const handleEventChange = async (info: CalendarEventChangeArg) => {
        const { id, start, end } = info.event;

        try {
            // Format dates for API
            const startDate = start ? new Date(start).toISOString().split('T')[0] : '';
            const endDate = end ? new Date(end).toISOString().split('T')[0] : startDate;

            // Update the task dates in the backend
            await axios.put(`/api/tasks/${id}`, {
                start_date: startDate,
                end_date: endDate
            });

            // Update local state
            setCalendarEvents(prev =>
                prev.map(event =>
                    event.id === id
                        ? { ...event, start: startDate, end: endDate || startDate }
                        : event
                )
            );

            toast({
                title: "Event Updated",
                description: "Task dates have been updated.",
            });
        } catch (error) {
            console.error('Error updating event:', error);

            // Revert the drag if there was an error
            info.revert();

            toast({
                title: "Update Failed",
                description: "Failed to update task dates. Please try again.",
                variant: "destructive"
            });
        }
    };

    // Sync with Google Calendar
    const syncWithGoogle = async () => {
        setSyncing(true);

        try {
            await axios.post('/api/calendar/sync');

            toast({
                title: "Calendar Synced",
                description: "Your tasks have been synchronized with Google Calendar.",
            });
        } catch (error) {
            console.error('Error syncing with Google Calendar:', error);

            toast({
                title: "Sync Failed",
                description: "Failed to sync with Google Calendar. Please check your connection.",
                variant: "destructive"
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
                    className="grid grid-cols-1 gap-6 md:grid-cols-4"
                    variants={containerVariants}
                >
                    {/* Main Calendar */}
                    <motion.div
                        className="col-span-1 md:col-span-3"
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
                                        events={calendarEvents}
                                        editable={true}
                                        selectable={true}
                                        selectMirror={true}
                                        dayMaxEvents={true}
                                        weekends={true}
                                        eventClick={(info) => handleEventClick(info)}
                                        eventChange={(info) => handleEventChange(info)}
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

                    {/* Sidebar */}
                    <motion.div
                        className="col-span-1"
                        variants={itemVariants}
                    >
                        <Card className="bg-background">
                            <div className="p-6">
                                <CardTitle className="text-xl font-semibold text-foreground">Event Details</CardTitle>
                                <CardDescription>
                                    {selectedEvent ? 'Selected event information' : 'Select an event to view details'}
                                </CardDescription>
                            </div>
                            <CardContent>
                                {selectedEvent ? (
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="font-medium text-foreground">{selectedEvent.title}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(selectedEvent.start).toLocaleDateString()} - {new Date(selectedEvent.end).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {selectedEvent.groupName && (
                                            <div>
                                                <p className="text-sm font-medium text-foreground">Group</p>
                                                <p className="text-sm text-muted-foreground">{selectedEvent.groupName}</p>
                                            </div>
                                        )}
                                        {selectedEvent.assignmentTitle && (
                                            <div>
                                                <p className="text-sm font-medium text-foreground">Assignment</p>
                                                <p className="text-sm text-muted-foreground">{selectedEvent.assignmentTitle}</p>
                                            </div>
                                        )}
                                        {selectedEvent.priority && (
                                            <div>
                                                <p className="text-sm font-medium text-foreground">Priority</p>
                                                <p className="text-sm text-muted-foreground">{selectedEvent.priority}</p>
                                            </div>
                                        )}
                                        {selectedEvent.status && (
                                            <div>
                                                <p className="text-sm font-medium text-foreground">Status</p>
                                                <p className="text-sm text-muted-foreground">{selectedEvent.status}</p>
                                            </div>
                                        )}
                                        {selectedEvent.progress !== undefined && (
                                            <div>
                                                <p className="text-sm font-medium text-foreground">Progress</p>
                                                <div className="h-2 w-full rounded-full bg-secondary">
                                                    <div
                                                        className="h-full rounded-full bg-primary transition-all"
                                                        style={{ width: `${selectedEvent.progress}%` }}
                                                    />
                                                </div>
                                                <p className="mt-1 text-xs text-muted-foreground">{selectedEvent.progress}% Complete</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground">No event selected</p>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}
