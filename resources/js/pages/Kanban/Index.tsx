import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Button } from '@/components/ui/button';
import { PageProps, BreadcrumbItem } from '@/types';
import { KanbanBoard as KanbanBoardType } from '@/types/kanban';
import { KanbanService } from '@/services/kanban-service';
import { Plus, LayoutGrid } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

interface Props extends PageProps {
    initialBoardId?: number;
}

export default function KanbanIndex({ initialBoardId }: Props) {
    const [boards, setBoards] = useState<KanbanBoardType[]>([]);
    const [selectedBoardId, setSelectedBoardId] = useState<number | null>(initialBoardId || null);
    const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [newBoardDescription, setNewBoardDescription] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatingBoard, setIsCreatingBoard] = useState(false);
    const { toast } = useToast();

    // Breadcrumbs
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Kanban Boards',
            href: '/kanban',
        }
    ];

    if (selectedBoardId) {
        const selectedBoard = boards.find(board => board.id === selectedBoardId);
        if (selectedBoard) {
            breadcrumbs.push({
                title: selectedBoard.name,
                href: `/kanban/${selectedBoard.id}`,
            });
        }
    }

    // Fetch boards on component mount
    useEffect(() => {
        const fetchBoards = async () => {
            try {
                setIsLoading(true);
                const data = await KanbanService.getBoards();
                setBoards(data);

                // Select first board if none selected and we have boards
                if (!selectedBoardId && data.length > 0) {
                    setSelectedBoardId(data[0].id);
                }

                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching boards:', error);
                toast({
                    title: 'Error loading boards',
                    description: 'Could not load your Kanban boards',
                    variant: 'destructive',
                });
                setIsLoading(false);
            }
        };

        fetchBoards();
    }, [selectedBoardId]);

    // Handle creating a new board
    const handleCreateBoard = async () => {
        if (!newBoardName.trim()) return;

        try {
            setIsCreatingBoard(true);

            const newBoard = await KanbanService.createBoard({
                name: newBoardName.trim(),
                description: newBoardDescription.trim() || undefined,
                is_active: true,
            });

            setBoards([...boards, newBoard]);
            setSelectedBoardId(newBoard.id);
            setIsCreateBoardOpen(false);
            setNewBoardName('');
            setNewBoardDescription('');

            toast({
                title: 'Board created',
                description: 'New Kanban board has been created successfully',
            });
        } catch (error) {
            console.error('Error creating board:', error);
            toast({
                title: 'Error creating board',
                description: 'Could not create a new board',
                variant: 'destructive',
            });
        } finally {
            setIsCreatingBoard(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={selectedBoardId ? `Kanban - ${boards.find(b => b.id === selectedBoardId)?.name || ''}` : 'Kanban Boards'} />

            <div className="flex flex-col h-full">
                {/* Board Selection Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        {boards.length > 0 && (
                            <div className="flex items-center">
                                <Label htmlFor="boardSelect" className="mr-2">Select Board:</Label>
                                <select
                                    id="boardSelect"
                                    value={selectedBoardId || ''}
                                    onChange={(e) => setSelectedBoardId(parseInt(e.target.value))}
                                    className="border border-gray-300 dark:border-gray-600 rounded-md p-1 bg-background text-foreground"
                                >
                                    {boards.map((board) => (
                                        <option key={board.id} value={board.id}>
                                            {board.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={() => setIsCreateBoardOpen(true)}
                        className="flex items-center gap-1"
                    >
                        <Plus size={16} />
                        New Board
                    </Button>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : selectedBoardId ? (
                        <KanbanBoard boardId={selectedBoardId} />
                    ) : boards.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <LayoutGrid className="h-16 w-16 text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold mb-2">No Kanban Boards</h2>
                            <p className="text-muted-foreground mb-4">Create your first Kanban board to get started</p>
                            <Button onClick={() => setIsCreateBoardOpen(true)}>
                                Create Board
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-64">
                            <p>Select a board to view</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Board Dialog */}
            <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Board</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="boardName">Board Name</Label>
                            <Input
                                id="boardName"
                                value={newBoardName}
                                onChange={(e) => setNewBoardName(e.target.value)}
                                placeholder="e.g., Project X, Sprint Planning"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="boardDescription">Description (Optional)</Label>
                            <Textarea
                                id="boardDescription"
                                value={newBoardDescription}
                                onChange={(e) => setNewBoardDescription(e.target.value)}
                                placeholder="Add a description for your board"
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCreateBoardOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateBoard}
                            disabled={isCreatingBoard || !newBoardName.trim()}
                        >
                            {isCreatingBoard ? 'Creating...' : 'Create Board'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
