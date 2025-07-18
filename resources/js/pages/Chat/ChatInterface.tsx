import React, { useState, useEffect } from 'react';
import { ChatHeader } from '@/components/Chat/chat-header';
import { ChatInput } from '@/components/Chat/chat-input';
import { ChatList, Message as ChatListMessage } from '@/components/Chat/chat-list';
import { ChatSidebar } from '@/components/Chat/chat-sidebar';
import { useToast } from '@/components/ui/use-toast';
import axios, { AxiosError } from 'axios';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, UserPlus, Users, Info, MessageSquare, Plus, Loader2, Upload } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassContainer } from '@/components/ui/glass-container';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { containerVariants, itemVariants } from '@/lib/theme-constants';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Enhanced animation variants
const messageVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 400,
            damping: 25
        }
    },
    exit: {
        opacity: 0,
        scale: 0.8,
        y: -20,
        transition: {
            duration: 0.3,
            ease: "easeInOut"
        }
    }
};

const slideInVariants = {
    hidden: { x: -300, opacity: 0 },
    visible: { 
        x: 0, 
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 30
        }
    },
    exit: { 
        x: -300, 
        opacity: 0,
        transition: {
            duration: 0.2
        }
    }
};

interface User {
    id: number;
    name: string;
    email?: string;
    avatar?: string;
    status?: string;
}

// Use the Message interface from ChatList
type Message = ChatListMessage;

interface Chat {
    id: number;
    type: 'direct' | 'group';
    name: string;
    avatar?: string;
    lastMessage?: {
        content: string;
        timestamp: string;
    };
    unreadCount?: number;
    participants?: User[];
    status?: string;
}

interface ChatInterfaceProps {
    currentUser: User;
}

interface MessageData {
    id?: number;
    content?: string;
    message?: string;
    sender_id: number;
    receiver_id?: number;
    group_id?: number;
    created_at?: string;
    user?: User;
    attachments?: Array<{
        id: number;
        file_name: string;
        file_type: string;
        file_size: number;
        file_url: string;
    }>;
}

interface ChatData {
    id: number;
    user: {
        id: number;
        name: string;
        avatar?: string;
        status?: string;
    };
    lastMessage?: {
        content: string;
        created_at: string;
    };
    unreadCount?: number;
}

interface GroupData {
    id: number;
    name: string;
    avatar?: string;
    lastMessage?: {
        content: string;
        created_at: string;
    };
    unreadCount?: number;
}

