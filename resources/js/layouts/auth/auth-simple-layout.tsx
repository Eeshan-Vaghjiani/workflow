import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';
import { motion, Variants } from 'framer-motion';
import { GlassContainer } from '@/components/ui/glass-container';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

// Define animation variants
const containerVariants: Variants = {
    initial: { opacity: 0 },
    animate: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            when: "beforeChildren"
        }
    }
};

const itemVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};

const logoVariants: Variants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
        scale: 1,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 200,
            damping: 20
        }
    }
};

export default function AuthSimpleLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="bg-softBlue/30 dark:bg-gray-900 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-50/50 dark:from-primary-900/20 via-transparent to-transparent">
            <motion.div
                className="w-full max-w-sm"
                variants={containerVariants}
                initial="initial"
                animate="animate"
            >
                <GlassContainer
                    className="p-8 backdrop-blur-md"
                    blurIntensity="lg"
                    border={true}
                    animate={true}
                >
                    <div className="flex flex-col gap-8">
                        <motion.div
                            className="flex flex-col items-center gap-4"
                            variants={itemVariants}
                        >
                            <motion.div variants={logoVariants}>
                                <Link href={route('home')} className="flex flex-col items-center gap-2 font-medium">
                                    <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 dark:bg-primary/20">
                                        <AppLogoIcon className="size-10 fill-current text-primary dark:text-primary-300" />
                                    </div>
                                    <span className="sr-only">{title}</span>
                                </Link>
                            </motion.div>

                            <motion.div
                                className="space-y-2 text-center"
                                variants={itemVariants}
                            >
                                <h1 className="text-2xl font-medium text-gray-900 dark:text-white">{title}</h1>
                                <p className="text-muted-foreground text-center text-sm text-gray-600 dark:text-gray-300">{description}</p>
                            </motion.div>
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            {children}
                        </motion.div>
                    </div>
                </GlassContainer>
            </motion.div>
        </div>
    );
}
