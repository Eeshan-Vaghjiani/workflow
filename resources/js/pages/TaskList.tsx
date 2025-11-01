import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CheckSquare, Clock, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import { csrfRequest } from '../Utils/csrf.js';
import { Card3D } from '@/components/ui/card-3d';
import { GlassContainer } from '@/components/ui/glass-container';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { containerVariants, itemVariants } from '@/lib/theme-constants';

interface Task {
    id: number;
    title: string;
    description: string | null;
    status: 'pending' | 'completed';
    end_date: string;
    assigned_to: number | null;
    assigned_user?: {
        id: number;
        name: string;
    };
    assignment?: {
        id: number;
        title: string;
        group?: {
            id: number;
            name: string;
        };
    };
}

interface Props {
    tasks?: Task[];
}

export default function TaskList({ tasks = [] }: Props) {
    // Function to complete a task
    const completeTask = async (taskId: number) => {
        try {
            // Use our csrfRequest utility which handles token refreshing
            await csrfRequest('post', `/tasks/${taskId}/complete`, {});

            // Show success message
            toast({
                title: "Task completed",
                description: "The task has been marked as complete.",
            });

            // Refresh the page to show updated data
            window.location.reload();
        } catch (error) {
            console.error('Error completing task:', error);
            toast({
                title: "Error",
                description: "Failed to complete the task. Please try again.",
                variant: "destructive"
            });
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Tasks',
            href: '/tasks',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tasks" />

            <motion.div
                className="flex h-full flex-1 flex-col gap-6 p-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants}>
                    <Card3D className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Tasks</h1>
                                <p className="mt-1 text-gray-600 dark:text-gray-300">Manage and track your task progress</p>
                            </div>
                            <EnhancedButton
                                variant="primary"
                                size="md"
                                icon={<Plus className="h-4 w-4" />}
                                iconPosition="left"
                                magnetic={true}
                            >
                                <Link href={route('group-tasks.create')} className="text-white dark:text-black">
                                    Create Task
                                </Link>
                            </EnhancedButton>
                        </div>
                    </Card3D>
                </motion.div>

                {tasks.length > 0 ? (
                    <motion.div
                        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                        variants={containerVariants}
                    >
                        {tasks.map((task, index) => (
                            <motion.div
                                key={task.id}
                                variants={itemVariants}
                                custom={index}
                                whileHover={{ y: -5, transition: { type: "spring", stiffness: 300, damping: 30 } }}
                            >
                                <Card3D className="p-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h2 className="text-lg font-medium text-primary-500 dark:text-neon-green">{task.title}</h2>
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${task.status === 'completed'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300'
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300'
                                                }`}
                                        >
                                            {task.status === 'completed' ? (
                                                <span className="flex items-center"><CheckSquare className="w-3 h-3 mr-1" /> Completed</span>
                                            ) : (
                                                <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> Pending</span>
                                            )}
                                        </span>
                                    </div>

                                    {task.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{task.description}</p>
                                    )}

                                    <div className="mt-3 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Due Date:</span>
                                            <span className="font-medium text-gray-800 dark:text-gray-200">{new Date(task.end_date).toLocaleDateString()}</span>
                                        </div>

                                        <div className="mb-3">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Assigned to:</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {task.assigned_user ? task.assigned_user.name : 'Unassigned'}
                                            </p>
                                        </div>

                                        {task.assignment && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">Assignment:</span>
                                                <span className="font-medium text-gray-800 dark:text-gray-200">{task.assignment.title}</span>
                                            </div>
                                        )}

                                        {task.assignment?.group && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">Group:</span>
                                                <Link
                                                    href={route('groups.show', task.assignment.group.id)}
                                                    className="font-medium text-primary-500 hover:text-primary-600 dark:text-neon-green dark:hover:text-primary-300"
                                                >
                                                    {task.assignment.group.name}
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 flex space-x-2">
                                        {task.assignment?.group?.id && task.assignment?.id ? (
                                            <EnhancedButton
                                                variant="outline"
                                                size="sm"
                                                magnetic={true}
                                                className="flex-1"
                                            >
                                                <Link
                                                    href={route('group-tasks.show', {
                                                        group: task.assignment.group.id,
                                                        assignment: task.assignment.id,
                                                        task: task.id
                                                    })}
                                                >
                                                    View Details
                                                </Link>
                                            </EnhancedButton>
                                        ) : (
                                            <EnhancedButton
                                                variant="outline"
                                                size="sm"
                                                disabled={true}
                                                className="flex-1"
                                            >
                                                View Details
                                            </EnhancedButton>
                                        )}

                                        {task.status === 'pending' && (
                                            <EnhancedButton
                                                onClick={() => completeTask(task.id)}
                                                variant="primary"
                                                size="sm"
                                                magnetic={true}
                                                className="flex-1"
                                            >
                                                Complete
                                            </EnhancedButton>
                                        )}
                                    </div>
                                </Card3D>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div variants={itemVariants}>
                        <GlassContainer className="flex h-full items-center justify-center p-8" blurIntensity="md">
                            <div className="relative z-10 text-center">
                                <motion.div
                                    className="flex justify-center mb-4"
                                    animate={{
                                        scale: [1, 1.05, 1],
                                        transition: { duration: 2, repeat: Infinity }
                                    }}
                                >
                                    <CheckSquare className="w-12 h-12 text-primary-500 dark:text-neon-green" />
                                </motion.div>
                                <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">No Tasks Yet</h3>
                                <p className="mb-6 max-w-md text-gray-600 dark:text-gray-300">
                                    Create your first task to start tracking your work
                                </p>
                                <EnhancedButton
                                    variant="primary"
                                    icon={<Plus className="h-4 w-4" />}
                                    iconPosition="left"
                                    magnetic={true}
                                >
                                    <Link href={route('group-tasks.create')} className="text-white dark:text-black">
                                        Create Task
                                    </Link>
                                </EnhancedButton>
                            </div>
                        </GlassContainer>
                    </motion.div>
                )}
            </motion.div>
        </AppLayout>
    );
}
