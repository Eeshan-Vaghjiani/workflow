import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import InputError from '@/components/input-error';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Card3D } from '@/components/ui/card-3d';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { containerVariants, itemVariants } from '@/lib/theme-constants';
import AuthLayout from '@/layouts/auth-layout';

export default function TwoFactorVerify() {
    const [showRecoveryCode, setShowRecoveryCode] = useState(false);
    const codeInputRef = useRef<HTMLInputElement>(null);
    const recoveryCodeInputRef = useRef<HTMLInputElement>(null);

    const form = useForm({
        code: '',
    });

    const recoveryForm = useForm({
        recovery_code: '',
    });

    useEffect(() => {
        if (codeInputRef.current) {
            codeInputRef.current.focus();
        }
    }, []);

    const submitCode: FormEventHandler = (e) => {
        e.preventDefault();

        form.post(route('two-factor.verify'), {
            onSuccess: () => {
                console.log('Verification successful');
            },
            onError: () => {
                form.reset('code');
                if (codeInputRef.current) {
                    codeInputRef.current.focus();
                }
            },
        });
    };

    const submitRecoveryCode: FormEventHandler = (e) => {
        e.preventDefault();

        recoveryForm.post(route('two-factor.recovery-code'), {
            onSuccess: () => {
                console.log('Recovery code verification successful');
            },
            onError: () => {
                recoveryForm.reset('recovery_code');
                if (recoveryCodeInputRef.current) {
                    recoveryCodeInputRef.current.focus();
                }
            },
        });
    };

    return (
        <AuthLayout title="Two-Factor Verification" description={!showRecoveryCode ?
            'Please enter the code from your authenticator app to verify your identity.' :
            'Please enter one of your recovery codes to verify your identity.'}>
            <Head title="Two-Factor Verification" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full"
            >
                <Card3D className="p-6">
                    <CardContent className="p-0">
                        {!showRecoveryCode ? (
                            <motion.form onSubmit={submitCode} variants={containerVariants}>
                                <motion.div variants={itemVariants}>
                                    <Label htmlFor="code" className="dark:text-gray-300">Authentication Code</Label>
                                    <Input
                                        id="code"
                                        type="text"
                                        className="mt-1 block w-full dark:bg-gray-700/70 dark:text-gray-200 dark:border-gray-600 backdrop-blur-sm transition-all duration-200"
                                        value={form.data.code}
                                        onChange={(e) => form.setData('code', e.target.value)}
                                        autoComplete="one-time-code"
                                        ref={codeInputRef}
                                        autoFocus
                                        inputMode="numeric"
                                        placeholder="Enter 6-digit code"
                                    />
                                    <InputError message={form.errors.code} className="mt-2" />
                                </motion.div>

                                <motion.div className="mt-6" variants={itemVariants}>
                                    <EnhancedButton
                                        type="submit"
                                        className="w-full"
                                        disabled={form.processing}
                                        loading={form.processing}
                                        variant="primary"
                                        size="lg"
                                        magnetic={true}
                                    >
                                        Verify
                                    </EnhancedButton>
                                </motion.div>
                            </motion.form>
                        ) : (
                            <motion.form onSubmit={submitRecoveryCode} variants={containerVariants}>
                                <motion.div variants={itemVariants}>
                                    <Label htmlFor="recovery_code" className="dark:text-gray-300">Recovery Code</Label>
                                    <Input
                                        id="recovery_code"
                                        type="text"
                                        className="mt-1 block w-full dark:bg-gray-700/70 dark:text-gray-200 dark:border-gray-600 backdrop-blur-sm transition-all duration-200"
                                        value={recoveryForm.data.recovery_code}
                                        onChange={(e) => recoveryForm.setData('recovery_code', e.target.value)}
                                        autoComplete="off"
                                        ref={recoveryCodeInputRef}
                                        autoFocus
                                        placeholder="Enter recovery code"
                                    />
                                    <InputError message={recoveryForm.errors.recovery_code} className="mt-2" />
                                </motion.div>

                                <motion.div className="mt-6" variants={itemVariants}>
                                    <EnhancedButton
                                        type="submit"
                                        className="w-full"
                                        disabled={recoveryForm.processing}
                                        loading={recoveryForm.processing}
                                        variant="primary"
                                        size="lg"
                                        magnetic={true}
                                    >
                                        Verify
                                    </EnhancedButton>
                                </motion.div>
                            </motion.form>
                        )}
                    </CardContent>
                    <CardFooter className="flex-col p-0 mt-6">
                        <motion.div variants={itemVariants}>
                            <EnhancedButton
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowRecoveryCode(!showRecoveryCode)}
                                className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-300"
                            >
                                {!showRecoveryCode ?
                                    "Can't access your authenticator app? Use a recovery code" :
                                    "Back to authenticator code verification"}
                            </EnhancedButton>
                        </motion.div>
                    </CardFooter>
                </Card3D>
            </motion.div>
        </AuthLayout>
    );
}
