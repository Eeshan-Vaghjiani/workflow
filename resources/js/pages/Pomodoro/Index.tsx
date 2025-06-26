import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import PomodoroTimer from '@/components/PomodoroTimer';
import { motion } from 'framer-motion';
import { GlassContainer } from '@/components/ui/glass-container';
import { Clock } from 'lucide-react';

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
            <motion.div
                className="flex h-full flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    className="flex items-center justify-between"
                    variants={itemVariants}
                >
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary-500 dark:text-neon-green" />
                        <h1 className="text-2xl font-bold">Pomodoro Timer</h1>
                    </div>
                </motion.div>

                <motion.div
                    className="flex justify-center"
                    variants={itemVariants}
                >
                    <GlassContainer className="p-8 w-full max-w-2xl">
                        <PomodoroTimer userId={userId} />

                        <motion.div
                            className="mt-8 text-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                        >
                            <h2 className="text-lg font-medium mb-2">How to use the Pomodoro Technique</h2>
                            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 text-left list-disc pl-5">
                                <li>Set the timer for 25 minutes and focus intensely on your work</li>
                                <li>When the timer rings, take a short 5-minute break</li>
                                <li>After four work sessions, take a longer 15-30 minute break</li>
                                <li>Repeat the process to maintain high productivity</li>
                            </ul>
                        </motion.div>
                    </GlassContainer>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}
