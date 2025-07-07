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
    onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    description,
    icon,
    trend,
    className,
    onClick,
}) => {
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
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
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
                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        {icon}
                    </div>
                )}
            </div>
        </Card>
    );
};
