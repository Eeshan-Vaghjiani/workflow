import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { useState } from 'react';

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
        progressColor?: string;
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

export default function GanttView({ tasks }: Props) {
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);

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
        styles: {
            backgroundColor: task.styles?.backgroundColor || '#4338ca',
            progressColor: task.styles?.progressColor || '#3730a3',
        },
        project: task.type === 'project' ? undefined : task.dependencies[0],
    }));

    const handleTaskClick = (task: Task) => {
        const originalTask = tasks.find(t => t.id === task.id);
        if (originalTask) {
            alert(`
                Task: ${originalTask.name}
                Assigned to: ${originalTask.assignedTo}
                Group: ${originalTask.groupName}
                ${originalTask.assignmentTitle ? `Assignment: ${originalTask.assignmentTitle}` : ''}
                ${originalTask.priority ? `Priority: ${originalTask.priority}` : ''}
                Progress: ${originalTask.progress}%
            `);
        }
    };

    const handleViewModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setViewMode(e.target.value as ViewMode);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gantt Chart" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">Gantt Chart View</h1>
                        <div>
                            <label htmlFor="viewMode" className="mr-2">View Mode:</label>
                            <select
                                id="viewMode"
                                value={viewMode}
                                onChange={handleViewModeChange}
                                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value={ViewMode.Day}>Day</option>
                                <option value={ViewMode.Week}>Week</option>
                                <option value={ViewMode.Month}>Month</option>
                                <option value={ViewMode.Year}>Year</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {ganttTasks.length > 0 ? (
                            <Gantt
                                tasks={ganttTasks}
                                viewMode={viewMode}
                                onSelect={handleTaskClick}
                                listCellWidth="155px"
                                columnWidth={viewMode === ViewMode.Day ? 60 : viewMode === ViewMode.Week ? 250 : viewMode === ViewMode.Month ? 300 : 350}
                            />
                        ) : (
                            <p className="text-center py-10">No tasks available to display in Gantt chart.</p>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
} 