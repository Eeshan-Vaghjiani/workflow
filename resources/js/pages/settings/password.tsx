import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Check, X, Eye, EyeOff, Shield, Lock } from 'lucide-react';
import { GlassContainer } from '@/components/ui/glass-container';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Password settings',
        href: '/settings/password',
    },
];

// Password strength calculation
const calculatePasswordStrength = (password: string): { score: number; feedback: string[] } => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
        score += 20;
    } else {
        feedback.push('Use at least 8 characters');
    }

    if (password.length >= 12) {
        score += 10;
    }

    if (/[a-z]/.test(password)) {
        score += 10;
    } else {
        feedback.push('Add lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
        score += 10;
    } else {
        feedback.push('Add uppercase letters');
    }

    if (/[0-9]/.test(password)) {
        score += 20;
    } else {
        feedback.push('Add numbers');
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
        score += 30;
    } else {
        feedback.push('Add special characters (!@#$%^&*)');
    }

    return { score, feedback };
};

const getStrengthColor = (score: number): string => {
    if (score < 30) return 'bg-red-500';
    if (score < 60) return 'bg-yellow-500';
    if (score < 80) return 'bg-blue-500';
    return 'bg-green-500';
};

const getStrengthText = (score: number): string => {
    if (score < 30) return 'Weak';
    if (score < 60) return 'Fair';
    if (score < 80) return 'Good';
    return 'Strong';
};

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const passwordStrength = calculatePasswordStrength(data.password);
    const passwordsMatch = data.password === data.password_confirmation && data.password_confirmation !== '';

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Password settings" />

            <SettingsLayout>
                <motion.div 
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <HeadingSmall 
                        title="Update password" 
                        description="Ensure your account is using a long, random password to stay secure" 
                    />

                    <GlassContainer className="p-6">
                        <CardHeader className="px-0 pb-6">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Shield className="h-5 w-5" />
                                Password Security
                            </CardTitle>
                        </CardHeader>

                        <form onSubmit={updatePassword} className="space-y-6">
                            {/* Current Password */}
                            <div className="space-y-2">
                                <Label htmlFor="current_password" className="text-sm font-medium">
                                    Current password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="current_password"
                                        ref={currentPasswordInput}
                                        value={data.current_password}
                                        onChange={(e) => setData('current_password', e.target.value)}
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        className="pr-10"
                                        autoComplete="current-password"
                                        placeholder="Enter your current password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <InputError message={errors.current_password} />
                            </div>

                            {/* New Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium">
                                    New password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        ref={passwordInput}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        type={showNewPassword ? 'text' : 'password'}
                                        className="pr-10"
                                        autoComplete="new-password"
                                        placeholder="Enter your new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>

                                {/* Password Strength Indicator */}
                                {data.password && (
                                    <motion.div 
                                        className="space-y-3"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span>Password strength</span>
                                                <span className={`font-medium ${
                                                    passwordStrength.score < 30 ? 'text-red-500' :
                                                    passwordStrength.score < 60 ? 'text-yellow-500' :
                                                    passwordStrength.score < 80 ? 'text-blue-500' :
                                                    'text-green-500'
                                                }`}>
                                                    {getStrengthText(passwordStrength.score)}
                                                </span>
                                            </div>
                                            <Progress 
                                                value={passwordStrength.score} 
                                                className="h-2"
                                            />
                                        </div>

                                        {passwordStrength.feedback.length > 0 && (
                                            <div className="space-y-1">
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    To improve your password:
                                                </p>
                                                <ul className="space-y-1">
                                                    {passwordStrength.feedback.map((item, index) => (
                                                        <li key={index} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                            <X className="h-3 w-3 text-red-500" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                <InputError message={errors.password} />
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation" className="text-sm font-medium">
                                    Confirm password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password_confirmation"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        className="pr-10"
                                        autoComplete="new-password"
                                        placeholder="Confirm your new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>

                                {/* Password Match Indicator */}
                                {data.password_confirmation && (
                                    <motion.div 
                                        className="flex items-center gap-2 text-sm"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {passwordsMatch ? (
                                            <>
                                                <Check className="h-4 w-4 text-green-500" />
                                                <span className="text-green-600 dark:text-green-400">Passwords match</span>
                                            </>
                                        ) : (
                                            <>
                                                <X className="h-4 w-4 text-red-500" />
                                                <span className="text-red-600 dark:text-red-400">Passwords don't match</span>
                                            </>
                                        )}
                                    </motion.div>
                                )}

                                <InputError message={errors.password_confirmation} />
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <Button 
                                    disabled={processing || !passwordsMatch || passwordStrength.score < 50}
                                    className="flex items-center gap-2"
                                >
                                    <Lock className="h-4 w-4" />
                                    {processing ? 'Updating...' : 'Update password'}
                                </Button>

                                <Transition
                                    show={recentlySuccessful}
                                    enter="transition ease-in-out"
                                    enterFrom="opacity-0"
                                    leave="transition ease-in-out"
                                    leaveTo="opacity-0"
                                >
                                    <motion.div
                                        className="flex items-center gap-2 text-green-600 dark:text-green-400"
                                        initial={{ scale: 0.9 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Check className="h-4 w-4" />
                                        <span className="text-sm font-medium">Password updated successfully!</span>
                                    </motion.div>
                                </Transition>
                            </div>
                        </form>
                    </GlassContainer>

                    {/* Security Tips */}
                    <GlassContainer className="p-6">
                        <CardHeader className="px-0 pb-4">
                            <CardTitle className="text-lg">Password Security Tips</CardTitle>
                        </CardHeader>
                        <div className="grid gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-start gap-3">
                                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>Use a unique password for this account</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>Include a mix of letters, numbers, and special characters</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>Avoid using personal information like names or birthdays</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>Consider using a password manager to generate and store secure passwords</span>
                            </div>
                        </div>
                    </GlassContainer>
                </motion.div>
            </SettingsLayout>
        </AppLayout>
    );
}
