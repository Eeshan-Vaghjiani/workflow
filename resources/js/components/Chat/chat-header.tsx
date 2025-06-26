import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Phone, Video, Search, ArrowLeft } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    onInfoClick?: () => void;
    onSearchClick?: () => void;
    isMobile?: boolean;
}

export function ChatHeader({
    type,
    user,
    group,
    onBackClick,
    onInfoClick,
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
        <div className="flex items-center justify-between p-3 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center">
                {isMobile && (
                    <Button variant="ghost" size="icon" onClick={onBackClick} className="mr-2">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}
                <Avatar className="h-10 w-10 mr-3">
                    {avatar ? (
                        <AvatarImage src={avatar} alt={name} />
                    ) : (
                        <AvatarFallback>{name ? getInitials(name) : '?'}</AvatarFallback>
                    )}
                </Avatar>
                <div>
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">{name}</h2>
                    {type === 'direct' && status && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            {status === 'online' ? (
                                <>
                                    <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                                    Online
                                </>
                            ) : (
                                lastSeen ? `Last seen ${lastSeen}` : 'Offline'
                            )}
                        </p>
                    )}
                    {type === 'group' && memberCount !== undefined && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {memberCount} members
                        </p>
                    )}
                </div>
            </div>
            <div className="flex items-center space-x-1">
                {type === 'direct' && (
                    <>
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                            <Phone className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                            <Video className="h-5 w-5" />
                        </Button>
                    </>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onSearchClick}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                    <Search className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onInfoClick}>
                            {type === 'direct' ? 'Contact Info' : 'Group Info'}
                        </DropdownMenuItem>
                        <DropdownMenuItem>Clear Chat</DropdownMenuItem>
                        {type === 'group' && (
                            <DropdownMenuItem>Leave Group</DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-red-600 dark:text-red-400">
                            Block {type === 'direct' ? 'User' : 'Group'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
