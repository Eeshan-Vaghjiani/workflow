import React, { useState } from 'react';
import { KanbanColumn } from '@/types/kanban';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface AddColumnDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: Partial<KanbanColumn>) => void;
}

export function AddColumnDialog({ open, onOpenChange, onSubmit }: AddColumnDialogProps) {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#3B82F6'); // Default blue

    // Color options
    const colorOptions = [
        { name: 'Slate', value: '#64748B' },
        { name: 'Blue', value: '#3B82F6' },
        { name: 'Amber', value: '#F59E0B' },
        { name: 'Violet', value: '#8B5CF6' },
        { name: 'Emerald', value: '#10B981' },
        { name: 'Rose', value: '#F43F5E' },
        { name: 'Indigo', value: '#6366F1' },
        { name: 'Orange', value: '#F97316' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) return;

        onSubmit({
            name: name.trim(),
            color,
        });

        // Reset form
        setName('');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add New Column</DialogTitle>
                        <DialogDescription>
                            Create a new column for your Kanban board.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Column Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., To Do, In Progress, Done"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Column Color</Label>
                            <div className="flex flex-wrap gap-2">
                                {colorOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={`w-8 h-8 rounded-full cursor-pointer ${color === option.value ? 'ring-2 ring-primary ring-offset-2' : ''
                                            }`}
                                        style={{ backgroundColor: option.value }}
                                        onClick={() => setColor(option.value)}
                                        title={option.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={!name.trim()}>
                            Add Column
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
