import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';
import { refreshCsrfToken } from '../../Utils/csrf.js';
import { motion, Variants } from 'framer-motion';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { GlassContainer } from '@/components/ui/glass-container';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

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

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        // Refresh CSRF token on component mount
        refreshCsrfToken();
    }, []);

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        // Refresh CSRF token before submitting
        await refreshCsrfToken();
        post(route('login'), {
            onFinish: () => reset('password'),
            preserveScroll: true,
        });
    };

    return (
        <AuthLayout title="Log in to your account" description="Enter your email and password below to log in">
            <Head title="Log in" />

            <motion.form
                className="flex flex-col gap-6"
                onSubmit={submit}
                variants={formVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="grid gap-6">
                    <motion.div className="grid gap-2" variants={inputVariants}>
                        <Label htmlFor="email" className="dark:text-gray-300">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="email@example.com"
                            className="dark:bg-gray-700/70 dark:text-gray-200 dark:border-gray-600 backdrop-blur-sm transition-all duration-200"
                        />
                        <InputError message={errors.email} />
                    </motion.div>

                    <motion.div className="grid gap-2" variants={inputVariants}>
                        <div className="flex items-center">
                            <Label htmlFor="password" className="dark:text-gray-300">Password</Label>
                            {canResetPassword && (
                                <TextLink href={route('password.request')} className="ml-auto text-sm dark:text-gray-300 dark:hover:text-white hover:text-primary-600 transition-colors" tabIndex={5}>
                                    Forgot password?
                                </TextLink>
                            )}
                        </div>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Password"
                            className="dark:bg-gray-700/70 dark:text-gray-200 dark:border-gray-600 backdrop-blur-sm transition-all duration-200"
                        />
                        <InputError message={errors.email} />
                    </motion.div>

                    <motion.div className="flex items-center space-x-3" variants={inputVariants}>
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onClick={() => setData('remember', !data.remember)}
                            tabIndex={3}
                            className="dark:border-gray-600"
                        />
                        <Label htmlFor="remember" className="dark:text-gray-300">Remember me</Label>
                    </motion.div>

                    <motion.div variants={inputVariants}>
                        <EnhancedButton
                            type="submit"
                            className="mt-4 w-full bg-primary hover:bg-primary-600 text-white"
                            tabIndex={4}
                            disabled={processing}
                            loading={processing}
                            magnetic={true}
                            size="lg"
                        >
                            Log in
                        </EnhancedButton>
                    </motion.div>
                </div>

                <motion.div
                    className="text-muted-foreground text-center text-sm dark:text-gray-400"
                    variants={inputVariants}
                >
                    Don't have an account?{' '}
                    <TextLink href={route('register')} tabIndex={5} className="dark:text-gray-300 dark:hover:text-white hover:text-primary-600 transition-colors">
                        Sign up
                    </TextLink>
                </motion.div>
            </motion.form>

            {status && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4"
                >
                    <GlassContainer className="p-3 bg-green-500/10 dark:bg-green-500/20">
                        <p className="text-center text-sm font-medium text-green-600 dark:text-green-400">
                            {status}
                        </p>
                    </GlassContainer>
                </motion.div>
            )}
        </AuthLayout>
    );
}
