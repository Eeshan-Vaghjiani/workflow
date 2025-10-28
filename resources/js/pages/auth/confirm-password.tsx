// Components
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { motion } from 'framer-motion';

import InputError from '@/components/input-error';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { containerVariants, itemVariants } from '@/lib/theme-constants';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm<Required<{ password: string }>>({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout
            title="Confirm your password"
            description="This is a secure area of the application. Please confirm your password before continuing."
        >
            <Head title="Confirm password" />

            <motion.form
                onSubmit={submit}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="space-y-6">
                    <motion.div className="grid gap-2" variants={itemVariants}>
                        <Label htmlFor="password" className="dark:text-gray-300">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            name="password"
                            placeholder="Password"
                            autoComplete="current-password"
                            value={data.password}
                            autoFocus
                            onChange={(e) => setData('password', e.target.value)}
                            className="dark:bg-gray-700/70 dark:text-gray-200 dark:border-gray-600 backdrop-blur-sm transition-all duration-200"
                        />

                        <InputError message={errors.password} />
                    </motion.div>

                    <motion.div className="flex items-center" variants={itemVariants}>
                        <EnhancedButton
                            className="w-full"
                            disabled={processing}
                            loading={processing}
                            variant="primary"
                            size="lg"
                            magnetic={true}
                        >
                            Confirm password
                        </EnhancedButton>
                    </motion.div>
                </div>
            </motion.form>
        </AuthLayout>
    );
}
