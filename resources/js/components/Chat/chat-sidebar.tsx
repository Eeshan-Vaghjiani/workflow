import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Settings, UserPlus, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface User {
    id: number;
    name: string;
    avatar?: string;
    status?: string;
}

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

interface ChatSidebarProps {
    chats: Chat[];
    selectedChatId?: number;
    onChatSelect: (chat: Chat) => void;
    onNewChat: () => void;
    onNewGroup: () => void;
    onSettingsClick: () => void;
    currentUserId: number;
}

export function ChatSidebar({
    chats,
    selectedChatId,
    onChatSelect,
    onNewChat,
    onNewGroup,
    onSettingsClick,
    currentUserId,
}: ChatSidebarProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter chats based on search query
    const filteredChats = chats.filter(chat =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Format timestamp to relative time (e.g., "2m ago", "Yesterday")
    const formatTimestamp = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            return formatDistanceToNow(date, { addSuffix: true });
        } catch (error) {
            return timestamp;
        }
    };

    // Get initials from name
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase();
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r dark:border-gray-700">
            {/* Header */}
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Chats</h2>
                <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" onClick={onNewChat}>
                        <UserPlus className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onNewGroup}>
                        <Users className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onSettingsClick}>
                        <Settings className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="p-3 border-b dark:border-gray-700">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <Input
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-gray-100 dark:bg-gray-700 border-0"
                    />
                </div>
            </div>

            {/* Chat List */}
            <ScrollArea className="flex-1">
                {filteredChats.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        {searchQuery ? 'No conversations found' : 'No conversations yet'}
                    </div>
                ) : (
                    filteredChats.map(chat => {
                        const isSelected = chat.id === selectedChatId;
                        const isOnline = chat.type === 'direct' && chat.status === 'online';

                        return (
                            <button
                                key={chat.id}
                                className={`
                  w-full flex items-center p-3 gap-3 text-left transition-colors
                  hover:bg-gray-100 dark:hover:bg-gray-700
                  ${isSelected ? 'bg-gray-100 dark:bg-gray-700' : ''}
                  ${chat.unreadCount ? 'font-semibold' : ''}
                `}
                                onClick={() => onChatSelect(chat)}
                            >
                                {/* Avatar with online indicator */}
                                <div className="relative flex-shrink-0">
                                    <Avatar className="h-12 w-12">
                                        {chat.avatar ? (
                                            <AvatarImage src={chat.avatar} alt={chat.name} />
                                        ) : (
                                            <AvatarFallback>{getInitials(chat.name)}</AvatarFallback>
                                        )}
                                    </Avatar>
                                    {isOnline && (
                                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></span>
                                    )}
                                    {chat.type === 'group' && (
                                        <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                            <Users className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                                        </span>
                                    )}
                                </div>

                                {/* Chat info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                            {chat.name}
                                        </h3>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {chat.lastMessage?.timestamp ? formatTimestamp(chat.lastMessage.timestamp) : ''}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                            {chat.lastMessage?.content || 'No messages yet'}
                                        </p>
                                        {chat.unreadCount && chat.unreadCount > 0 && (
                                            <Badge className="ml-2 bg-blue-500">{chat.unreadCount}</Badge>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </ScrollArea>

            {/* New Chat Button */}
            <div className="p-3 border-t dark:border-gray-700">
                <Button
                    className="w-full flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={onNewChat}
                >
                    <Plus className="h-5 w-5" />
                    New Chat
                </Button>
            </div>
        </div>
    );
}
