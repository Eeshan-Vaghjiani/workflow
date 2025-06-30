import { useEffect, useState, useRef, RefObject, useCallback } from 'react';
import { useAppearance } from './use-appearance';

/**
 * Enhanced theme hook that adds animation to theme transitions
 */
export const useAnimatedTheme = () => {
  const { theme, setTheme } = useAppearance();

  const animatedToggle = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    // Add theme transition animation
    document.documentElement.style.setProperty('--theme-transition', 'all 0.3s ease');
    setTheme(newTheme);

    // Remove transition after animation completes to avoid affecting other interactions
    setTimeout(() => {
      document.documentElement.style.removeProperty('--theme-transition');
    }, 300);
  }, [setTheme]);

  return { theme, setTheme: animatedToggle };
};

/**
 * Hook for magnetic hover effects on elements
 * @param ref Reference to the element
 * @param strength Magnetic effect strength (0-1)
 */
export const useMagneticHover = (
  ref: RefObject<HTMLElement>,
  strength: number = 0.3
) => {
  const [isHovered, setIsHovered] = useState(false);
  const initialPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseEnter = () => {
      setIsHovered(true);

      // Store the initial position
      const rect = element.getBoundingClientRect();
      initialPosition.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    };

    const handleMouseLeave = () => {
      setIsHovered(false);

      // Reset transform when mouse leaves
      element.style.transform = 'translate(0px, 0px)';
      element.style.transition = 'transform 0.5s ease';

      // Remove transition after animation completes
      setTimeout(() => {
        if (!isHovered) {
          element.style.transition = '';
        }
      }, 500);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isHovered) return;

      // Calculate distance from center
      const distanceX = e.clientX - initialPosition.current.x;
      const distanceY = e.clientY - initialPosition.current.y;

      // Apply magnetic effect with provided strength
      element.style.transform = `translate(${distanceX * strength}px, ${distanceY * strength}px)`;
      element.style.transition = 'transform 0.1s ease';
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
    };
  }, [ref, strength, isHovered]);

  return { isHovered };
};

/**
 * Hook for parallax effects based on scroll position
 */
export const useParallax = (
  ref: RefObject<HTMLElement>,
  speed: number = 0.1
) => {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const offset = scrollTop * speed;
      element.style.transform = `translateY(${offset}px)`;
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [ref, speed]);
};

/**
 * Hook for floating animation effect
 */
export const useFloatingAnimation = (
  ref: RefObject<HTMLElement>,
  options: {
    enabled: boolean;
    amplitude: number;
    frequency: number;
  } = { enabled: true, amplitude: 10, frequency: 5000 }
) => {
  useEffect(() => {
    const element = ref.current;
    if (!element || !options.enabled) return;

    const startTime = Date.now();
    let animationFrame: number | null = null;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const position = Math.sin(elapsed / options.frequency * Math.PI * 2) * options.amplitude;

      element.style.transform = `translateY(${position}px)`;
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [ref, options.enabled, options.amplitude, options.frequency]);
};
