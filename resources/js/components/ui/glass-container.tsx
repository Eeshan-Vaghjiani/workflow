import React from 'react';
import { motion, Transition, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassContainerProps {
    children: React.ReactNode;
    className?: string;
    blurIntensity?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    darkMode?: boolean;
    border?: boolean;
    borderColor?: string;
    hoverEffect?: boolean;
    animate?: boolean;
}

export const GlassContainer: React.FC<GlassContainerProps> = ({
    children,
    className = '',
    blurIntensity = 'md',
    darkMode,
    border = true,
    borderColor,
    hoverEffect = false,
    animate = false,
}) => {
    // Create blur class based on intensity
    const blurClass = {
        none: '',
        sm: 'backdrop-blur-sm',
        md: 'backdrop-blur-md',
        lg: 'backdrop-blur-lg',
        xl: 'backdrop-blur-xl',
    }[blurIntensity];

    // Define different styles based on dark mode
    const lightGlass = 'bg-white/10 shadow-sm';
    const darkGlass = 'bg-black/20 shadow-md';

    // Define border styles
    const borderStyle = border
        ? `border ${borderColor || 'border-white/10 dark:border-white/5'}`
        : '';

    // Combine all classes
    const containerClass = cn(
        'rounded-xl',
        blurClass,
        darkMode === undefined ? 'light:bg-white/10 dark:bg-black/20' : darkMode ? darkGlass : lightGlass,
        borderStyle,
        className
    );

    // Define hover effect animation variants
    const hoverVariants: Variants = hoverEffect ? {
        initial: {},
        whileHover: {
            scale: 1.02,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
        }
    } : {};

    // Define hover transition
    const hoverTransition: Transition = {
        type: 'spring',
        stiffness: 300,
        damping: 20
    };

    // Define entry animation variants
    const entryVariants: Variants = animate ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
    } : {};

    // Define entry transition
    const entryTransition: Transition = {
        duration: 0.5,
        ease: 'easeOut'
    };

    return (
        <motion.div
            className={containerClass}
            variants={animate ? entryVariants : (hoverEffect ? hoverVariants : undefined)}
            initial={animate ? "initial" : undefined}
            animate={animate ? "animate" : undefined}
            whileHover={hoverEffect ? "whileHover" : undefined}
            transition={hoverEffect ? hoverTransition : entryTransition}
        >
            {children}
        </motion.div>
    );
};
