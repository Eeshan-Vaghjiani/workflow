import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, format, parseISO } from 'date-fns';

interface Group {
    id: number;
    name: string;
}

interface Assignment {
    id: number;
    title: string;
    description: string;
    due_date: string;
    start_date: string;
    end_date: string;
    status: string;
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

interface AIPrompt {
    id: number;
    prompt: string;
    response: string;
    model_used: string;
    success: boolean;
    created_at: string;
    user: {
        id: number;
        name: string;
    };
    group?: Group;
    metadata?: {
        response_time_ms?: number;
        [key: string]: unknown;
    };
}

interface DashboardProps {
    groups: Group[];
    aiAssignments: AIAssignment[];
    aiPrompts: AIPrompt[];
}

// Helper function to format dates in DD/MM/YYYY format
const formatDate = (dateString: string): string => {
    try {
        return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch {
        return dateString;
    }
};

export default function Dashboard({ aiAssignments, aiPrompts }: DashboardProps) {
    const [expandedPrompt, setExpandedPrompt] = useState<number | null>(null);

    return (
        <AppLayout>
            <Head title="AI Tasks Dashboard" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold mb-6">AI Tasks Dashboard</h1>

                    <Tabs defaultValue="assignments">
                        <TabsList className="mb-6">
                            <TabsTrigger value="assignments">AI Generated Assignments</TabsTrigger>
                            <TabsTrigger value="prompts">AI Prompts History</TabsTrigger>
                        </TabsList>

                        <TabsContent value="assignments">
                            <div className="grid gap-6">
                                {aiAssignments.length > 0 ? (
                                    aiAssignments.map((aiAssignment) => (
                                        <Card key={aiAssignment.id}>
                                            <CardHeader>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardTitle>{aiAssignment.assignment.title}</CardTitle>
                                                        <CardDescription>
                                                            Group: {aiAssignment.group.name} |
                                                            Created by: {aiAssignment.creator.name} |
                                                            {formatDistanceToNow(new Date(aiAssignment.created_at), { addSuffix: true })}
                                                        </CardDescription>
                                                    </div>
                                                    <Badge variant="outline">{aiAssignment.model_used}</Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="mb-4">
                                                    <h3 className="text-sm font-medium text-gray-500">Original Prompt:</h3>
                                                    <p className="mt-1 text-sm">{aiAssignment.original_prompt}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <span>Due: {formatDate(aiAssignment.assignment.due_date)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => window.location.href = `/groups/${aiAssignment.group.id}/assignments/${aiAssignment.assignment.id}`}
                                                    >
                                                        View Assignment
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <Card>
                                        <CardContent className="py-6">
                                            <p className="text-center text-gray-500">No AI-generated assignments found.</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="prompts">
                            <div className="grid gap-6">
                                {aiPrompts.length > 0 ? (
                                    aiPrompts.map((prompt) => (
                                        <Card key={prompt.id}>
                                            <CardHeader>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardTitle className="text-lg">
                                                            {prompt.prompt.length > 60
                                                                ? prompt.prompt.substring(0, 60) + '...'
                                                                : prompt.prompt}
                                                        </CardTitle>
                                                        <CardDescription>
                                                            User: {prompt.user.name} |
                                                            {prompt.group ? ` Group: ${prompt.group.name} |` : ''}
                                                            {formatDistanceToNow(new Date(prompt.created_at), { addSuffix: true })}
                                                            {prompt.metadata?.response_time_ms ?
                                                                ` | Response time: ${prompt.metadata.response_time_ms}ms` :
                                                                ''}
                                                        </CardDescription>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Badge variant={prompt.success ? "default" : "destructive"}>
                                                            {prompt.success ? 'Success' : 'Failed'}
                                                        </Badge>
                                                        <Badge variant="outline">{prompt.model_used}</Badge>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="mb-4">
                                                    <h3 className="text-sm font-medium text-gray-500">Prompt:</h3>
                                                    <p className="mt-1 text-sm">{prompt.prompt}</p>
                                                </div>

                                                {expandedPrompt === prompt.id && (
                                                    <div className="mb-4">
                                                        <h3 className="text-sm font-medium text-gray-500">Response:</h3>
                                                        <pre className="mt-1 text-xs p-4 bg-gray-50 rounded overflow-auto max-h-60">
                                                            {prompt.response}
                                                        </pre>
                                                    </div>
                                                )}

                                                <div className="flex justify-end">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setExpandedPrompt(expandedPrompt === prompt.id ? null : prompt.id)}
                                                    >
                                                        {expandedPrompt === prompt.id ? 'Hide Response' : 'View Response'}
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <Card>
                                        <CardContent className="py-6">
                                            <p className="text-center text-gray-500">No AI prompts history found.</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AppLayout>
    );
}
