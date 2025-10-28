import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, ActivitySquare, Users, AlertCircle, AlertTriangle, RefreshCw, LogIn } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { GlassContainer } from '@/components/ui/glass-container';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { motion, AnimatePresence } from 'framer-motion';
import { containerVariants, itemVariants } from '@/lib/theme-constants';

interface TaskAssignmentPanelProps {
    groupId: number;
    assignmentId: number;
    onAssignmentChange?: () => void;
}

interface Task {
    id: number;
    title: string;
    assigned_to: number | null;
    assigned_user?: {
        id: number;
        name: string;
    };
    effort_hours: number;
    importance: number;
    priority: string;
    status: string;
    creator?: {
        id: number;
        name: string;
    };
}

interface GroupMember {
    id: number;
    name: string;
}

interface WorkloadDistribution {
    id: number;
    name: string;
    taskCount: number;
    totalEffort: number;
    totalImportance: number;
    weightedWorkload: number;
    percentage: number;
    tasks: {
        id: number;
        title: string;
        effort: number;
        importance: number;
    }[];
}

export default function TaskAssignmentPanel({ groupId, assignmentId, onAssignmentChange }: TaskAssignmentPanelProps) {
    const [loading, setLoading] = useState(true);
    const [distributing, setDistributing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorDetails, setErrorDetails] = useState<Array<{ task_id?: number; message: string }> | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [workloadDistribution, setWorkloadDistribution] = useState<WorkloadDistribution[]>([]);
    const [hasUnassignedTasks, setHasUnassignedTasks] = useState(false);
    const [invalidAssignmentsFixed, setInvalidAssignmentsFixed] = useState(0);
    const [authError, setAuthError] = useState(false);

    useEffect(() => {
        fetchAssignmentStats();
    }, [groupId, assignmentId]);

    // Log group members when they change (for debugging)
    useEffect(() => {
        if (groupMembers.length > 0) {
            console.debug(`Group has ${groupMembers.length} members available for task assignment`);
        }
    }, [groupMembers]);

    const checkAuthentication = async () => {
        try {
            // First try to check auth status using web route
            const response = await axios.get('/auth/status');

            if (response.data.authenticated) {
                console.log('User authenticated:', response.data.user?.name);
                return true;
            }

            // If not authenticated, try to refresh the session
            console.log('Not authenticated, trying to refresh session...');
            await axios.get('/auth/refresh-session');

            // Check authentication again after refresh
            const statusResponse = await axios.get('/auth/status');
            return statusResponse.data.authenticated;
        } catch (err) {
            console.error('Authentication check failed:', err);
            return false;
        }
    };

    const fetchAssignmentStats = async () => {
        try {
            setLoading(true);
            setError(null);
            setErrorDetails(null);
            setAuthError(false);

            // Verify we're authenticated first
            const isAuthenticated = await checkAuthentication();
            if (!isAuthenticated) {
                setAuthError(true);
                setError('Authentication required. Please log in and try again.');
                setLoading(false);
                return;
            }

            // Use only the regular web routes, not API routes
            console.log('Using direct web route for task stats');
            const response = await axios.get(`/groups/${groupId}/assignments/${assignmentId}/get-stats`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });

            if (response?.data?.success) {
                setTasks(response.data.tasks);
                setGroupMembers(response.data.groupMembers);
                setWorkloadDistribution(response.data.workloadDistribution);
                setHasUnassignedTasks(response.data.hasUnassignedTasks);

                if (response.data.invalidAssignmentsFixed > 0) {
                    setInvalidAssignmentsFixed(response.data.invalidAssignmentsFixed);
                }
            } else if (response?.data) {
                setError(response.data.error || 'Failed to fetch assignment statistics');
                if (response.data.error_details) {
                    setErrorDetails(response.data.error_details);
                }
            } else {
                setError('Failed to fetch assignment statistics. No valid response received.');
            }
        } catch (err: unknown) {
            console.error('Error fetching assignment stats:', err);

            const error = err as { response?: { status?: number; data?: { error?: string; error_details?: Array<{ task_id?: number; message: string }> } } };

            console.error('Error details:', error.response?.data);

            if (error.response?.status === 401) {
                setAuthError(true);
                setError('Authentication required. Please log in and try again.');
            } else {
                const errorMessage = error.response?.data?.error || 'Failed to load task assignments. Please try again.';
                setError(errorMessage);

                // Set detailed error information
                if (error.response?.data?.error_details) {
                    setErrorDetails(error.response.data.error_details);
                } else if (error.response?.data) {
                    setErrorDetails([{
                        message: JSON.stringify(error.response.data, null, 2)
                    }]);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAutoDistributeTasks = async () => {
        try {
            setDistributing(true);
            setError(null);
            setErrorDetails(null);

            // Verify we're authenticated first
            const isAuthenticated = await checkAuthentication();
            if (!isAuthenticated) {
                setAuthError(true);
                setError('Authentication required. Please log in and try again.');
                setDistributing(false);
                return;
            }

            console.log('Starting task distribution...');
            const response = await axios.post(`/groups/${groupId}/assignments/${assignmentId}/distribute-tasks`, {}, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                },
                withCredentials: true
            });

            console.log('Distribution response:', response.data);

            if (response?.data?.success) {
                setTasks(response.data.tasks);
                setWorkloadDistribution(response.data.workloadDistribution);
                setHasUnassignedTasks(false);

                // Check if there were any errors during distribution
                if (response.data.stats && response.data.stats.errors > 0) {
                    setErrorDetails(response.data.stats.error_details || []);
                    setError(`Task distribution completed with ${response.data.stats.errors} errors. Some tasks may not be assigned correctly.`);
                }

                if (onAssignmentChange) {
                    onAssignmentChange();
                }
            } else if (response?.data) {
                setError(response.data.error || 'Failed to distribute tasks');
                if (response.data.error_details) {
                    setErrorDetails(response.data.error_details);
                }
            } else {
                setError('Failed to distribute tasks. No valid response received.');
            }
        } catch (err: unknown) {
            console.error('Error distributing tasks:', err);

            const error = err as { response?: { status?: number; data?: { error?: string; error_details?: Array<{ task_id?: number; message: string }> } } };

            console.error('Error response:', error.response?.data);

            const errorMessage = error.response?.data?.error || 'Failed to distribute tasks. Please try again.';
            setError(errorMessage);

            if (error.response?.data?.error_details) {
                setErrorDetails(error.response.data.error_details);
            } else if (error.response?.data) {
                setErrorDetails([{
                    message: JSON.stringify(error.response.data, null, 2)
                }]);
            }
        } finally {
            setDistributing(false);
        }
    };

    // Render loading state
    if (loading) {
        return (
            <motion.div
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <GlassContainer className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-4 w-40 mt-2" />
                        </div>
                        <Skeleton className="h-10 w-36" />
                    </div>
                    <div className="space-y-4">
                        {Array(3).fill(0).map((_, i) => (
                            <Skeleton key={i} className="h-20 w-full" />
                        ))}
                    </div>
                </GlassContainer>
            </motion.div>
        );
    }

    // Render auth error
    if (authError) {
        return (
            <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
                <GlassContainer className="p-6">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mb-6"
                        >
                            <LogIn className="h-16 w-16 text-red-500 mx-auto" />
                        </motion.div>
                        <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                            Your session may have expired. Please log in again to view and manage task assignments.
                        </p>
                        <EnhancedButton
                            onClick={() => window.location.href = '/login'}
                            icon={<LogIn className="h-4 w-4 mr-2" />}
                            iconPosition="left"
                        >
                            Log In
                        </EnhancedButton>
                    </div>
                </GlassContainer>
            </motion.div>
        );
    }

    // Render main content
    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Error Alert */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        variants={itemVariants}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>

                        {errorDetails && errorDetails.length > 0 && (
                            <div className="mt-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-md text-sm">
                                <details>
                                    <summary className="font-medium cursor-pointer">View error details</summary>
                                    <ul className="mt-2 list-disc pl-5 space-y-1">
                                        {errorDetails.map((detail, i) => (
                                            <li key={i}>
                                                {detail.task_id && <span className="font-mono">Task #{detail.task_id}: </span>}
                                                {detail.message}
                                            </li>
                                        ))}
                                    </ul>
                                </details>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fixed Invalid Assignments Notice */}
            <AnimatePresence>
                {invalidAssignmentsFixed > 0 && (
                    <motion.div
                        variants={itemVariants}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Notice</AlertTitle>
                            <AlertDescription>
                                {invalidAssignmentsFixed} task{invalidAssignmentsFixed > 1 ? 's were' : ' was'} assigned to users who are no longer in the group.
                                These assignments have been automatically cleared.
                            </AlertDescription>
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Task Distribution Overview */}
            <motion.div variants={itemVariants}>
                <GlassContainer className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold">Task Distribution</h2>
                            <p className="text-gray-500 dark:text-gray-400">
                                {tasks.length} task{tasks.length !== 1 ? 's' : ''} across {groupMembers.length} group member{groupMembers.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <EnhancedButton
                            onClick={handleAutoDistributeTasks}
                            disabled={distributing || tasks.length === 0 || groupMembers.length === 0}
                            className="flex items-center gap-2"
                            icon={<RefreshCw className={`h-4 w-4 ${distributing ? 'animate-spin' : ''}`} />}
                            iconPosition="left"
                        >
                            {distributing ? 'Distributing...' : 'Auto-Distribute Tasks'}
                        </EnhancedButton>
                    </div>

                    {/* Workload Distribution */}
                    {workloadDistribution.length > 0 ? (
                        <div className="space-y-6">
                            <AnimatePresence>
                                {workloadDistribution.map((member) => (
                                    <motion.div
                                        key={member.id}
                                        variants={itemVariants}
                                        className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-sm rounded-lg p-4 border border-white/10 dark:border-gray-700/50"
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <h3 className="font-medium">{member.name}</h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <ActivitySquare className="h-3.5 w-3.5" />
                                                        {member.taskCount} task{member.taskCount !== 1 ? 's' : ''}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <BarChart className="h-3.5 w-3.5" />
                                                        {member.totalEffort} hours
                                                    </span>
                                                </div>
                                            </div>
                                            <Badge className={`${member.percentage > 40 ? 'bg-green-500' : member.percentage > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                                                {member.percentage.toFixed(1)}% workload
                                            </Badge>
                                        </div>
                                        <Progress value={member.percentage} className="h-2 mt-2" />

                                        {/* Task List */}
                                        {member.tasks.length > 0 && (
                                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                {member.tasks.map((task) => (
                                                    <div key={task.id} className="flex justify-between items-center p-2 bg-white/5 dark:bg-gray-900/20 rounded">
                                                        <span className="truncate">{task.title}</span>
                                                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1 whitespace-nowrap">
                                                            <ActivitySquare className="h-3 w-3" /> {task.effort}h
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium mb-2">No task distribution data</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                {hasUnassignedTasks
                                    ? "There are unassigned tasks. Click 'Auto-Distribute Tasks' to assign them."
                                    : tasks.length === 0
                                        ? "No tasks have been created for this assignment yet."
                                        : "Tasks exist but no workload data is available."}
                            </p>
                            {hasUnassignedTasks && (
                                <EnhancedButton
                                    onClick={handleAutoDistributeTasks}
                                    disabled={distributing}
                                    icon={<RefreshCw className={`h-4 w-4 ${distributing ? 'animate-spin' : ''}`} />}
                                    iconPosition="left"
                                >
                                    {distributing ? 'Distributing...' : 'Auto-Distribute Tasks'}
                                </EnhancedButton>
                            )}
                        </div>
                    )}
                </GlassContainer>
            </motion.div>
        </motion.div>
    );
}
