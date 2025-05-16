import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface User {
    id: number;
    name: string;
    avatar?: string;
    role?: string;
}

interface Message {
    id: number;
    content: string;
    sender: User;
    timestamp: string;
    date: string;
    is_system_message: boolean;
}

interface Group {
    id: number;
    name: string;
    description?: string;
    avatar?: string;
    members: User[];
    unreadCount?: number;
    lastMessage?: {
        content: string;
        timestamp: string;
        date: string;
        sender?: string;
    };
    memberCount?: number;
}

interface GroupChatsProps {
    currentUserId: number;
}

export default function GroupChats({ currentUserId }: GroupChatsProps) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch user's groups
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get('/chat/groups');
                setGroups(response.data);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching groups:', error);
                setIsLoading(false);
                toast({
                    title: 'Error',
                    description: 'Failed to load groups. Please try again.',
                    variant: 'destructive',
                });
            }
        };

        fetchGroups();
    }, [toast]);

    // Fetch messages for the selected group
    useEffect(() => {
        if (selectedGroup) {
            const fetchMessages = async () => {
                try {
                    setLoadingMessages(true);
                    const response = await axios.get(`/chat/group/${selectedGroup.id}`);

                    setMessages(response.data.messages || []);
                    // Update group info with the latest data
                    setSelectedGroup({
                        ...selectedGroup,
                        ...response.data,
                    });
                    setLoadingMessages(false);
                } catch (error) {
                    console.error('Error fetching group messages:', error);
                    setLoadingMessages(false);
                    toast({
                        title: 'Error',
                        description: 'Failed to load group messages. Please try again.',
                        variant: 'destructive',
                    });
                }
            };

            fetchMessages();

            // Set up Pusher channel for real-time updates
            const channel = window.Echo.join(`group.${selectedGroup.id}`);

            channel.listen('.group.message', (data: Message) => {
                // Only add the message if it's not already in our list
                if (!messages.some(msg => msg.id === data.id)) {
                    setMessages(prevMessages => [...prevMessages, data]);
                }
            });

            // Handle presence events
            channel.here((users: User[]) => {
                console.log('Users currently in the channel:', users);
            });

            channel.joining((user: User) => {
                console.log('User joined:', user);
            });

            channel.leaving((user: User) => {
                console.log('User left:', user);
            });

            return () => {
                channel.stopListening('.group.message');
                // Clean up any additional listeners
                window.Echo.leave(`group.${selectedGroup.id}`);
            };
        }
    }, [selectedGroup, messages, toast]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, selectedGroup, toast]);

    const handleSelectGroup = (group: Group) => {
        setSelectedGroup(group);
        setSearchQuery('');
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedGroup || isSending) return;

        try {
            setIsSending(true);
            const response = await axios.post(`/chat/group/${selectedGroup.id}`, {
                message: newMessage,
            });

            // Add the new message to the list
            setMessages(prevMessages => [...prevMessages, response.data]);
            setNewMessage('');

            // Update the group in the list with the last message
            setGroups(prevGroups =>
                prevGroups.map(group =>
                    group.id === selectedGroup.id
                        ? {
                            ...group,
                            lastMessage: {
                                content: newMessage,
                                timestamp: response.data.timestamp,
                                date: response.data.date,
                                sender: 'You',
                            },
                        }
                        : group
                )
            );

            setIsSending(false);
        } catch (error) {
            console.error('Error sending message:', error);
            setIsSending(false);
            toast({
                title: 'Error',
                description: 'Failed to send message. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const filteredGroups = searchQuery
        ? groups.filter(group =>
            group.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : groups;

    return (
        <div className="flex h-full flex-col md:flex-row">
            {/* Sidebar - Group List */}
            <div className="h-1/3 w-full border-b border-r border-gray-200 md:h-full md:w-80 md:flex-shrink-0 dark:border-gray-700">
                <div className="flex h-full flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <Input
                                placeholder="Search groups..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="h-5 w-5 animate-spin rounded-full border-t-2 border-gray-500"></div>
                            </div>
                        ) : filteredGroups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                <p>You're not in any groups yet</p>
                                <p>Join or create a group to start chatting</p>
                            </div>
                        ) : (
                            <div className="p-2 space-y-1">
                                {filteredGroups.map((group) => (
                                    <button
                                        key={group.id}
                                        className={`flex w-full items-center gap-2 rounded-md p-2 ${selectedGroup?.id === group.id
                                            ? 'bg-gray-100 dark:bg-gray-800'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                        onClick={() => handleSelectGroup(group)}
                                    >
                                        <div className="relative">
                                            {group.avatar ? (
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={group.avatar} alt={group.name} />
                                                    <AvatarFallback>
                                                        {group.name.substring(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            ) : (
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-500 dark:bg-blue-900 dark:text-blue-300">
                                                    <Users size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-1 flex-col items-start">
                                            <div className="flex w-full justify-between">
                                                <span className="font-medium">{group.name}</span>
                                                {group.lastMessage && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {group.lastMessage.timestamp}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex w-full justify-between">
                                                {group.lastMessage && (
                                                    <span className="truncate text-sm text-gray-500 dark:text-gray-400">
                                                        {group.lastMessage.sender ? `${group.lastMessage.sender}: ` : ''}
                                                        {group.lastMessage.content}
                                                    </span>
                                                )}
                                                {(group.unreadCount || 0) > 0 && (
                                                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                                                        {group.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </div>

            {/* Main group chat area */}
            <div className="flex-1 overflow-hidden">
                {selectedGroup ? (
                    <div className="flex h-full flex-col">
                        {/* Group chat header */}
                        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                            <div className="flex items-center">
                                {selectedGroup.avatar ? (
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={selectedGroup.avatar} alt={selectedGroup.name} />
                                        <AvatarFallback>{selectedGroup.name.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-500 dark:bg-blue-900 dark:text-blue-300">
                                        <Users size={20} />
                                    </div>
                                )}
                                <div className="ml-3">
                                    <h3 className="font-semibold">{selectedGroup.name}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {selectedGroup.members?.length || selectedGroup.memberCount || 0} members
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Chat messages */}
                        <ScrollArea className="flex-1 p-4">
                            {loadingMessages ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="h-5 w-5 animate-spin rounded-full border-t-2 border-gray-500"></div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center text-sm text-gray-500 dark:text-gray-400">
                                    <p>No messages yet</p>
                                    <p>Be the first to send a message!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.is_system_message
                                                ? 'justify-center'
                                                : message.sender.id === currentUserId
                                                    ? 'justify-end'
                                                    : 'justify-start'
                                                }`}
                                        >
                                            {message.is_system_message ? (
                                                <div className="my-2 rounded-md bg-gray-100 px-3 py-1 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                                    {message.content}
                                                </div>
                                            ) : message.sender.id !== currentUserId && (
                                                <Avatar className="mr-2 h-8 w-8 self-end">
                                                    <AvatarImage src={message.sender.avatar || ''} alt={message.sender.name} />
                                                    <AvatarFallback>{message.sender.name.substring(0, 2)}</AvatarFallback>
                                                </Avatar>
                                            )}

                                            {!message.is_system_message && (
                                                <div
                                                    className={`max-w-xs rounded-lg px-4 py-2 ${message.sender.id === currentUserId
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                                                        }`}
                                                >
                                                    {message.sender.id !== currentUserId && (
                                                        <p className="mb-1 text-xs font-medium">
                                                            {message.sender.name}
                                                        </p>
                                                    )}
                                                    <p>{message.content}</p>
                                                    <span className={`mt-1 block text-xs ${message.sender.id === currentUserId
                                                        ? 'text-blue-100'
                                                        : 'text-gray-500 dark:text-gray-400'
                                                        }`}>
                                                        {message.timestamp}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </ScrollArea>

                        {/* Message input */}
                        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="Type your message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    disabled={isSending}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={isSending || !newMessage.trim()}
                                >
                                    {isSending ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    ) : 'Send'}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                        <div className="mb-4 rounded-full bg-gray-100 p-6 dark:bg-gray-800">
                            <Users className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold">Select a group</h3>
                        <p className="mt-2 max-w-md text-gray-500 dark:text-gray-400">
                            Choose a group from the list to start chatting
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
