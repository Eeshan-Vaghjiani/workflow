import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useAppearance } from '@/hooks/use-appearance';
import MouseFollower from '@/components/ui/mouse-follower';

// Define animation variants
const pageVariants: Variants = {
    initial: {
        opacity: 0,
        scale: 0.98,
    },
    animate: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.5,
            ease: "easeOut",
            when: "beforeChildren",
        }
    },
    exit: {
        opacity: 0,
        scale: 0.96,
        transition: {
            duration: 0.3,
            ease: "easeInOut"
        }
    }
};

export default function AuthLayout({ children, title, description, ...props }: { children: React.ReactNode; title: string; description: string }) {
    // Get theme from appearance hook
    const { theme } = useAppearance();

    // Determine if we should use the mouse follower (not on touch or reduce motion devices)
    const shouldUseMouseFollower =
        typeof window !== 'undefined' &&
        !('ontouchstart' in window) &&
        localStorage.getItem('reduceMotion') !== 'true';

    return (
        <>

            <AnimatePresence mode="wait">
                <motion.div
                    key={window.location.pathname}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                    className="auth-layout-wrapper"
                >
                    <AuthLayoutTemplate title={title} description={description} {...props}>
                        {children}
                    </AuthLayoutTemplate>
                </motion.div>
            </AnimatePresence>
        </>
    );
}
