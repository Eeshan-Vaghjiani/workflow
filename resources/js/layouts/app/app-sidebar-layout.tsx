
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';
import { motion, Variants } from 'framer-motion';
import { GlassContainer } from '@/components/ui/glass-container';

// Define animation variants
const contentVariants: Variants = {
    initial: {
        opacity: 0,
        x: 20
    },
    animate: {
        opacity: 1,
        x: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15,
            when: "beforeChildren",
            staggerChildren: 0.1
        }
    },
    exit: {
        opacity: 0,
        x: -20,
        transition: {
            duration: 0.3
        }
    }
};

const headerVariants: Variants = {
    initial: { opacity: 0, y: -20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};

export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                <motion.div
                    variants={headerVariants}
                    initial="initial"
                    animate="animate"
                >
                    <GlassContainer
                        className="mb-4"
                        blurIntensity="sm"
                        border={true}
                    >
                        <AppSidebarHeader breadcrumbs={breadcrumbs} />
                    </GlassContainer>
                </motion.div>

                <motion.main
                    className="flex-1 overflow-y-auto p-4 md:p-6 bg-softBlue/30 dark:bg-gray-800/30 futuristic-scrollbar h-full flex flex-col"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={contentVariants}
                >
                    {children}
                </motion.main>
            </div>
        </AppShell>
    );
}
