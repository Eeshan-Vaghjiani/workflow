import { useState, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import axios from 'axios';
import { CalendarIcon, Check, RefreshCw, Calendar as CalendarLogo, Settings } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from '@inertiajs/react';
import { Card3D } from '@/components/ui/card-3d';
import { GlassContainer } from '@/components/ui/glass-container';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { containerVariants, itemVariants } from '@/lib/theme-constants';

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
                        <Card3D>
                            <div className="flex flex-row items-center justify-between p-6">
                                <div>
                                    <CardTitle className="text-gray-900 dark:text-white">Calendar</CardTitle>
                                    <CardDescription className="text-gray-600 dark:text-gray-300">View and manage your tasks and assignments</CardDescription>
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
                                    <EnhancedButton
                                        variant="outline"
                                        size="sm"
                                        icon={<Settings className="h-4 w-4" />}
                                        iconPosition="left"
                                        magnetic={true}
                                    >
                                        <Link href={route('calendar.settings')}>
                                            Settings
                                        </Link>
                                    </EnhancedButton>
                                </div>
                            </div>
                            <CardContent>
                                <FullCalendar
                                    ref={calendarRef}
                                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                    initialView="dayGridMonth"
                                    headerToolbar={{
                                        left: 'prev,next today',
                                        center: 'title',
                                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                                    }}
                                    events={calendarEvents}
                                    editable={true}
                                    selectable={true}
                                    selectMirror={true}
                                    dayMaxEvents={true}
                                    eventClick={handleEventClick}
                                    eventDrop={handleEventChange}
                                    eventResize={handleEventChange}
                                    height="auto"
                                />
                            </CardContent>
                        </Card3D>
                    </motion.div>

                    {/* Event Details Sidebar */}
                    <motion.div className="col-span-1" variants={itemVariants}>
                        <GlassContainer className="p-6" blurIntensity="sm">
                            <div className="mb-4">
                                <CardTitle className="text-gray-900 dark:text-white">Event Details</CardTitle>
                                <CardDescription className="text-gray-600 dark:text-gray-300">Selected task information</CardDescription>
                            </div>

                            {selectedEvent ? (
                                <motion.div
                                    className="space-y-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedEvent.title}</h3>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                            <CalendarLogo className="h-4 w-4 text-primary-500 dark:text-neon-green" />
                                            <span>
                                                {new Date(selectedEvent.start).toLocaleDateString()} - {new Date(selectedEvent.end || selectedEvent.start).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {selectedEvent.assignmentTitle && (
                                        <div className="pt-2">
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Assignment</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{selectedEvent.assignmentTitle}</p>
                                        </div>
                                    )}

                                    {selectedEvent.groupName && (
                                        <div className="pt-2">
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Group</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{selectedEvent.groupName}</p>
                                        </div>
                                    )}

                                    <div className="flex justify-between pt-2">
                                        {selectedEvent.priority && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Priority</p>
                                                <div className="flex items-center">
                                                    <span
                                                        className="h-3 w-3 rounded-full mr-2"
                                                        style={{ backgroundColor: selectedEvent.backgroundColor }}
                                                    />
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{selectedEvent.priority}</p>
                                                </div>
                                            </div>
                                        )}

                                        {selectedEvent.status && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Status</p>
                                                <div className="flex items-center">
                                                    {selectedEvent.status === 'completed' && (
                                                        <Check className="h-4 w-4 mr-1 text-green-500" />
                                                    )}
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{selectedEvent.status.replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {selectedEvent.progress !== undefined && (
                                        <div className="pt-2">
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Progress</p>
                                            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${selectedEvent.progress}%`,
                                                        backgroundColor: selectedEvent.backgroundColor
                                                    }}
                                                />
                                            </div>
                                            <p className="text-right text-xs text-gray-600 dark:text-gray-400">{selectedEvent.progress}%</p>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    className="flex flex-col items-center justify-center h-60 text-center text-gray-500 dark:text-gray-400"
                                    initial={{ opacity: 0.6 }}
                                    animate={{
                                        opacity: [0.6, 0.8, 0.6],
                                        transition: {
                                            repeat: Infinity,
                                            duration: 2
                                        }
                                    }}
                                >
                                    <CalendarLogo className="h-10 w-10 mb-2 text-primary-300 dark:text-primary-600/30" />
                                    <p>Select an event to view details</p>
                                </motion.div>
                            )}
                        </GlassContainer>
                    </motion.div>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}
