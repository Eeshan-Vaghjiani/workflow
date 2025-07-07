import React, { useRef, useState } from 'react';
import { motion, useMotionTemplate, useMotionValue, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Card3DProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
    children: React.ReactNode;
    className?: string;
    glowColor?: string;
    hoverScale?: number;
    rotationIntensity?: number;
}

export const Card3D: React.FC<Card3DProps> = ({
    children,
    className = "",
    glowColor,
    hoverScale = 1.02,
    rotationIntensity = 10,
    ...props
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    // Initialize hover state
    const [isHovered, setIsHovered] = useState(false);

    // Motion values for the card's rotation
    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);

    // Motion values for the glow effect's position
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Create a template for the glow background
    const glowBg = useMotionTemplate`
    radial-gradient(
      650px circle at ${mouseX}px ${mouseY}px,
      ${glowColor || 'rgba(0, 136, 122, 0.15)'} 0%,
      transparent 80%
    )
  `;

    // Handle mouse movement over the card
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isTouchDevice || !cardRef.current) return;

        // Get the card's position and dimensions
        const rect = cardRef.current.getBoundingClientRect();

        // Calculate the mouse position relative to the card center
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const mouseXRelative = e.clientX - centerX;
        const mouseYRelative = e.clientY - centerY;

        // Scale the rotation values based on distance from center and rotation intensity
        const rotateXValue = (mouseYRelative / (rect.height / 2)) * rotationIntensity * -1;
        const rotateYValue = (mouseXRelative / (rect.width / 2)) * rotationIntensity;

        // Update rotation motion values
        rotateX.set(rotateXValue);
        rotateY.set(rotateYValue);

        // Update the position for the glow effect
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
    };

    // Reset the card's rotation when mouse leaves
    const handleMouseLeave = () => {
        rotateX.set(0);
        rotateY.set(0);
        setIsHovered(false);
    };

    // Set hover state when mouse enters
    const handleMouseEnter = () => {
        // Check if the device has touch capability (to disable 3D effect)
        if (typeof window !== 'undefined') {
            setIsTouchDevice('ontouchstart' in window);
        }
        setIsHovered(true);
    };

    return (
        <motion.div
            ref={cardRef}
            className={cn(
                "relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900",
                className
            )}
            style={{
                transform: isTouchDevice ? undefined : `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                transformStyle: 'preserve-3d',
            }}
            whileHover={isTouchDevice ? { scale: 1 } : { scale: hoverScale }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            {...props}
        >
            {/* Glow effect overlay */}
            {isHovered && !isTouchDevice && (
                <motion.div
                    className="absolute inset-0 z-0 opacity-0 dark:opacity-30"
                    style={{ background: glowBg }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                />
            )}

            {/* Card content */}
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
};
