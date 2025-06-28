import React, { useEffect, useState, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { motion, Variants } from 'framer-motion';
import { type NavItem } from '@/types';
import {
    LayoutGrid,
    Users,
    ClipboardList,
    CheckSquare,
    Calendar,
    GitBranch,
    Bell,
    MessageCircle,
    BookOpen,
    Timer,
    BrainCircuit,
    CreditCard,
    Settings,
    User,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import AppLogo from './app-logo';
import { useMagneticHover } from '@/hooks/use-animation';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { cn } from '@/lib/utils';

// Animation variants for initial load only
const sidebarVariants: Variants = {
    hidden: {
        x: -300,
        opacity: 0
    },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 20,
            when: "beforeChildren",
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

// Animation variants for items
const itemVariants: Variants = {
    hidden: {
        x: -20,
        opacity: 0
    },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 10
        }
    }
};

// Hover animation for nav items
const navItemHoverVariants: Variants = {
    initial: { scale: 1, x: 0 },
    hover: {
        scale: 1.02,
        x: 5,
        transition: {
            type: "spring",
            stiffness: 400,
            damping: 10
        }
    }
};

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Groups',
        href: '/groups',
        icon: Users,
    },
    {
        title: 'Assignments',
        href: '/assignments',
        icon: ClipboardList,
    },
    {
        title: 'Tasks',
        href: '/tasks',
        icon: CheckSquare,
    },
    {
        title: 'Calendar',
        href: '/calendar',
        icon: Calendar,
    },
    {
        title: 'Gantt Chart',
        href: '/dashboard/gantt',
        icon: GitBranch,
    },
    {
        title: 'Study Planner',
        href: '/study-planner',
        icon: BookOpen,
    },
    {
        title: 'Pomodoro Timer',
        href: '/pomodoro',
        icon: Timer,
    },
    {
        title: 'AI Tasks',
        href: '/ai-tasks',
        icon: BrainCircuit,
    },
    {
        title: 'Chat',
        href: '/chat',
        icon: MessageCircle,
    },
    {
        title: 'Notifications',
        href: '/notifications',
        icon: Bell,
    },
    {
        title: 'Pro Membership',
        href: '/mpesa',
        icon: CreditCard,
    }
];

const settingsNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: '/settings/profile',
        icon: User,
    },
    {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
    }
];

