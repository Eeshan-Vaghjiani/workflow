import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import StudyPlanner from '@/components/StudyPlanner';

interface Props {
    userId: number;
    studySessions: Array<{
        id: number;
        title: string;
        description: string | null;
        session_date: string;
        start_time: string;
        end_time: string;
        completed: boolean;
    }>;
    studyTasks: Array<{
        id: number;
        title: string;
        description: string | null;
        completed: boolean;
        study_session_id: number | null;
    }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Study Planner',
        href: '/study-planner',
    },
];

export default function Index({ userId }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Study Planner" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Study Planner</h1>
                </div>
                <StudyPlanner userId={userId} />
            </div>
        </AppLayout>
    );
}
