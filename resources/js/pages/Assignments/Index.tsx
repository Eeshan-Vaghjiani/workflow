import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface Assignment {
    id: number;
    title: string;
    description: string | null;
    due_date: string;
    group: {
        id: number;
        name: string;
    };
}

interface Props {
    assignments: Assignment[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Assignments',
        href: '/group-assignments',
    },
];

export default function AssignmentsIndex({ assignments }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Assignments" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between mb-4">
                    <h1 className="text-2xl font-bold">Assignments</h1>
                    <Link
                        href={route('group-assignments.create')}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 transition"
                    >
                        Create Assignment
                    </Link>
                </div>

                {assignments.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {assignments.map((assignment) => (
                            <div key={assignment.id} className="border rounded-xl p-4 hover:border-blue-500 transition">
                                <Link href={route('group-assignments.show', assignment.id)}>
                                    <h2 className="text-xl font-semibold text-blue-600 hover:text-blue-800 mb-2">{assignment.title}</h2>
                                </Link>
                                <p className="text-sm text-gray-500 mb-2">{assignment.description || 'No description'}</p>
                                <div className="flex justify-between text-sm">
                                    <span>Group: <Link href={route('groups.show', assignment.group.id)} className="text-blue-500 hover:text-blue-700">{assignment.group.name}</Link></span>
                                    <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[50vh] flex items-center justify-center overflow-hidden rounded-xl border">
                        <div className="text-center">
                            <h3 className="text-xl font-semibold mb-2">No Assignments Yet</h3>
                            <p className="text-gray-500 mb-4">Create an assignment to start organizing tasks.</p>
                            <Link
                                href={route('group-assignments.create')}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 transition"
                            >
                                Create Assignment
                            </Link>
                        </div>
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/10 dark:stroke-neutral-100/10" />
                    </div>
                )}
            </div>
        </AppLayout>
    );
} 