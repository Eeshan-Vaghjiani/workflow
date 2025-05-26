import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import PomodoroTimer from '@/components/PomodoroTimer';

interface Props {
    userId: number;
    settings: {
        focus_minutes: number;
        short_break_minutes: number;
        long_break_minutes: number;
        long_break_interval: number;
        auto_start_breaks: boolean;
        auto_start_pomodoros: boolean;
        notifications_enabled: boolean;
    };
    sessions: Array<{
        id: number;
        type: 'focus' | 'short_break' | 'long_break';
        duration_minutes: number;
        started_at: string;
        ended_at: string;
        completed: boolean;
    }>;
    completedCount: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Pomodoro Timer',
        href: '/pomodoro',
    },
];

export default function Index({ userId }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pomodoro Timer" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Pomodoro Timer</h1>
                </div>
                <div className="flex justify-center">
                    <PomodoroTimer userId={userId} />
                </div>
            </div>
        </AppLayout>
    );
}
