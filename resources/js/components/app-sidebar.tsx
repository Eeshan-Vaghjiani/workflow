import React, { useEffect, useState, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { motion, Variants } from 'framer-motion';
import { type NavItem, PageProps } from '@/types';
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
    ChevronRight,
    Sparkles
} from 'lucide-react';
import AppLogo from './app-logo';
import { useMagneticHover } from '@/hooks/use-animation';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { PromptCounter } from '@/components/pricing/PromptCounter';

// Animation variants for initial load only
const sidebarVariants: Variants = {
    hidden: {
        opacity: 1,
        x: 0
    },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            when: "beforeChildren",
            staggerChildren: 0.08,
            delayChildren: 0.1
        }
    }
};

// Animation variants for items
const itemVariants: Variants = {
    hidden: {
        x: -100, // Start further left off-screen
        opacity: 0,
        scale: 0.8
    },
    visible: (i) => ({
        x: 0,
        opacity: 1,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 70,
            damping: 8,
            delay: i * 0.08 // Slightly faster delay
        }
    }),
    initial: { scale: 1, x: 0 },
    hover: {
        scale: 1.05,
        x: 8,
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

// Extend the User type to include AI prompt properties
interface ExtendedUser {
    id: number;
    name: string;
    email: string;
    ai_prompts_remaining?: number;
    is_paid_user?: boolean;
    total_prompts_purchased?: number;
}

export function AppSidebar() {
    const { url, props } = usePage<PageProps>();
    const [shouldAnimate, setShouldAnimate] = useState(true);
    const logoRef = useRef<HTMLDivElement>(null);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('app_sidebar_collapsed') === 'true';
        }
        return false;
    });

    // Get user prompt data from auth props
    const user = props.auth?.user as ExtendedUser;
    const promptsRemaining = user?.ai_prompts_remaining || 0;
    const isPaidUser = user?.is_paid_user || false;
    const totalPromptsPurchased = user?.total_prompts_purchased || 0;

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
                {mainNavItems.map((item, index) => {
                    const isActive = url.startsWith(item.href);
                    const IconComponent = item.icon;

                    return (
                        <motion.div
                            key={item.title}
                            variants={itemVariants}
                            initial={shouldAnimate ? "hidden" : "visible"}
                            animate="visible"
                            custom={index}
                            whileHover="hover"
                        >
                            <Link
                                href={item.href}
                                className="block"
                            >
                                <motion.div
                                    className={`flex items-center ${isCollapsed ? "justify-center" : ""} px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                                        ${isActive
                                            ? 'bg-softBlue/60 dark:bg-gray-800/50 text-primary-500 dark:text-neon-green shadow-sm backdrop-blur-sm'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-softBlue/30 dark:hover:bg-gray-800/30'
                                        }`}
                                >
                                    <motion.div
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
                {settingsNavItems.map((item, index) => {
                    const isActive = url.startsWith(item.href);
                    const IconComponent = item.icon;

                    return (
                        <motion.div
                            key={item.title}
                            variants={itemVariants}
                            initial={shouldAnimate ? "hidden" : "visible"}
                            animate="visible"
                            custom={index}
                            whileHover="hover"
                        >
                            <Link
                                href={item.href}
                                className="block"
                            >
                                <motion.div
                                    className={`flex items-center ${isCollapsed ? "justify-center" : ""} px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                                        ${isActive
                                            ? 'bg-softBlue/60 dark:bg-gray-800/50 text-primary-500 dark:text-neon-green shadow-sm backdrop-blur-sm'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-softBlue/30 dark:hover:bg-gray-800/30'
                                        }`}
                                >
                                    <motion.div
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
            className={`fixed inset-y-0 left-0 z-20 flex flex-col bg-white/80 dark:bg-gray-900/80 shadow-sm backdrop-blur-md border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'
                }`}
            variants={sidebarVariants}
            initial={shouldAnimate ? "hidden" : "visible"}
            animate="visible"
        >
            <div className="flex items-center justify-between p-4">
                <div ref={logoRef} className={`flex-shrink-0 ${isCollapsed ? 'mx-auto' : ''}`}>
                    <AppLogo />
                </div>
                <EnhancedButton
                    onClick={toggleCollapse}
                    variant="ghost"
                    size="sm"
                    className={`${isCollapsed ? 'absolute -right-3 top-5 bg-white dark:bg-gray-800 rounded-full shadow-sm' : ''}`}
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </EnhancedButton>
            </div>

            {/* AI Prompts Counter */}
            {!isCollapsed && (
                <div className="px-4 mb-2">
                    <PromptCounter
                        promptsRemaining={promptsRemaining}
                        totalPurchased={totalPromptsPurchased}
                        isPaidUser={isPaidUser}
                    />
                    <Link
                        href="/pricing"
                        className="flex items-center justify-center mt-2 py-1.5 px-2 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors"
                    >
                        <Sparkles className="w-3 h-3 mr-1" />
                        Buy AI Prompts
                    </Link>
                </div>
            )}

            <div className="flex-1 overflow-y-auto futuristic-scrollbar">
                <AnimatedNavMain />
            </div>

            <div className="mt-auto">
                <SettingsNav />
            </div>
        </motion.aside>
    );
}
