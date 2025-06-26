import { AppContent } from '@/components/app-content';
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
            <AppContent variant="sidebar" className="bg-softBlue/30 dark:bg-gray-900">
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

                <motion.div
                    variants={contentVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="h-full"
                >
                    {children}
                </motion.div>
            </AppContent>
        </AppShell>
    );
}
