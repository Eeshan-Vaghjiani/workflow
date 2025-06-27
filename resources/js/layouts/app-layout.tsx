import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode, useEffect } from 'react';
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

const childVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    },
    exit: { opacity: 0, y: -20 }
};

export default function AppLayout({ children, breadcrumbs, ...props }: AppLayoutProps) {
    // Get theme from appearance hook
    const { theme } = useAppearance();

    // Apply additional settings from localStorage
    useEffect(() => {
        // Apply color scheme
        const colorScheme = localStorage.getItem('colorScheme') || 'teal';
        const colorMap: Record<string, { primary: string, secondary: string, accent: string, neon: string }> = {
            teal: {
                primary: '#00887A',
                secondary: '#D3E3FC',
                accent: '#FFCCBC',
                neon: '#00FFA3'
            },
            blue: {
                primary: '#2563EB',
                secondary: '#DBEAFE',
                accent: '#C7D2FE',
                neon: '#00D4FF'
            },
            purple: {
                primary: '#7C3AED',
                secondary: '#EDE9FE',
                accent: '#DDD6FE',
                neon: '#C4B5FD'
            },
            emerald: {
                primary: '#059669',
                secondary: '#D1FAE5',
                accent: '#A7F3D0',
                neon: '#6EE7B7'
            },
            amber: {
                primary: '#D97706',
                secondary: '#FEF3C7',
                accent: '#FDE68A',
                neon: '#FBBF24'
            },
            cyber: {
                primary: '#FF0080',
                secondary: '#0C0032',
                accent: '#00FFFF',
                neon: '#FF00FF'
            },
        };

        if (colorMap[colorScheme]) {
            document.documentElement.style.setProperty('--primary-color', colorMap[colorScheme].primary);
            document.documentElement.style.setProperty('--secondary-color', colorMap[colorScheme].secondary);
            document.documentElement.style.setProperty('--accent-color', colorMap[colorScheme].accent);
            document.documentElement.style.setProperty('--neon-color', colorMap[colorScheme].neon);
        }

        // Apply motion settings
        if (localStorage.getItem('reduceMotion') === 'true') {
            document.body.classList.add('reduce-motion');
        } else {
            document.body.classList.remove('reduce-motion');
        }
    }, []);

    // Determine if we should use the mouse follower (not on touch or reduce motion devices)
    const shouldUseMouseFollower =
        typeof window !== 'undefined' &&
        !('ontouchstart' in window) &&
        localStorage.getItem('reduceMotion') !== 'true';

    return (
        <div className="flex h-screen bg-white dark:bg-gray-900 cursor-hover-area">
            {shouldUseMouseFollower && <MouseFollower theme={theme} />}

            <AnimatePresence mode="wait">
                <motion.div
                    key={window.location.pathname}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                    className="flex flex-1 overflow-hidden"
                >
                    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
                        <motion.div
                            variants={childVariants}
                            className="mx-auto max-w-7xl"
                        >
                            {children}
                        </motion.div>
                    </AppLayoutTemplate>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
