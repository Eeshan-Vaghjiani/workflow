import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, User, X, MessageSquare } from 'lucide-react';
import { useForm } from '@inertiajs/react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Message {
    id: number;
    sender_id: number;
    receiver_id: number;
    message: string;
    created_at: string;
    read: boolean;
    sender: {
        id: number;
        name: string;
    };
}

interface Conversation {
    id: number;
    user: User;
    last_message: {
        message: string;
        created_at: string;
    };
    unread_count: number;
}

interface Props {
    currentUserId: number;
}

export default function DirectMessages({ currentUserId }: Props) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [typing, setTyping] = useState(false);
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const { data, setData, reset } = useForm({
        message: '',
    });

    // Load conversations
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const response = await axios.get('/api/direct-messages');
                setConversations(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error loading conversations:', error);
                setLoading(false);
            }
        };

        fetchConversations();
    }, []);

    // Load messages when active conversation changes
    useEffect(() => {
        if (!activeConversation) return;

        const fetchMessages = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/api/direct-messages/${activeConversation.id}`);
                setMessages(response.data);
                // Mark messages as read
                axios.post(`/api/direct-messages/${activeConversation.id}/read`);
                // Update unread count in conversations list
                setConversations(prevConversations => 
                    prevConversations.map(conv => 
                        conv.id === activeConversation.id 
                            ? { ...conv, unread_count: 0 } 
                            : conv
                    )
                );
                setLoading(false);
                scrollToBottom();
            } catch (error) {
                console.error('Error loading messages:', error);
                setLoading(false);
            }
        };

        fetchMessages();
    }, [activeConversation]);

    // Set up Echo listeners for real-time communication
    useEffect(() => {
        if (!window.Echo || !currentUserId) return;

        const channel = window.Echo.private(`chat.${currentUserId}`);

        channel.listen('.message.new', (e: { message: Message }) => {
            // If this message is from the active conversation, add it to the messages
            if (activeConversation && e.message.sender_id === activeConversation.id) {
                setMessages(prev => [...prev, e.message]);
                // Mark as read immediately
                axios.post(`/api/direct-messages/${activeConversation.id}/read`);
                scrollToBottom();
            } else {
                // Update conversations list with the new message
                setConversations(prev => 
                    prev.map(conv => 
                        conv.id === e.message.sender_id 
                            ? { 
                                ...conv, 
                                last_message: { 
                                    message: e.message.message, 
                                    created_at: e.message.created_at 
                                },
                                unread_count: conv.unread_count + 1
                            } 
                            : conv
                    )
                );
            }
        });

        channel.listen('.user.typing', (e: { userId: number, userName: string }) => {
            if (activeConversation && e.userId === activeConversation.id) {
                setTyping(true);
                setTypingUser(e.userName);

                // Clear previous timeout if exists
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }

                // Set new timeout to clear typing indicator after 3 seconds
                typingTimeoutRef.current = setTimeout(() => {
                    setTyping(false);
                    setTypingUser(null);
                }, 3000);
            }
        });

        return () => {
            channel.stopListening('.message.new');
            channel.stopListening('.user.typing');
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [currentUserId, activeConversation]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeConversation || !data.message.trim() || sending) return;

        setSending(true);
        try {
            const response = await axios.post(`/api/direct-messages/${activeConversation.id}`, {
                message: data.message,
            });
            setMessages(prev => [...prev, response.data]);
            
            // Update the conversation list
            setConversations(prev => 
                prev.map(conv => 
                    conv.id === activeConversation.id 
                        ? { 
                            ...conv, 
                            last_message: { 
                                message: data.message, 
                                created_at: new Date().toISOString() 
                            } 
                        } 
                        : conv
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
        
        // Send typing event
        if (activeConversation && e.target.value) {
            axios.post(`/api/direct-messages/${activeConversation.id}/typing`);
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatConversationTimestamp = (timestamp: string) => {
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
            {/* Left sidebar - Conversations */}
            <div className="w-1/3 border-r border-neutral-200 dark:border-neutral-700 bg-muted/30 dark:bg-neutral-900/40 flex flex-col">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                    <h3 className="font-medium">Direct Messages</h3>
                </div>

                <div className="overflow-y-auto flex-1">
                    {loading && conversations.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-500 p-4 text-center">
                            <MessageSquare className="h-12 w-12 mb-2 opacity-30" />
                            <p>No conversations yet.</p>
                            <p className="text-sm">Start a new message with a teammate.</p>
                        </div>
                    ) : (
                        conversations.map((conversation) => (
                            <div
                                key={conversation.id}
                                className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition ${
                                    activeConversation?.id === conversation.id
                                        ? 'bg-neutral-100 dark:bg-neutral-800'
                                        : ''
                                }`}
                                onClick={() => setActiveConversation(conversation.user)}
                            >
                                <Avatar>
                                    <AvatarFallback>{conversation.user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium truncate">{conversation.user.name}</span>
                                        <span className="text-xs text-neutral-500">
                                            {formatConversationTimestamp(conversation.last_message.created_at)}
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <p className="text-sm text-neutral-500 truncate flex-1">
                                            {conversation.last_message.message}
                                        </p>
                                        {conversation.unread_count > 0 && (
                                            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                                                {conversation.unread_count}
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
                {!activeConversation ? (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-500 p-4 text-center">
                        <MessageSquare className="h-16 w-16 mb-3 opacity-30" />
                        <h3 className="text-lg font-medium mb-1">Your Messages</h3>
                        <p>Select a conversation to start chatting</p>
                    </div>
                ) : (
                    <>
                        {/* Chat header */}
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback>{activeConversation.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-medium">{activeConversation.name}</h3>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setActiveConversation(null)}
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
                                            message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                                        }`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-lg p-3 ${
                                                message.sender_id === currentUserId
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted'
                                            }`}
                                        >
                                            <div className="break-words">{message.message}</div>
                                            <div className="text-xs mt-1 opacity-70">
                                                {formatTimestamp(message.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            {typing && (
                                <div className="flex justify-start">
                                    <div className="bg-muted rounded-lg p-3">
                                        <div className="flex items-center gap-1">
                                            <div className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                            <div className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                            <div className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce"></div>
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