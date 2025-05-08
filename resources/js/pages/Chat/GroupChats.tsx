import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, Users, X } from 'lucide-react';
import { useForm } from '@inertiajs/react';

interface User {
    id: number;
    name: string;
}

interface Group {
    id: number;
    name: string;
    description: string;
    member_count: number;
    unread_count: number;
    last_message?: {
        message: string;
        user: {
            name: string;
        };
        created_at: string;
    }
}

interface GroupMessage {
    id: number;
    group_id: number;
    user_id: number;
    message: string;
    created_at: string;
    user: {
        id: number;
        name: string;
    };
}

interface Props {
    currentUserId: number;
}

export default function GroupChats({ currentUserId }: Props) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [activeGroup, setActiveGroup] = useState<Group | null>(null);
    const [messages, setMessages] = useState<GroupMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [typingUsers, setTypingUsers] = useState<{[key: string]: string}>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const { data, setData, reset } = useForm({
        message: '',
    });

    // Load groups
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await axios.get('/api/groups');
                setGroups(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error loading groups:', error);
                setLoading(false);
            }
        };

        fetchGroups();
    }, []);

    // Load messages when active group changes
    useEffect(() => {
        if (!activeGroup) return;

        const fetchGroupMessages = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/api/groups/${activeGroup.id}/messages`);
                setMessages(response.data.data);
                
                // Mark messages as read
                axios.post(`/api/groups/${activeGroup.id}/read`);
                
                // Update unread count in groups list
                setGroups(prevGroups => 
                    prevGroups.map(group => 
                        group.id === activeGroup.id 
                            ? { ...group, unread_count: 0 } 
                            : group
                    )
                );
                
                setLoading(false);
                scrollToBottom();
            } catch (error) {
                console.error('Error loading group messages:', error);
                setLoading(false);
            }
        };

        fetchGroupMessages();

        // Join the presence channel when accessing a group
        if (window.Echo) {
            const channel = window.Echo.join(`group.${activeGroup.id}`);
            
            // Listen for new messages
            channel.listen('.group.message', (e: { message: GroupMessage }) => {
                setMessages(prev => [...prev, e.message]);
                scrollToBottom();
            });
            
            // Listen for typing indicators
            channel.listenForWhisper('typing', (e: { id: number, name: string }) => {
                if (e.id !== currentUserId) {
                    // Add user to typing users
                    setTypingUsers(prev => ({ ...prev, [e.id]: e.name }));
                    
                    // Remove after 3 seconds of inactivity
                    setTimeout(() => {
                        setTypingUsers(prev => {
                            const updated = { ...prev };
                            delete updated[e.id];
                            return updated;
                        });
                    }, 3000);
                }
            });
            
            // Handle users joining/leaving
            channel.here((users: User[]) => {
                console.log('Users currently in the group:', users);
            });
            
            channel.joining((user: User) => {
                console.log('User joined the group:', user);
            });
            
            channel.leaving((user: User) => {
                console.log('User left the group:', user);
                // Remove from typing users if they were typing
                setTypingUsers(prev => {
                    if (prev[user.id]) {
                        const updated = { ...prev };
                        delete updated[user.id];
                        return updated;
                    }
                    return prev;
                });
            });
        }

        return () => {
            if (window.Echo) {
                window.Echo.leave(`group.${activeGroup.id}`);
            }
        };
    }, [activeGroup, currentUserId]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeGroup || !data.message.trim() || sending) return;

        setSending(true);
        try {
            const response = await axios.post(`/api/groups/${activeGroup.id}/messages`, {
                message: data.message,
            });
            
            // The message is already added via the broadcast
            // But we'll add it here too in case the broadcast fails
            setMessages(prev => [...prev, response.data]);
            
            // Update the group list with the last message
            setGroups(prev => 
                prev.map(group => 
                    group.id === activeGroup.id 
                        ? { 
                            ...group, 
                            last_message: { 
                                message: data.message,
                                user: { name: 'You' },
                                created_at: new Date().toISOString() 
                            } 
                        } 
                        : group
                )
            );
            
            reset('message');
            scrollToBottom();
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData('message', e.target.value);
        
        // Send typing indicator through the channel
        if (activeGroup && window.Echo && e.target.value) {
            window.Echo.join(`group.${activeGroup.id}`)
                .whisper('typing', {
                    id: currentUserId,
                    name: 'You' // This would be better with current user's name
                });
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatGroupTimestamp = (timestamp?: string) => {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    return (
        <div className="flex h-[600px] border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            {/* Left sidebar - Groups */}
            <div className="w-1/3 border-r border-neutral-200 dark:border-neutral-700 bg-muted/30 dark:bg-neutral-900/40 flex flex-col">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                    <h3 className="font-medium">Group Chats</h3>
                </div>

                <div className="overflow-y-auto flex-1">
                    {loading && groups.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
                        </div>
                    ) : groups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-500 p-4 text-center">
                            <Users className="h-12 w-12 mb-2 opacity-30" />
                            <p>No groups available.</p>
                            <p className="text-sm">Join or create a group to start chatting.</p>
                        </div>
                    ) : (
                        groups.map((group) => (
                            <div
                                key={group.id}
                                className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition ${
                                    activeGroup?.id === group.id
                                        ? 'bg-neutral-100 dark:bg-neutral-800'
                                        : ''
                                }`}
                                onClick={() => setActiveGroup(group)}
                            >
                                <Avatar>
                                    <AvatarFallback className="bg-indigo-500 text-white">{group.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium truncate">{group.name}</span>
                                        {group.last_message && (
                                            <span className="text-xs text-neutral-500">
                                                {formatGroupTimestamp(group.last_message.created_at)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center">
                                        <p className="text-sm text-neutral-500 truncate flex-1">
                                            {group.last_message 
                                                ? `${group.last_message.user.name}: ${group.last_message.message}` 
                                                : `${group.member_count} members`}
                                        </p>
                                        {group.unread_count > 0 && (
                                            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                                                {group.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right side - Chat */}
            <div className="flex-1 flex flex-col bg-white dark:bg-neutral-800">
                {!activeGroup ? (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-500 p-4 text-center">
                        <Users className="h-16 w-16 mb-3 opacity-30" />
                        <h3 className="text-lg font-medium mb-1">Group Chats</h3>
                        <p>Select a group to start chatting</p>
                    </div>
                ) : (
                    <>
                        {/* Chat header */}
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback className="bg-indigo-500 text-white">{activeGroup.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-medium">{activeGroup.name}</h3>
                                    <p className="text-xs text-neutral-500">{activeGroup.member_count} members</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setActiveGroup(null)}
                                className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-neutral-500">
                                    No messages yet. Start the conversation!
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${
                                            message.user_id === currentUserId ? 'justify-end' : 'justify-start'
                                        }`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-lg p-3 ${
                                                message.user_id === currentUserId
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted'
                                            }`}
                                        >
                                            {message.user_id !== currentUserId && (
                                                <div className="text-sm font-medium mb-1">
                                                    {message.user.name}
                                                </div>
                                            )}
                                            <div className="break-words">{message.message}</div>
                                            <div className="text-xs mt-1 opacity-70">
                                                {formatTimestamp(message.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            {Object.keys(typingUsers).length > 0 && (
                                <div className="flex justify-start">
                                    <div className="bg-muted rounded-lg p-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-neutral-500">
                                                {Object.keys(typingUsers).length === 1 
                                                    ? `${Object.values(typingUsers)[0]} is typing...` 
                                                    : 'Several people are typing...'}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <div className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                <div className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                <div className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message input */}
                        <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-200 dark:border-neutral-700">
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    placeholder="Type your message..."
                                    value={data.message}
                                    onChange={handleInputChange}
                                    disabled={sending}
                                    className="flex-1"
                                />
                                <Button type="submit" disabled={sending || !data.message.trim()}>
                                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
} 