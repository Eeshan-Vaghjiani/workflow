import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, EventApi } from '@fullcalendar/core';
import { useState } from 'react';

interface Event {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay?: boolean;
    url?: string;
    backgroundColor?: string;
    borderColor?: string;
    extendedProps: {
        assignment?: string;
        group: string;
        priority: string;
        status?: string;
        type?: string;
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

    // Function to handle event click
    const handleEventClick = (info: EventClickArg) => {
        // Prevent default to stop navigation when we want to show the modal
        if (!info.event.url) {
            info.jsEvent.preventDefault();
        }
    };

    // Function to handle event hover
    const handleEventMouseEnter = (info: { event: EventApi }) => {
        setEventInfo(info.event);
    };

    // Function to handle event hover out
    const handleEventMouseLeave = () => {
        setEventInfo(null);
    };

    // Helper function to safely format dates
    const formatDate = (date: Date | null) => {
        return date?.toLocaleDateString() ?? '';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Calendar" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <h1 className="text-2xl font-bold mb-6">Calendar View</h1>

                    <div className="relative">
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay'
                            }}
                            events={events}
                            eventClick={handleEventClick}
                            eventMouseEnter={handleEventMouseEnter}
                            eventMouseLeave={handleEventMouseLeave}
                            height="auto"
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
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
} 