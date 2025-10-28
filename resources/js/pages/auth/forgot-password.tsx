// Components
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { motion, Variants } from 'framer-motion';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassContainer } from '@/components/ui/glass-container';
import AuthLayout from '@/layouts/auth-layout';

// Animation variants
const formVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const inputVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm<Required<{ email: string }>>({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <AuthLayout title="Forgot password" description="Enter your email to receive a password reset link">
            <Head title="Forgot password" />

            {status && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mb-4"
                >
                    <GlassContainer className="p-3 bg-green-500/10 dark:bg-green-500/20">
                        <p className="text-center text-sm font-medium text-green-600 dark:text-green-400">
                            {status}
                        </p>
                    </GlassContainer>
                </motion.div>
            )}

            <motion.div
                className="space-y-6"
                variants={formVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.form onSubmit={submit} variants={formVariants}>
                    <motion.div className="grid gap-2" variants={inputVariants}>
                        <Label htmlFor="email" className="dark:text-gray-300">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            autoComplete="off"
                            value={data.email}
                            autoFocus
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="email@example.com"
                            className="dark:bg-gray-700/70 dark:text-gray-200 dark:border-gray-600 backdrop-blur-sm transition-all duration-200"
                        />

                        <InputError message={errors.email} />
                    </motion.div>

                    <motion.div className="my-6 flex items-center justify-start" variants={inputVariants}>
                        <EnhancedButton
                            className="w-full"
                            disabled={processing}
                            loading={processing}
                            variant="primary"
                            size="lg"
                            magnetic={true}
                        >
                            Email password reset link
                        </EnhancedButton>
                    </motion.div>
                </motion.form>

                <motion.div
                    className="text-muted-foreground space-x-1 text-center text-sm dark:text-gray-400"
                    variants={inputVariants}
                >
                    <span>Or, return to</span>
                    <TextLink href={route('login')} className="dark:text-gray-300 dark:hover:text-white hover:text-primary-600 transition-colors">log in</TextLink>
                </motion.div>
            </motion.div>
        </AuthLayout>
    );
}