export default function ChatInterface({ currentUser }: ChatInterfaceProps) {
    // State for chats and messages
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // New chat modal state
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // New group modal state
    const [showNewGroupModal, setShowNewGroupModal] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

    // Reply state
    const [replyingTo, setReplyingTo] = useState<{
        id: number | string;
        content: string;
        sender?: string;
    } | null>(null);

    const { toast } = useToast();

    // Load chats on component mount
    useEffect(() => {
        fetchChats();
    }, []);

    // Load messages when a chat is selected
    useEffect(() => {
        if (selectedChat) {
            fetchMessages(selectedChat);
        }
    }, [selectedChat]);

    // Set up real-time messaging with proper filtering
    useEffect(() => {
        if (!selectedChat) return;

        // Real-time updates setup
        const channel = window.Echo.channel('chat');

        // Handle new messages with proper filtering
        channel.listen('.message.new', (data: MessageData) => {
            console.log('New message received:', data);

            // Only process the message if it's relevant to the current chat
            const isRelevantMessage =
                (selectedChat.type === 'direct' &&
                    ((data.sender_id === currentUser.id && data.receiver_id === selectedChat.id) ||
                        (data.sender_id === selectedChat.id && data.receiver_id === currentUser.id))) ||
                (selectedChat.type === 'group' && data.group_id === selectedChat.id);

            if (isRelevantMessage) {
                // Format the message
                const formattedMessage: Message = {
                    id: data.id || Date.now(),
                    content: data.content || data.message || '',
                    sender_id: data.sender_id,
                    receiver_id: data.receiver_id,
                    group_id: data.group_id,
                    created_at: data.created_at || new Date().toISOString(),
                    user: data.user,
                    is_from_me: data.sender_id === currentUser.id,
                    attachments: data.attachments || []
                };

                // Add to messages
                setMessages(prevMessages => [...prevMessages, formattedMessage]);

                // Mark as read if it's a received message
                if (data.sender_id !== currentUser.id && data.id) {
                    markMessageAsRead(data.id, selectedChat);
                }
            } else {
                // Update the chat list with unread message indication
                updateChatWithNewMessage(data);
            }
        });

        return () => {
            channel.stopListening('.message.new');
        };
    }, [selectedChat, currentUser.id]);

    // Fetch all chats
    const fetchChats = async () => {
        try {
            setIsLoading(true);
            // Fetch direct message conversations
            const directResponse = await axios.get<{ conversations: ChatData[] }>('/api/direct-messages');
            const directChats = directResponse.data.conversations.map((convo) => ({
                id: convo.user.id,
                type: 'direct' as const,
                name: convo.user.name,
                avatar: convo.user.avatar,
                status: convo.user.status,
                lastMessage: convo.lastMessage ? {
                    content: convo.lastMessage.content,
                    timestamp: convo.lastMessage.created_at
                } : undefined,
                unreadCount: convo.unreadCount || 0
            }));

            // Fetch group chats
            const groupResponse = await axios.get<GroupData[]>('/api/chat/groups');
            const groupChats = groupResponse.data.map((group) => ({
                id: group.id,
                type: 'group' as const,
                name: group.name,
                avatar: group.avatar,
                lastMessage: group.lastMessage ? {
                    content: group.lastMessage.content,
                    timestamp: group.lastMessage.created_at
                } : undefined,
                unreadCount: group.unreadCount || 0
            }));

            // Combine and sort by most recent message
            const allChats = [...directChats, ...groupChats].sort((a, b) => {
                const timeA = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
                const timeB = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
                return timeB - timeA;
            });

            setChats(allChats);
            setIsLoading(false);

            // If no chat is selected and we have chats, select the first one
            if (!selectedChat && allChats.length > 0) {
                setSelectedChat(allChats[0]);
            }
        } catch (error) {
            console.error('Error fetching chats:', error);
            toast({
                title: 'Error',
                description: 'Failed to load chats. Please try again.',
                variant: 'destructive'
            });
            setIsLoading(false);
        }
    };

    // Fetch messages for a chat
    const fetchMessages = async (chat: Chat) => {
        try {
            setIsLoadingMessages(true);
            let response;

            if (chat.type === 'direct') {
                response = await axios.get(`/api/direct-messages/${chat.id}`);
            } else {
                response = await axios.get(`/api/groups/${chat.id}/messages`);
            }

            const formattedMessages = response.data.messages.map((msg: any) => ({
                id: msg.id,
                content: msg.content || msg.message,
                sender_id: msg.sender_id || msg.user_id,
                receiver_id: msg.receiver_id,
                group_id: msg.group_id,
                created_at: msg.created_at,
                timestamp: msg.timestamp,
                user: msg.user,
                status: msg.status || 'delivered',
                is_from_me: (msg.sender_id || msg.user_id) === currentUser.id,
                attachments: msg.attachments || []
            }));

            setMessages(formattedMessages);

            // Mark as read
            if (chat.unreadCount && chat.unreadCount > 0) {
                markChatAsRead(chat);
            }

            setIsLoadingMessages(false);
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

    // Send a message with enhanced attachment support
    const sendMessage = async (content: string, attachments?: File[]) => {
        if (!selectedChat || (!content.trim() && (!attachments || attachments.length === 0))) return;

        try {
            setIsSending(true);

            // Create form data for attachments
            const formData = new FormData();
            formData.append('message', content);

            if (attachments && attachments.length > 0) {
                attachments.forEach((file, index) => {
                    formData.append(`attachments[${index}]`, file);
                });
            }

            // Add reply reference if replying
            if (replyingTo) {
                formData.append('parent_id', replyingTo.id.toString());
            }

            // Optimistically add message to UI
            const tempId = `temp-${Date.now()}`;
            const tempMessage: Message = {
                id: tempId,
                content: content,
                sender_id: currentUser.id,
                created_at: new Date().toISOString(),
                status: 'sending',
                is_from_me: true,
                user: {
                    id: currentUser.id,
                    name: currentUser.name,
                    avatar: currentUser.avatar
                },
                attachments: attachments ? attachments.map((file, index) => ({
                    id: -index, // Temporary ID
                    file_name: file.name,
                    file_type: file.type,
                    file_size: file.size,
                    file_url: URL.createObjectURL(file) // Temporary URL
                })) : []
            };

            if (selectedChat.type === 'direct') {
                tempMessage.receiver_id = selectedChat.id;
            } else {
                tempMessage.group_id = selectedChat.id;
            }

            setMessages(prev => [...prev, tempMessage]);

            let response;
            // Send to server
            if (selectedChat.type === 'direct') {
                response = await axios.post(`/api/direct-messages/${selectedChat.id}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            } else {
                response = await axios.post(`/api/groups/${selectedChat.id}/messages`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            }

            // Replace temp message with real one
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === tempId ? {
                        ...response.data,
                        is_from_me: true,
                        status: 'delivered'
                    } : msg
                )
            );

            // Clear reply state
            setReplyingTo(null);

            // Update chat list
            updateChatWithSentMessage(selectedChat.id, content);

            setIsSending(false);

        } catch (error) {
            console.error('Error sending message:', error);
            setIsSending(false);

            // Mark the message as failed
            setMessages(prev =>
                prev.map(msg =>
                    msg.id.toString().startsWith('temp-') ? { ...msg, status: 'failed' } : msg
                )
            );

            toast({
                title: 'Error',
                description: 'Failed to send message. Please try again.',
                variant: 'destructive',
            });
        }
    };

    // Handle reply
    const handleReply = (messageId: number | string) => {
        const message = messages.find(m => m.id === messageId);
        if (message) {
            setReplyingTo({
                id: messageId,
                content: message.content,
                sender: message.user?.name || 'Unknown'
            });
        }
    };

    // Handle delete message
    const handleDeleteMessage = async (messageId: number | string) => {
        try {
            if (selectedChat?.type === 'direct') {
                await axios.delete(`/api/direct-messages/${messageId}`);
            } else {
                await axios.delete(`/api/groups/${selectedChat?.id}/messages/${messageId}`);
            }

            // Remove from local state
            setMessages(prev => prev.filter(msg => msg.id !== messageId));

            toast({
                title: 'Success',
                description: 'Message deleted successfully.',
            });
        } catch (error) {
            console.error('Error deleting message:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete message.',
                variant: 'destructive',
            });
        }
    };

    // Mark a chat as read
    const markChatAsRead = async (chat: Chat) => {
        try {
            if (chat.type === 'direct') {
                await axios.post(`/api/direct-messages/${chat.id}/read`);
            } else {
                await axios.post(`/api/groups/${chat.id}/read`);
            }

            // Update local chat list
            setChats(prev =>
                prev.map(c =>
                    c.id === chat.id ? { ...c, unreadCount: 0 } : c
                )
            );
        } catch (error) {
            console.error('Error marking chat as read:', error);
        }
    };

    // Mark a message as read
    const markMessageAsRead = async (messageId: number | string, chat: Chat) => {
        try {
            if (chat.type === 'direct') {
                await axios.post(`/api/direct-messages/${chat.id}/read`);
            }
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    };

    // Update chat list with new incoming message
    const updateChatWithNewMessage = (messageData: any) => {
        const chatId = messageData.group_id ||
            (messageData.sender_id === currentUser.id ? messageData.receiver_id : messageData.sender_id);

        setChats(prev =>
            prev.map(chat => {
                if (chat.id === chatId) {
                    return {
                        ...chat,
                        lastMessage: {
                            content: messageData.content || messageData.message,
                            timestamp: messageData.created_at || new Date().toISOString()
                        },
                        unreadCount: messageData.sender_id !== currentUser.id ?
                            (chat.unreadCount || 0) + 1 : chat.unreadCount
                    };
                }
                return chat;
            })
        );
    };

    // Update chat list with sent message
    const updateChatWithSentMessage = (chatId: number, content: string) => {
        setChats(prev =>
            prev.map(chat => {
                if (chat.id === chatId) {
                    return {
                        ...chat,
                        lastMessage: {
                            content: content,
                            timestamp: new Date().toISOString()
                        }
                    };
                }
                return chat;
            })
        );
    };

    // Search for users
    const searchUsers = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            setIsSearching(true);
            const response = await axios.get(`/api/chat/search-users?name=${encodeURIComponent(query)}`);
            setSearchResults(response.data.filter((user: User) => user.id !== currentUser.id));
            setIsSearching(false);
        } catch (error) {
            console.error('Error searching users:', error);
            setIsSearching(false);
            toast({
                title: 'Error',
                description: 'Failed to search users. Please try again.',
                variant: 'destructive',
            });
        }
    };

    // Handle creating a new direct chat
    const handleCreateDirectChat = (user: User) => {
        // Check if chat already exists
        const existingChat = chats.find(c => c.type === 'direct' && c.id === user.id);

        if (existingChat) {
            setSelectedChat(existingChat);
        } else {
            // Create new chat locally
            const newChat: Chat = {
                id: user.id,
                type: 'direct',
                name: user.name,
                avatar: user.avatar,
                status: user.status
            };

            setChats(prev => [newChat, ...prev]);
            setSelectedChat(newChat);
        }

        setShowNewChatModal(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    // Handle creating a new group chat
    const handleCreateGroupChat = async () => {
        if (!groupName.trim() || selectedUsers.length === 0) return;

        try {
            const response = await axios.post('/api/groups', {
                name: groupName,
                members: selectedUsers.map(user => user.id)
            });

            const newGroup: Chat = {
                id: response.data.id,
                type: 'group',
                name: groupName,
                participants: [...selectedUsers, currentUser]
            };

            setChats(prev => [newGroup, ...prev]);
            setSelectedChat(newGroup);
            setShowNewGroupModal(false);
            setGroupName('');
            setSelectedUsers([]);

            toast({
                title: 'Success',
                description: 'Group created successfully.',
            });
        } catch (error) {
            console.error('Error creating group:', error);
            toast({
                title: 'Error',
                description: 'Failed to create group. Please try again.',
                variant: 'destructive',
            });
        }
    };

    // Handle message reaction
    const handleMessageReaction = async (messageId: string | number, emoji: string) => {
        try {
            if (!selectedChat) return;

            // Add reaction locally first for UI responsiveness
            setMessages(prev => prev.map(msg => {
                if (msg.id === messageId) {
                    const reactions = msg.reactions || [];
                    const existingReaction = reactions.findIndex(r => r.emoji === emoji);

                    if (existingReaction >= 0) {
                        // Update existing reaction
                        const updatedReactions = [...reactions];
                        updatedReactions[existingReaction] = {
                            ...updatedReactions[existingReaction],
                            count: updatedReactions[existingReaction].count + 1,
                            users: [...updatedReactions[existingReaction].users, currentUser.id]
                        };
                        return { ...msg, reactions: updatedReactions };
                    } else {
                        // Add new reaction
                        return {
                            ...msg,
                            reactions: [
                                ...reactions,
                                { emoji, count: 1, users: [currentUser.id] }
                            ]
                        };
                    }
                }
                return msg;
            }));

            // Send to server
            let endpoint = '';
            if (selectedChat.type === 'direct') {
                endpoint = `/api/direct-messages/${messageId}/reactions`;
            } else {
                endpoint = `/api/groups/${selectedChat.id}/messages/${messageId}/reactions`;
            }

            await axios.post(endpoint, { emoji });
        } catch (error) {
            console.error('Error adding reaction:', error);
            toast({
                title: 'Error',
                description: 'Failed to add reaction. Please try again.',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="h-screen flex bg-gradient-to-br from-background via-background to-muted/20">
            {/* Sidebar */}
            <motion.div
                variants={slideInVariants}
                initial="hidden"
                animate="visible"
                className="w-80 border-r border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
            >
                <ChatSidebar
                    chats={chats}
                    selectedChat={selectedChat}
                    onChatSelect={setSelectedChat}
                    onNewChat={() => setShowNewChatModal(true)}
                    onNewGroup={() => setShowNewGroupModal(true)}
                    currentUserId={currentUser.id}
                    isLoading={isLoading}
                />
            </motion.div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedChat ? (
                    <>
                        {/* Chat Header */}
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <ChatHeader
                                chat={{
                                    id: selectedChat.id,
                                    name: selectedChat.name,
                                    avatar: selectedChat.avatar,
                                    type: selectedChat.type,
                                    status: selectedChat.status,
                                    participants: selectedChat.participants
                                }}
                            />
                        </motion.div>

                        {/* Messages Area */}
                        <motion.div
                            className="flex-1 flex flex-col"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <ChatList
                                messages={messages}
                                currentUserId={currentUser.id}
                                isLoading={isLoadingMessages}
                                onReply={handleReply}
                                onDelete={handleDeleteMessage}
                            />
                        </motion.div>

                        {/* Chat Input */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <ChatInput
                                onSendMessage={sendMessage}
                                isDisabled={isSending}
                                placeholder={`Message ${selectedChat.name}...`}
                                replyingTo={replyingTo}
                                onCancelReply={() => setReplyingTo(null)}
                            />
                        </motion.div>
                    </>
                ) : (
                    <motion.div
                        className="flex-1 flex items-center justify-center"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="p-12 text-center bg-gradient-to-br from-muted/30 to-muted/10 border-dashed">
                            <div className="text-6xl mb-6">💬</div>
                            <h2 className="text-2xl font-bold mb-4">Welcome to Chat!</h2>
                            <p className="text-muted-foreground mb-6">
                                Select a conversation to start messaging or create a new one.
                            </p>
                            <Button onClick={() => setShowNewChatModal(true)} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Start New Conversation
                            </Button>
                        </Card>
                    </motion.div>
                )}
            </div>

            {/* New Chat Modal */}
            <Dialog open={showNewChatModal} onOpenChange={setShowNewChatModal}>
                <DialogContent className="sm:max-w-md">
                    <Card className="border-0 shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                New Conversation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        searchUsers(e.target.value);
                                    }}
                                    className="w-full"
                                />
                            </div>
                            
                            <ScrollArea className="h-64">
                                <div className="space-y-2">
                                    {isSearching ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        searchResults.map((user) => (
                                            <motion.div
                                                key={user.id}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    className="w-full justify-start gap-3 h-auto p-3"
                                                    onClick={() => handleCreateDirectChat(user)}
                                                >
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={user.avatar} alt={user.name} />
                                                        <AvatarFallback>
                                                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 text-left">
                                                        <div className="font-medium">{user.name}</div>
                                                        <div className="text-sm text-muted-foreground">{user.email}</div>
                                                    </div>
                                                </Button>
                                            </motion.div>
                                        ))
                                    ) : searchQuery ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No users found
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            Start typing to search for users
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </DialogContent>
            </Dialog>

            {/* New Group Modal */}
            <Dialog open={showNewGroupModal} onOpenChange={setShowNewGroupModal}>
                <DialogContent>
                    <div className="space-y-4">
                        <div className="text-xl font-semibold">Create New Group</div>

                        <div>
                            <Input
                                placeholder="Group name"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="mb-4"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {selectedUsers.map(user => (
                                <div
                                    key={user.id}
                                    className="flex items-center gap-1 bg-primary-100 dark:bg-gray-700 px-2 py-1 rounded-full"
                                >
                                    <span className="text-xs">{user.name}</span>
                                    <button
                                        onClick={() => setSelectedUsers(prev => prev.filter(u => u.id !== user.id))}
                                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search users to add..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    if (e.target.value.length >= 2) {
                                        searchUsers(e.target.value);
                                    }
                                }}
                                className="pl-10 pr-4"
                            />
                        </div>

                        <div className="relative">
                            {isSearching ? (
                                <div className="flex justify-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 dark:border-neon-green"></div>
                                </div>
                            ) : (
                                <ScrollArea className="h-60">
                                    <AnimatePresence>
                                        {searchResults.length > 0 ? (
                                            <div className="space-y-2">
                                                {searchResults
                                                    .filter(user => !selectedUsers.some(selected => selected.id === user.id))
                                                    .map((user) => (
                                                        <motion.div
                                                            key={user.id}
                                                            className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                                                            onClick={() => setSelectedUsers(prev => [...prev, user])}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10 }}
                                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                            whileHover={{ scale: 1.02 }}
                                                        >
                                                            <div className="flex items-center">
                                                                <Avatar className="h-10 w-10">
                                                                    <AvatarImage src={user.avatar} alt={user.name} />
                                                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="ml-3">
                                                                    <div className="font-medium">{user.name}</div>
                                                                    {user.email && <div className="text-xs text-gray-500">{user.email}</div>}
                                                                </div>
                                                            </div>
                                                            <EnhancedButton size="sm" variant="ghost" icon={<Plus className="h-4 w-4" />}>
                                                                Add
                                                            </EnhancedButton>
                                                        </motion.div>
                                                    ))}
                                            </div>
                                        ) : searchQuery.length >= 2 ? (
                                            <div className="text-center py-4 text-gray-500">
                                                No users found
                                            </div>
                                        ) : null}
                                    </AnimatePresence>
                                </ScrollArea>
                            )}
                        </div>

                        <div className="mt-4 flex justify-between">
                            <EnhancedButton
                                variant="outline"
                                onClick={() => setShowNewGroupModal(false)}
                            >
                                Cancel
                            </EnhancedButton>
                            <EnhancedButton
                                onClick={handleCreateGroupChat}
                                disabled={!groupName || selectedUsers.length === 0}
                                icon={<Users className="h-4 w-4" />}
                            >
                                Create Group
                            </EnhancedButton>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
