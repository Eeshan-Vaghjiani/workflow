import React, { useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, isToday, isYesterday } from 'date-fns';
import { MoreHorizontal, Check, CheckCheck, Trash, Reply, Forward, Copy, Pin, CornerUpLeft } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface Message {
    id: string | number;
    content: string;
    sender_id: number;
    timestamp?: string;
    created_at: string;
    user?: {
        id: number;
        name: string;
        avatar?: string;
    };
    status?: 'sent' | 'delivered' | 'read' | 'failed';
    is_from_me?: boolean;
    group_id?: number;
    receiver_id?: number;
    reactions?: {
        emoji: string;
        count: number;
        users: number[];
    }[];
    parent_id?: string | number;
    parent?: {
        id: string | number;
        content: string;
        sender?: {
            id: number;
            name: string;
        }
    };
    deleted_at?: string;
    attachment?: {
        id: number;
        file_path: string;
        file_name: string;
        file_type: string;
        file_size: number;
    };
}

interface ChatListProps {
    messages: Message[];
    currentUserId: number;
    isLoading?: boolean;
    onMessageDelete?: (messageId: string | number) => void;
    onMessageReply?: (message: Message) => void;
    onMessageReaction?: (messageId: string | number, emoji: string) => void;
    onMessageForward?: (message: Message) => void;
    onMessagePin?: (messageId: string | number) => void;
    onMessageUnpin?: (messageId: string | number) => void;
    pinnedMessages?: Message[];
    conversationType?: 'direct' | 'group';
}

