import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Settings, UserPlus, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { GlassContainer } from '@/components/ui/glass-container';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { motion, AnimatePresence } from 'framer-motion';
import { containerVariants, itemVariants } from '@/lib/theme-constants';

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
    selectedChat?: Chat | null;
    onChatSelect: (chat: Chat) => void;
    onNewChat: () => void;
    onNewGroup: () => void;
    currentUserId: number;
    isLoading?: boolean;
}

export function ChatSidebar({
    chats,
    selectedChat,
    onChatSelect,
    onNewChat,
    onNewGroup,
    currentUserId,
    isLoading = false,
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
        } catch {
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

    const handleSettingsClick = () => {
        // Settings functionality to be implemented
        console.log('Settings clicked');
    };

    return (
        <motion.div
            className="flex flex-col h-full"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
        >
            {/* Header */}
            <GlassContainer className="p-4 m-2 mb-0 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Chats</h2>
                <div className="flex space-x-1">
                    <EnhancedButton variant="ghost" size="sm" onClick={onNewChat}>
                        <UserPlus className="h-5 w-5" />
                    </EnhancedButton>
                    <EnhancedButton variant="ghost" size="sm" onClick={onNewGroup}>
                        <Users className="h-5 w-5" />
                    </EnhancedButton>
                    <EnhancedButton variant="ghost" size="sm" onClick={handleSettingsClick}>
                        <Settings className="h-5 w-5" />
                    </EnhancedButton>
                </div>
            </GlassContainer>

            {/* Search */}
            <div className="p-3 mx-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <Input
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-gray-100/50 dark:bg-gray-700/50 border-0 rounded-xl"
                    />
                </div>
            </div>

            {/* Chat List */}
            <ScrollArea className="flex-1 px-2">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="p-4 text-center"
                        >
                            <GlassContainer className="p-4">
                                <p className="text-gray-500 dark:text-gray-400">
                                    Loading conversations...
                                </p>
                            </GlassContainer>
                        </motion.div>
                    ) : filteredChats.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="p-4 text-center"
                        >
                            <GlassContainer className="p-4">
                                <p className="text-gray-500 dark:text-gray-400">
                                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                                </p>
                            </GlassContainer>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chatList"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-2 py-2"
                        >
                            {filteredChats.map((chat, index) => {
                                const isSelected = selectedChat?.id === chat.id;
                                const isOnline = chat.type === 'direct' && chat.status === 'online';
                                
                                // Create unique key using chat id and type to prevent duplicates
                                const uniqueKey = `${chat.type}-${chat.id}-${index}`;

                                return (
                                    <motion.div
                                        key={uniqueKey}
                                        variants={itemVariants}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                        onClick={() => onChatSelect(chat)}
                                    >
                                        <GlassContainer
                                            className={`p-3 cursor-pointer ${isSelected ? 'bg-white/20 dark:bg-black/30 border-primary/50' : ''}`}
                                            hoverEffect={true}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Avatar with online indicator */}
                                                <div className="relative flex-shrink-0">
                                                    <Avatar className="h-12 w-12 border-2 border-white/20 dark:border-gray-800/50">
                                                        {chat.avatar ? (
                                                            <AvatarImage src={chat.avatar} alt={chat.name} />
                                                        ) : (
                                                            <AvatarFallback className="bg-gradient-to-br from-primary-100 to-primary-300 dark:from-gray-700 dark:to-gray-900">
                                                                {getInitials(chat.name)}
                                                            </AvatarFallback>
                                                        )}
                                                    </Avatar>
                                                    {isOnline && (
                                                        <motion.span
                                                            className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"
                                                            initial={{ scale: 0.8 }}
                                                            animate={{ scale: [0.8, 1.2, 0.8] }}
                                                            transition={{ repeat: Infinity, duration: 2 }}
                                                        ></motion.span>
                                                    )}
                                                    {chat.type === 'group' && (
                                                        <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                                            <Users className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Chat info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center">
                                                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
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
                                                            <Badge className="ml-2 bg-gradient-to-r from-primary to-blue-500">{chat.unreadCount}</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </GlassContainer>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </ScrollArea>

            {/* New Chat Button */}
            <div className="p-3 mx-2 mb-2">
                <EnhancedButton
                    className="w-full flex items-center gap-2"
                    variant="primary"
                    onClick={onNewChat}
                    icon={<Plus className="h-5 w-5" />}
                    iconPosition="left"
                >
                    New Chat
                </EnhancedButton>
            </div>
        </motion.div>
    );
}
