import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMagneticHover } from '@/hooks/use-animation';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';
type IconPosition = 'left' | 'right' | 'top';

interface EnhancedButtonProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: IconPosition;
    fullWidth?: boolean;
    magnetic?: boolean;
    magneticStrength?: number;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    type?: "button" | "submit" | "reset";
    [key: string]: any;
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    magnetic = true,
    magneticStrength = 0.2,
    disabled = false,
    className = '',
    children,
    ...props
}) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    // Only apply magnetic effect if enabled and button is not disabled or loading
    const magneticEnabled = magnetic && !disabled && !loading;
    const { isHovered } = useMagneticHover(
        buttonRef,
        magneticEnabled ? magneticStrength : 0
    );

    // Base classes for button
    const baseClasses = 'relative inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    // Size classes
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs rounded-md',
        md: 'px-4 py-2 text-sm rounded-lg',
        lg: 'px-6 py-3 text-base rounded-lg',
    }[size];

    // Variant classes - these include both light and dark mode classes
    const variantClasses = {
        primary: 'bg-[#00887A] hover:bg-[#007A6C] text-white dark:bg-[#00C9A7] dark:hover:bg-[#00B397] dark:text-black focus:ring-[#D3E3FC] dark:focus:ring-[#00C9A7]',
        secondary: 'bg-[#77A6F7] hover:bg-[#6495E6] text-white dark:bg-[#60A5FA] dark:hover:bg-[#5094E9] dark:text-black focus:ring-[#D3E3FC] dark:focus:ring-[#60A5FA]',
        outline: 'border border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-gray-500 dark:focus:ring-gray-400',
        ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-gray-500 dark:focus:ring-gray-400',
        danger: 'bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800 focus:ring-red-500',
    }[variant];

    // Disabled styles
    const disabledClasses = (disabled || loading)
        ? 'opacity-50 cursor-not-allowed pointer-events-none'
        : '';

    // Full width class
    const widthClass = fullWidth ? 'w-full' : '';

    // Construct final className
    const buttonClasses = `${baseClasses} ${sizeClasses} ${variantClasses} ${disabledClasses} ${widthClass} ${className}`;

    return (
        <motion.button
            ref={buttonRef}
            className={buttonClasses}
            disabled={disabled || loading}
            initial={{ scale: 1 }}
            whileHover={!disabled && !loading ? { scale: 1.03 } : {}}
            whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
            {...props}
        >
            <AnimatePresence initial={false}>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: '1em', marginRight: '0.5em' }}
                        exit={{ opacity: 0, width: 0, marginRight: 0 }}
                        className="mr-2 inline-block"
                    >
                        <svg
                            className="animate-spin -ml-1 h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Icon on the left */}
            {icon && iconPosition === 'left' && !loading && (
                <span className="mr-2">{icon}</span>
            )}

            {/* Icon on top */}
            {icon && iconPosition === 'top' && !loading && (
                <span className="mb-2">{icon}</span>
            )}

            {/* Button content */}
            <span>{children}</span>

            {/* Icon on the right */}
            {icon && iconPosition === 'right' && (
                <span className="ml-2">{icon}</span>
            )}

            {/* Animated glow effect when hovered, visible in dark mode */}
            {isHovered && !disabled && !loading && (
                <motion.div
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00FFA3] to-[#FF006E] opacity-30 dark:opacity-20 blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: variant === 'ghost' || variant === 'outline' ? 0.2 : 0.1 }}
                    exit={{ opacity: 0 }}
                />
            )}
        </motion.button>
    );
};
