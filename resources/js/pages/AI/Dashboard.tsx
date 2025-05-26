import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, CalendarRange, Plus } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface Group {
    id: number;
    name: string;
}

interface Assignment {
    id: number;
    title: string;
}

interface AIAssignment {
    id: number;
    original_prompt: string;
    model_used: string;
    created_at: string;
    group: Group;
    assignment: Assignment;
    creator: {
        id: number;
        name: string;
    };
}

interface Props {
    groups: Group[];
    aiAssignments: AIAssignment[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'AI Tasks',
        href: '/ai-tasks',
    },
];

export default function Dashboard({ groups, aiAssignments }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Task Management" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">AI Task Management</h1>
                    <div className="flex gap-2">
                        {groups.length > 0 && (
                            <Button asChild>
                                <Link href={`/groups/${groups[0].id}/ai-tasks`}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create AI Tasks
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                {aiAssignments.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {aiAssignments.map((item) => (
                            <Card key={item.id}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">{item.assignment.title}</CardTitle>
                                    <CardDescription>{item.group.name}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col gap-2">
                                        <div className="text-sm line-clamp-2">{item.original_prompt}</div>
                                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                            <CalendarRange className="h-3.5 w-3.5" />
                                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <BrainCircuit className="h-3.5 w-3.5" />
                                            <span>{item.model_used || 'Unknown Model'}</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" size="sm" asChild className="w-full">
                                        <Link href={`/groups/${item.group.id}/assignments/${item.assignment.id}`}>
                                            View Assignment
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex h-96 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
                        <BrainCircuit className="h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No AI-Generated Tasks Yet</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Use AI to automatically generate and distribute tasks for your assignments.
                        </p>
                        {groups.length > 0 && (
                            <Button className="mt-4" asChild>
                                <Link href={`/groups/${groups[0].id}/ai-tasks`}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Your First AI Tasks
                                </Link>
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
