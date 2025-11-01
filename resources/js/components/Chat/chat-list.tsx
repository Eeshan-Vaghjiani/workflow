import React, { useEffect, useRef } from 'react';
import { ChatMessage } from './chat-message';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Attachment {
    id: number;
    file_name: string;
    file_type: string;
    file_size: number;
    file_url: string;
}

interface MessageUser {
    id: number;
    name: string;
    avatar?: string;
}

export interface Message {
    id: number | string;
    content: string;
    message?: string; // fallback field name
    user?: MessageUser;
    sender?: MessageUser; // fallback field name
    sender_id?: number;
    user_id?: number;
    timestamp?: string;
    created_at?: string;
    status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
    is_from_me?: boolean;
    attachments?: Attachment[];
    parent_id?: number | string;
    parent?: {
        id: number | string;
        content: string;
        user: MessageUser;
    };
}

interface ChatListProps {
    messages: Message[];
    currentUserId: number;
    isLoading?: boolean;
    className?: string;
    onReply?: (messageId: number | string) => void;
    onEdit?: (messageId: number | string) => void;
    onDelete?: (messageId: number | string) => void;
    onReaction?: (messageId: number | string, emoji: string) => void;
}

const typingIndicatorVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { type: "spring", stiffness: 400, damping: 25 }
    }
};

export function ChatList({
    messages,
    currentUserId,
    isLoading = false,
    className = '',
    onReply,
    onEdit,
    onDelete,
    onReaction,
}: ChatListProps) {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        const scrollToBottom = () => {
            if (endOfMessagesRef.current) {
                endOfMessagesRef.current.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'end'
                });
            }
        };

        // Use setTimeout to ensure the DOM has updated
        const timer = setTimeout(scrollToBottom, 100);
        return () => clearTimeout(timer);
    }, [messages]);

    const formatMessage = (msg: Message): Message => {
        // Normalize message data to handle different API response formats
        const user = msg.user || msg.sender || {
            id: msg.sender_id || msg.user_id || 0,
            name: 'Unknown User',
            avatar: undefined
        };

        const content = msg.content || msg.message || '';
        const timestamp = msg.timestamp || 
            (msg.created_at ? new Date(msg.created_at).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            }) : '');

        return {
            ...msg,
            content,
            user,
            timestamp,
            is_from_me: msg.is_from_me ?? (user.id === currentUserId),
            attachments: msg.attachments || []
        };
    };

    const groupMessagesByDate = (messages: Message[]) => {
        const groups: { [key: string]: Message[] } = {};
        
        messages.forEach(msg => {
            const date = msg.created_at ? 
                new Date(msg.created_at).toDateString() : 
                new Date().toDateString();
            
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(formatMessage(msg));
        });

        return groups;
    };

    const formatDateHeader = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    };

    const messageGroups = groupMessagesByDate(messages);

    if (isLoading && messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading messages...</span>
                </div>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <Card className="p-8 text-center bg-gradient-to-br from-muted/30 to-muted/10 border-dashed">
                    <div className="text-4xl mb-4">💬</div>
                    <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                    <p className="text-muted-foreground">
                        Start the conversation by sending a message!
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <ScrollArea 
            ref={scrollAreaRef} 
            className={`flex-1 ${className}`}
        >
            <div className="p-2 space-y-6">
                <AnimatePresence mode="popLayout">
                    {Object.entries(messageGroups).map(([date, groupMessages]) => (
                        <motion.div
                            key={date}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="space-y-1"
                        >
                            {/* Date Header */}
                            <div className="flex justify-center py-2">
                                <Card className="px-3 py-1 bg-muted/50 border-0">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {formatDateHeader(date)}
                                    </span>
                                </Card>
                            </div>

                            {/* Messages for this date */}
                            <AnimatePresence mode="popLayout">
                                {groupMessages.map((message) => (
                                    <motion.div
                                        key={message.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    >
                                        <ChatMessage
                                            id={message.id}
                                            content={message.content}
                                            user={message.user!}
                                            timestamp={message.timestamp!}
                                            isFromMe={message.is_from_me!}
                                            status={message.status}
                                            attachments={message.attachments}
                                            isReply={!!message.parent_id}
                                            replyTo={message.parent}
                                            onReply={onReply}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                            onReaction={onReaction}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Typing Indicator */}
                {isLoading && messages.length > 0 && (
                    <motion.div
                        variants={typingIndicatorVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="flex items-center gap-3 px-4 py-2"
                    >
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        </div>
                        <span className="text-sm text-muted-foreground">Someone is typing...</span>
                    </motion.div>
                )}

                {/* Invisible div to scroll to */}
                <div ref={endOfMessagesRef} className="h-1" />
            </div>
        </ScrollArea>
    );
}
