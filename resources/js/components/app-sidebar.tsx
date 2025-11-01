import React, { useState, useRef, useLayoutEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
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
    Trello,
    LucideIcon
} from 'lucide-react';
import AppLogo from './app-logo';
import { useMagneticHover } from '@/hooks/use-animation';

interface NavItemWithIcon extends NavItem {
    icon: LucideIcon;
    method?: string;
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
        title: 'Kanban',
        href: '/kanban',
        icon: Trello,
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
        method: 'post'
    }
];

export function AppSidebar() {
    const { url } = usePage<PageProps>();
    const controls = useAnimation();
    const hasAnimatedRef = useRef(false);
    const prevUrlRef = useRef(url);
    const logoRef = useRef<HTMLDivElement>(null);
    const [isCollapsed, setIsCollapsed] = useState(false); // Default to expanded

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

    const toggleCollapse = () => {
        setIsCollapsed(prev => !prev);
    };

    // More precise active route check
    const isActiveRoute = (itemHref: string) => {
        // Special case for dashboard to prevent matching with '/dashboard/gantt'
        if (itemHref === '/dashboard' && url === '/dashboard') {
            return true;
        }

        // Handle exact matches
        if (url === itemHref) {
            return true;
        }

        // For other nested routes, check if they start with the itemHref
        // but make sure we're not matching partial segments
        if (itemHref !== '/dashboard' && url.startsWith(itemHref)) {
            // Check if the next character after the href is a slash or nothing
            const nextChar = url.charAt(itemHref.length);
            return nextChar === '' || nextChar === '/';
        }

        return false;
    };

    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        router.post(route('logout'));
    };

    const AnimatedNavMain = () => {
        return (
            <nav className="space-y-1 px-3">
                {mainNavItems.map((item, index) => {
                    const isActive = isActiveRoute(item.href);
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
                                        delay: index * 0.05, // Reduced delay to prevent long animations
                                        duration: 0.2,
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
                    const isActive = isActiveRoute(item.href);
                    const Icon = item.icon;

                    if (item.title === 'Logout') {
                        return (
                            <button
                                key={item.href}
                                onClick={handleLogout}
                                className={`flex items-center w-full px-3 py-2 rounded-md transition-colors text-foreground hover:bg-primary/10 dark:hover:bg-primary/20 ${isCollapsed ? 'justify-center' : ''}`}
                            >
                                <Icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-2'}`} />
                                {!isCollapsed && (
                                    <span>{item.title}</span>
                                )}
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
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
                    );
                })}
            </nav>
        );
    };

    return (
        <aside className={`bg-card border-r border-border transition-all duration-300 flex flex-col ${isCollapsed ? 'w-[70px]' : 'w-[240px]'}`}>
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div ref={logoRef} className={`transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                    <AppLogo />
                </div>
                <button
                    onClick={toggleCollapse}
                    className="p-2 rounded-lg hover:bg-accent transition-colors"
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-5 w-5" />
                    ) : (
                        <ChevronLeft className="h-5 w-5" />
                    )}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto futuristic-scrollbar">
                <div className="p-2">
                    {isCollapsed ? (
                        <button
                            onClick={() => router.visit('/pricing')}
                            className="w-full p-2 flex flex-col items-center justify-center bg-primary text-white dark:text-black rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <Sparkles className="h-5 w-5" />
                        </button>
                    ) : (
                        <Link
                            href="/pricing"
                            className="w-full p-2 flex items-center justify-center bg-primary text-white dark:text-black rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <Sparkles className="h-5 w-5 mr-2" />
                            <span>Buy AI Prompts</span>
                        </Link>
                    )}
                </div>

                <AnimatedNavMain />
            </div>

            <div className="border-t border-border p-2">
                <SettingsNav />
            </div>
        </aside>
    );
}
