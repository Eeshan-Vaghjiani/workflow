// Components
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { motion } from 'framer-motion';

import TextLink from '@/components/text-link';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { GlassContainer } from '@/components/ui/glass-container';
import AuthLayout from '@/layouts/auth-layout';
import { containerVariants, itemVariants } from '@/lib/theme-constants';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <AuthLayout title="Verify email" description="Please verify your email address by clicking on the link we just emailed to you.">
            <Head title="Email verification" />

            {status === 'verification-link-sent' && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mb-4"
                >
                    <GlassContainer className="p-3 bg-green-500/10 dark:bg-green-500/20">
                        <p className="text-center text-sm font-medium text-green-600 dark:text-green-400">
                            A new verification link has been sent to the email address you provided during registration.
                        </p>
                    </GlassContainer>
                </motion.div>
            )}

            <motion.form
                onSubmit={submit}
                className="space-y-6 text-center"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants}>
                    <EnhancedButton
                        disabled={processing}
                        variant="secondary"
                        size="lg"
                        loading={processing}
                        magnetic={true}
                        className="w-full"
                    >
                        Resend verification email
                    </EnhancedButton>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <TextLink href={route('logout')} method="post" className="mx-auto block text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-white transition-colors">
                        Log out
                    </TextLink>
                </motion.div>
            </motion.form>
        </AuthLayout>
    );
}
