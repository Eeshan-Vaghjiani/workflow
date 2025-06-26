import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import ChatInterface from './ChatInterface';

interface Props {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            avatar?: string;
        };
    };
    initialGroups?: any[];
}

export default function ChatWrapper({ auth, initialGroups = [] }: Props) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Chat</h2>}
        >
            <Head title="Chat" />
            <div className="py-4">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-0 h-[80vh]">
                            <ChatInterface currentUser={auth.user} />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
