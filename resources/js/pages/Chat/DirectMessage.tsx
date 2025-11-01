import React, { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { ChatInterface } from '@/pages/Chat/ChatInterface';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface User {
    id: number;
    name: string;
    avatar?: string;
    email?: string;
}

interface Props {
    auth: {
        user: User;
    };
    targetUser: User;
    userId: number;
}

export default function DirectMessage({ auth, targetUser, userId }: Props) {
    const breadcrumbs = [
        { title: 'Chat', href: '/chat' },
        { title: targetUser?.name || 'Direct Message', href: `/chat/direct/${userId}` }
    ];

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title={`Chat with ${targetUser?.name || 'User'}`} />
            
            <div className="h-full flex flex-col">
                {/* Header with back button */}
                <div className="flex items-center gap-3 p-4 border-b dark:border-gray-700">
                    <Link href="/chat">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {targetUser?.name || 'Direct Message'}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {targetUser?.email}
                        </p>
                    </div>
                </div>

                {/* Chat Interface */}
                <div className="flex-1 overflow-hidden">
                    <ChatInterface 
                        currentUser={auth.user} 
                        selectedUser={targetUser}
                        chatType="direct"
                    />
                </div>
            </div>
        </AppSidebarLayout>
    );
}