export function AppSidebar() {
    const { url } = usePage();
    const [shouldAnimate, setShouldAnimate] = useState(true);
    const logoRef = useRef<HTMLDivElement>(null);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('app_sidebar_collapsed') === 'true';
        }
        return false;
    });

    // Apply magnetic effect to logo
    useMagneticHover(logoRef, 0.3);

    // Use session storage to track if the sidebar has been animated before
    useEffect(() => {
        const hasAnimated = sessionStorage.getItem('app_sidebar_animated');
        if (hasAnimated) {
            setShouldAnimate(false);
        } else {
            sessionStorage.setItem('app_sidebar_animated', 'true');
        }
    }, []);

    // Save collapsed state to localStorage
    useEffect(() => {
        localStorage.setItem('app_sidebar_collapsed', isCollapsed.toString());
    }, [isCollapsed]);

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    // Custom NavMain component with animations
    const AnimatedNavMain = () => {
        return (
            <nav className="mt-5 px-4 space-y-2">
                {mainNavItems.map((item) => {
                    const isActive = url.startsWith(item.href);
                    const IconComponent = item.icon;

                    return (
                        <motion.div
                            key={item.title}
                            variants={shouldAnimate ? itemVariants : undefined}
                            initial="initial"
                            whileHover="hover"
                        >
                            <Link
                                href={item.href}
                                className="block"
                            >
                                <motion.div
                                    variants={navItemHoverVariants}
                                    className={`flex items-center ${isCollapsed ? "justify-center" : ""} px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                                        ${isActive
                                            ? 'bg-softBlue/60 dark:bg-gray-800/50 text-primary-500 dark:text-neon-green shadow-sm backdrop-blur-sm'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-softBlue/30 dark:hover:bg-gray-800/30'
                                        }`}
                                >
                                    <motion.div
                                        initial={{ rotate: 0 }}
                                        whileHover={{ rotate: isActive ? 0 : 10 }}
                                        className={`${isCollapsed ? "" : "mr-3"} h-5 w-5 flex-shrink-0 ${isActive ? 'text-primary-500 dark:text-neon-green' : ''}`}
                                    >
                                        {IconComponent && <IconComponent />}
                                    </motion.div>
                                    {!isCollapsed && <span>{item.title}</span>}

                                    {/* Animated indicator for active item */}
                                    {isActive && !isCollapsed && (
                                        <motion.div
                                            className="ml-auto h-2 w-2 rounded-full bg-primary-500 dark:bg-neon-green"
                                            animate={{
                                                scale: [1, 1.2, 1],
                                                opacity: [0.7, 1, 0.7]
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                repeatType: "loop"
                                            }}
                                        />
                                    )}
                                </motion.div>
                            </Link>
                        </motion.div>
                    );
                })}
            </nav>
        );
    };

    // Settings navigation component with animations
    const SettingsNav = () => {
        return (
            <nav className="px-4 space-y-2 mb-4">
                {!isCollapsed && (
                    <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        User
                    </h3>
                )}
                {settingsNavItems.map((item) => {
                    const isActive = url.startsWith(item.href);
                    const IconComponent = item.icon;

                    return (
                        <motion.div
                            key={item.title}
                            variants={shouldAnimate ? itemVariants : undefined}
                            initial="initial"
                            whileHover="hover"
                        >
                            <Link
                                href={item.href}
                                className="block"
                            >
                                <motion.div
                                    variants={navItemHoverVariants}
                                    className={`flex items-center ${isCollapsed ? "justify-center" : ""} px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                                        ${isActive
                                            ? 'bg-softBlue/60 dark:bg-gray-800/50 text-primary-500 dark:text-neon-green shadow-sm backdrop-blur-sm'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-softBlue/30 dark:hover:bg-gray-800/30'
                                        }`}
                                >
                                    <motion.div
                                        initial={{ rotate: 0 }}
                                        whileHover={{ rotate: isActive ? 0 : 10 }}
                                        className={`${isCollapsed ? "" : "mr-3"} h-5 w-5 flex-shrink-0 ${isActive ? 'text-primary-500 dark:text-neon-green' : ''}`}
                                    >
                                        {IconComponent && <IconComponent />}
                                    </motion.div>
                                    {!isCollapsed && <span>{item.title}</span>}

                                    {/* Animated indicator for active item */}
                                    {isActive && !isCollapsed && (
                                        <motion.div
                                            className="ml-auto h-2 w-2 rounded-full bg-primary-500 dark:bg-neon-green"
                                            animate={{
                                                scale: [1, 1.2, 1],
                                                opacity: [0.7, 1, 0.7]
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                repeatType: "loop"
                                            }}
                                        />
                                    )}
                                </motion.div>
                            </Link>
                        </motion.div>
                    );
                })}
            </nav>
        );
    };

    return (
        <motion.aside
            className={cn(
                "bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-r border-gray-200/50 dark:border-gray-700/30 shadow-sm flex-shrink-0 overflow-y-auto futuristic-scrollbar transition-all duration-300",
                isCollapsed ? "w-[4.5rem]" : "w-64"
            )}
            initial={shouldAnimate ? "hidden" : "visible"}
            animate="visible"
            variants={sidebarVariants}
        >
            <div className="px-6 py-6">
                <Link href="/dashboard" className="flex items-center space-x-2">
                    <motion.div
                        ref={logoRef}
                        className="bg-gradient-to-br from-primary-500 to-primary-600 dark:from-neon-green dark:to-primary-500 rounded-lg p-2 flex items-center justify-center shadow-md shadow-primary-500/20 dark:shadow-neon-green/20"
                        whileHover={{
                            scale: 1.05,
                            boxShadow: "0px 10px 20px 0px rgba(0, 136, 122, 0.3)",
                        }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <AppLogo />
                    </motion.div>
                    {!isCollapsed && (
                        <motion.span
                            className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            Workflow
                        </motion.span>
                    )}
                </Link>
            </div>

            <AnimatedNavMain />

            <div className="mt-8">
                <SettingsNav />
            </div>

            {/* Collapse/Expand Toggle Button */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <EnhancedButton
                    variant="ghost"
                    size="sm"
                    onClick={toggleCollapse}
                    className="rounded-full p-2 bg-softBlue/30 dark:bg-gray-800/30 hover:bg-softBlue/50 dark:hover:bg-gray-700/50"
                >
                    <motion.div
                        animate={{ rotate: isCollapsed ? 0 : 180 }}
                        transition={{ duration: 0.3 }}
                    >
                        {isCollapsed ? (
                            <ChevronRight className="h-4 w-4 text-primary-500 dark:text-neon-green" />
                        ) : (
                            <ChevronLeft className="h-4 w-4 text-primary-500 dark:text-neon-green" />
                        )}
                    </motion.div>
                </EnhancedButton>
            </div>
        </motion.aside>
    );
}
