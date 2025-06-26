import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useAppearance } from '@/hooks/use-appearance';
import MouseFollower from '@/components/ui/mouse-follower';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

// const navigation = [
//     { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
//     { name: 'Tasks', href: '/tasks', icon: CheckSquareIcon },
//     { name: 'Groups', href: '/groups', icon: UsersIcon },
//     { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
//     { name: 'Settings', href: '/settings', icon: SettingsIcon },
// ];

// Define animation variants
const pageVariants: Variants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: "easeOut",
            when: "beforeChildren",
            staggerChildren: 0.1,
        }
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: {
            duration: 0.3,
            ease: "easeInOut"
        }
    }
};

export default function AppLayout({ children, breadcrumbs, ...props }: AppLayoutProps) {
    // Get theme from appearance hook
    const { theme } = useAppearance();

    // Determine if we should use the mouse follower (not on touch or reduce motion devices)
    const shouldUseMouseFollower =
        typeof window !== 'undefined' &&
        !('ontouchstart' in window) &&
        localStorage.getItem('reduceMotion') !== 'true';

    return (
        <>
            {shouldUseMouseFollower && <MouseFollower theme={theme} />}

            <AnimatePresence mode="wait">
                <motion.div
                    key={window.location.pathname}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                    className="app-layout-wrapper"
                >
                    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
                        {children}
                    </AppLayoutTemplate>
                </motion.div>
            </AnimatePresence>
        </>
    );
};
