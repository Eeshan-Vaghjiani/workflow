import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Play, Pause, RotateCcw, Coffee, BookOpen, Bell, BellOff } from 'lucide-react';
import axios from 'axios';

interface PomodoroTimerProps {
    userId: number;
}

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

interface TimerSettings {
    focusMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    longBreakInterval: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    notifications: boolean;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ userId }) => {
    // Default settings
    const defaultSettings: TimerSettings = {
        focusMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        longBreakInterval: 4,
        autoStartBreaks: true,
        autoStartPomodoros: false,
        notifications: true
    };

    // State variables
    const [settings, setSettings] = useState<TimerSettings>(defaultSettings);
    const [mode, setMode] = useState<TimerMode>('focus');
    const [timeLeft, setTimeLeft] = useState(settings.focusMinutes * 60);
    const [isActive, setIsActive] = useState(false);
    const [completedPomodoros, setCompletedPomodoros] = useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const timerRef = useRef<number | null>(null);
    const { toast } = useToast();

    // Load user settings from server on mount
    useEffect(() => {
        if (!userId) return;

        // Try to load user's settings from server
        const loadUserSettings = async () => {
            try {
                axios.defaults.headers.common['X-CSRF-TOKEN'] = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
                axios.defaults.withCredentials = true;

                const response = await axios.get(`/api/web/pomodoro/settings/${userId}`);
                if (response.data && response.data.settings) {
                    setSettings({
                        focusMinutes: response.data.settings.focus_minutes || defaultSettings.focusMinutes,
                        shortBreakMinutes: response.data.settings.short_break_minutes || defaultSettings.shortBreakMinutes,
                        longBreakMinutes: response.data.settings.long_break_minutes || defaultSettings.longBreakMinutes,
                        longBreakInterval: response.data.settings.long_break_interval || defaultSettings.longBreakInterval,
                        autoStartBreaks: response.data.settings.auto_start_breaks ?? defaultSettings.autoStartBreaks,
                        autoStartPomodoros: response.data.settings.auto_start_pomodoros ?? defaultSettings.autoStartPomodoros,
                        notifications: response.data.settings.notifications_enabled ?? defaultSettings.notifications
                    });
                }
            } catch (error) {
                console.error('Error loading pomodoro settings:', error);
            }
        };

        loadUserSettings();
    }, [userId]);

    // Initialize the timer with the correct mode duration
    useEffect(() => {
        if (mode === 'focus') {
            setTimeLeft(settings.focusMinutes * 60);
        } else if (mode === 'shortBreak') {
            setTimeLeft(settings.shortBreakMinutes * 60);
        } else {
            setTimeLeft(settings.longBreakMinutes * 60);
        }
    }, [mode, settings]);

    // Timer countdown logic
    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = window.setTimeout(() => {
                setTimeLeft(prevTime => prevTime - 1);
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            handleTimerComplete();
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isActive, timeLeft]);

    // Handle timer completion
    const handleTimerComplete = () => {
        playAlarmSound();
        showNotification();

        if (mode === 'focus') {
            const newCompletedCount = completedPomodoros + 1;
            setCompletedPomodoros(newCompletedCount);

            // Save completed pomodoro session to the database
            savePomodoroSession('focus', settings.focusMinutes);

            if (newCompletedCount % settings.longBreakInterval === 0) {
                setMode('longBreak');
                toast({
                    title: "Time for a long break!",
                    description: `You've completed ${newCompletedCount} pomodoros. Take ${settings.longBreakMinutes} minutes to recharge.`,
                });
            } else {
                setMode('shortBreak');
                toast({
                    title: "Time for a short break!",
                    description: `You've completed a pomodoro. Take ${settings.shortBreakMinutes} minutes to refresh.`,
                });
            }

            if (settings.autoStartBreaks) {
                setIsActive(true);
            } else {
                setIsActive(false);
            }
        } else {
            // Save break session to the database
            if (mode === 'shortBreak') {
                savePomodoroSession('short_break', settings.shortBreakMinutes);
            } else {
                savePomodoroSession('long_break', settings.longBreakMinutes);
            }

            setMode('focus');
            toast({
                title: "Break complete!",
                description: "Time to focus again.",
            });

            if (settings.autoStartPomodoros) {
                setIsActive(true);
            } else {
                setIsActive(false);
            }
        }
    };

    // New function to save pomodoro session to the database
    const savePomodoroSession = (type: string, durationMinutes: number) => {
        // Setup authentication headers
        axios.defaults.headers.common['X-CSRF-TOKEN'] = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        axios.defaults.withCredentials = true;

        console.log('Saving pomodoro session:', { type, durationMinutes, userId });

        axios.post('/api/web/pomodoro/sessions', {
            type: type,
            duration_minutes: durationMinutes,
            task_id: null // Can be updated if you want to link pomodoro to specific tasks
        })
            .then(response => {
                console.log('Pomodoro session saved:', response.data);
            })
            .catch(error => {
                console.error('Error saving pomodoro session:', error);
                console.error('Error details:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    headers: error.response?.headers
                });
                toast({
                    title: "Error",
                    description: "Failed to save your pomodoro session",
                    variant: "destructive"
                });
            });
    };

    // Notification and sound helpers
    const playAlarmSound = () => {
        if (settings.notifications) {
            try {
                const audio = new Audio('/sounds/bell.mp3');
                audio.play();
            } catch (error) {
                console.error('Failed to play sound:', error);
            }
        }
    };

    const showNotification = () => {
        if (settings.notifications && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification('Pomodoro Timer', {
                    body: mode === 'focus'
                        ? 'Focus session complete. Time for a break!'
                        : 'Break is over. Time to focus!',
                    icon: '/favicon.ico'
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }
    };

    // Timer controls
    const startTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        if (mode === 'focus') {
            setTimeLeft(settings.focusMinutes * 60);
        } else if (mode === 'shortBreak') {
            setTimeLeft(settings.shortBreakMinutes * 60);
        } else {
            setTimeLeft(settings.longBreakMinutes * 60);
        }
    };

    // Format time display
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Add a new function to save settings to the database
    const saveSettings = async () => {
        try {
            // Setup authentication headers
            axios.defaults.headers.common['X-CSRF-TOKEN'] = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            axios.defaults.withCredentials = true;

            await axios.post('/api/web/pomodoro/settings', {
                focus_minutes: settings.focusMinutes,
                short_break_minutes: settings.shortBreakMinutes,
                long_break_minutes: settings.longBreakMinutes,
                long_break_interval: settings.longBreakInterval,
                auto_start_breaks: settings.autoStartBreaks,
                auto_start_pomodoros: settings.autoStartPomodoros,
                notifications_enabled: settings.notifications
            });

            toast({
                title: "Settings Saved",
                description: "Your pomodoro settings have been saved successfully",
            });
        } catch (error) {
            console.error('Error saving pomodoro settings:', error);
            toast({
                title: "Error",
                description: "Failed to save your pomodoro settings",
                variant: "destructive"
            });
        }
    };

    // Helper function to update settings with save
    const updateSettings = (newSettings: Partial<TimerSettings>) => {
        const updatedSettings = { ...settings, ...newSettings };
        setSettings(updatedSettings);
        // Debounce the save to reduce API calls
        clearTimeout(timerRef.current as unknown as number);
        timerRef.current = window.setTimeout(() => {
            saveSettings();
        }, 1000) as unknown as number;
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <Card className="overflow-hidden">
                <CardHeader className={`${mode === 'focus' ? 'bg-red-500' :
                    mode === 'shortBreak' ? 'bg-green-500' : 'bg-blue-500'
                    } text-white`}>
                    <CardTitle className="text-center text-2xl">Pomodoro Timer</CardTitle>
                    <CardDescription className="text-center text-white">
                        {mode === 'focus' ? 'Focus Session' :
                            mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-6">
                    <div className="text-center mb-6">
                        <div className="text-6xl font-bold mb-4">{formatTime(timeLeft)}</div>
                        <div className="space-x-2 mb-4">
                            <Button
                                variant={mode === 'focus' ? 'default' : 'outline'}
                                onClick={() => setMode('focus')}
                                className="rounded-full"
                            >
                                <BookOpen className="mr-2 h-4 w-4" />
                                Focus
                            </Button>
                            <Button
                                variant={mode === 'shortBreak' ? 'default' : 'outline'}
                                onClick={() => setMode('shortBreak')}
                                className="rounded-full"
                            >
                                <Coffee className="mr-2 h-4 w-4" />
                                Short Break
                            </Button>
                            <Button
                                variant={mode === 'longBreak' ? 'default' : 'outline'}
                                onClick={() => setMode('longBreak')}
                                className="rounded-full"
                            >
                                <Coffee className="mr-2 h-4 w-4" />
                                Long Break
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-center space-x-4">
                        <Button onClick={startTimer} size="lg" className="w-24">
                            {isActive ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                            {isActive ? 'Pause' : 'Start'}
                        </Button>
                        <Button onClick={resetTimer} variant="outline" size="lg" className="w-24">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset
                        </Button>
                    </div>
                </CardContent>

                <CardFooter className="bg-muted/50 px-6 py-4 flex justify-between items-center">
                    <div>
                        <Badge variant="outline" className="mr-2">
                            {completedPomodoros} Completed
                        </Badge>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateSettings({
                                notifications: !settings.notifications
                            })}
                        >
                            {settings.notifications ?
                                <Bell className="h-4 w-4" /> :
                                <BellOff className="h-4 w-4" />
                            }
                        </Button>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    >
                        {isSettingsOpen ? 'Hide Settings' : 'Settings'}
                    </Button>
                </CardFooter>
            </Card>

            {isSettingsOpen && (
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Timer Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Focus Duration: {settings.focusMinutes} min</Label>
                            </div>
                            <Slider
                                value={[settings.focusMinutes]}
                                min={5}
                                max={60}
                                step={5}
                                onValueChange={(value) => updateSettings({ focusMinutes: value[0] })}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Short Break: {settings.shortBreakMinutes} min</Label>
                            </div>
                            <Slider
                                value={[settings.shortBreakMinutes]}
                                min={1}
                                max={15}
                                step={1}
                                onValueChange={(value) => updateSettings({ shortBreakMinutes: value[0] })}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Long Break: {settings.longBreakMinutes} min</Label>
                            </div>
                            <Slider
                                value={[settings.longBreakMinutes]}
                                min={5}
                                max={30}
                                step={5}
                                onValueChange={(value) => updateSettings({ longBreakMinutes: value[0] })}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Long Break After: {settings.longBreakInterval} pomodoros</Label>
                            </div>
                            <Slider
                                value={[settings.longBreakInterval]}
                                min={2}
                                max={6}
                                step={1}
                                onValueChange={(value) => updateSettings({ longBreakInterval: value[0] })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="auto-break">Auto-start Breaks</Label>
                            <Switch
                                id="auto-break"
                                checked={settings.autoStartBreaks}
                                onCheckedChange={(checked: boolean) => updateSettings({ autoStartBreaks: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="auto-pomodoro">Auto-start Pomodoros</Label>
                            <Switch
                                id="auto-pomodoro"
                                checked={settings.autoStartPomodoros}
                                onCheckedChange={(checked: boolean) => updateSettings({ autoStartPomodoros: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="notifications">Enable Notifications</Label>
                            <Switch
                                id="notifications"
                                checked={settings.notifications}
                                onCheckedChange={(checked: boolean) => {
                                    if (checked && 'Notification' in window && Notification.permission !== 'granted') {
                                        Notification.requestPermission();
                                    }
                                    updateSettings({ notifications: checked });
                                }}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={saveSettings} className="ml-auto">
                            Save Settings
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
};

export default PomodoroTimer;
