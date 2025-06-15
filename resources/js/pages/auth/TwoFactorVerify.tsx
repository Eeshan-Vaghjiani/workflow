import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gray-100 dark:bg-gray-900">
            <div className="w-full sm:max-w-md mt-6 px-6 py-4 bg-white dark:bg-gray-800 shadow-md overflow-hidden sm:rounded-lg">
                <Card className="w-full max-w-md mx-auto border-0 shadow-none bg-transparent">
                    <CardHeader>
                        <CardTitle className="dark:text-white">Two-Factor Verification</CardTitle>
                        <CardDescription className="dark:text-gray-300">
                            {!showRecoveryCode ?
                                'Please enter the code from your authenticator app to verify your identity.' :
                                'Please enter one of your recovery codes to verify your identity.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!showRecoveryCode ? (
                            <form onSubmit={submitCode}>
                                <div>
                                    <Label htmlFor="code" className="dark:text-gray-300">Authentication Code</Label>
                                    <Input
                                        id="code"
                                        type="text"
                                        className="mt-1 block w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                                        value={form.data.code}
                                        onChange={(e) => form.setData('code', e.target.value)}
                                        autoComplete="one-time-code"
                                        ref={codeInputRef}
                                        autoFocus
                                        inputMode="numeric"
                                        placeholder="Enter 6-digit code"
                                    />
                                    <InputError message={form.errors.code} className="mt-2" />
                                </div>

                                <div className="mt-6">
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={form.processing}
                                    >
                                        Verify
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={submitRecoveryCode}>
                                <div>
                                    <Label htmlFor="recovery_code" className="dark:text-gray-300">Recovery Code</Label>
                                    <Input
                                        id="recovery_code"
                                        type="text"
                                        className="mt-1 block w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                                        value={recoveryForm.data.recovery_code}
                                        onChange={(e) => recoveryForm.setData('recovery_code', e.target.value)}
                                        autoComplete="off"
                                        ref={recoveryCodeInputRef}
                                        autoFocus
                                        placeholder="Enter recovery code"
                                    />
                                    <InputError message={recoveryForm.errors.recovery_code} className="mt-2" />
                                </div>

                                <div className="mt-6">
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={recoveryForm.processing}
                                    >
                                        Verify
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                    <CardFooter className="flex-col">
                        <Button
                            type="button"
                            variant="link"
                            onClick={() => setShowRecoveryCode(!showRecoveryCode)}
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        >
                            {!showRecoveryCode ?
                                "Can't access your authenticator app? Use a recovery code" :
                                "Back to authenticator code verification"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
