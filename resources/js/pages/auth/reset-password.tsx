import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { motion, Variants } from 'framer-motion';

import InputError from '@/components/input-error';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

interface ResetPasswordProps {
    token: string;
    email: string;
}

type ResetPasswordForm = {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
};

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

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { data, setData, post, processing, errors, reset } = useForm<Required<ResetPasswordForm>>({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout title="Reset password" description="Please enter your new password below">
            <Head title="Reset password" />

            <motion.form
                onSubmit={submit}
                variants={formVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="grid gap-6">
                    <motion.div className="grid gap-2" variants={inputVariants}>
                        <Label htmlFor="email" className="dark:text-gray-300">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            autoComplete="email"
                            value={data.email}
                            className="mt-1 block w-full dark:bg-gray-700/70 dark:text-gray-200 dark:border-gray-600 backdrop-blur-sm transition-all duration-200"
                            readOnly
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </motion.div>

                    <motion.div className="grid gap-2" variants={inputVariants}>
                        <Label htmlFor="password" className="dark:text-gray-300">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            name="password"
                            autoComplete="new-password"
                            value={data.password}
                            className="mt-1 block w-full dark:bg-gray-700/70 dark:text-gray-200 dark:border-gray-600 backdrop-blur-sm transition-all duration-200"
                            autoFocus
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Password"
                        />
                        <InputError message={errors.password} />
                    </motion.div>

                    <motion.div className="grid gap-2" variants={inputVariants}>
                        <Label htmlFor="password_confirmation" className="dark:text-gray-300">Confirm password</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            className="mt-1 block w-full dark:bg-gray-700/70 dark:text-gray-200 dark:border-gray-600 backdrop-blur-sm transition-all duration-200"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder="Confirm password"
                        />
                        <InputError message={errors.password_confirmation} className="mt-2" />
                    </motion.div>

                    <motion.div variants={inputVariants}>
                        <EnhancedButton
                            type="submit"
                            className="mt-4 w-full"
                            disabled={processing}
                            loading={processing}
                            variant="primary"
                            size="lg"
                            magnetic={true}
                        >
                            Reset password
                        </EnhancedButton>
                    </motion.div>
                </div>
            </motion.form>
        </AuthLayout>
    );
}
