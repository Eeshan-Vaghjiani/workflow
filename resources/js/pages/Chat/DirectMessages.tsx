import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface User {
    id: number;
    name: string;
    avatar?: string;
    status?: string;
}

interface Message {
    id: number;
    content: string;
    timestamp: string;
    date: string;
    is_from_me: boolean;
    sender?: User;
}

interface Conversation {
    user: User;
    lastMessage: {
        content: string;
        timestamp: string;
        date: string;
        is_read: boolean;
        is_from_me: boolean;
    };
    unreadCount: number;
}

interface DirectMessagesProps {
    currentUserId: number;
}

export default function DirectMessages({ currentUserId }: DirectMessagesProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load conversations
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get('/chat/direct');
                setConversations(response.data.conversations);
                setUsers(response.data.users);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching conversations:', error);
                setIsLoading(false);
                toast({
                    title: 'Error',
                    description: 'Failed to load conversations. Please try again.',
                    variant: 'destructive',
                });
            }
        };

        fetchConversations();
    }, [toast]);

    // Load messages for selected user
    useEffect(() => {
        if (selectedUser) {
            const fetchMessages = async () => {
                try {
                    setIsLoadingMessages(true);
                    const response = await axios.get(`/chat/direct/${selectedUser.id}`);
                    setMessages(response.data.messages);
                    setIsLoadingMessages(false);

                    // Update conversation to mark as read
                    setConversations(prevConversations =>
                        prevConversations.map(convo =>
                            convo.user.id === selectedUser.id
                                ? { ...convo, unreadCount: 0 }
                                : convo
                        )
                    );
                } catch (error) {
                    console.error('Error fetching messages:', error);
                    setIsLoadingMessages(false);
                    toast({
                        title: 'Error',
                        description: 'Failed to load messages. Please try again.',
                        variant: 'destructive',
                    });
                }
            };

            fetchMessages();

            // Setup Pusher channel for real-time messaging
            const channel = window.Echo.private(`chat.${currentUserId}`);

            channel.listen('.message.new', (data: Message) => {
                if (data.sender && data.sender.id === selectedUser.id) {
                    setMessages(prevMessages => [...prevMessages, data]);

                    // Update the conversation list
                    setConversations(prevConversations =>
                        prevConversations.map(convo => {
                            if (convo.user.id === selectedUser.id) {
                                return {
                                    ...convo,
                                    lastMessage: {
                                        content: data.content,
                                        timestamp: data.timestamp,
                                        date: data.date,
                                        is_read: true,
                                        is_from_me: false,
                                    },
                                    unreadCount: 0, // Mark as read since we're in the conversation
                                };
                            }
                            return convo;
                        })
                    );
                } else if (data.sender) {
                    // Message from someone else, update their conversation unread count
                    setConversations(prevConversations =>
                        prevConversations.map(convo => {
                            if (convo.user.id === data.sender?.id) {
                                return {
                                    ...convo,
                                    lastMessage: {
                                        content: data.content,
                                        timestamp: data.timestamp,
                                        date: data.date,
                                        is_read: false,
                                        is_from_me: false,
                                    },
                                    unreadCount: convo.unreadCount + 1,
                                };
                            }
                            return convo;
                        })
                    );
                }
            });

            return () => {
                channel.stopListening('.message.new');
            };
        }
    }, [selectedUser, currentUserId, toast]);

    // Scroll to bottom whenever messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSelectUser = (user: User) => {
        setSelectedUser(user);
        setSearchQuery('');
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedUser || isSending) return;

        try {
            setIsSending(true);
            const response = await axios.post(`/chat/direct/${selectedUser.id}`, {
                message: newMessage,
            });

            // Add the new message to the list
            setMessages(prevMessages => [...prevMessages, response.data]);
            setNewMessage('');

            // Update conversations list
            setConversations(prevConversations => {
                const updatedConversations = prevConversations.map(convo => {
                    if (convo.user.id === selectedUser.id) {
                        return {
                            ...convo,
                            lastMessage: {
                                content: newMessage,
                                timestamp: response.data.timestamp,
                                date: response.data.date,
                                is_read: true,
                                is_from_me: true,
                            },
                        };
                    }
                    return convo;
                });

                // If this is a new conversation, add it to the list
                if (!prevConversations.some(convo => convo.user.id === selectedUser.id)) {
                    updatedConversations.unshift({
                        user: selectedUser,
                        lastMessage: {
                            content: newMessage,
                            timestamp: response.data.timestamp,
                            date: response.data.date,
                            is_read: true,
                            is_from_me: true,
                        },
                        unreadCount: 0,
                    });
                }

                return updatedConversations;
            });

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

    const filteredUsers = searchQuery
        ? users.filter(user =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : [];

    const filteredConversations = searchQuery
        ? conversations.filter(convo =>
            convo.user.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : conversations;

    return (
        <div className="flex h-full flex-col md:flex-row">
            {/* Sidebar - Conversation List */}
            <div className="h-1/3 w-full border-b border-r border-gray-200 md:h-full md:w-80 md:flex-shrink-0 dark:border-gray-700">
                <div className="flex h-full flex-col">
                    <div className="p-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <Input
                                placeholder="Search contacts..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        {searchQuery && filteredUsers.length > 0 && (
                            <div className="p-2">
                                <h3 className="mb-2 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    CONTACTS
                                </h3>
                                {filteredUsers.map((user) => (
                                    <button
                                        key={user.id}
                                        className="flex w-full items-center gap-2 rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        onClick={() => handleSelectUser(user)}
                                    >
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={user.avatar || ''} alt={user.name} />
                                            <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-1 flex-col items-start">
                                            <span className="font-medium">{user.name}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="p-2">
                            <h3 className="mb-2 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                CONVERSATIONS
                            </h3>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="h-5 w-5 animate-spin rounded-full border-t-2 border-gray-500"></div>
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                    <p>No conversations yet</p>
                                    <p>Start chatting with someone!</p>
                                </div>
                            ) : (
                                filteredConversations.map((conversation) => (
                                    <button
                                        key={conversation.user.id}
                                        className={`flex w-full items-center gap-2 rounded-md p-2 ${selectedUser?.id === conversation.user.id
                                            ? 'bg-gray-100 dark:bg-gray-800'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                        onClick={() => handleSelectUser(conversation.user)}
                                    >
                                        <div className="relative">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={conversation.user.avatar || ''} alt={conversation.user.name} />
                                                <AvatarFallback>{conversation.user.name.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            {conversation.user.status === 'online' && (
                                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-gray-900"></span>
                                            )}
                                        </div>
                                        <div className="flex flex-1 flex-col items-start">
                                            <div className="flex w-full justify-between">
                                                <span className="font-medium">{conversation.user.name}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {conversation.lastMessage.timestamp}
                                                </span>
                                            </div>
                                            <div className="flex w-full justify-between">
                                                <span className="truncate text-sm text-gray-500 dark:text-gray-400">
                                                    {conversation.lastMessage.is_from_me ? 'You: ' : ''}
                                                    {conversation.lastMessage.content}
                                                </span>
                                                {conversation.unreadCount > 0 && (
                                                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                                                        {conversation.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* Main chat area */}
            <div className="flex-1 overflow-hidden">
                {selectedUser ? (
                    <div className="flex h-full flex-col">
                        {/* Chat header */}
                        <div className="flex items-center border-b border-gray-200 p-4 dark:border-gray-700">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={selectedUser.avatar || ''} alt={selectedUser.name} />
                                <AvatarFallback>{selectedUser.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="ml-3">
                                <h3 className="font-semibold">{selectedUser.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {selectedUser.status === 'online' ? 'Online' : 'Offline'}
                                </p>
                            </div>
                        </div>

                        {/* Chat messages */}
                        <ScrollArea className="flex-1 p-4">
                            {isLoadingMessages ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="h-5 w-5 animate-spin rounded-full border-t-2 border-gray-500"></div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center text-sm text-gray-500 dark:text-gray-400">
                                    <p>No messages yet</p>
                                    <p>Start a conversation!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.is_from_me ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {!message.is_from_me && message.sender && (
                                                <Avatar className="mr-2 h-8 w-8 self-end">
                                                    <AvatarImage src={message.sender.avatar || ''} alt={message.sender.name} />
                                                    <AvatarFallback>{message.sender.name.substring(0, 2)}</AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div
                                                className={`max-w-xs rounded-lg px-4 py-2 ${message.is_from_me
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                                                    }`}
                                            >
                                                <p>{message.content}</p>
                                                <span className={`mt-1 block text-xs ${message.is_from_me ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {message.timestamp}
                                                </span>
                                            </div>
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
                            <Search className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold">Select a conversation</h3>
                        <p className="mt-2 max-w-md text-gray-500 dark:text-gray-400">
                            Choose from your existing conversations or start a new one.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
