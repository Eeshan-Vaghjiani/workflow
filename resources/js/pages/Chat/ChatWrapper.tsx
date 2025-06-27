import React from 'react';
import { Head } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import ChatInterface from '@/pages/Chat/ChatInterface';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from '@/lib/theme-constants';

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
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="h-full w-full"
            >
                <motion.div variants={itemVariants}>
                    <ChatInterface currentUser={auth.user} />
                </motion.div>
            </motion.div>
        </AppSidebarLayout>
    );
}
