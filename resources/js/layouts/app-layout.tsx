import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

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
    const [isMounted, setIsMounted] = useState(false);

    // Apply additional settings from localStorage
    useEffect(() => {
        setIsMounted(true);

        try {
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
        } catch (error) {
            console.error('Error applying theme settings:', error);
        }
    }, []);

    // Handle server-side rendering
    if (!isMounted && typeof window === 'undefined') {
        return null;
    }

    return (
        <div className="flex h-screen bg-background text-foreground">
            <AnimatePresence mode="wait">
                <motion.div
                    key={window.location.pathname}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                    className="flex flex-1 overflow-hidden h-full"
                >
                    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
                        <motion.div
                            variants={childVariants}
                            className="mx-auto max-w-7xl h-full"
                        >
                            {children}
                        </motion.div>
                    </AppLayoutTemplate>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
