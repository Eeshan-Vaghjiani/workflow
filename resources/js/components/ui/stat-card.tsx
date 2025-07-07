import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from './card';

export interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon?: React.ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
    variant?: 'default' | 'primary' | 'secondary' | 'success' | 'danger';
    onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    description,
    icon,
    trend,
    className,
    variant = 'default',
    onClick,
}) => {
    const getIconContainerClass = () => {
        switch (variant) {
            case 'primary':
                return 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300';
            case 'secondary':
                return 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300';
            case 'success':
                return 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300';
            case 'danger':
                return 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300';
            default:
                return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300';
        }
    };

    const getValueClass = () => {
        switch (variant) {
            case 'primary':
                return 'text-blue-600 dark:text-blue-300';
            case 'secondary':
                return 'text-purple-600 dark:text-purple-300';
            case 'success':
                return 'text-green-600 dark:text-green-300';
            case 'danger':
                return 'text-red-600 dark:text-red-300';
            default:
                return 'text-gray-900 dark:text-white';
        }
    };

    return (
        <Card
            className={cn(
                'overflow-hidden transition-all duration-200',
                onClick && 'cursor-pointer hover:shadow-md',
                className
            )}
            onClick={onClick}
        >
            <div className="p-6 flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {title}
                    </p>
                    <h3 className={cn("text-2xl font-bold", getValueClass())}>
                        {value}
                    </h3>

                    {trend && (
                        <div className="mt-2 flex items-center">
                            <span
                                className={cn(
                                    'text-xs font-medium mr-1',
                                    trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                )}
                            >
                                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                            </span>
                            <svg
                                className={cn(
                                    'h-3 w-3',
                                    trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                )}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d={trend.isPositive ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
                                />
                            </svg>
                        </div>
                    )}

                    {description && (
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            {description}
                        </p>
                    )}
                </div>

                {icon && (
                    <div className={cn("p-3 rounded-lg", getIconContainerClass())}>
                        {icon}
                    </div>
                )}
            </div>
        </Card>
    );
};
