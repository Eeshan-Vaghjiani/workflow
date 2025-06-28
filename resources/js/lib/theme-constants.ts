import { Variants } from 'framer-motion';

// Theme constants for the enhanced design system
export const lightTheme = {
  primary: '#00887A',      // Navigation active states, CTA buttons
  accent: '#FFCCBC',       // Hover states, notifications
  light: '#FFFFFF',        // Card backgrounds, main content
  softBlue: '#D3E3FC',     // Page backgrounds, section dividers
  ctaBright: '#77A6F7',    // Secondary actions, links, status
  glass: 'rgba(255, 255, 255, 0.1)', // Glassmorphism effects
};

// Dark Mode Colors (Futuristic Enhancement)
export const darkTheme = {
  primary: '#00C9A7',      // Brighter primary for dark mode
  accent: '#FF8A65',       // Enhanced accent for dark
  light: '#1A1A1A',        // Dark card backgrounds
  softBlue: '#0F1419',     // Dark page backgrounds
  ctaBright: '#60A5FA',    // Bright CTAs for dark mode
  glass: 'rgba(0, 0, 0, 0.3)', // Dark glassmorphism
  neon: '#00FFA3',         // Futuristic neon accents
  cyber: '#FF006E',        // Cyber pink highlights
};

// Animation constants
export const springTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30
};

export const easeTransition = {
  type: "tween" as const,
  ease: "easeOut",
  duration: 0.4
};

// Animation variants for staggered children
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      type: "tween" as const,
      ease: "easeInOut",
      duration: 0.3
    }
  }
};
