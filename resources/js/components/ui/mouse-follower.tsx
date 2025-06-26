import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface MouseFollowerProps {
    theme: 'light' | 'dark' | 'system';
}

const MouseFollower: React.FC<MouseFollowerProps> = ({ theme }) => {
    // Mouse position for cursor dot
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    // Smoothed follower position for outer circle
    const followerX = useSpring(cursorX, { damping: 25, stiffness: 200 });
    const followerY = useSpring(cursorY, { damping: 25, stiffness: 200 });

    // Interaction states
    const [isHovering, setIsHovering] = useState(false);
    const [isPointer, setIsPointer] = useState(false);
    const [isClicking, setIsClicking] = useState(false);
    const [isHidden, setIsHidden] = useState(false);

    // Scale springs for smooth animation
    const dotScale = useSpring(1, { damping: 25, stiffness: 300 });
    const followerScale = useSpring(1, { damping: 25, stiffness: 300 });

    useEffect(() => {
        const updateMousePosition = (e: MouseEvent) => {
            // Update cursor position
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);

            // Check if hovering interactive element
            const target = e.target as HTMLElement;
            const isInteractive =
                target.tagName === 'BUTTON' ||
                target.tagName === 'A' ||
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' ||
                target.classList.contains('interactive');

            setIsPointer(window.getComputedStyle(target).cursor === 'pointer');
            setIsHovering(isInteractive);

            // Set proper scales based on interaction
            if (isInteractive) {
                dotScale.set(0.5);
                followerScale.set(1.5);
            } else {
                dotScale.set(1);
                followerScale.set(1);
            }
        };

        const handleMouseDown = () => {
            setIsClicking(true);
            dotScale.set(0.8);
            followerScale.set(0.8);
        };

        const handleMouseUp = () => {
            setIsClicking(false);
            dotScale.set(isHovering ? 0.5 : 1);
            followerScale.set(isHovering ? 1.5 : 1);
        };

        const handleMouseLeave = () => {
            setIsHidden(true);
            dotScale.set(0);
            followerScale.set(0);
        };

        const handleMouseEnter = () => {
            setIsHidden(false);
            dotScale.set(1);
            followerScale.set(1);
        };

        // Add all event listeners
        document.addEventListener('mousemove', updateMousePosition);
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mouseenter', handleMouseEnter);

        return () => {
            // Clean up all event listeners
            document.removeEventListener('mousemove', updateMousePosition);
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mouseenter', handleMouseEnter);
        };
    }, [cursorX, cursorY, dotScale, followerScale, isHovering]);

    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Don't render for touch devices
    if (typeof window !== 'undefined' && 'ontouchstart' in window) {
        return null;
    }

    return (
        <>
            {/* Cursor dot */}
            <motion.div
                className="fixed top-0 left-0 z-50 pointer-events-none"
                style={{
                    x: cursorX,
                    y: cursorY,
                    scale: dotScale,
                    opacity: isHidden ? 0 : 1
                }}
            >
                <div
                    className={`h-3 w-3 rounded-full ${isClicking
                            ? isDark ? 'bg-[#00FFA3]' : 'bg-[#00887A]'
                            : isPointer
                                ? isDark ? 'bg-[#FF006E]' : 'bg-[#77A6F7]'
                                : isDark ? 'bg-white' : 'bg-black'
                        }`}
                />
            </motion.div>

            {/* Follower circle */}
            <motion.div
                className="fixed top-0 left-0 z-40 pointer-events-none"
                style={{
                    x: followerX,
                    y: followerY,
                    scale: followerScale,
                    opacity: isHidden ? 0 : isClicking ? 0.3 : 0.15
                }}
            >
                <div
                    className={`h-12 w-12 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${isClicking
                            ? isDark ? 'bg-[#00FFA3]' : 'bg-[#00887A]'
                            : isPointer
                                ? isDark ? 'bg-[#FF006E]' : 'bg-[#77A6F7]'
                                : isDark ? 'bg-white' : 'bg-black'
                        }`}
                />
            </motion.div>
        </>
    );
};

export default MouseFollower;
