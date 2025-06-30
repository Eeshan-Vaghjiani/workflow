import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { motion, useAnimation } from 'framer-motion';
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
    User,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    LogOut,
    LucideIcon
} from 'lucide-react';
import AppLogo from './app-logo';
import { useMagneticHover } from '@/hooks/use-animation';
import { EnhancedButton } from '@/components/ui/enhanced-button';

interface NavItemWithIcon extends NavItem {
    icon: LucideIcon;
}

const mainNavItems: NavItemWithIcon[] = [
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

const settingsNavItems: NavItemWithIcon[] = [
    {
        title: 'Profile',
        href: '/settings/profile',
        icon: User,
    },
    {
        title: 'Logout',
        href: route('logout'),
        icon: LogOut,
    }
];

export function AppSidebar() {
    const { url } = usePage<PageProps>();
    const controls = useAnimation();
    const hasAnimatedRef = useRef(false);
    const prevUrlRef = useRef(url);
    const logoRef = useRef<HTMLDivElement>(null);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('app_sidebar_collapsed') === 'true';
        }
        return false;
    });

    // Apply magnetic effect to logo
    useMagneticHover(logoRef, 0.3);

    // Handle initial animation and page navigation
    useLayoutEffect(() => {
        const shouldAnimate = !hasAnimatedRef.current || prevUrlRef.current !== url;

        if (shouldAnimate) {
            controls.start({
                x: 0,
                opacity: 1,
                transition: { duration: 0.3, ease: "easeOut" }
            });
            hasAnimatedRef.current = true;
        }

        prevUrlRef.current = url;
    }, [url, controls]);

    // Save collapsed state to localStorage
    useEffect(() => {
        localStorage.setItem('app_sidebar_collapsed', isCollapsed.toString());
    }, [isCollapsed]);

    const toggleCollapse = () => {
        setIsCollapsed(prev => !prev);
    };

    const AnimatedNavMain = () => {
        return (
            <nav className="space-y-1 px-3">
                {mainNavItems.map((item, index) => {
                    const isActive = url.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                        <motion.div
                            key={item.href}
                            custom={index}
                            initial={!hasAnimatedRef.current ? { x: -20, opacity: 0 } : false}
                            animate={controls}
                            variants={{
                                visible: {
                                    x: 0,
                                    opacity: 1,
                                    transition: {
                                        delay: index * 0.1,
                                        duration: 0.3,
                                        ease: "easeOut"
                                    }
                                }
                            }}
                            whileHover={{
                                x: 5,
                                transition: {
                                    duration: 0.2
                                }
                            }}
                            className="mb-1"
                        >
                            <Link
                                href={item.href}
                                className={`flex items-center px-3 py-2 rounded-md transition-colors ${isActive
                                    ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground'
                                    : 'text-foreground hover:bg-primary/10 dark:hover:bg-primary/20'
                                    } ${isCollapsed ? 'justify-center' : ''}`}
                            >
                                <Icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-2'} ${isActive ? 'text-primary dark:text-primary-foreground' : ''}`} />
                                {!isCollapsed && (
                                    <span className={`${isActive ? 'font-medium' : ''}`}>{item.title}</span>
                                )}
                            </Link>
                        </motion.div>
                    );
                })}
            </nav>
        );
    };

    const SettingsNav = () => {
        return (
            <nav className="space-y-1 px-3">
                {settingsNavItems.map((item) => {
                    const isActive = url.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            {...(item.title === 'Logout' ? { method: 'post' } : {})}
                            className={`flex items-center px-3 py-2 rounded-md transition-colors ${isActive
                                ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground'
                                : 'text-foreground hover:bg-primary/10 dark:hover:bg-primary/20'
                                } ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            <Icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-2'} ${isActive ? 'text-primary dark:text-primary-foreground' : ''}`} />
                            {!isCollapsed && (
                                <span className={`${isActive ? 'font-medium' : ''}`}>{item.title}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>
        );
    };

    return (
        <motion.aside
            className={`fixed inset-y-0 left-0 z-20 flex flex-col bg-white/80 dark:bg-gray-900/80 shadow-sm backdrop-blur-md border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'
                }`}
            initial={!hasAnimatedRef.current ? { x: -20, opacity: 0 } : false}
            animate={controls}
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

            {/* AI Prompts Buy Button */}
            {!isCollapsed && (
                <div className="px-4 mb-2">
                    <Link
                        href="/pricing"
                        className="flex items-center justify-center py-1.5 px-2 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors"
                    >
                        <Sparkles className="w-3 h-3 mr-1" />
                        Buy AI Prompts
                    </Link>
                </div>
            )}

            <div className="flex-1 overflow-y-auto futuristic-scrollbar">
                <AnimatedNavMain />
            </div>

            <div className="p-3">
                <SettingsNav />
            </div>
        </motion.aside>
    );
}
