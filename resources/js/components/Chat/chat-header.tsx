import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Search, ArrowLeft } from 'lucide-react';
import { GlassContainer } from '@/components/ui/glass-container';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { motion } from 'framer-motion';

interface User {
    id: number;
    name: string;
    avatar?: string;
    status?: string;
    lastSeen?: string;
}

interface Group {
    id: number;
    name: string;
    avatar?: string;
    memberCount?: number;
}

interface ChatHeaderProps {
    type: 'direct' | 'group';
    user?: User;
    group?: Group;
    onBackClick?: () => void;
    onSearchClick?: () => void;
    isMobile?: boolean;
}

export function ChatHeader({
    type,
    user,
    group,
    onBackClick,
    onSearchClick,
    isMobile = false,
}: ChatHeaderProps) {
    const name = type === 'direct' ? user?.name : group?.name;
    const avatar = type === 'direct' ? user?.avatar : group?.avatar;
    const status = type === 'direct' ? user?.status : undefined;
    const lastSeen = type === 'direct' ? user?.lastSeen : undefined;
    const memberCount = type === 'group' ? group?.memberCount : undefined;

    // Get initials from name
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase();
    };

    return (
        <GlassContainer className="m-2 mb-0 border-b-0">
            <div className="flex items-center justify-between p-3">
                <motion.div
                    className="flex items-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {isMobile && (
                        <EnhancedButton variant="ghost" size="sm" onClick={onBackClick} className="mr-2">
                            <ArrowLeft className="h-5 w-5" />
                        </EnhancedButton>
                    )}
                    <Avatar className="h-12 w-12 mr-3 border-2 border-white/20 dark:border-gray-800/50">
                        {avatar ? (
                            <AvatarImage src={avatar} alt={name} />
                        ) : (
                            <AvatarFallback className="bg-gradient-to-br from-primary-100 to-primary-300 dark:from-gray-700 dark:to-gray-900">
                                {name ? getInitials(name) : '?'}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <div>
                        <motion.h2
                            className="font-semibold text-gray-900 dark:text-white"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            {name}
                        </motion.h2>
                        {type === 'direct' && status && (
                            <motion.p
                                className="text-xs text-gray-500 dark:text-gray-400 flex items-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                {status === 'online' ? (
                                    <>
                                        <motion.span
                                            className="h-2 w-2 rounded-full bg-green-500 mr-1"
                                            animate={{ scale: [0.8, 1.2, 0.8] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                        ></motion.span>
                                        Online
                                    </>
                                ) : (
                                    lastSeen ? `Last seen ${lastSeen}` : 'Offline'
                                )}
                            </motion.p>
                        )}
                        {type === 'group' && memberCount !== undefined && (
                            <motion.p
                                className="text-xs text-gray-500 dark:text-gray-400"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                {memberCount} members
                            </motion.p>
                        )}
                    </div>
                </motion.div>
                <motion.div
                    className="flex items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <EnhancedButton
                        variant="ghost"
                        size="sm"
                        onClick={onSearchClick}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        title="Search in conversation"
                    >
                        <Search className="h-5 w-5" />
                    </EnhancedButton>
                </motion.div>
            </div>
        </GlassContainer>
    );
}
