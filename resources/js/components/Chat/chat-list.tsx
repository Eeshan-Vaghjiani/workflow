import React, { useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, isToday, isYesterday } from 'date-fns';
import { MoreHorizontal, Check, CheckCheck, Trash, Reply, Forward, Copy, Pin } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
}

interface ChatListProps {
    messages: Message[];
    currentUserId: number;
    isLoading?: boolean;
    onMessageDelete?: (messageId: string | number) => void;
    onMessageReply?: (message: Message) => void;
    onMessageReaction?: (messageId: string | number, emoji: string) => void;
    onMessageForward?: (message: Message) => void;
    conversationType: 'direct' | 'group';
}

export function ChatList({
    messages = [],
    currentUserId,
    isLoading = false,
    onMessageDelete,
    onMessageReply,
    onMessageReaction,
    onMessageForward,
    conversationType,
}: ChatListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Format the date for message grouping
    const formatMessageDate = (dateString?: string) => {
        if (!dateString) {
            return 'Unknown Date';
        }
        const date = new Date(dateString);
        if (isToday(date)) {
            return 'Today';
        } else if (isYesterday(date)) {
            return 'Yesterday';
        } else {
            return format(date, 'MMMM d, yyyy');
        }
    };

    // Group messages by date
    const groupedMessages = messages && messages.length > 0
        ? messages.reduce((groups: Record<string, Message[]>, message) => {
            const date = formatMessageDate(message.created_at || message.timestamp);
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(message);
            return groups;
        }, {})
        : {};

    // Get initials from name
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase();
    };

    // Format time for display
    const formatTime = (dateString?: string) => {
        if (!dateString) {
            return '';
        }
        const date = new Date(dateString);
        return format(date, 'h:mm a');
    };

    // Render status indicators for sent messages
    const renderMessageStatus = (status?: string) => {
        switch (status) {
            case 'sent':
                return <Check className="h-3.5 w-3.5 text-gray-400" />;
            case 'delivered':
                return <CheckCheck className="h-3.5 w-3.5 text-gray-400" />;
            case 'read':
                return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
            default:
                return <Check className="h-3.5 w-3.5 text-gray-400" />;
        }
    };

    // Add message reaction button
    const handleReaction = (messageId: string | number, emoji: string) => {
        if (onMessageReaction) {
            onMessageReaction(messageId, emoji);
        }
    };

    // Add emoji reaction component
    const EmojiReactions = ({ message }: { message: Message }) => {
        return (
            <div className="flex gap-1 mt-1">
                {message.reactions && message.reactions.map((reaction, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-sm cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                        onClick={() => handleReaction(message.id, reaction.emoji)}
                    >
                        <span>{reaction.emoji}</span>
                        <span className="text-gray-600 dark:text-gray-400 text-xs">
                            {reaction.count}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto p-4 space-y-6 bg-gray-50 dark:bg-gray-900">
            {isLoading ? (
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
                </div>
            ) : (
                Object.entries(groupedMessages).map(([date, dateMessages]) => (
                    <div key={date} className="space-y-3">
                        <div className="flex justify-center">
                            <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-3 py-1 rounded-full">
                                {date}
                            </div>
                        </div>

                        {dateMessages.map((message, index) => {
                            const isFromMe = message.sender_id === currentUserId || message.is_from_me;
                            const showSender =
                                conversationType === 'group' &&
                                !isFromMe &&
                                (index === 0 || dateMessages[index - 1].sender_id !== message.sender_id);

                            return (
                                <div
                                    key={message.id}
                                    className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex ${isFromMe ? 'flex-row-reverse' : 'flex-row'} max-w-[80%] group`}>
                                        {/* Avatar (only shown for received messages in group chats when sender changes) */}
                                        {!isFromMe && conversationType === 'group' && showSender && (
                                            <div className="flex-shrink-0 mt-auto">
                                                <Avatar className="h-8 w-8">
                                                    {message.user?.avatar ? (
                                                        <AvatarImage src={message.user.avatar} alt={message.user.name} />
                                                    ) : (
                                                        <AvatarFallback>
                                                            {message.user?.name ? getInitials(message.user.name) : '?'}
                                                        </AvatarFallback>
                                                    )}
                                                </Avatar>
                                            </div>
                                        )}

                                        {/* Message content */}
                                        <div
                                            className={`flex flex-col ${isFromMe ? 'items-end mr-2' : 'items-start ml-2'}`}
                                        >
                                            {/* Sender name for group chats */}
                                            {conversationType === 'group' && !isFromMe && showSender && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1">
                                                    {message.user?.name}
                                                </div>
                                            )}

                                            {/* Message bubble */}
                                            <div className="flex items-end gap-1">
                                                {/* Context menu for messages */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align={isFromMe ? 'end' : 'start'}>
                                                        <DropdownMenuItem onClick={() => onMessageReply?.(message)}>
                                                            <Reply className="h-4 w-4 mr-2" />
                                                            Reply
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onMessageForward?.(message)}>
                                                            <Forward className="h-4 w-4 mr-2" />
                                                            Forward
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() =>
                                                            navigator.clipboard.writeText(message.content)
                                                        }>
                                                            <Copy className="h-4 w-4 mr-2" />
                                                            Copy
                                                        </DropdownMenuItem>
                                                        {isFromMe && (
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => onMessageDelete?.(message.id)}
                                                            >
                                                                <Trash className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem>
                                                            <Pin className="h-4 w-4 mr-2" />
                                                            Pin
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>

                                                <div
                                                    className={`
                            px-3 py-2 rounded-2xl max-w-full break-words
                            ${isFromMe
                                                            ? 'bg-blue-500 text-white rounded-br-none'
                                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
                                                        }
                          `}
                                                >
                                                    {message.content}

                                                    {/* Message timestamp */}
                                                    <div
                                                        className={`
                              text-xs mt-1 flex justify-end items-center gap-1
                              ${isFromMe ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}
                            `}
                                                    >
                                                        {formatTime(message.created_at || message.timestamp)}
                                                        {isFromMe && renderMessageStatus(message.status)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Message reactions */}
                                            <EmojiReactions message={message} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))
            )}
            <div ref={messagesEndRef} />
        </div>
    );
}
