import React, { useState } from 'react';

interface Card3DProps {
    className?: string;
    children: React.ReactNode;
}

export const Card3D: React.FC<Card3DProps> = ({ className = "", children }) => {
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [glowPosition, setGlowPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate rotation based on mouse position
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateXValue = ((y - centerY) / centerY) * 5; // Limit rotation to 5 degrees
        const rotateYValue = ((centerX - x) / centerX) * 5;

        // Update glow position
        const glowX = (x / rect.width) * 100;
        const glowY = (y / rect.height) * 100;

        setRotateX(rotateXValue);
        setRotateY(rotateYValue);
        setGlowPosition({ x: glowX, y: glowY });
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
    };

    return (
        <div
            className={`relative rounded-xl shadow-sm overflow-hidden ${className}`}
            style={{
                transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                transition: "transform 0.3s ease",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Highlight/glow effect */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, rgba(255,255,255,0.2) 0%, transparent 50%)`,
                    opacity: Math.abs(rotateX) + Math.abs(rotateY) > 0 ? 1 : 0,
                    transition: "opacity 0.3s ease"
                }}
            />

            {/* Border highlight */}
            <div
                className="absolute inset-0 border border-white/10 rounded-xl pointer-events-none"
                style={{
                    boxShadow: `0 0 15px 1px rgba(255,255,255,${(Math.abs(rotateX) + Math.abs(rotateY)) / 20})`,
                    opacity: Math.abs(rotateX) + Math.abs(rotateY) > 0 ? 1 : 0,
                    transition: "opacity 0.3s ease"
                }}
            />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};
