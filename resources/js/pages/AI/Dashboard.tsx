import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { Card3D } from '@/components/ui/card-3d';
import { GlassContainer } from '@/components/ui/glass-container';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { containerVariants, itemVariants } from '@/lib/theme-constants';

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

    const breadcrumbs = [
        {
            title: 'AI Tasks Dashboard',
            href: '/ai-tasks',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Tasks Dashboard" />
            <motion.div
                className="flex h-full flex-1 flex-col gap-6 p-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants}>
                    <Card3D className="p-6">
                        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">AI Tasks Dashboard</h1>

                        <Tabs defaultValue="assignments">
                            <TabsList className="mb-6">
                                <TabsTrigger value="assignments">AI Generated Assignments</TabsTrigger>
                                <TabsTrigger value="prompts">AI Prompts History</TabsTrigger>
                            </TabsList>

                            <TabsContent value="assignments">
                                <motion.div
                                    className="grid gap-6"
                                    variants={containerVariants}
                                >
                                    {aiAssignments.length > 0 ? (
                                        aiAssignments.map((aiAssignment, index) => (
                                            <motion.div
                                                key={aiAssignment.id}
                                                variants={itemVariants}
                                                custom={index}
                                            >
                                                <GlassContainer blurIntensity="sm">
                                                    <CardHeader>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <CardTitle className="text-gray-900 dark:text-white">{aiAssignment.assignment.title}</CardTitle>
                                                                <CardDescription className="text-gray-600 dark:text-gray-300">
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
                                                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Original Prompt:</h3>
                                                            <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">{aiAssignment.original_prompt}</p>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                                                <span>Due: {formatDate(aiAssignment.assignment.due_date)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end">
                                                            <EnhancedButton
                                                                variant="outline"
                                                                size="sm"
                                                                magnetic={true}
                                                                onClick={() => window.location.href = `/groups/${aiAssignment.group.id}/assignments/${aiAssignment.assignment.id}`}
                                                            >
                                                                View Assignment
                                                            </EnhancedButton>
                                                        </div>
                                                    </CardContent>
                                                </GlassContainer>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <motion.div variants={itemVariants}>
                                            <GlassContainer blurIntensity="sm">
                                                <CardContent className="py-6">
                                                    <p className="text-center text-gray-500 dark:text-gray-400">No AI-generated assignments found.</p>
                                                </CardContent>
                                            </GlassContainer>
                                        </motion.div>
                                    )}
                                </motion.div>
                            </TabsContent>

                            <TabsContent value="prompts">
                                <motion.div
                                    className="grid gap-6"
                                    variants={containerVariants}
                                >
                                    {aiPrompts.length > 0 ? (
                                        aiPrompts.map((prompt, index) => (
                                            <motion.div
                                                key={prompt.id}
                                                variants={itemVariants}
                                                custom={index}
                                            >
                                                <GlassContainer blurIntensity="sm">
                                                    <CardHeader>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <CardTitle className="text-lg text-gray-900 dark:text-white">
                                                                    {prompt.prompt.length > 60
                                                                        ? prompt.prompt.substring(0, 60) + '...'
                                                                        : prompt.prompt}
                                                                </CardTitle>
                                                                <CardDescription className="text-gray-600 dark:text-gray-300">
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
                                                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Prompt:</h3>
                                                            <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">{prompt.prompt}</p>
                                                        </div>

                                                        {expandedPrompt === prompt.id && (
                                                            <motion.div
                                                                className="mb-4"
                                                                initial={{ opacity: 0, y: 20 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ duration: 0.3 }}
                                                            >
                                                                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Response:</h3>
                                                                <pre className="mt-1 text-xs p-4 bg-gray-50 dark:bg-gray-800 rounded overflow-auto max-h-60 text-gray-800 dark:text-gray-200">
                                                                    {prompt.response}
                                                                </pre>
                                                            </motion.div>
                                                        )}

                                                        <div className="flex justify-end">
                                                            <EnhancedButton
                                                                variant="outline"
                                                                size="sm"
                                                                magnetic={true}
                                                                onClick={() => setExpandedPrompt(expandedPrompt === prompt.id ? null : prompt.id)}
                                                            >
                                                                {expandedPrompt === prompt.id ? 'Hide Response' : 'View Response'}
                                                            </EnhancedButton>
                                                        </div>
                                                    </CardContent>
                                                </GlassContainer>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <motion.div variants={itemVariants}>
                                            <GlassContainer blurIntensity="sm">
                                                <CardContent className="py-6">
                                                    <p className="text-center text-gray-500 dark:text-gray-400">No AI prompts history found.</p>
                                                </CardContent>
                                            </GlassContainer>
                                        </motion.div>
                                    )}
                                </motion.div>
                            </TabsContent>
                        </Tabs>
                    </Card3D>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}
