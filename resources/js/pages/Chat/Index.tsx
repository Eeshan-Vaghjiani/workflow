import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Search, Users, Clock, ArrowLeftCircle, Plus, User, Trash, Settings, MoreVertical, Paperclip, Loader2, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import { Badge } from '@/components/ui/badge';

interface User {
    id: number;
    name: string;
    avatar?: string;
    email?: string;
}

interface Message {
    id: number | string;
    content: string;
    message?: string;
    user_id?: number;
    sender_id?: number;
    receiver_id?: number;
    group_id?: number;
    created_at?: string;
    timestamp?: string;
    user?: {
        id: number;
        name: string;
        avatar?: string;
    };
    _key?: string;
    is_from_me?: boolean;
    status?: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
}

interface Chat {
    id: number;
    name: string;
    type: 'group' | 'direct';
    avatar?: string;
    lastMessage?: {
        content: string;
        timestamp: string;
    };
    unreadCount?: number;
}

interface Props {
    auth: {
        user: User;
    };
    initialGroups?: any[];
}

export default function UnifiedChat({ auth, initialGroups = [] }: Props) {
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);

    // Add state for direct and group messages
    const [directMessages, setDirectMessages] = useState<Record<number, Message[]>>({});
    const [groupMessages, setGroupMessages] = useState<Record<number, Message[]>>({});

    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [showUserSearch, setShowUserSearch] = useState(false);
    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentUser = auth.user;

    const breadcrumbs = [{ title: 'Chat', href: '/chat' }];

    // Fetch groups and direct messages to create a unified chat list
    useEffect(() => {
        const fetchChats = async () => {
            try {
                setIsLoading(true);

                // Get CSRF token from meta tag
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                const authHeaders = {
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                };

                // Fetch groups using the correct chat groups endpoint
                const groupsResponse = await axios.get(window.location.origin + '/api/chat/groups', {
                    withCredentials: true,
                    headers: authHeaders
                });

                // Check if the response contains data directly or has a nested data property
                const groupsData = groupsResponse.data.data || groupsResponse.data;

                console.log('Groups response:', groupsData);

                const groups = Array.isArray(groupsData) ? groupsData.map((group: any) => ({
                    id: group.id,
                    name: group.name,
                    type: 'group' as const,
                    avatar: group.avatar,
                    lastMessage: group.lastMessage ? {
                        content: group.lastMessage.content,
                        timestamp: group.lastMessage.timestamp || group.lastMessage.date
                    } : undefined,
                    unreadCount: group.unreadCount || 0
                })) : [];

                // Fetch direct message conversations
                try {
                    const directMessagesResponse = await axios.get(window.location.origin + '/api/direct-messages', {
                        withCredentials: true,
                        headers: authHeaders
                    });
                    const directMessagesData = directMessagesResponse.data.conversations || directMessagesResponse.data || [];

                    console.log('Direct messages response:', directMessagesData);

                    const directChats = Array.isArray(directMessagesData) ? directMessagesData.map((conversation: any) => ({
                        id: conversation.user.id,
                        name: conversation.user.name,
                        type: 'direct' as const,
                        avatar: conversation.user.avatar,
                        lastMessage: conversation.lastMessage ? {
                            content: conversation.lastMessage.content,
                            timestamp: conversation.lastMessage.timestamp || conversation.lastMessage.date
                        } : undefined,
                        unreadCount: conversation.unreadCount || 0
                    })) : [];

                    // Combine groups and direct messages
                    setChats([...groups, ...directChats] as Chat[]);
                } catch (dmError) {
                    console.error('Error fetching direct messages:', dmError);
                    // Continue with just groups if direct messages fail
                    setChats(groups as Chat[]);
                }

                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching chats:', error);
                setIsLoading(false);
                toast({
                    title: 'Error',
                    description: 'Failed to load chats. Please try again.',
                    variant: 'destructive',
                });
            }
        };

        fetchChats();
    }, []);

    // Set up real-time updates for the current chat
    useEffect(() => {
        if (selectedChat?.id) {
            const fetchMessages = async () => {
                try {
                    setLoadingMessages(true);

                    // Get CSRF token from meta tag
                    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                    const authHeaders = {
                        'X-CSRF-TOKEN': csrfToken || '',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    };

                    // First check if we're authenticated
                    try {
                        const authCheckResponse = await axios.get(window.location.origin + '/debug/auth-status', {
                            withCredentials: true
                        });
                        console.log('Auth check response:', authCheckResponse.data);
                        if (!authCheckResponse.data.authenticated) {
                            console.error('User is not authenticated!');
                            toast({
                                title: 'Authentication Error',
                                description: 'You are not logged in. Please refresh the page and try again.',
                                variant: 'destructive',
                            });
                            setLoadingMessages(false);
                            return;
                        }
                    } catch (authError) {
                        console.error('Auth check failed:', authError);
                    }

                    let response;
                    let messagesFetched = false;
                    let attempts = 0;
                    const maxAttempts = 3;

                    // Try multiple endpoints with retry logic
                    while (!messagesFetched && attempts < maxAttempts) {
                        attempts++;
                        try {
                            if (selectedChat.type === 'group') {
                                // Group messages endpoint
                                response = await axios.get(window.location.origin + `/api/web/groups/${selectedChat.id}/messages`, {
                                    withCredentials: true,
                                    headers: authHeaders
                                });
                                messagesFetched = true;
                            } else {
                                // For direct messages - try different endpoints
                                try {
                                    // First try the regular web route
                                    response = await axios.get(window.location.origin + `/web/direct-messages/${selectedChat.id}`, {
                                        withCredentials: true,
                                        headers: authHeaders
                                    });
                                    messagesFetched = true;
                                } catch (webError) {
                                    console.log(`Web route failed (attempt ${attempts}), trying API web fallback...`);
                                    try {
                                        // Try the API web fallback
                                        response = await axios.get(window.location.origin + `/api/web/direct-messages/${selectedChat.id}`, {
                                            withCredentials: true,
                                            headers: authHeaders
                                        });
                                        messagesFetched = true;
                                    } catch (apiWebError) {
                                        console.log(`API web fallback failed (attempt ${attempts}), trying API route...`);
                                        // Last try - API route
                                        try {
                                            response = await axios.get(window.location.origin + `/api/direct-messages/${selectedChat.id}`, {
                                                withCredentials: true,
                                                headers: authHeaders
                                            });
                                            messagesFetched = true;
                                        } catch (apiError) {
                                            console.error(`All API routes failed (attempt ${attempts})`, apiError);
                                            if (attempts >= maxAttempts) {
                                                throw apiError;
                                            }
                                            // Wait before retrying
                                            await new Promise(resolve => setTimeout(resolve, 1000));
                                        }
                                    }
                                }
                            }
                        } catch (error) {
                            console.error(`Error fetching messages (attempt ${attempts}):`, error);
                            if (attempts >= maxAttempts) {
                                throw error;
                            }
                            // Wait before retrying
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    }

                    if (!messagesFetched) {
                        throw new Error('Failed to fetch messages after multiple attempts');
                    }

                    const responseData = response?.data ? (
                        Array.isArray(response.data) ? response.data :
                            response.data.messages || response.data.data || []
                    ) : [];

                    console.log('Fetched messages:', responseData);

                    setMessages(responseData);
                    setLoadingMessages(false);
                } catch (error) {
                    console.error('Error fetching messages:', error);
                    setLoadingMessages(false);
                    toast({
                        title: 'Error',
                        description: 'Failed to load messages. Please try again.',
                        variant: 'destructive',
                    });
                }
            };

            fetchMessages();

            // Set up Pusher channel for real-time updates
            try {
                // Check if Echo is properly initialized
                if (typeof window.Echo === 'undefined') {
                    console.error('Echo is not defined. Real-time messaging will not work.');
                    return;
                }

                // Use a single public channel for all messages
                const channelName = 'chat';
                console.log('Setting up listener on channel:', channelName);

                // Subscribe to the public channel
                const channel = window.Echo.channel(channelName);

                if (!channel) {
                    console.error('Failed to subscribe to channel:', channelName);
                    return;
                }

                console.log('Successfully subscribed to channel:', channelName);

                // Listen for events both with and without the dot prefix
                // First try with the dot prefix (Laravel standard)
                channel.listen('.message.new', (data: any) => {
                    console.log(`Received .message.new event (with dot) on ${channelName}:`, data);
                    handleNewMessage(data);
                });

                // Also listen without the dot prefix as fallback
                channel.listen('message.new', (data: any) => {
                    console.log(`Received message.new event (no dot) on ${channelName}:`, data);
                    handleNewMessage(data);
                });

                // Extract message handling to avoid duplicate code
                const handleNewMessage = (data: any) => {
                    console.log('Raw message data received:', data);

                    try {
                        // Deep extract the message data from various possible structures
                        // If we have a .message property, use that, otherwise use data itself
                        let incomingMessage = data;

                        // Handle both string and object message formats
                        if (data.message) {
                            console.log('Message found in .message property, type:', typeof data.message);
                            // If message is a string, it's the content, not the full message object
                            if (typeof data.message === 'string') {
                                // Keep the original data but set explicit content
                                incomingMessage = {
                                    ...data,
                                    content: data.message,
                                };
                                console.log('Message is string, created object:', incomingMessage);
                            } else {
                                incomingMessage = data.message;
                            }
                        } else if (data.data) {
                            console.log('Message found in .data property');
                            incomingMessage = data.data;
                        }

                        if (!incomingMessage) {
                            console.error('No valid message data found in the event', data);
                            return;
                        }

                        console.log('Incoming message structure:', incomingMessage);

                        // Examine all possible properties where sender ID might be found
                        console.log('Debug all possible ID fields:', {
                            'incomingMessage.sender_id': incomingMessage.sender_id,
                            'incomingMessage.user_id': incomingMessage.user_id,
                            'data.sender_id': data.sender_id,
                            'data.user_id': data.user_id,
                            'incomingMessage.user?.id': incomingMessage.user?.id,
                            'data.user?.id': data.user?.id
                        });

                        // Safely extract message properties with detailed logging and fallbacks
                        const messageId = incomingMessage.id || data.id;
                        // Look in more places for sender ID
                        const senderId = incomingMessage.sender_id || data.sender_id ||
                            incomingMessage.user_id || data.user_id ||
                            (incomingMessage.user ? incomingMessage.user.id : null) ||
                            (data.user ? data.user.id : null);
                        const receiverId = incomingMessage.receiver_id || data.receiver_id;
                        const groupId = incomingMessage.group_id || data.group_id;
                        // Ensure content is retrieved from the right property
                        const content = incomingMessage.content ||
                            (typeof incomingMessage.message === 'string' ? incomingMessage.message : '');
                        const timestamp = incomingMessage.created_at || new Date().toISOString();

                        // Use the user object if available, otherwise create one
                        const messageUser = incomingMessage.user || {
                            id: senderId,
                            name: incomingMessage.sender_name || 'Unknown User',
                            avatar: incomingMessage.sender_avatar
                        };

                        console.log('Extracted message data:', {
                            messageId,
                            senderId,
                            receiverId,
                            groupId,
                            content,
                            timestamp
                        });

                        // Only try to handle the message if we have at least the content
                        if (!content && !messageId) {
                            console.error('Missing critical message data (content and ID)', data);
                            return;
                        }

                        // We can handle the message even without sender ID - just treat as an unknown user
                        const processedMessage: Message = {
                            id: messageId || new Date().getTime(), // Fallback to timestamp if no ID
                            content: content || (typeof data.message === 'string' ? data.message : ''),
                            sender_id: senderId,
                            receiver_id: receiverId,
                            group_id: groupId,
                            timestamp: timestamp,
                            is_from_me: senderId === currentUser.id,
                            user: messageUser
                        };

                        console.log('Processed message for display:', processedMessage);

                        // Handle direct messages and group messages accordingly
                        if (processedMessage.group_id) {
                            // Group chat message
                            console.log('Adding message to group chat:', processedMessage.group_id);

                            // Update messages if this is the active chat
                            if (selectedChat && selectedChat.type === 'group' && selectedChat.id === processedMessage.group_id) {
                                console.log('This is the active group chat, adding message to display');
                                setMessages(prevMessages => [...prevMessages, processedMessage]);
                                setTimeout(scrollToBottom, 100);
                            } else {
                                console.log('Message is for a different group chat:', processedMessage.group_id);
                            }

                            // Update group messages store
                            setGroupMessages(prevMessages => {
                                const groupId = processedMessage.group_id || 0;
                                const updatedMessages = { ...prevMessages };

                                if (!updatedMessages[groupId]) {
                                    updatedMessages[groupId] = [];
                                }

                                // Check for duplicates
                                const isDuplicate = updatedMessages[groupId].some(
                                    (msg: Message) => msg.id === processedMessage.id
                                );

                                if (!isDuplicate) {
                                    updatedMessages[groupId] = [...updatedMessages[groupId], processedMessage];
                                }

                                return updatedMessages;
                            });

                            // Update chat list with new message info
                            setChats(prevChats => {
                                const updatedChats = [...prevChats];
                                const chatIndex = updatedChats.findIndex(
                                    chat => chat.type === 'group' && chat.id === processedMessage.group_id
                                );

                                if (chatIndex >= 0) {
                                    console.log('Updating group chat in chat list:', updatedChats[chatIndex].name);
                                    updatedChats[chatIndex] = {
                                        ...updatedChats[chatIndex],
                                        lastMessage: {
                                            content: processedMessage.content,
                                            timestamp: processedMessage.timestamp || new Date().toISOString(),
                                        },
                                        unreadCount: processedMessage.sender_id !== currentUser.id
                                            ? (updatedChats[chatIndex].unreadCount || 0) + 1
                                            : updatedChats[chatIndex].unreadCount || 0,
                                    };
                                } else {
                                    console.warn('Could not find group chat in chat list:', processedMessage.group_id);
                                }

                                return updatedChats;
                            });
                        } else {
                            // Direct message - could be to or from current user
                            const chatWithId = processedMessage.sender_id === currentUser.id
                                ? processedMessage.receiver_id
                                : processedMessage.sender_id;

                            console.log('Adding direct message for chat with user:', chatWithId);

                            if (chatWithId) {
                                // Only update the UI if this message belongs to the currently selected chat
                                const isForCurrentChat = selectedChat &&
                                    selectedChat.type === 'direct' &&
                                    ((selectedChat.id === chatWithId) ||
                                        (selectedChat.id === processedMessage.sender_id && currentUser.id === processedMessage.receiver_id) ||
                                        (selectedChat.id === processedMessage.receiver_id && currentUser.id === processedMessage.sender_id));

                                console.log('Message belongs to current chat?', isForCurrentChat, {
                                    selectedChatId: selectedChat?.id,
                                    chatWithId,
                                    senderId: processedMessage.sender_id,
                                    receiverId: processedMessage.receiver_id,
                                    currentUserId: currentUser.id
                                });

                                // If this is the active chat, update its messages
                                if (isForCurrentChat) {
                                    setMessages(prevMessages => [...prevMessages, processedMessage]);
                                    setTimeout(scrollToBottom, 100);
                                }

                                // Update direct messages store
                                setDirectMessages(prevMessages => {
                                    const updatedMessages = { ...prevMessages };

                                    if (!updatedMessages[chatWithId]) {
                                        updatedMessages[chatWithId] = [];
                                    }

                                    // Check for duplicates
                                    const isDuplicate = updatedMessages[chatWithId].some(
                                        (msg: Message) => msg.id === processedMessage.id
                                    );

                                    if (!isDuplicate) {
                                        updatedMessages[chatWithId] = [...updatedMessages[chatWithId], processedMessage];
                                    }

                                    return updatedMessages;
                                });

                                // Update chat list with new message info
                                setChats(prevChats => {
                                    const updatedChats = [...prevChats];
                                    const chatIndex = updatedChats.findIndex(
                                        chat => chat.type === 'direct' && chat.id === chatWithId
                                    );

                                    if (chatIndex >= 0) {
                                        updatedChats[chatIndex] = {
                                            ...updatedChats[chatIndex],
                                            lastMessage: {
                                                content: processedMessage.content,
                                                timestamp: processedMessage.timestamp || new Date().toISOString(),
                                            },
                                            unreadCount: processedMessage.sender_id !== currentUser.id
                                                ? (updatedChats[chatIndex].unreadCount || 0) + 1
                                                : updatedChats[chatIndex].unreadCount || 0,
                                        };
                                    }

                                    return updatedChats;
                                });
                            }
                        }

                        // Add notification toast for messages not from current user
                        if (processedMessage.sender_id !== currentUser.id) {
                            toast({
                                title: `New message from ${processedMessage.user?.name || 'Unknown User'}`,
                                description: processedMessage.content,
                                duration: 5000,
                            });
                        }
                    } catch (error) {
                        console.error('Error handling new message:', error);
                    }
                };

                // Listen for message deletion events
                channel.listen('message.deleted', (data: any) => {
                    console.log(`Received message.deleted event:`, data);

                    // Extract the message ID safely
                    const messageId = data.id || (data.message && data.message.id);

                    if (messageId) {
                        // Remove the message from the local state
                        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
                    }
                });

                // CRITICAL FIX: Proper cleanup function to prevent stale listeners
                return () => {
                    console.log('Cleaning up Pusher listeners for channel:', channelName);

                    // Explicitly stop listening to all events
                    channel.stopListening('.message.new');
                    channel.stopListening('message.deleted');

                    // Leave the channel to clean up resources
                    window.Echo.leave(channelName);
                };
            } catch (error) {
                console.error('Error setting up real-time channel:', error);
            }
        }
    }, [selectedChat?.id, currentUser?.id]); // Correct dependency array to re-subscribe when chat changes

    // Scroll to bottom when messages change
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Auto-scroll to bottom when messages change
        if (messagesContainerRef.current && messages.length > 0) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSelectChat = (chat: Chat) => {
        setSelectedChat(chat);
        setSearchQuery('');
    };

    // Add scrollToBottom function
    const scrollToBottom = () => {
        const messageContainer = document.querySelector('.chat-messages-container');
        if (messageContainer) {
            messageContainer.scrollTop = messageContainer.scrollHeight;
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedChat) return;

        setIsSending(true);

        try {
            console.log('Sending message to:', selectedChat.type, selectedChat.id);

            let response;
            let messageData = null;

            // Record the message we're about to send for possible recovery
            const pendingMessage: Message = {
                id: Date.now(), // Temporary ID
                content: newMessage,
                timestamp: new Date().toISOString(),
                is_from_me: true,
                user: {
                    id: currentUser.id,
                    name: currentUser.name,
                    avatar: currentUser.avatar
                }
            };

            // Try different endpoints in sequence
            try {
                // Try web route first
                response = await axios.post(`/web/direct-messages/${selectedChat.id}`, {
                    message: newMessage
                });
                messageData = response.data;
                console.log('Message sent successfully via web route:', messageData);
            } catch (webError) {
                console.warn('Web route failed, trying api/web route:', webError);

                try {
                    // Try api/web route next
                    response = await axios.post(`/api/web/direct-messages/${selectedChat.id}`, {
                        message: newMessage
                    });
                    messageData = response.data;
                    console.log('Message sent successfully via api/web route:', messageData);
                } catch (apiWebError) {
                    console.warn('api/web route failed, trying api/chat route:', apiWebError);

                    // For group messages, use the group-specific endpoint
                    if (selectedChat.type === 'group') {
                        console.log('Sending group message to endpoint:', `/api/chat/groups/${selectedChat.id}/messages`);
                        response = await axios.post(`/api/chat/groups/${selectedChat.id}/messages`, {
                            message: newMessage
                        });
                    } else {
                        // Last resort for direct messages
                        response = await axios.post(`/api/direct-messages/${selectedChat.id}`, {
                            message: newMessage
                        });
                    }

                    messageData = response.data;
                    console.log('Message sent successfully via last resort route:', messageData);
                }
            }

            // Manually add the message to the UI without waiting for the socket
            if (selectedChat.type === 'direct') {
                const newMessageObj = messageData || {
                    ...pendingMessage,
                    sender_id: currentUser.id,
                    receiver_id: selectedChat.id,
                };

                setMessages(prevMessages => [...prevMessages, newMessageObj]);
            } else {
                const newMessageObj = messageData || {
                    ...pendingMessage,
                    sender_id: currentUser.id,
                    group_id: selectedChat.id,
                };

                // Add the message to the current messages display
                setMessages(prevMessages => [...prevMessages, newMessageObj]);

                // Update the chat list with the new message info
                setChats(prevChats => {
                    const updatedChats = [...prevChats];
                    // Find the chat by ID instead of using array indexing
                    const chatIndex = updatedChats.findIndex(
                        chat => chat.type === 'group' && chat.id === selectedChat.id
                    );

                    if (chatIndex >= 0) {
                        updatedChats[chatIndex] = {
                            ...updatedChats[chatIndex],
                            lastMessage: {
                                content: newMessageObj.content,
                                timestamp: newMessageObj.timestamp || new Date().toISOString(),
                            },
                            // No need to update unread count for our own messages
                            // Just preserve the existing count
                            unreadCount: updatedChats[chatIndex].unreadCount || 0,
                        };
                    }
                    return updatedChats;
                });
            }

            setNewMessage('');
            scrollToBottom();

        } catch (error: any) {
            console.error('Error sending message:', error);

            // Even if the API call failed, add the message to the UI to improve UX
            // Mark it with a 'pending' or 'failed' status that can be shown to the user
            if (selectedChat.type === 'direct') {
                const failedMessage: Message = {
                    id: Date.now(),
                    content: newMessage,
                    timestamp: new Date().toISOString(),
                    is_from_me: true,
                    status: 'failed',
                    sender_id: currentUser.id,
                    receiver_id: selectedChat.id,
                    user: {
                        id: currentUser.id,
                        name: currentUser.name,
                        avatar: currentUser.avatar
                    }
                };

                setMessages(prevMessages => [...prevMessages, failedMessage]);
            } else if (selectedChat.type === 'group') {
                // Handle failed group messages
                const failedMessage: Message = {
                    id: Date.now(),
                    content: newMessage,
                    timestamp: new Date().toISOString(),
                    is_from_me: true,
                    status: 'failed',
                    sender_id: currentUser.id,
                    group_id: selectedChat.id,
                    user: {
                        id: currentUser.id,
                        name: currentUser.name,
                        avatar: currentUser.avatar
                    }
                };

                setMessages(prevMessages => [...prevMessages, failedMessage]);

                // Update the chat list with the failed message
                setChats(prevChats => {
                    const updatedChats = [...prevChats];
                    const chatIndex = updatedChats.findIndex(
                        chat => chat.type === 'group' && chat.id === selectedChat.id
                    );

                    if (chatIndex >= 0) {
                        updatedChats[chatIndex] = {
                            ...updatedChats[chatIndex],
                            lastMessage: {
                                content: newMessage,
                                timestamp: new Date().toISOString(),
                            },
                            unreadCount: updatedChats[chatIndex].unreadCount || 0,
                        };
                    }
                    return updatedChats;
                });
            }

            toast({
                title: "Failed to send message",
                description: "Your message could not be sent. It will appear locally only.",
                variant: "destructive",
            });
        } finally {
            setIsSending(false);
        }
    };

    // Search for users
    const searchUsers = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            setIsSearchingUsers(true);
            console.log('Searching for users with query:', query);

            // Get CSRF token from meta tag
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            console.log('CSRF token available:', !!csrfToken);

            // Use an absolute URL to ensure it goes through the web middleware
            const apiUrl = window.location.origin + `/api/chat/search-users?name=${encodeURIComponent(query)}`;
            console.log('Using API URL:', apiUrl);

            const response = await axios.get(apiUrl, {
                withCredentials: true,
                headers: {
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            console.log('User search results:', response.data);

            // Check if the response contains an error
            if (response.data && response.data.error) {
                console.error('Search API returned error:', response.data.error);
                toast({
                    title: 'Search Error',
                    description: response.data.error,
                    variant: 'destructive',
                });
                setSearchResults([]);
                setIsSearchingUsers(false);
                return;
            }

            // Make sure we got an array back
            if (!Array.isArray(response.data)) {
                console.error('Expected array of users but got:', typeof response.data, response.data);
                toast({
                    title: 'Unexpected Data Format',
                    description: 'The server returned data in an unexpected format.',
                    variant: 'destructive',
                });
                setSearchResults([]);
            } else {
                // Valid array response
                setSearchResults(response.data);
            }

            setIsSearchingUsers(false);
        } catch (error) {
            console.error('Error searching users:', error);

            // Extract the error message from Axios error
            let errorMessage = 'Failed to search for users';
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    console.error('Error response data:', error.response.data);
                    errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
                } else if (error.request) {
                    errorMessage = 'No response received from server';
                    console.error('No response received:', error.request);
                }
            }

            toast({
                title: 'Search Error',
                description: errorMessage,
                variant: 'destructive',
            });

            setSearchResults([]);
            setIsSearchingUsers(false);
        }
    };

    // Handle user search input change
    const handleUserSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (showUserSearch) {
            // Debounce search to avoid too many requests
            const timeoutId = setTimeout(() => {
                searchUsers(query);
            }, 300);

            return () => clearTimeout(timeoutId);
        }
    };

    // Start a new direct message chat with a user
    const startDirectChat = (user: User) => {
        // Check if we already have a chat with this user
        const existingChat = chats.find(
            chat => chat.type === 'direct' && chat.id === user.id
        );

        if (existingChat) {
            setSelectedChat(existingChat);
        } else {
            // Create a new chat and select it
            const newChat: Chat = {
                id: user.id,
                name: user.name,
                type: 'direct' as const,
                avatar: user.avatar,
            };

            setChats(prevChats => [...prevChats, newChat]);
            setSelectedChat(newChat);
        }

        // Reset search
        setShowUserSearch(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    const filteredChats = showUserSearch
        ? []
        : searchQuery
            ? chats.filter(chat =>
                chat.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            : chats;

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Add deleteMessage function
    const deleteMessage = async (messageId: number | string) => {
        if (!selectedChat) return;

        try {
            // Get CSRF token from meta tag
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const authHeaders = {
                'X-CSRF-TOKEN': csrfToken || '',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            };

            // Try multiple endpoints with retry logic
            let response;
            let success = false;
            let attempts = 0;
            const maxAttempts = 3;

            while (!success && attempts < maxAttempts) {
                attempts++;
                try {
                    // Try web route first
                    response = await axios.delete(window.location.origin + `/messages/${messageId}`, {
                        withCredentials: true,
                        headers: authHeaders
                    });
                    console.log('Message deleted successfully via web route:', response?.data);
                    success = true;
                } catch (webError) {
                    console.log(`Web route failed (attempt ${attempts}), trying API route...`);
                    try {
                        // Try API route
                        response = await axios.delete(window.location.origin + `/api/direct-messages/${messageId}`, {
                            withCredentials: true,
                            headers: authHeaders
                        });
                        console.log('Message deleted successfully via API route:', response?.data);
                        success = true;
                    } catch (apiError) {
                        console.error(`API route failed (attempt ${attempts})`, apiError);
                        if (attempts >= maxAttempts) {
                            throw apiError;
                        }
                        // Wait before retrying
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }

            if (!success) {
                throw new Error('Failed to delete message after multiple attempts');
            }

            // Remove the message from the local state
            setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));

            toast({
                title: 'Success',
                description: 'Message deleted successfully',
                variant: 'default',
            });

        } catch (error) {
            console.error('Error deleting message:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete message. Please try again.',
                variant: 'destructive',
            });
        }
    };

    // Add getInitials function
    const getInitials = (name: string): string => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Format time helper function
    const formatTime = (timestamp: string | undefined): string => {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Add modern UI styling to the chat component
    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" onClick={() => setShowUserSearch(true)} className="mr-2">
                        <Plus className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Messages</h1>
                </div>
                <div>
                    <Button variant="ghost" size="icon">
                        <Settings className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Chat List */}
                <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
                    {/* Search */}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search conversations..."
                                className="pl-8 bg-gray-100 dark:bg-gray-700 border-0"
                                value={searchQuery}
                                onChange={handleUserSearchChange}
                                onFocus={() => setShowUserSearch(true)}
                            />
                        </div>
                    </div>

                    {/* Chat List */}
                    <div className="flex-1 overflow-auto">
                        {showUserSearch ? (
                            <div className="p-3">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Search Results</h3>
                                {isSearchingUsers ? (
                                    <div className="flex justify-center p-4">
                                        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <ul className="space-y-2">
                                        {searchResults.map((user) => (
                                            <li key={user.id}>
                                                <Button
                                                    variant="ghost"
                                                    className="w-full justify-start"
                                                    onClick={() => startDirectChat(user)}
                                                >
                                                    <Avatar className="h-8 w-8 mr-2">
                                                        <AvatarImage src={user.avatar} alt={user.name} />
                                                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{user.name}</span>
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : searchQuery.length > 0 ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 p-2">No users found</p>
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 p-2">Type to search for users</p>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full mt-2"
                                    onClick={() => {
                                        setShowUserSearch(false);
                                        setSearchQuery('');
                                    }}
                                >
                                    Back to conversations
                                </Button>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {chats.map((chat) => (
                                    <li key={`${chat.type}-${chat.id}`}>
                                        <Button
                                            variant="ghost"
                                            className={`w-full justify-start p-3 ${selectedChat?.id === chat.id && selectedChat?.type === chat.type
                                                ? 'bg-gray-100 dark:bg-gray-700'
                                                : ''
                                                }`}
                                            onClick={() => handleSelectChat(chat)}
                                        >
                                            <div className="relative">
                                                <Avatar className="h-10 w-10 mr-3">
                                                    <AvatarImage src={chat.avatar} alt={chat.name} />
                                                    <AvatarFallback>{getInitials(chat.name)}</AvatarFallback>
                                                </Avatar>
                                                {chat.unreadCount && chat.unreadCount > 0 && (
                                                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                                        {chat.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline">
                                                    <p className="text-sm font-medium truncate">{chat.name}</p>
                                                    {chat.lastMessage && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {chat.lastMessage.timestamp}
                                                        </p>
                                                    )}
                                                </div>
                                                {chat.lastMessage && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {chat.lastMessage.content}
                                                    </p>
                                                )}
                                                <div className="flex items-center mt-1">
                                                    <Badge variant={chat.type === 'group' ? 'secondary' : 'outline'} className="text-xs">
                                                        {chat.type === 'group' ? 'Group' : 'Direct'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Chat Content */}
                <div className="flex-1 flex flex-col">
                    {selectedChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center">
                                <Avatar className="h-9 w-9 mr-2">
                                    <AvatarImage src={selectedChat.avatar} alt={selectedChat.name} />
                                    <AvatarFallback>{getInitials(selectedChat.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedChat.name}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {selectedChat.type === 'group' ? 'Group chat' : 'Direct message'}
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900 chat-messages-container">
                                {loadingMessages ? (
                                    <div className="flex justify-center items-center h-full">
                                        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                                    </div>
                                ) : messages.length > 0 ? (
                                    <div className="space-y-4">
                                        {messages.map((message, index) => {
                                            const isFromMe = message.is_from_me || message.sender_id === currentUser.id;
                                            const showAvatar = !isFromMe && (!messages[index - 1] || messages[index - 1].sender_id !== message.sender_id);

                                            return (
                                                <div
                                                    key={message.id}
                                                    className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    {!isFromMe && showAvatar && (
                                                        <Avatar className="h-8 w-8 mr-2 mt-1">
                                                            <AvatarImage src={message.user?.avatar} alt={message.user?.name} />
                                                            <AvatarFallback>{message.user?.name ? getInitials(message.user.name) : '?'}</AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                    {!isFromMe && !showAvatar && <div className="w-8 mr-2" />}
                                                    <div
                                                        className={`max-w-[70%] rounded-lg px-4 py-2 ${isFromMe
                                                            ? 'bg-blue-500 text-white rounded-br-none'
                                                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
                                                            } ${message.status === 'failed' ? 'opacity-50' : ''}`}
                                                    >
                                                        {!isFromMe && showAvatar && (
                                                            <p className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">
                                                                {message.user?.name}
                                                            </p>
                                                        )}
                                                        <p>{message.content}</p>
                                                        <p className="text-xs text-right mt-1 opacity-70">
                                                            {formatTime(message.timestamp || message.created_at)}
                                                        </p>
                                                        {message.status === 'failed' && (
                                                            <p className="text-xs text-red-500 mt-1">Failed to send</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                        <MessageSquare className="h-12 w-12 mb-2" />
                                        <p>No messages yet</p>
                                        <p className="text-sm">Send a message to start the conversation</p>
                                    </div>
                                )}
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                <form
                                    className="flex items-center space-x-2"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        sendMessage();
                                    }}
                                >
                                    <Button type="button" variant="ghost" size="icon">
                                        <Paperclip className="h-5 w-5" />
                                    </Button>
                                    <Input
                                        type="text"
                                        placeholder="Type a message..."
                                        className="flex-1"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                    />
                                    <Button type="submit" disabled={isSending || !newMessage.trim()}>
                                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                            <MessageSquare className="h-16 w-16 mb-4" />
                            <h2 className="text-xl font-semibold mb-2">No chat selected</h2>
                            <p className="text-center max-w-md">
                                Select a conversation from the sidebar or start a new one by searching for users.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
