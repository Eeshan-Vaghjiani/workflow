import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Clock, BookOpen, PlusCircle, CheckCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';

interface StudySession {
    id: string;
    title: string;
    description?: string;
    date: Date;
    startTime: string;
    endTime: string;
    completed: boolean;
}

interface StudyTask {
    id: string;
    title: string;
    completed: boolean;
}

interface StudyPlannerProps {
    userId: number;
}

const StudyPlanner: React.FC<StudyPlannerProps> = ({ userId }) => {
    const [activeTab, setActiveTab] = useState('upcoming');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [sessionTitle, setSessionTitle] = useState('');
    const [sessionDescription, setSessionDescription] = useState('');
    const [studySessions, setStudySessions] = useState<StudySession[]>([]);
    const [isAddingSession, setIsAddingSession] = useState(false);
    const [currentTask, setCurrentTask] = useState('');
    const [studyTasks, setStudyTasks] = useState<StudyTask[]>([]);
    const { toast } = useToast();

    // Load saved study sessions and tasks
    useEffect(() => {
        // Load from localStorage for now (would be API in production)
        const savedSessions = localStorage.getItem(`studySessions-${userId}`);
        const savedTasks = localStorage.getItem(`studyTasks-${userId}`);

        if (savedSessions) {
            const parsedSessions = JSON.parse(savedSessions);
            // Convert string dates back to Date objects
            setStudySessions(parsedSessions.map((session: any) => ({
                ...session,
                date: new Date(session.date)
            })));
        }

        if (savedTasks) {
            setStudyTasks(JSON.parse(savedTasks));
        }
    }, [userId]);

    // Save study sessions and tasks
    useEffect(() => {
        localStorage.setItem(`studySessions-${userId}`, JSON.stringify(studySessions));
        localStorage.setItem(`studyTasks-${userId}`, JSON.stringify(studyTasks));
    }, [studySessions, studyTasks, userId]);

    const handleAddSession = () => {
        if (!sessionTitle) {
            toast({
                title: "Error",
                description: "Please enter a session title",
                variant: "destructive"
            });
            return;
        }

        const newSession: StudySession = {
            id: Date.now().toString(),
            title: sessionTitle,
            description: sessionDescription,
            date: selectedDate,
            startTime,
            endTime,
            completed: false
        };

        setStudySessions([...studySessions, newSession]);
        setSessionTitle('');
        setSessionDescription('');
        setIsAddingSession(false);

        toast({
            title: "Success",
            description: "Study session added to your schedule",
        });
    };

    const handleAddTask = () => {
        if (!currentTask.trim()) return;

        const newTask: StudyTask = {
            id: Date.now().toString(),
            title: currentTask,
            completed: false
        };

        setStudyTasks([...studyTasks, newTask]);
        setCurrentTask('');
    };

    const toggleTaskCompletion = (taskId: string) => {
        setStudyTasks(prevTasks =>
            prevTasks.map(task =>
                task.id === taskId ? { ...task, completed: !task.completed } : task
            )
        );
    };

    const deleteTask = (taskId: string) => {
        setStudyTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    };

    const toggleSessionCompletion = (sessionId: string) => {
        setStudySessions(prevSessions =>
            prevSessions.map(session =>
                session.id === sessionId ? { ...session, completed: !session.completed } : session
            )
        );
    };

    const deleteSession = (sessionId: string) => {
        setStudySessions(prevSessions => prevSessions.filter(session => session.id !== sessionId));
    };

    const upcomingSessions = studySessions.filter(
        session => !session.completed && new Date(session.date) >= new Date().setHours(0, 0, 0, 0)
    ).sort((a, b) => a.date.getTime() - b.date.getTime());

    const completedSessions = studySessions.filter(
        session => session.completed
    ).sort((a, b) => b.date.getTime() - a.date.getTime());

    const activeTasks = studyTasks.filter(task => !task.completed);
    const completedTasks = studyTasks.filter(task => task.completed);

    return (
        <div className="w-full">
            <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="tasks">Study Tasks</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Upcoming Study Sessions</h2>
                        <Button onClick={() => setIsAddingSession(!isAddingSession)}>
                            {isAddingSession ? 'Cancel' : 'Add Session'}
                        </Button>
                    </div>

                    {isAddingSession && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Add New Study Session</CardTitle>
                                <CardDescription>Schedule a focused study session</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="session-title">Session Title</Label>
                                    <Input
                                        id="session-title"
                                        placeholder="E.g., Math Review"
                                        value={sessionTitle}
                                        onChange={(e) => setSessionTitle(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="session-description">Description (Optional)</Label>
                                    <Textarea
                                        id="session-description"
                                        placeholder="What will you study?"
                                        value={sessionDescription}
                                        onChange={(e) => setSessionDescription(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start text-left font-normal"
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={selectedDate}
                                                    onSelect={(date) => date && setSelectedDate(date)}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Start Time</Label>
                                        <Input
                                            type="time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>End Time</Label>
                                        <Input
                                            type="time"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleAddSession} className="w-full">Add Study Session</Button>
                            </CardFooter>
                        </Card>
                    )}

                    {upcomingSessions.length > 0 ? (
                        <div className="grid gap-4">
                            {upcomingSessions.map((session) => (
                                <Card key={session.id} className="relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-1 h-full bg-blue-500`} />
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle>{session.title}</CardTitle>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => toggleSessionCompletion(session.id)}
                                                >
                                                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteSession(session.id)}
                                                >
                                                    <Trash2 className="h-5 w-5 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardDescription>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <CalendarIcon className="h-4 w-4" />
                                                <span>{format(session.date, 'EEEE, MMMM d, yyyy')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                                <Clock className="h-4 w-4" />
                                                <span>{session.startTime} - {session.endTime}</span>
                                            </div>
                                        </CardDescription>
                                    </CardHeader>
                                    {session.description && (
                                        <CardContent>
                                            <p className="text-sm">{session.description}</p>
                                        </CardContent>
                                    )}
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-12 border border-dashed rounded-md">
                            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">No Upcoming Sessions</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Plan your study sessions to stay on track with your learning goals.
                            </p>
                            <Button className="mt-4" onClick={() => setIsAddingSession(true)}>
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Add Your First Session
                            </Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="completed">
                    {completedSessions.length > 0 ? (
                        <ScrollArea className="h-[600px] rounded-md">
                            <div className="grid gap-4 p-4">
                                {completedSessions.map((session) => (
                                    <Card key={session.id} className="relative overflow-hidden">
                                        <div className={`absolute top-0 left-0 w-1 h-full bg-green-500`} />
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="flex items-center">
                                                        {session.title}
                                                        <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                                            Completed
                                                        </Badge>
                                                    </CardTitle>
                                                    <CardDescription>
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <CalendarIcon className="h-4 w-4" />
                                                            <span>{format(session.date, 'EEEE, MMMM d, yyyy')}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                                            <Clock className="h-4 w-4" />
                                                            <span>{session.startTime} - {session.endTime}</span>
                                                        </div>
                                                    </CardDescription>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteSession(session.id)}
                                                >
                                                    <Trash2 className="h-5 w-5 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        {session.description && (
                                            <CardContent>
                                                <p className="text-sm">{session.description}</p>
                                            </CardContent>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="text-center p-12 border border-dashed rounded-md">
                            <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">No Completed Sessions Yet</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Complete your study sessions to see them here.
                            </p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="tasks">
                    <div className="space-y-4">
                        <div className="flex items-end gap-2">
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="task">Add Study Task</Label>
                                <Input
                                    id="task"
                                    placeholder="Enter a task..."
                                    value={currentTask}
                                    onChange={(e) => setCurrentTask(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                />
                            </div>
                            <Button onClick={handleAddTask}>Add</Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="font-medium mb-2">Active Tasks</h3>
                                {activeTasks.length > 0 ? (
                                    <div className="space-y-2">
                                        {activeTasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className="flex items-center justify-between p-3 bg-background border rounded-md"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => toggleTaskCompletion(task.id)}
                                                        className="rounded-full border border-muted-foreground/20 size-5 flex items-center justify-center hover:bg-muted-foreground/5"
                                                    />
                                                    <span>{task.title}</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteTask(task.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No active tasks</p>
                                )}
                            </div>

                            {completedTasks.length > 0 && (
                                <div>
                                    <h3 className="font-medium mb-2">Completed Tasks</h3>
                                    <div className="space-y-2">
                                        {completedTasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className="flex items-center justify-between p-3 bg-muted/50 border rounded-md"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => toggleTaskCompletion(task.id)}
                                                        className="rounded-full bg-green-500 text-white size-5 flex items-center justify-center hover:bg-green-600"
                                                    >
                                                        <CheckCircle className="h-3 w-3" />
                                                    </button>
                                                    <span className="line-through text-muted-foreground">{task.title}</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteTask(task.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default StudyPlanner;
