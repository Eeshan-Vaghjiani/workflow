import React, { useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, isToday, isYesterday } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
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
}

interface ChatListProps {
    messages: Message[];
    currentUserId: number;
    isLoading?: boolean;
    onMessageDelete?: (messageId: string | number) => void;
    onMessageReaction?: (messageId: string | number, emoji: string) => void;
    conversationType?: 'direct' | 'group';
}

export function ChatList({
    messages,
    currentUserId,
    isLoading,
    conversationType = 'direct'
}: ChatListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const formatMessageDate = (date: string) => {
        const messageDate = new Date(date);
        if (isToday(messageDate)) {
            return format(messageDate, 'h:mm a');
        }
        if (isYesterday(messageDate)) {
            return 'Yesterday';
        }
        return format(messageDate, 'MMM d');
    };

    const renderMessageStatus = (status?: 'sent' | 'delivered' | 'read' | 'failed') => {
        switch (status) {
            case 'read':
                return <CheckCheck className="h-4 w-4 text-primary" />;
            case 'delivered':
                return <CheckCheck className="h-4 w-4 text-muted-foreground" />;
            case 'sent':
                return <Check className="h-4 w-4 text-muted-foreground" />;
            default:
                return null;
        }
    };

    return (
        <div className="flex-1 h-full overflow-hidden">
            <ScrollArea ref={scrollRef} className="h-full pt-4">
                <div className="space-y-4 px-4 pb-4">
                    {isLoading ? (
                        <div className="flex justify-center">
                            <div className="animate-pulse flex space-x-4">
                                <div className="h-3 w-3 bg-muted-foreground/20 rounded-full"></div>
                                <div className="h-3 w-3 bg-muted-foreground/20 rounded-full"></div>
                                <div className="h-3 w-3 bg-muted-foreground/20 rounded-full"></div>
                            </div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex justify-center items-center h-full">
                            <p className="text-muted-foreground text-sm">No messages yet</p>
                        </div>
                    ) : (
                        messages.map((message, index) => {
                            const isFromMe = message.sender_id === currentUserId;
                            const showAvatar = !isFromMe && conversationType === 'group';
                            const prevMessage = messages[index - 1];
                            const nextMessage = messages[index + 1];
                            const isFirstInGroup = !prevMessage || prevMessage.sender_id !== message.sender_id;
                            const isLastInGroup = !nextMessage || nextMessage.sender_id !== message.sender_id;
                            const showDate = !prevMessage || !isSameDay(new Date(prevMessage.created_at), new Date(message.created_at));

                            return (
                                <React.Fragment key={message.id}>
                                    {showDate && (
                                        <div className="flex justify-center my-4">
                                            <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                                                {formatMessageDate(message.created_at)}
                                            </span>
                                        </div>
                                    )}
                                    <div
                                        className={cn(
                                            "flex gap-2",
                                            isFromMe ? "justify-end" : "justify-start",
                                            !isLastInGroup && "mb-1"
                                        )}
                                    >
                                        {showAvatar && isFirstInGroup && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={message.user?.avatar} />
                                                <AvatarFallback>
                                                    {message.user?.name[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                        {showAvatar && !isFirstInGroup && <div className="w-8" />}
                                        <div
                                            className={cn(
                                                "group relative max-w-[70%] rounded-2xl px-4 py-2 text-sm",
                                                isFromMe
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted/50 text-foreground",
                                                isFirstInGroup && !isFromMe && "rounded-tl-sm",
                                                !isLastInGroup && !isFromMe && "rounded-bl-sm",
                                                isFirstInGroup && isFromMe && "rounded-tr-sm",
                                                !isLastInGroup && isFromMe && "rounded-br-sm"
                                            )}
                                        >
                                            {conversationType === 'group' && !isFromMe && isFirstInGroup && (
                                                <div className="text-xs font-medium text-primary mb-1">
                                                    {message.user?.name}
                                                </div>
                                            )}
                                            {message.content}
                                            <div
                                                className={cn(
                                                    "absolute bottom-1 text-[10px]",
                                                    isFromMe ? "-left-12 flex items-center gap-1" : "-right-12"
                                                )}
                                            >
                                                <span className="text-muted-foreground">
                                                    {format(new Date(message.created_at), 'h:mm a')}
                                                </span>
                                                {isFromMe && renderMessageStatus(message.status)}
                                            </div>
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

function isSameDay(date1: Date, date2: Date) {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}
