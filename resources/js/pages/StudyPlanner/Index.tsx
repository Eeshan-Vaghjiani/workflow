import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import StudyPlanner from '@/components/StudyPlanner';
import { motion } from 'framer-motion';
import { Card3D } from '@/components/ui/card-3d';
import { containerVariants, itemVariants } from '@/lib/theme-constants';

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
            <motion.div
                className="flex h-full flex-1 flex-col gap-6 p-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants}>
                    <Card3D className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Study Planner</h1>
                        </div>
                        <motion.div
                            variants={itemVariants}
                            className="w-full"
                        >
                            <StudyPlanner userId={userId} />
                        </motion.div>
                    </Card3D>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}
