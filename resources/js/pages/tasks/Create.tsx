import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface Assignment {
    id: number;
    title: string;
    due_date: string;
    group: {
        id: number;
        name: string;
    };
}

interface Props {
    assignments: Assignment[];
    selectedAssignmentId?: string | number;
    errors: {
        title?: string;
        description?: string;
        end_date?: string;
        assignment_id?: string;
        effort_hours?: string;
        importance?: string;
        priority?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tasks',
        href: '/group-tasks',
    },
    {
        title: 'Create',
        href: '/group-tasks/create',
    },
];

export default function TasksCreate({ assignments, selectedAssignmentId, errors }: Props) {
    const today = new Date().toISOString().split('T')[0];
    const [maxDate, setMaxDate] = useState<string>(today);

    const { data, setData, post, processing } = useForm({
        title: '',
        description: '',
        end_date: today,
        assignment_id: selectedAssignmentId?.toString() || '',
        effort_hours: '1',
        importance: '3',
        priority: 'medium',
    });

    const selectedAssignment = assignments.find(a => a.id.toString() === data.assignment_id);

    // Update max date when assignment changes
    useEffect(() => {
        if (selectedAssignment && selectedAssignment.due_date) {
            setMaxDate(selectedAssignment.due_date);

            // If current end_date is after assignment due date, update it
            if (data.end_date > selectedAssignment.due_date) {
                setData('end_date', selectedAssignment.due_date);
            }
        } else {
            // Default to 1 month from now if no assignment selected
            const oneMonthLater = new Date();
            oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
            setMaxDate(oneMonthLater.toISOString().split('T')[0]);
        }
    }, [data.assignment_id]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (data.assignment_id) {
            const selectedAssignment = assignments.find(a => a.id.toString() === data.assignment_id);
            if (selectedAssignment) {
                post(route('group-tasks.store', {
                    group: selectedAssignment.group.id,
                    assignment: selectedAssignment.id
                }));
            } else {
                alert('Please select a valid assignment');
            }
        } else {
            alert('Please select an assignment');
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Task" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold">Create Task</h1>
                    <p className="text-gray-500">Create a new task for an assignment</p>
                </div>

                {assignments.length > 0 ? (
                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Task Title
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-opacity-50 ${errors.title ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                    required
                                />
                                {errors.title && <div className="text-red-500 text-sm mt-1">{errors.title}</div>}
                            </div>

                            <div className="mb-6">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    rows={4}
                                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-opacity-50 ${errors.description ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                />
                                {errors.description && <div className="text-red-500 text-sm mt-1">{errors.description}</div>}
                            </div>

                            <div className="mb-6">
                                <label htmlFor="assignment_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Assignment
                                </label>
                                <select
                                    id="assignment_id"
                                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-opacity-50 ${errors.assignment_id ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
                                    value={data.assignment_id}
                                    onChange={e => setData('assignment_id', e.target.value)}
                                    required
                                >
                                    <option value="">Select an assignment</option>
                                    {assignments.map((assignment) => (
                                        <option key={assignment.id} value={assignment.id.toString()}>
                                            {assignment.title} (Due: {assignment.due_date})
                                        </option>
                                    ))}
                                </select>
                                {errors.assignment_id && <div className="text-red-500 text-sm mt-1">{errors.assignment_id}</div>}
                                {selectedAssignment && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Assignment due date: {selectedAssignment.due_date}
                                    </p>
                                )}
                            </div>

                            <div className="mb-6">
                                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    id="end_date"
                                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-opacity-50 ${errors.end_date ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
                                    value={data.end_date}
                                    onChange={e => setData('end_date', e.target.value)}
                                    min={today}
                                    max={maxDate}
                                    required
                                />
                                {errors.end_date && <div className="text-red-500 text-sm mt-1">{errors.end_date}</div>}
                                <p className="text-xs text-gray-500 mt-1">
                                    Must be between today and the assignment due date
                                </p>
                            </div>

                            <div className="mb-6 grid grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="effort_hours" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Effort (hours)
                                    </label>
                                    <input
                                        type="number"
                                        id="effort_hours"
                                        min="1"
                                        max="100"
                                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-opacity-50 ${errors.effort_hours ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
                                        value={data.effort_hours}
                                        onChange={e => setData('effort_hours', e.target.value)}
                                    />
                                    {errors.effort_hours && <div className="text-red-500 text-sm mt-1">{errors.effort_hours}</div>}
                                    <p className="text-xs text-gray-500 mt-1">Estimated hours to complete</p>
                                </div>

                                <div>
                                    <label htmlFor="importance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Importance
                                    </label>
                                    <select
                                        id="importance"
                                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-opacity-50 ${errors.importance ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
                                        value={data.importance}
                                        onChange={e => setData('importance', e.target.value)}
                                    >
                                        <option value="1">1 (Lowest)</option>
                                        <option value="2">2</option>
                                        <option value="3">3 (Medium)</option>
                                        <option value="4">4</option>
                                        <option value="5">5 (Highest)</option>
                                    </select>
                                    {errors.importance && <div className="text-red-500 text-sm mt-1">{errors.importance}</div>}
                                    <p className="text-xs text-gray-500 mt-1">Task importance level</p>
                                </div>

                                <div>
                                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Priority
                                    </label>
                                    <select
                                        id="priority"
                                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-opacity-50 ${errors.priority ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
                                        value={data.priority}
                                        onChange={e => setData('priority', e.target.value)}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                    {errors.priority && <div className="text-red-500 text-sm mt-1">{errors.priority}</div>}
                                    <p className="text-xs text-gray-500 mt-1">Task urgency level</p>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                {selectedAssignment && (
                                    <Link href={route('group-assignments.index', { group: selectedAssignment.group.id })}>
                                        <Button variant="outline" className="mr-2">
                                            Cancel
                                        </Button>
                                    </Link>
                                )}
                                <Button type="submit" disabled={processing}>
                                    Create Task
                                </Button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 text-center">
                        <p className="text-gray-500">No assignments available. Please create an assignment first.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
