import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Suspense, lazy, useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import ViewMode as a value
import { ViewMode } from '@rsagiev/gantt-task-react-19';
import type { Task } from '@rsagiev/gantt-task-react-19';

// Lazy load the Gantt component and its styles
const GanttComponent = lazy(() => Promise.all([
    import('@rsagiev/gantt-task-react-19').then(module => ({ default: module.Gantt })),
    import('@rsagiev/gantt-task-react-19/dist/index.css').then(() => ({}))
]).then(([moduleExport]) => moduleExport));

interface GanttTask {
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    type: string;
    hideChildren: boolean;
    displayOrder: number;
    assignedTo: string;
    assignmentTitle?: string;
    groupName: string;
    priority?: string;
    dependencies: string[];
    styles?: {
        backgroundColor?: string;
        backgroundSelectedColor?: string;
        progressColor?: string;
        progressSelectedColor?: string;
    };
}

interface Props {
    tasks: GanttTask[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Gantt Chart',
        href: '/dashboard/gantt',
    },
];

const viewModeOptions = [
    { mode: ViewMode.QuarterDay, label: '6 Hours', icon: Clock },
    { mode: ViewMode.Day, label: 'Day', icon: Calendar },
    { mode: ViewMode.Week, label: 'Week', icon: Calendar },
    { mode: ViewMode.Month, label: 'Month', icon: CalendarIcon },
];

export default function GanttView({ tasks }: Props) {
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
    const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);
    const [columnWidth, setColumnWidth] = useState(300);
    const [error, setError] = useState<Error | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Calculate column width based on container width and view mode
    const updateColumnWidth = useCallback(() => {
        if (!containerRef.current) return;

        const containerWidth = containerRef.current.offsetWidth;
        const tableWidth = 155; // listCellWidth
        const availableWidth = containerWidth - tableWidth;

        let columns: number;
        switch (viewMode) {
            case ViewMode.QuarterDay:
                columns = 4 * 30; // 4 quarters per day * ~30 days
                break;
            case ViewMode.Day:
                columns = 30; // ~30 days
                break;
            case ViewMode.Week:
                columns = 12; // ~12 weeks
                break;
            case ViewMode.Month:
            default:
                columns = 6; // 6 months
                break;
        }

        const newColumnWidth = Math.max(Math.floor(availableWidth / columns), 30);
        setColumnWidth(newColumnWidth);
    }, [viewMode]);

    // Update column width on mount, window resize, and view mode change
    useEffect(() => {
        updateColumnWidth();
        window.addEventListener('resize', updateColumnWidth);
        return () => window.removeEventListener('resize', updateColumnWidth);
    }, [updateColumnWidth]);

    // Convert tasks from API format to Gantt-task-react format
    const ganttTasks: Task[] = tasks.map(task => ({
        id: task.id,
        name: task.name,
        start: new Date(task.start),
        end: new Date(task.end),
        progress: task.progress,
        type: task.type === 'project' ? 'project' : 'task',
        hideChildren: task.hideChildren,
        displayOrder: task.displayOrder,
        dependencies: task.dependencies,
        project: task.type === 'project' ? undefined : task.dependencies[0],
        styles: {
            backgroundColor: task.type === 'project' ? 'var(--chart-3)' : 'var(--chart-1)',
            backgroundSelectedColor: 'var(--chart-2)',
            progressColor: 'var(--chart-4)',
            progressSelectedColor: 'var(--chart-5)',
        },
    }));

    const handleTaskClick = useCallback((task: Task) => {
        const originalTask = tasks.find(t => t.id === task.id);
        setSelectedTask(prev => prev?.id === originalTask?.id ? null : originalTask || null);
    }, [tasks]);

    if (error) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Gantt Chart" />
                <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="text-center text-red-500">
                            <h2 className="text-xl font-bold">Error Loading Gantt Chart</h2>
                            <p>{error.message}</p>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gantt Chart" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 w-[calc(100vw-280px)] [.sidebar-collapsed_&]:w-[calc(100vw-80px)]">
                <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold dark:text-white">Gantt Chart View</h1>
                            <div className="flex gap-2">
                                {viewModeOptions.map(({ mode, label, icon: Icon }) => (
                                    <Button
                                        key={mode}
                                        variant={viewMode === mode ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setViewMode(mode)}
                                        className={cn(
                                            "gap-2",
                                            viewMode === mode && "bg-primary text-primary-foreground"
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="gantt-container-wrapper" ref={containerRef}>
                            <div className="gantt-container">
                                {ganttTasks.length > 0 ? (
                                    <Suspense fallback={
                                        <div className="flex items-center justify-center h-64">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    }>
                                        <GanttComponent
                                            tasks={ganttTasks}
                                            viewMode={viewMode}
                                            onSelect={handleTaskClick}
                                            listCellWidth="155px"
                                            columnWidth={columnWidth}
                                            rowHeight={50}
                                            barCornerRadius={4}
                                            TooltipContent={() => null}
                                            arrowColor="currentColor"
                                        />
                                        {selectedTask && (
                                            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-50">
                                                <h3 className="text-lg font-bold mb-2 dark:text-white">{selectedTask.name}</h3>
                                                <div className="space-y-2 dark:text-gray-300">
                                                    <p><span className="font-medium">Assigned to:</span> {selectedTask.assignedTo}</p>
                                                    <p><span className="font-medium">Group:</span> {selectedTask.groupName}</p>
                                                    {selectedTask.assignmentTitle && (
                                                        <p><span className="font-medium">Assignment:</span> {selectedTask.assignmentTitle}</p>
                                                    )}
                                                    {selectedTask.priority && (
                                                        <p><span className="font-medium">Priority:</span> {selectedTask.priority}</p>
                                                    )}
                                                    <p><span className="font-medium">Progress:</span> {selectedTask.progress}%</p>
                                                    <p><span className="font-medium">Duration:</span> {new Date(selectedTask.start).toLocaleDateString()} - {new Date(selectedTask.end).toLocaleDateString()}</p>
                                                </div>
                                                <Button
                                                    onClick={() => setSelectedTask(null)}
                                                    variant="outline"
                                                    className="mt-4 w-full"
                                                >
                                                    Close
                                                </Button>
                                            </div>
                                        )}
                                    </Suspense>
                                ) : (
                                    <p className="text-center py-10 dark:text-white">No tasks available to display in Gantt chart.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
} 