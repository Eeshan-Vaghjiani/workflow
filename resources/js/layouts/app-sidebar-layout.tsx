import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren, useEffect, useState } from 'react';
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
    const [isMounted, setIsMounted] = useState(false);

    // Handle client-side rendering
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Handle server-side rendering
    if (!isMounted && typeof window === 'undefined') {
        return null;
    }

    return (
        <AppShell variant="sidebar">
            <div className="flex h-full w-full">
                <div className="flex-shrink-0">
                    <AppSidebar />
                </div>
                <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                    <motion.div
                        variants={headerVariants}
                        initial="initial"
                        animate="animate"
                        className="px-1 pt-1"
                    >
                        <GlassContainer
                            className="mb-2"
                            blurIntensity="sm"
                            border={true}
                        >
                            <AppSidebarHeader breadcrumbs={breadcrumbs} />
                        </GlassContainer>
                    </motion.div>

                    <motion.main
                        className="flex-1 overflow-y-auto p-2 md:p-3 bg-gradient-to-br from-softBlue/20 to-white/10 dark:from-gray-800/30 dark:to-gray-900/20 futuristic-scrollbar h-full flex flex-col"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={contentVariants}
                    >
                        {children}
                    </motion.main>
                </div>
            </div>
        </AppShell>
    );
}
