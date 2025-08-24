import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MessageCircle, Users, Plus, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassContainer } from '@/components/ui/glass-container';
import axios from 'axios';

interface User {
    id: number;
    name: string;
    avatar?: string;
    email?: string;
    status?: string;
}

interface Group {
    id: number;
    name: string;
    description?: string;
    avatar?: string;
    memberCount?: number;
    unreadCount?: number;
    lastMessage?: {
        content: string;
        timestamp: string;
        sender?: string;
    };
}

interface Conversation {
    user: User;
    lastMessage?: {
        content: string;
        timestamp: string;
        is_read: boolean;
        is_from_me: boolean;
    };
    unreadCount: number;
}

interface Props {
    auth: {
        user: User;
    };
}

export default function ChatNavigation({ auth }: Props) {
    const breadcrumbs = [{ title: 'Chat', href: '/chat' }];
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [usersResponse, groupsResponse, conversationsResponse] = await Promise.all([
                axios.get('/api/users'),
                axios.get('/api/groups'),
                axios.get('/api/conversations')
            ]);

            setUsers(usersResponse.data || []);
            setGroups(groupsResponse.data || []);
            setConversations(conversationsResponse.data || []);
        } catch (error) {
            console.error('Error loading chat data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredUsers = users.filter(user => 
        user.id !== auth.user.id && 
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredGroups = groups.filter(group => 
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title="Chat" />
            
            <motion.div 
                className="p-6 space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Messages</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Connect with your colleagues and groups
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search users and groups..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Recent Conversations */}
                {conversations.length > 0 && (
                    <GlassContainer className="p-6">
                        <CardHeader className="px-0 pb-4">
                            <CardTitle className="flex items-center gap-2">
                                <MessageCircle className="h-5 w-5" />
                                Recent Conversations
                            </CardTitle>
                        </CardHeader>
                        <ScrollArea className="h-[200px]">
                            <div className="space-y-2">
                                {conversations.map((conversation) => (
                                    <Link
                                        key={conversation.user.id}
                                        href={`/chat/direct/${conversation.user.id}`}
                                        className="block"
                                    >
                                        <motion.div
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={conversation.user.avatar} alt={conversation.user.name} />
                                                <AvatarFallback>
                                                    {conversation.user.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                                    {conversation.user.name}
                                                </p>
                                                {conversation.lastMessage && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                        {conversation.lastMessage.content}
                                                    </p>
                                                )}
                                            </div>
                                            {conversation.unreadCount > 0 && (
                                                <Badge variant="destructive" className="ml-2">
                                                    {conversation.unreadCount}
                                                </Badge>
                                            )}
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        </ScrollArea>
                    </GlassContainer>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Users */}
                    <GlassContainer className="p-6">
                        <CardHeader className="px-0 pb-4">
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Users ({filteredUsers.length})
                            </CardTitle>
                        </CardHeader>
                        <ScrollArea className="h-[400px]">
                            <div className="space-y-2">
                                {isLoading ? (
                                    <p className="text-gray-500 dark:text-gray-400">Loading users...</p>
                                ) : filteredUsers.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400">No users found</p>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <Link
                                            key={user.id}
                                            href={`/chat/direct/${user.id}`}
                                            className="block"
                                        >
                                            <motion.div
                                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={user.avatar} alt={user.name} />
                                                    <AvatarFallback>
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {user.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {user.email}
                                                    </p>
                                                </div>
                                                {user.status && (
                                                    <div className={`w-3 h-3 rounded-full ${
                                                        user.status === 'online' ? 'bg-green-500' :
                                                        user.status === 'away' ? 'bg-yellow-500' :
                                                        'bg-gray-400'
                                                    }`} />
                                                )}
                                            </motion.div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </GlassContainer>

                    {/* Groups */}
                    <GlassContainer className="p-6">
                        <CardHeader className="px-0 pb-4">
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Groups ({filteredGroups.length})
                                </div>
                                <Button size="sm" variant="outline">
                                    <Plus className="h-4 w-4 mr-1" />
                                    New Group
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <ScrollArea className="h-[400px]">
                            <div className="space-y-2">
                                {isLoading ? (
                                    <p className="text-gray-500 dark:text-gray-400">Loading groups...</p>
                                ) : filteredGroups.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400">No groups found</p>
                                ) : (
                                    filteredGroups.map((group) => (
                                        <Link
                                            key={group.id}
                                            href={`/chat/group/${group.id}`}
                                            className="block"
                                        >
                                            <motion.div
                                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={group.avatar} alt={group.name} />
                                                    <AvatarFallback>
                                                        <Users className="h-5 w-5" />
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {group.name}
                                                        </p>
                                                        {group.unreadCount && group.unreadCount > 0 && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                {group.unreadCount}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {group.description || `${group.memberCount || 0} members`}
                                                    </p>
                                                    {group.lastMessage && (
                                                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
                                                            {group.lastMessage.sender}: {group.lastMessage.content}
                                                        </p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </GlassContainer>
                </div>
            </motion.div>
        </AppSidebarLayout>
    );
}
