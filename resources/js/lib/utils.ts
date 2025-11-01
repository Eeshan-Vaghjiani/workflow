import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names and merges Tailwind classes efficiently
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}
