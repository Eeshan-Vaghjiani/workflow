import React from 'react';
import { Head } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import ChatInterface from '@/pages/Chat/ChatInterface';

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
}

export default function ChatWrapper({ auth }: Props) {
    const breadcrumbs = [{ title: 'Chat', href: '/chat' }];

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title="Chat" />
            <ChatInterface currentUser={auth.user} />
        </AppSidebarLayout>
    );
}
