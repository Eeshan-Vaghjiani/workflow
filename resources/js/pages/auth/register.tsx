import { useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Card3D } from '@/components/ui/card-3d';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { containerVariants, itemVariants } from '@/lib/theme-constants';
import { LoaderCircle } from 'lucide-react';

export default function Register() {
    useEffect(() => {
        // Redirect to WorkOS login which handles both login and registration
        window.location.href = route('login');
    }, []);

    return (
        <>
            <Head title="Register" />
            <div className="flex min-h-screen flex-col items-center pt-6 sm:justify-center sm:pt-0 bg-gray-100 dark:bg-gray-900">
                <motion.div
                    className="mt-6 w-full sm:max-w-md"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <Card3D className="p-8">
                        <motion.div className="text-center" variants={itemVariants}>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Redirecting to WorkOS...</h2>
                            <motion.div
                                className="flex justify-center my-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <LoaderCircle className="h-10 w-10 animate-spin text-primary-500 dark:text-neon-green" />
                            </motion.div>
                            <p className="mt-4 text-gray-600 dark:text-gray-300">
                                Please wait while we redirect you to our secure authentication provider.
                            </p>
                            <motion.div className="mt-6" variants={itemVariants}>
                                <EnhancedButton
                                    variant="primary"
                                    size="md"
                                    magnetic={true}
                                >
                                    <Link
                                        href={route('login')}
                                        className="text-white dark:text-black"
                                    >
                                        Click here if you are not redirected automatically
                                    </Link>
                                </EnhancedButton>
                            </motion.div>
                        </motion.div>
                    </Card3D>
                </motion.div>
            </div>
        </>
    );
}
