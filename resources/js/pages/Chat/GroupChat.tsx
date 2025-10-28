import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { ChatInterface } from '@/pages/Chat/ChatInterface';
import { ArrowLeft, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface User {
    id: number;
    name: string;
    avatar?: string;
    email?: string;
}

interface Group {
    id: number;
    name: string;
    description?: string;
    avatar?: string;
    memberCount?: number;
    members?: User[];
}

interface Props {
    auth: {
        user: User;
    };
    group: Group;
    groupId: number;
}

export default function GroupChat({ auth, group, groupId }: Props) {
    const breadcrumbs = [
        { title: 'Chat', href: '/chat' },
        { title: group?.name || 'Group Chat', href: `/chat/group/${groupId}` }
    ];

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title={`${group?.name || 'Group Chat'}`} />
            
            <div className="h-full flex flex-col">
                {/* Header with back button */}
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <Link href="/chat">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={group?.avatar} alt={group?.name} />
                            <AvatarFallback>
                                <Users className="h-5 w-5" />
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {group?.name || 'Group Chat'}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {group?.memberCount ? `${group.memberCount} members` : group?.description}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                            <Settings className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Chat Interface */}
                <div className="flex-1 overflow-hidden">
                    <ChatInterface 
                        currentUser={auth.user} 
                        selectedGroup={group}
                        chatType="group"
                    />
                </div>
            </div>
        </AppSidebarLayout>
    );
}