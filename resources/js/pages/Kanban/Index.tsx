import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Button } from '@/components/ui/button';
import { PageProps, BreadcrumbItem } from '@/types';
import { KanbanBoard as KanbanBoardType } from '@/types/kanban';
import { KanbanService } from '@/services/kanban-service';
import { Plus, LayoutGrid, AlertTriangle, RefreshCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AxiosError } from 'axios';
import axios from 'axios';

interface Props extends PageProps {
    initialBoardId?: number;
}

interface AuthStatus {
    authenticated: boolean;
    user?: {
        id: number;
        name: string;
        email: string;
    };
}

export default function KanbanIndex({ initialBoardId }: Props) {
    const [boards, setBoards] = useState<KanbanBoardType[]>([]);
    const [selectedBoardId, setSelectedBoardId] = useState<number | null>(initialBoardId || null);
    const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [newBoardDescription, setNewBoardDescription] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatingBoard, setIsCreatingBoard] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
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

    // Check authentication status
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const status = await KanbanService.checkAuth();
                setAuthStatus(status);

                if (!status.authenticated) {
                    setError('Authentication failed. Please log in again.');
                    toast({
                        title: 'Authentication Error',
                        description: 'You need to log in again to access Kanban boards',
                        variant: 'destructive',
                    });
                }
            } catch (err) {
                console.error('Error checking auth status:', err);
                setAuthStatus({ authenticated: false });
                setError('Could not verify authentication status. Please try again later.');
            }
        };

        checkAuth();
    }, []);

    // Fetch boards on component mount
    useEffect(() => {
        const fetchBoards = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const apiData = await KanbanService.getBoards();
                setBoards(apiData);

                // Select first board if none selected and we have boards
                if (!selectedBoardId && apiData.length > 0) {
                    setSelectedBoardId(apiData[0].id);
                }
            } catch (error) {
                console.error('Error fetching boards:', error);

                // Set a user-friendly error message
                if (axios.isAxiosError(error)) {
                    const axiosError = error as AxiosError;
                    if (axiosError.response?.status === 401) {
                        setError('Authentication required. Please log in again.');

                        toast({
                            title: 'Authentication Error',
                            description: 'You need to log in again to access your Kanban boards',
                            variant: 'destructive',
                        });
                    } else {
                        setError('Could not load your Kanban boards. Please try again later.');
                        toast({
                            title: 'Error loading boards',
                            description: axiosError.message || 'Could not load your Kanban boards',
                            variant: 'destructive',
                        });
                    }
                } else {
                    setError('Could not load your Kanban boards. Please try again later.');
                    toast({
                        title: 'Error loading boards',
                        description: 'An unexpected error occurred',
                        variant: 'destructive',
                    });
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchBoards();
    }, []);

    // Handle creating a new board
    const handleCreateBoard = async () => {
        if (!newBoardName.trim()) return;

        try {
            setIsCreatingBoard(true);
            setError(null);

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

            // Set a user-friendly error message
            const axiosError = error as AxiosError;
            if (axiosError.response?.status === 401) {
                setError('Authentication required. Please log in again.');
            } else {
                setError('Could not create a new board. Please try again later.');
            }

            toast({
                title: 'Error creating board',
                description: axiosError.message || 'Could not create a new board',
                variant: 'destructive',
            });
        } finally {
            setIsCreatingBoard(false);
        }
    };

    // Handle retry on authentication error
    const handleRetry = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // First check auth status
            const status = await KanbanService.checkAuth();
            setAuthStatus(status);

            if (status.authenticated) {
                // Then fetch boards
                const apiData = await KanbanService.getBoards();
                setBoards(apiData);

                if (apiData.length > 0) {
                    setSelectedBoardId(apiData[0].id);
                }

                toast({
                    title: 'Success',
                    description: 'Kanban boards loaded successfully',
                });
            } else {
                setError('Authentication required. Please log in again.');
                toast({
                    title: 'Authentication Error',
                    description: 'You need to log in again to access your Kanban boards',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error retrying:', error);
            setError('Could not load your Kanban boards. Please try again later.');
            toast({
                title: 'Error',
                description: 'Failed to refresh. Please try again later.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={selectedBoardId ? `Kanban - ${boards.find(b => b.id === selectedBoardId)?.name || ''}` : 'Kanban Boards'} />

            <div className="flex flex-col h-full">
                {/* Auth status display */}
                {authStatus && !authStatus.authenticated && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Authentication Error</AlertTitle>
                        <AlertDescription>
                            You are not authenticated. Please log in again to access your Kanban boards.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Error display for other issues */}
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription className="flex items-center justify-between">
                            <span>{error}</span>
                            <Button size="sm" onClick={handleRetry} disabled={isLoading}>
                                <RefreshCcw className="h-4 w-4 mr-1" />
                                Retry
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

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
                                        <option key={board.id} value={board.id}>{board.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => setIsCreateBoardOpen(true)}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            New Board
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : boards.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                            <LayoutGrid className="h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium mb-2">No Kanban Boards</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                                You don't have any Kanban boards yet. Create one to get started.
                            </p>
                            <Button
                                onClick={() => setIsCreateBoardOpen(true)}
                                disabled={!authStatus?.authenticated}
                            >
                                <Plus size={16} className="mr-1" />
                                Create New Board
                            </Button>
                        </div>
                    ) : selectedBoardId ? (
                        <KanbanBoard boardId={selectedBoardId} />
                    ) : (
                        <div className="flex items-center justify-center h-64">
                            <p className="text-gray-500 dark:text-gray-400">Select a board to view</p>
                        </div>
                    )}
                </div>

                {/* Create Board Dialog */}
                <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Kanban Board</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="boardName">Board Name</Label>
                                <Input
                                    id="boardName"
                                    placeholder="Enter board name"
                                    value={newBoardName}
                                    onChange={(e) => setNewBoardName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="boardDescription">Description (optional)</Label>
                                <Textarea
                                    id="boardDescription"
                                    placeholder="Enter board description"
                                    value={newBoardDescription}
                                    onChange={(e) => setNewBoardDescription(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateBoardOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateBoard}
                                disabled={!newBoardName.trim() || isCreatingBoard}
                            >
                                {isCreatingBoard ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-1" />
                                ) : null}
                                Create Board
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
