import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, CheckCircle2, Coffee, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

// Notification sound
const NOTIFICATION_SOUND = '/sounds/notification.mp3';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

interface PomodoroSettings {
    focusMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    longBreakInterval: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    notifications: boolean;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    longBreakInterval: 4,
    autoStartBreaks: true,
    autoStartPomodoros: true,
    notifications: true
};

interface PomodoroTimerProps {
    userId?: number;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ userId }) => {
    // Timer state
    const [mode, setMode] = useState<TimerMode>('focus');
    const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_SETTINGS.focusMinutes * 60);
    const [isActive, setIsActive] = useState<boolean>(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [completedPomodoros, setCompletedPomodoros] = useState<number>(0);
    const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
    const timerRef = useRef<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { toast } = useToast();

    // Load saved settings from localStorage
    useEffect(() => {
        const savedSettings = localStorage.getItem(`pomodoroSettings-${userId || 'default'}`);
        const savedPomodoros = localStorage.getItem(`completedPomodoros-${userId || 'default'}`);

        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }

        if (savedPomodoros) {
            setCompletedPomodoros(parseInt(savedPomodoros, 10));
        }

        // Initialize audio
        audioRef.current = new Audio(NOTIFICATION_SOUND);

        return () => {
            // Cleanup timer on unmount
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [userId]);

    // Save settings to localStorage
    useEffect(() => {
        localStorage.setItem(`pomodoroSettings-${userId || 'default'}`, JSON.stringify(settings));
    }, [settings, userId]);

    // Save completed pomodoros to localStorage
    useEffect(() => {
        localStorage.setItem(`completedPomodoros-${userId || 'default'}`, completedPomodoros.toString());
    }, [completedPomodoros, userId]);

    // Update timeLeft when mode or settings change
    useEffect(() => {
        switch (mode) {
            case 'focus':
                setTimeLeft(settings.focusMinutes * 60);
                break;
            case 'shortBreak':
                setTimeLeft(settings.shortBreakMinutes * 60);
                break;
            case 'longBreak':
                setTimeLeft(settings.longBreakMinutes * 60);
                break;
        }
    }, [mode, settings]);

    // Timer logic
    useEffect(() => {
        if (isActive) {
            timerRef.current = window.setInterval(() => {
                setTimeLeft(prevTime => {
                    if (prevTime <= 1) {
                        clearInterval(timerRef.current!);
                        handleTimerComplete();
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isActive]);

    // Handle timer completion
    const handleTimerComplete = () => {
        // Play notification sound if enabled
        if (settings.notifications && audioRef.current) {
            audioRef.current.play().catch(e => console.error('Error playing notification sound:', e));
        }

        // Show notification
        const modeMessages = {
            focus: "Focus session complete! Time for a break.",
            shortBreak: "Break complete! Ready to focus again?",
            longBreak: "Long break complete! Ready for a new focus session?"
        };

        toast({
            title: "Timer Complete",
            description: modeMessages[mode],
        });

        // Handle automatic transitions
        if (mode === 'focus') {
            // Increment completed pomodoros count
            const newCount = completedPomodoros + 1;
            setCompletedPomodoros(newCount);

            // Determine if we need a long break
            const isLongBreakDue = newCount % settings.longBreakInterval === 0;
            const nextMode = isLongBreakDue ? 'longBreak' : 'shortBreak';

            setMode(nextMode);

            // Auto-start break if enabled
            setIsActive(settings.autoStartBreaks);
        } else {
            // If we're finishing a break, go back to focus mode
            setMode('focus');

            // Auto-start pomodoro if enabled
            setIsActive(settings.autoStartPomodoros);
        }
    };

    // Format time as MM:SS
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Progress calculation
    const calculateProgress = (): number => {
        let totalSeconds;
        switch (mode) {
            case 'focus':
                totalSeconds = settings.focusMinutes * 60;
                break;
            case 'shortBreak':
                totalSeconds = settings.shortBreakMinutes * 60;
                break;
            case 'longBreak':
                totalSeconds = settings.longBreakMinutes * 60;
                break;
        }

        const percentage = 100 - (timeLeft / totalSeconds) * 100;
        return Math.max(0, Math.min(100, percentage));
    };

    // Get theme color based on current mode
    const getModeColor = (): string => {
        switch (mode) {
            case 'focus':
                return 'text-red-500 dark:text-red-400';
            case 'shortBreak':
                return 'text-green-500 dark:text-green-400';
            case 'longBreak':
                return 'text-blue-500 dark:text-blue-400';
        }
    };

    // Get progress color based on current mode
    const getProgressColor = (): string => {
        switch (mode) {
            case 'focus':
                return 'bg-red-500 dark:bg-red-600';
            case 'shortBreak':
                return 'bg-green-500 dark:bg-green-600';
            case 'longBreak':
                return 'bg-blue-500 dark:bg-blue-600';
        }
    };

    // Timer controls
    const startTimer = () => setIsActive(true);
    const pauseTimer = () => setIsActive(false);
    const resetTimer = () => {
        setIsActive(false);
        switch (mode) {
            case 'focus':
                setTimeLeft(settings.focusMinutes * 60);
                break;
            case 'shortBreak':
                setTimeLeft(settings.shortBreakMinutes * 60);
                break;
            case 'longBreak':
                setTimeLeft(settings.longBreakMinutes * 60);
                break;
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                            Pomodoro Timer
                            <Badge className="ml-2" variant="outline">
                                {completedPomodoros} {completedPomodoros === 1 ? 'Session' : 'Sessions'}
                            </Badge>
                        </CardTitle>
                    </div>
                    <CardDescription>
                        Stay focused with timed work sessions
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Tabs value={mode} onValueChange={(value) => setMode(value as TimerMode)} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="focus" className="flex items-center gap-1">
                                <BrainCircuit className="h-4 w-4" />
                                Focus
                            </TabsTrigger>
                            <TabsTrigger value="shortBreak" className="flex items-center gap-1">
                                <Coffee className="h-4 w-4" />
                                Short Break
                            </TabsTrigger>
                            <TabsTrigger value="longBreak" className="flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4" />
                                Long Break
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex flex-col items-center space-y-6">
                        <div className="relative flex items-center justify-center w-48 h-48 rounded-full border-4 border-muted">
                            <Progress
                                value={calculateProgress()}
                                className={cn(
                                    "absolute top-0 left-0 w-full h-full rounded-full [&>div]:h-full [&>div]:transition-all",
                                    getProgressColor()
                                )}
                            />
                            <div className="absolute inset-3 bg-background dark:bg-background rounded-full flex items-center justify-center">
                                <span className={cn("text-5xl font-bold", getModeColor())}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            {!isActive ? (
                                <Button
                                    onClick={startTimer}
                                    className="flex gap-2 items-center"
                                    size="lg"
                                >
                                    <Play className="h-5 w-5" />
                                    Start
                                </Button>
                            ) : (
                                <Button
                                    onClick={pauseTimer}
                                    className="flex gap-2 items-center"
                                    variant="outline"
                                    size="lg"
                                >
                                    <Pause className="h-5 w-5" />
                                    Pause
                                </Button>
                            )}

                            <Button
                                onClick={resetTimer}
                                variant="outline"
                                size="icon"
                            >
                                <RotateCcw className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col">
                    <div className="w-full pt-4 border-t">
                        <div className="flex justify-between">
                            <p className="text-sm font-medium">Settings</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            >
                                {isSettingsOpen ? 'Hide' : 'Show'}
                            </Button>
                        </div>

                        {isSettingsOpen && (
                            <div className="mt-4 space-y-4">
                                <div className="space-y-2">
                                    <Label>Focus Duration: {settings.focusMinutes} minutes</Label>
                                    <Slider
                                        value={[settings.focusMinutes]}
                                        min={5}
                                        max={60}
                                        step={5}
                                        onValueChange={(value) => setSettings({ ...settings, focusMinutes: value[0] })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Short Break: {settings.shortBreakMinutes} minutes</Label>
                                    <Slider
                                        value={[settings.shortBreakMinutes]}
                                        min={1}
                                        max={15}
                                        step={1}
                                        onValueChange={(value) => setSettings({ ...settings, shortBreakMinutes: value[0] })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Long Break: {settings.longBreakMinutes} minutes</Label>
                                    <Slider
                                        value={[settings.longBreakMinutes]}
                                        min={5}
                                        max={30}
                                        step={5}
                                        onValueChange={(value) => setSettings({ ...settings, longBreakMinutes: value[0] })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Long Break After: {settings.longBreakInterval} sessions</Label>
                                    <Slider
                                        value={[settings.longBreakInterval]}
                                        min={2}
                                        max={8}
                                        step={1}
                                        onValueChange={(value) => setSettings({ ...settings, longBreakInterval: value[0] })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="auto-start-breaks">Auto-start breaks</Label>
                                    <Switch
                                        id="auto-start-breaks"
                                        checked={settings.autoStartBreaks}
                                        onCheckedChange={(checked) => setSettings({ ...settings, autoStartBreaks: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="auto-start-pomodoros">Auto-start focus sessions</Label>
                                    <Switch
                                        id="auto-start-pomodoros"
                                        checked={settings.autoStartPomodoros}
                                        onCheckedChange={(checked) => setSettings({ ...settings, autoStartPomodoros: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="notifications">Sound notifications</Label>
                                    <Switch
                                        id="notifications"
                                        checked={settings.notifications}
                                        onCheckedChange={(checked) => setSettings({ ...settings, notifications: checked })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default PomodoroTimer;