export function ChatList({
    messages = [],
    currentUserId,
    isLoading = false,
    onMessageDelete,
    onMessageReply,
    onMessageReaction,
    onMessageForward,
    onMessagePin,
    onMessageUnpin,
    pinnedMessages = [],
    conversationType = 'direct',
}: ChatListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Group messages by date
    const groupedMessages = useMemo(() => {
        return messages.reduce((groups: { [key: string]: Message[] }, message) => {
            if (!message.created_at) return groups;

            try {
                const date = new Date(message.created_at);
                if (isNaN(date.getTime())) return groups;

                const dateKey = date.toISOString().split('T')[0]; // Use ISO date string for consistent keys
                if (!groups[dateKey]) {
                    groups[dateKey] = [];
                }
                groups[dateKey].push(message);
            } catch (error) {
                console.error('Error grouping message:', error);
            }
            return groups;
        }, {});
    }, [messages]);

    // Format date for display
    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '';

        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return ''; // Invalid date

            if (isToday(date)) {
                return 'Today';
            }
            if (isYesterday(date)) {
                return 'Yesterday';
            }
            return format(date, 'MMMM d, yyyy');
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    };

    // Format time for display
    const formatTime = (dateStr: string | null | undefined) => {
        if (!dateStr) return '';

        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return ''; // Invalid date
            return format(date, 'h:mm a');
        } catch (error) {
            console.error('Error formatting time:', error);
            return '';
        }
    };

    // Render status indicators for sent messages
    const renderMessageStatus = (status?: string) => {
        switch (status) {
            case 'sent':
                return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
            case 'delivered':
                return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
            case 'read':
                return <CheckCheck className="h-3.5 w-3.5 text-primary" />;
            default:
                return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
        }
    };

    // Add message reaction button
    const handleReaction = useCallback((messageId: string | number, emoji: string) => {
        if (onMessageReaction) {
            onMessageReaction(messageId, emoji);
        }
    }, [onMessageReaction]);

    // Check if a message is pinned
    const isMessagePinned = useCallback((messageId: string | number) => {
        return pinnedMessages.some(pinnedMessage => pinnedMessage.id === messageId);
    }, [pinnedMessages]);

    // Add emoji reaction component
    const EmojiReactions = memo(({ message }: { message: Message }) => {
        return (
            <div className="flex gap-1 mt-1">
                {message.reactions && message.reactions.map((reaction) => (
                    <div
                        key={`${message.id}-${reaction.emoji}`}
                        className="flex items-center gap-1 bg-muted/50 dark:bg-muted/20 px-2 py-0.5 rounded-full text-sm cursor-pointer hover:bg-muted dark:hover:bg-muted/30"
                        onClick={() => handleReaction(message.id, reaction.emoji)}
                    >
                        <span>{reaction.emoji}</span>
                        <span className="text-muted-foreground text-xs">
                            {reaction.count}
                        </span>
                    </div>
                ))}
            </div>
        );
    });

    // Render attachment if present
    const renderAttachment = (message: Message) => {
        if (!message.attachment) return null;

        const isImage = message.attachment.file_type.startsWith('image/');
        const isPDF = message.attachment.file_type === 'application/pdf';
        const isVideo = message.attachment.file_type.startsWith('video/');

        return (
            <div className="mt-2 mb-1">
                {isImage ? (
                    <a
                        href={message.attachment.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                    >
                        <img
                            src={message.attachment.file_path}
                            alt={message.attachment.file_name}
                            className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-border"
                        />
                    </a>
                ) : isVideo ? (
                    <video
                        controls
                        className="max-w-[200px] max-h-[200px] rounded-lg border border-border"
                    >
                        <source src={message.attachment.file_path} type={message.attachment.file_type} />
                        Your browser does not support the video tag.
                    </video>
                ) : (
                    <a
                        href={message.attachment.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 dark:bg-muted/20 hover:bg-muted dark:hover:bg-muted/30"
                    >
                        <div className="bg-muted dark:bg-muted/50 p-2 rounded">
                            {isPDF ? '📄' : '📎'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate text-foreground">
                                {message.attachment.file_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {(message.attachment.file_size / 1024).toFixed(1)} KB
                            </div>
                        </div>
                    </a>
                )}
            </div>
        );
    };

    return (
        <ScrollArea ref={scrollAreaRef} className="chat-container h-full">
            <div className="chat-messages">
                {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                    <div key={date} className="space-y-4">
                        <div className="chat-date-divider">
                            <span className="chat-date-label">
                                {formatDate(date)}
                            </span>
                        </div>
                        {dateMessages.map((message, index) => {
                            const isFromMe = message.sender_id === currentUserId;
                            const isDeleted = !!message.deleted_at;
                            const isPinned = isMessagePinned(message.id);
                            const showAvatar = !isFromMe && (!index || dateMessages[index - 1]?.sender_id !== message.sender_id);
                            const showSenderName = conversationType === 'group' && !isFromMe && showAvatar;

                            return (
                                <div
                                    key={message.id}
                                    className={cn(
                                        "chat-message",
                                        isFromMe ? "chat-message-sent" : "chat-message-received"
                                    )}
                                >
                                    {/* Avatar */}
                                    {!isFromMe && (
                                        <div className={cn("flex-shrink-0", !showAvatar && "invisible")}>
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={message.user?.avatar} />
                                                <AvatarFallback>
                                                    {message.user?.name?.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                    )}

                                    {/* Message Content */}
                                    <div className="flex flex-col gap-1 max-w-[70%]">
                                        {/* Sender Name for Group Chat */}
                                        {showSenderName && (
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {message.user?.name}
                                            </span>
                                        )}

                                        {/* Parent Message (if replying) */}
                                        {message.parent && (
                                            <div
                                                className={cn(
                                                    "flex items-center gap-2 text-xs",
                                                    isFromMe ? "justify-end" : "justify-start"
                                                )}
                                            >
                                                <CornerUpLeft className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-muted-foreground">
                                                    Replying to {message.parent.sender?.name || 'message'}
                                                </span>
                                            </div>
                                        )}

                                        {/* Message Bubble */}
                                        <div
                                            className={cn(
                                                "chat-bubble",
                                                isPinned && "ring-2 ring-primary ring-opacity-50",
                                                isFromMe ? "chat-bubble-sent" : "chat-bubble-received",
                                                isDeleted && "bg-muted/20 dark:bg-muted/10 text-muted-foreground italic"
                                            )}
                                        >
                                            {/* Pinned indicator */}
                                            {isPinned && (
                                                <div className="absolute -top-2 -right-2 text-primary">
                                                    <Pin className="h-4 w-4" />
                                                </div>
                                            )}

                                            {/* Attachment if present */}
                                            {renderAttachment(message)}

                                            {/* Message text content */}
                                            <div className="break-words">
                                                {message.content}
                                            </div>

                                            {/* Message metadata */}
                                            <div
                                                className={cn(
                                                    "flex items-center gap-1 mt-1",
                                                    isFromMe ? "justify-end" : "justify-start"
                                                )}
                                            >
                                                <span className="text-[10px] text-muted-foreground">
                                                    {formatTime(message.created_at)}
                                                </span>
                                                {isFromMe && renderMessageStatus(message.status)}
                                            </div>
                                        </div>

                                        {/* Reactions */}
                                        <EmojiReactions message={message} />

                                        {/* Message Actions */}
                                        <div
                                            className={cn(
                                                "chat-message-actions",
                                                isFromMe ? "self-end" : "self-start"
                                            )}
                                        >
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 rounded-full"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">More actions</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align={isFromMe ? 'end' : 'start'}>
                                                    {onMessageReply && !isDeleted && (
                                                        <DropdownMenuItem onClick={() => onMessageReply(message)}>
                                                            <Reply className="h-4 w-4 mr-2" />
                                                            Reply
                                                        </DropdownMenuItem>
                                                    )}
                                                    {onMessageForward && !isDeleted && (
                                                        <DropdownMenuItem onClick={() => onMessageForward(message)}>
                                                            <Forward className="h-4 w-4 mr-2" />
                                                            Forward
                                                        </DropdownMenuItem>
                                                    )}
                                                    {!isDeleted && (
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(message.content);
                                                            }}
                                                        >
                                                            <Copy className="h-4 w-4 mr-2" />
                                                            Copy
                                                        </DropdownMenuItem>
                                                    )}
                                                    {onMessagePin && !isDeleted && (
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                if (isPinned) {
                                                                    onMessageUnpin?.(message.id);
                                                                } else {
                                                                    onMessagePin(message.id);
                                                                }
                                                            }}
                                                        >
                                                            <Pin className="h-4 w-4 mr-2" />
                                                            {isPinned ? 'Unpin' : 'Pin'}
                                                        </DropdownMenuItem>
                                                    )}
                                                    {onMessageDelete && isFromMe && !isDeleted && (
                                                        <DropdownMenuItem
                                                            onClick={() => onMessageDelete(message.id)}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <Trash className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-center py-4">
                        <div className="animate-pulse flex space-x-2">
                            <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
                            <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
                            <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>
        </ScrollArea>
    );
}
