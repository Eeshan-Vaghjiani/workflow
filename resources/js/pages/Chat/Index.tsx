import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DirectMessages from './DirectMessages';
import GroupChats from './GroupChats';
import { type BreadcrumbItem } from '@/types';

interface Props {
    currentUserId: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Chat',
        href: '/chat',
    },
];

export default function ChatIndex({ currentUserId }: Props) {
    const [activeTab, setActiveTab] = useState('direct');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Chat" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <Tabs defaultValue="direct" onValueChange={setActiveTab} className="w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold dark:text-white">Messaging</h1>
                            <TabsList>
                                <TabsTrigger value="direct">Direct Messages</TabsTrigger>
                                <TabsTrigger value="groups">Group Chats</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="direct" className="mt-6">
                            <DirectMessages currentUserId={currentUserId} />
                        </TabsContent>

                        <TabsContent value="groups" className="mt-6">
                            <GroupChats currentUserId={currentUserId} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AppLayout>
    );
} 