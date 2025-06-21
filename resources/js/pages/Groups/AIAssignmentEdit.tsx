import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, BrainCircuit, Loader2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';

interface Member {
    id: number;
    name: string;
    email: string;
    pivot: {
        role: string;
    };
}

interface Task {
    id: number;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    status: string;
    priority: string;
    effort_hours: number;
    importance: number;
    assigned_user_id: number | null;
    assigned_user?: {
        id: number;
        name: string;
    };
}

interface Assignment {
    id: number;
    title: string;
    description: string;
    unit_name: string;
    due_date: string;
    start_date: string;
    end_date: string;
    status: string;
    tasks: Task[];
}

interface Group {
    id: number;
    name: string;
    members: Member[];
}

interface AIGeneratedAssignment {
    id: number;
    original_prompt: string;
    model_used: string;
    ai_response: string;
}

interface Props {
    group: Group;
    assignment: Assignment;
    aiGeneratedAssignment: AIGeneratedAssignment;
}

// Helper function to format dates in DD/MM/YYYY format
// This is used directly in the Calendar component format function

export default function AIAssignmentEdit({ group, assignment, aiGeneratedAssignment }: Props) {
    const [activeTab, setActiveTab] = useState('details');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date(assignment.due_date));
    const [redistributeTasks, setRedistributeTasks] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const { toast } = useToast();

    const { data, setData, processing, errors } = useForm({
        title: assignment.title,
        description: assignment.description,
        unit_name: assignment.unit_name,
        due_date: assignment.due_date,
        status: assignment.status,
        tasks: assignment.tasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            start_date: task.start_date,
            end_date: task.end_date,
            status: task.status,
            priority: task.priority,
            effort_hours: task.effort_hours,
            importance: task.importance,
            assigned_user_id: task.assigned_user_id
        })),
        redistribute_tasks: false
    });

    useEffect(() => {
        if (selectedDate) {
            setData('due_date', format(selectedDate, 'yyyy-MM-dd'));
        }
    }, [selectedDate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Create a new FormData object
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('unit_name', data.unit_name);
        formData.append('due_date', data.due_date);
        formData.append('status', data.status);
        formData.append('redistribute_tasks', redistributeTasks ? '1' : '0');

        // Add tasks as JSON
        formData.append('tasks', JSON.stringify(data.tasks));

        // Submit with axios instead of using the form helper
        axios.post(route('ai-tasks.update', { group: group.id, assignment: assignment.id }), formData)
            .then(response => {
                if (response.data.redirect_url) {
                    window.location.href = response.data.redirect_url;
                }
            })
            .catch(error => {
                console.error('Error updating assignment:', error);
            });
    };

    const updateTask = (index: number, field: string, value: string | number | null) => {
        const updatedTasks = [...data.tasks];
        updatedTasks[index] = {
            ...updatedTasks[index],
            [field]: value
        };
        setData('tasks', updatedTasks);
    };

    const handleAiEdit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!aiPrompt.trim()) {
            setAiError('Please enter instructions for the AI');
            return;
        }

        setIsAiLoading(true);
        setAiError(null);

        try {
            // First ensure CSRF token is refreshed
            await axios.get('/sanctum/csrf-cookie');

            const response = await axios.post(`/groups/${group.id}/ai-tasks/generate`, {
                prompt: `Please modify the following assignment based on these instructions: ${aiPrompt}\n\nCurrent Assignment: ${data.title}\nDescription: ${data.description}\nUnit: ${data.unit_name}\nDue Date: ${data.due_date}`,
            }, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                }
            });

            if (response.data.error) {
                setAiError(response.data.error);
            } else if (response.data.assignment) {
                // Update form data with AI suggestions
                setData({
                    ...data,
                    title: response.data.assignment.title || data.title,
                    description: response.data.assignment.description || data.description,
                    unit_name: response.data.assignment.unit_name || data.unit_name,
                    due_date: response.data.assignment.due_date || data.due_date,
                });

                // Switch to details tab to show changes
                setActiveTab('details');

                toast({
                    title: 'Success!',
                    description: 'AI has suggested changes to the assignment',
                });
            }
        } catch (error) {
            console.error('AI Edit Error:', error);
            setAiError('Failed to process AI edit request. Please try again.');
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <AppLayout>
            <Head title={`Edit Assignment - ${assignment.title}`} />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold">Edit AI-Generated Assignment</h1>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">AI Model: {aiGeneratedAssignment.model_used}</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="mb-6">
                                <TabsTrigger value="details">Assignment Details</TabsTrigger>
                                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                                <TabsTrigger value="ai-edit">AI Edit</TabsTrigger>
                                <TabsTrigger value="prompt">Original Prompt</TabsTrigger>
                            </TabsList>

                            <TabsContent value="details">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Assignment Details</CardTitle>
                                        <CardDescription>Edit the basic information about this assignment</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="title">Title</Label>
                                                <Input
                                                    id="title"
                                                    value={data.title}
                                                    onChange={e => setData('title', e.target.value)}
                                                />
                                                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="unit_name">Unit/Course Name</Label>
                                                <Input
                                                    id="unit_name"
                                                    value={data.unit_name}
                                                    onChange={e => setData('unit_name', e.target.value)}
                                                />
                                                {errors.unit_name && <p className="text-sm text-red-500">{errors.unit_name}</p>}
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="description">Description</Label>
                                                <Textarea
                                                    id="description"
                                                    rows={4}
                                                    value={data.description}
                                                    onChange={e => setData('description', e.target.value)}
                                                />
                                                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="due_date">Due Date</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "w-full justify-start text-left font-normal",
                                                                !selectedDate && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {selectedDate ? format(selectedDate, "dd/MM/yyyy") : <span>Pick a date</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="single"
                                                            selected={selectedDate}
                                                            onSelect={setSelectedDate}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                {errors.due_date && <p className="text-sm text-red-500">{errors.due_date}</p>}
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="status">Status</Label>
                                                <Select
                                                    value={data.status}
                                                    onValueChange={(value) => setData('status', value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="completed">Completed</SelectItem>
                                                        <SelectItem value="archived">Archived</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="ai-edit">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <BrainCircuit className="h-5 w-5 text-primary" />
                                            AI Assignment Editor
                                        </CardTitle>
                                        <CardDescription>
                                            Let AI help you improve or modify this assignment. Describe what changes you want to make.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleAiEdit} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="ai-prompt">Instructions for AI</Label>
                                                <Textarea
                                                    id="ai-prompt"
                                                    placeholder="Describe how you want to modify this assignment. For example: 'Make this assignment more challenging by adding critical thinking tasks' or 'Simplify the language to make it more accessible'"
                                                    value={aiPrompt}
                                                    onChange={(e) => setAiPrompt(e.target.value)}
                                                    className="h-32"
                                                />
                                                <p className="text-sm text-muted-foreground">
                                                    Be specific about what aspects of the assignment you want to change.
                                                </p>
                                            </div>

                                            {aiError && (
                                                <Alert variant="destructive">
                                                    <AlertTitle>Error</AlertTitle>
                                                    <AlertDescription>{aiError}</AlertDescription>
                                                </Alert>
                                            )}

                                            <div className="flex justify-end">
                                                <Button type="submit" disabled={isAiLoading || !aiPrompt.trim()}>
                                                    {isAiLoading ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="mr-2 h-4 w-4" />
                                                            Generate Suggestions
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="tasks">
                                <Card>
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle>Tasks</CardTitle>
                                                <CardDescription>Edit the tasks for this assignment</CardDescription>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="redistribute"
                                                    checked={redistributeTasks}
                                                    onCheckedChange={(checked: boolean | 'indeterminate') => {
                                                        if (typeof checked === 'boolean') {
                                                            setRedistributeTasks(checked);
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor="redistribute">Auto-redistribute tasks to all members</Label>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-6">
                                            {data.tasks.map((task, index) => (
                                                <Card key={task.id} className="border border-gray-200">
                                                    <CardHeader className="py-3">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor={`task-${index}-title`}>Title</Label>
                                                            <Input
                                                                id={`task-${index}-title`}
                                                                value={task.title}
                                                                onChange={e => updateTask(index, 'title', e.target.value)}
                                                            />
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="py-0 space-y-4">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor={`task-${index}-description`}>Description</Label>
                                                            <Textarea
                                                                id={`task-${index}-description`}
                                                                rows={2}
                                                                value={task.description}
                                                                onChange={e => updateTask(index, 'description', e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <div className="grid gap-2">
                                                                <Label htmlFor={`task-${index}-priority`}>Priority</Label>
                                                                <Select
                                                                    value={task.priority}
                                                                    onValueChange={(value) => updateTask(index, 'priority', value)}
                                                                >
                                                                    <SelectTrigger id={`task-${index}-priority`}>
                                                                        <SelectValue placeholder="Select priority" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="low">Low</SelectItem>
                                                                        <SelectItem value="medium">Medium</SelectItem>
                                                                        <SelectItem value="high">High</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            <div className="grid gap-2">
                                                                <Label htmlFor={`task-${index}-effort`}>Effort (hours)</Label>
                                                                <Input
                                                                    id={`task-${index}-effort`}
                                                                    type="number"
                                                                    min="1"
                                                                    max="100"
                                                                    value={task.effort_hours}
                                                                    onChange={e => updateTask(index, 'effort_hours', parseInt(e.target.value))}
                                                                />
                                                            </div>

                                                            <div className="grid gap-2">
                                                                <Label htmlFor={`task-${index}-importance`}>Importance (1-5)</Label>
                                                                <Input
                                                                    id={`task-${index}-importance`}
                                                                    type="number"
                                                                    min="1"
                                                                    max="5"
                                                                    value={task.importance}
                                                                    onChange={e => updateTask(index, 'importance', parseInt(e.target.value))}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid gap-2">
                                                            <Label htmlFor={`task-${index}-assigned`}>Assigned To</Label>
                                                            <Select
                                                                value={task.assigned_user_id?.toString() || ""}
                                                                onValueChange={(value) => updateTask(index, 'assigned_user_id', value ? parseInt(value) : null)}
                                                            >
                                                                <SelectTrigger id={`task-${index}-assigned`}>
                                                                    <SelectValue placeholder="Select member" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="">Unassigned</SelectItem>
                                                                    {group && group.members ? group.members.map(member => (
                                                                        <SelectItem key={member.id} value={member.id.toString()}>
                                                                            {member.name}
                                                                        </SelectItem>
                                                                    )) : null}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="prompt">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Original AI Prompt</CardTitle>
                                        <CardDescription>The original prompt used to generate this assignment</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
                                            <p className="whitespace-pre-wrap">{aiGeneratedAssignment.original_prompt}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        <div className="mt-6 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.history.back()}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
