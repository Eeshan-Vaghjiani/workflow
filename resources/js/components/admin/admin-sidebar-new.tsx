import React, { useEffect, useState, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { motion, Variants } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    Shield,
    BarChart3,
    Settings,
    FileText,
    Bell,
    UserCog
} from 'lucide-react';
import { useMagneticHover } from '@/hooks/use-animation';
import GlassContainer from '@/components/ui/glass-container';

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

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Groups', href: '/admin/groups', icon: Shield },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
    { name: 'Audit Logs', href: '/admin/audit', icon: FileText },
    { name: 'Notifications', href: '/admin/notifications', icon: Bell },
    { name: 'Profile', href: '/admin/profile', icon: UserCog },
];

export const AdminSidebar = () => {
    const { url } = usePage();
    const [shouldAnimate, setShouldAnimate] = useState(true);
    const logoRef = useRef<HTMLDivElement>(null);

    // Apply magnetic effect to logo
    useMagneticHover(logoRef, 0.3);

    // Use session storage to track if the sidebar has been animated before
    useEffect(() => {
        const hasAnimated = sessionStorage.getItem('admin_sidebar_animated');
        if (hasAnimated) {
            setShouldAnimate(false);
        } else {
            sessionStorage.setItem('admin_sidebar_animated', 'true');
        }
    }, []);

    return (
        <motion.aside
            className="w-64 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-r border-gray-200/50 dark:border-gray-700/30 shadow-sm flex-shrink-0 overflow-y-auto futuristic-scrollbar"
            initial={shouldAnimate ? "hidden" : "visible"}
            animate="visible"
            variants={sidebarVariants}
        >
            <div className="px-6 py-6">
                <Link href="/admin" className="flex items-center space-x-2">
                    <motion.div
                        ref={logoRef}
                        className="bg-gradient-to-br from-primary-500 to-primary-600 dark:from-neon-green dark:to-primary-500 rounded-lg p-2 flex items-center justify-center shadow-md shadow-primary-500/20 dark:shadow-neon-green/20"
                        whileHover={{
                            scale: 1.05,
                            boxShadow: "0px 10px 20px 0px rgba(0, 136, 122, 0.3)",
                        }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className="text-white font-bold text-xl">A</span>
                    </motion.div>
                    <motion.span
                        className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        Admin Panel
                    </motion.span>
                </Link>
            </div>

            <nav className="mt-5 px-4 space-y-2">
                {navigation.map((item) => {
                    const isActive = url.startsWith(item.href);

                    return (
                        <motion.div
                            key={item.name}
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
                                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                                        ${isActive
                                            ? 'bg-softBlue/60 dark:bg-gray-800/50 text-primary-500 dark:text-neon-green shadow-sm backdrop-blur-sm'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-softBlue/30 dark:hover:bg-gray-800/30'
                                        }`}
                                >
                                    <motion.div
                                        initial={{ rotate: 0 }}
                                        whileHover={{ rotate: isActive ? 0 : 10 }}
                                        className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-primary-500 dark:text-neon-green' : ''}`}
                                    >
                                        <item.icon />
                                    </motion.div>
                                    <span>{item.name}</span>

                                    {/* Animated indicator for active item */}
                                    {isActive && (
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

            {/* Admin version info with glass effect */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
                <GlassContainer
                    className="pt-4 mt-4 px-3 py-3"
                    blurIntensity="sm"
                    hoverEffect
                >
                    <div className="flex items-center justify-center space-x-2">
                        <motion.div
                            className="h-2 w-2 rounded-full bg-green-500"
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.7, 1, 0.7]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatType: "loop"
                            }}
                        />
                        <p className="text-xs text-center font-medium text-gray-600 dark:text-gray-300">
                            Admin Control Center <span className="text-primary-500 dark:text-neon-green font-semibold">v1.0</span>
                        </p>
                    </div>
                </GlassContainer>
            </div>
        </motion.aside>
    );
};
