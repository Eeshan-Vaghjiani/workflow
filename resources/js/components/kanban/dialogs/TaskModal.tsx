import React, { useState, useEffect } from 'react';
import { KanbanTask } from '@/types/kanban';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarIcon, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import axios from 'axios';

interface TaskModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: KanbanTask;
    onSave: (task: Partial<KanbanTask>) => void;
    onDelete: (taskId: number) => void;
}

export function TaskModal({ open, onOpenChange, task, onSave, onDelete }: TaskModalProps) {
    // Form state
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [priority, setPriority] = useState(task.priority);
    const [assignedTo, setAssignedTo] = useState<number | undefined>(task.assigned_to);
    const [dueDate, setDueDate] = useState<Date | undefined>(
        task.due_date ? new Date(task.due_date) : undefined
    );
    const [tags, setTags] = useState<string[]>(task.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [users, setUsers] = useState<{ id: number; name: string; avatar?: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Load users for assignment
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('/api/users');
                setUsers(response.data.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, []);

    // Reset form when task changes
    useEffect(() => {
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(task.priority);
        setAssignedTo(task.assigned_to);
        setDueDate(task.due_date ? new Date(task.due_date) : undefined);
        setTags(task.tags || []);
    }, [task]);

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        setIsLoading(true);

        const updatedTask: Partial<KanbanTask> = {
            title: title.trim(),
            description: description.trim() || undefined,
            priority,
            assigned_to: assignedTo,
            due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
            tags,
            column_id: task.column_id,
            position: task.position,
        };

        onSave(updatedTask);
        setIsLoading(false);
    };

    // Handle tag addition
    const handleAddTag = () => {
        if (!tagInput.trim()) return;

        const newTag = tagInput.trim();
        if (!tags.includes(newTag)) {
            setTags([...tags, newTag]);
        }

        setTagInput('');
    };

    // Handle tag removal
    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    // Handle task deletion
    const handleDelete = () => {
        if (task.id && confirm('Are you sure you want to delete this task?')) {
            setIsDeleting(true);
            onDelete(task.id);
        }
    };

    // Helper function to get user initials
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{task.id ? 'Edit Task' : 'Create New Task'}</DialogTitle>
                        <DialogDescription>
                            {task.id ? 'Update task details' : 'Add a new task to your board'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Title */}
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Task title"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Task description"
                                rows={4}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Priority */}
                            <div className="grid gap-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Select
                                    value={priority}
                                    onValueChange={(value) => setPriority(value as 'low' | 'medium' | 'high' | 'urgent')}
                                >
                                    <SelectTrigger id="priority">
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Assigned To */}
                            <div className="grid gap-2">
                                <Label htmlFor="assignedTo">Assigned To</Label>
                                <Select
                                    value={assignedTo?.toString() || ''}
                                    onValueChange={(value) => setAssignedTo(value ? parseInt(value) : undefined)}
                                >
                                    <SelectTrigger id="assignedTo">
                                        <SelectValue placeholder="Select user" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Unassigned</SelectItem>
                                        {users.map((user) => (
                                            <SelectItem key={user.id} value={user.id.toString()}>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        {user.avatar ? (
                                                            <AvatarImage src={user.avatar} alt={user.name} />
                                                        ) : null}
                                                        <AvatarFallback>
                                                            {getInitials(user.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {user.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="grid gap-2">
                            <Label htmlFor="dueDate">Due Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="dueDate"
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !dueDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dueDate ? format(dueDate, "MMMM d, yyyy") : "No due date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={dueDate}
                                        onSelect={setDueDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Tags */}
                        <div className="grid gap-2">
                            <Label htmlFor="tags">Tags</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="tags"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    placeholder="Add a tag"
                                    className="flex-1"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddTag();
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    onClick={handleAddTag}
                                    variant="outline"
                                >
                                    Add
                                </Button>
                            </div>

                            {/* Tag List */}
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {tags.map((tag) => (
                                        <div
                                            key={tag}
                                            className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm"
                                        >
                                            <span>{tag}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTag(tag)}
                                                className="text-muted-foreground hover:text-foreground"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="flex justify-between">
                        <div>
                            {task.id > 0 && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex items-center gap-1"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading || !title.trim()}>
                                {isLoading ? "Saving..." : (task.id ? "Update" : "Create")}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
