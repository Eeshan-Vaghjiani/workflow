"use client"

import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger';
    size?: 'sm' | 'md' | 'lg';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = 'default', size = 'md', ...props }, ref) => {
        const variantClasses = {
            default: 'bg-[#00887A] text-white',
            secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
            outline: 'bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300',
            success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        };

        const sizeClasses = {
            sm: 'text-xs px-2 py-0.5',
            md: 'text-xs px-2.5 py-0.5',
            lg: 'text-sm px-3 py-1',
        };

        return (
            <span
                ref={ref}
                className={cn(
                    'inline-flex items-center font-medium rounded-full',
                    variantClasses[variant],
                    sizeClasses[size],
                    className
                )}
                {...props}
            />
        );
    }
);
