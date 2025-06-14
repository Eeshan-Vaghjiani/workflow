import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';

import InputError from '@/components/input-error';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';

// Define breadcrumbs for consistency with other pages
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Two-Factor Authentication',
        href: '/settings/two-factor-auth',
    },
];

type TwoFactorAuthProps = {
    enabled: boolean;
    qrCode: string | null;
    recoveryCodes: string[];
    confirming: boolean;
};

export default function TwoFactorAuth({ enabled, qrCode, recoveryCodes, confirming }: TwoFactorAuthProps) {
    const [confirmingDisable, setConfirmingDisable] = useState(false);
    const [confirmingRecoveryCodeRegeneration, setConfirmingRecoveryCodeRegeneration] = useState(false);
    const [showingRecoveryCodes, setShowingRecoveryCodes] = useState(false);

    const passwordInputRef = useRef<HTMLInputElement>(null);
    const codeInputRef = useRef<HTMLInputElement>(null);

    const enableForm = useForm({
        code: '',
    });

    const confirmForm = useForm({
        code: '',
    });

    const disableForm = useForm({
        password: '',
    });

    const regenerateCodesForm = useForm({
        password: '',
    });

    const submitEnableForm: FormEventHandler = (e) => {
        e.preventDefault();

        enableForm.post(route('two-factor.store'), {
            preserveScroll: true,
            onSuccess: () => {
                enableForm.reset();
                setShowingRecoveryCodes(true);
            },
            onError: () => {
                if (codeInputRef.current) {
                    codeInputRef.current.focus();
                }
            },
        });
    };

    const submitConfirmForm: FormEventHandler = (e) => {
        e.preventDefault();

        confirmForm.put(route('two-factor.update'), {
            preserveScroll: true,
            onSuccess: () => {
                confirmForm.reset();
            },
            onError: () => {
                if (codeInputRef.current) {
                    codeInputRef.current.focus();
                }
            },
        });
    };

    const submitDisableForm: FormEventHandler = (e) => {
        e.preventDefault();

        disableForm.delete(route('two-factor.destroy'), {
            preserveScroll: true,
            onSuccess: () => {
                disableForm.reset();
                setConfirmingDisable(false);
            },
            onError: () => {
                if (passwordInputRef.current) {
                    passwordInputRef.current.focus();
                }
            },
        });
    };

    const submitRegenerateCodesForm: FormEventHandler = (e) => {
        e.preventDefault();

        regenerateCodesForm.post(route('two-factor.recovery-codes'), {
            preserveScroll: true,
            onSuccess: () => {
                regenerateCodesForm.reset();
                setConfirmingRecoveryCodeRegeneration(false);
                setShowingRecoveryCodes(true);
            },
            onError: () => {
                if (passwordInputRef.current) {
                    passwordInputRef.current.focus();
                }
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Two-Factor Authentication" />

            <SettingsLayout>
                <div className="space-y-8 max-w-4xl">
                    {/* Header Section */}
                    <HeadingSmall
                        title="Two-Factor Authentication"
                        description="Add additional security to your account using two-factor authentication."
                    />

                    {/* Status Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-md px-6 py-5 border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium dark:text-white">
                                {enabled ? 'You have enabled two-factor authentication' : 'You have not enabled two-factor authentication'}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {enabled
                                    ? 'When two-factor authentication is enabled, you will be prompted for a secure, random token during authentication.'
                                    : 'When two-factor authentication is enabled, you will be prompted for a secure, random token during authentication.'}
                            </p>
                        </div>
                        <div>
                            {enabled && (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 hover:bg-green-100 dark:hover:bg-green-900">
                                    Enabled
                                </Badge>
                            )}
                        </div>
                    </div>

                    {!enabled && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="dark:text-white">Set up two-factor authentication</CardTitle>
                                <CardDescription className="dark:text-gray-300">
                                    Secure your account with two-factor authentication. When enabled, you'll be prompted for a secure, random token during login.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {qrCode && (
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-600 mb-2">
                                            To enable two-factor authentication, scan the following QR code using your phone's authenticator application, then enter the verification code.
                                        </p>
                                        <div className="mx-auto mt-4 max-w-xs p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" dangerouslySetInnerHTML={{ __html: qrCode }} />
                                    </div>
                                )}

                                {confirming && (
                                    <form onSubmit={submitConfirmForm} className="mt-6">
                                        <div>
                                            <Label htmlFor="code" className="dark:text-gray-300">Verification Code</Label>
                                            <Input
                                                id="code"
                                                type="text"
                                                name="code"
                                                className="mt-1 block w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                                                value={confirmForm.data.code}
                                                onChange={(e) => confirmForm.setData('code', e.target.value)}
                                                autoComplete="one-time-code"
                                                ref={codeInputRef}
                                            />
                                            <InputError message={confirmForm.errors.code} className="mt-2" />
                                        </div>

                                        <div className="mt-6">
                                            <Button
                                                type="submit"
                                                className="ml-auto"
                                                disabled={confirmForm.processing}
                                            >
                                                Confirm
                                            </Button>
                                        </div>
                                    </form>
                                )}

                                {!confirming && (
                                    <form onSubmit={submitEnableForm} className="mt-6">
                                        <div>
                                            <Label htmlFor="code" className="dark:text-gray-300">Verification Code</Label>
                                            <div className="flex items-center gap-3">
                                                <Input
                                                    id="code"
                                                    type="text"
                                                    name="code"
                                                    className="mt-1 block w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                                                    value={enableForm.data.code}
                                                    onChange={(e) => enableForm.setData('code', e.target.value)}
                                                    autoComplete="one-time-code"
                                                    ref={codeInputRef}
                                                    placeholder="6-digit verification code"
                                                />
                                                <Button
                                                    type="submit"
                                                    disabled={enableForm.processing}
                                                >
                                                    Enable
                                                </Button>
                                            </div>
                                            <InputError message={enableForm.errors.code} className="mt-2" />
                                        </div>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {enabled && (
                        <div className="space-y-8">
                            {/* Recovery Codes Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="dark:text-white">Recovery Codes</CardTitle>
                                    <CardDescription className="dark:text-gray-300">
                                        Store these recovery codes in a secure password manager. They can be used to recover access to your account if your authenticator device is lost.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 mb-4">
                                        <Button
                                            type="button"
                                            onClick={() => setShowingRecoveryCodes(!showingRecoveryCodes)}
                                            variant="outline"
                                        >
                                            {showingRecoveryCodes ? 'Hide Recovery Codes' : 'Show Recovery Codes'}
                                        </Button>

                                        <Button
                                            type="button"
                                            onClick={() => setConfirmingRecoveryCodeRegeneration(true)}
                                            variant="outline"
                                        >
                                            Regenerate Recovery Codes
                                        </Button>
                                    </div>

                                    {showingRecoveryCodes && (
                                        <Alert variant="default" className="mt-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                            <AlertDescription>
                                                <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                                                    Store these recovery codes in a secure password manager. They can be used to recover access to your account if your two-factor authentication device is lost.
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-md bg-gray-100 dark:bg-gray-900 px-4 py-4 font-mono text-sm">
                                                    {recoveryCodes.map((code) => (
                                                        <div key={code} className="truncate dark:text-gray-300">{code}</div>
                                                    ))}
                                                </div>
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Disable 2FA Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="dark:text-white">Disable Two-Factor Authentication</CardTitle>
                                    <CardDescription className="dark:text-gray-300">
                                        You can disable two-factor authentication if you no longer wish to use it.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button
                                        type="button"
                                        onClick={() => setConfirmingDisable(true)}
                                        variant="destructive"
                                    >
                                        Disable Two-Factor Authentication
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {confirmingDisable && (
                        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900">
                            <CardHeader>
                                <CardTitle className="dark:text-white">Disable two-factor authentication</CardTitle>
                                <CardDescription className="dark:text-gray-300">
                                    Please enter your password to confirm you would like to disable two-factor authentication.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={submitDisableForm}>
                                    <div>
                                        <Label htmlFor="password" className="dark:text-gray-300">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            name="password"
                                            className="mt-1 block w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                                            value={disableForm.data.password}
                                            onChange={(e) => disableForm.setData('password', e.target.value)}
                                            autoComplete="current-password"
                                            ref={passwordInputRef}
                                        />
                                        <InputError message={disableForm.errors.password} className="mt-2" />
                                    </div>

                                    <div className="mt-6 flex items-center justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setConfirmingDisable(false)}
                                            className="mr-3"
                                        >
                                            Cancel
                                        </Button>

                                        <Button
                                            type="submit"
                                            variant="destructive"
                                            disabled={disableForm.processing}
                                        >
                                            Disable
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {confirmingRecoveryCodeRegeneration && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="dark:text-white">Regenerate recovery codes</CardTitle>
                                <CardDescription className="dark:text-gray-300">
                                    Please enter your password to confirm you would like to regenerate your recovery codes.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={submitRegenerateCodesForm}>
                                    <div>
                                        <Label htmlFor="password_for_recovery_code_generation" className="dark:text-gray-300">Password</Label>
                                        <Input
                                            id="password_for_recovery_code_generation"
                                            type="password"
                                            name="password"
                                            className="mt-1 block w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                                            value={regenerateCodesForm.data.password}
                                            onChange={(e) => regenerateCodesForm.setData('password', e.target.value)}
                                            autoComplete="current-password"
                                            ref={passwordInputRef}
                                        />
                                        <InputError message={regenerateCodesForm.errors.password} className="mt-2" />
                                    </div>

                                    <div className="mt-6 flex items-center justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setConfirmingRecoveryCodeRegeneration(false)}
                                            className="mr-3"
                                        >
                                            Cancel
                                        </Button>

                                        <Button
                                            type="submit"
                                            disabled={regenerateCodesForm.processing}
                                        >
                                            Regenerate
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
