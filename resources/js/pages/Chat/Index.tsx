import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
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
            <div className="flex h-full flex-1 flex-col gap-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Chat</h1>
                </div>
                
                <Tabs 
                    value={activeTab} 
                    onValueChange={setActiveTab}
                    className="h-[calc(100vh-180px)]"
                >
                    <TabsList className="w-full grid grid-cols-2 mb-4">
                        <TabsTrigger value="direct">Direct Messages</TabsTrigger>
                        <TabsTrigger value="groups">Group Chats</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="direct" className="h-full border rounded-md overflow-hidden">
                        <DirectMessages currentUserId={currentUserId} />
                    </TabsContent>
                    
                    <TabsContent value="groups" className="h-full border rounded-md overflow-hidden">
                        <GroupChats currentUserId={currentUserId} />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
} 