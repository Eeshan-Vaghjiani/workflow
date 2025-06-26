import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { motion } from 'framer-motion';
import {
    Shield,
    KeyRound,
    Copy,
    Eye,
    EyeOff,
    Save
} from 'lucide-react';

// Animation variants for page elements
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring" as const,
            stiffness: 100,
            damping: 15
        }
    }
};

// Mock QR code for 2FA example
const mockQrCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKQAAACkCAYAAAAZtYVBAAAAAklEQVR4AewaftIAAAWzSURBVO3BQY7kRhIEQdNA/f/Lun3xIAGZVYOZHptD5C8anCkOa5rDmuawpjmsaQ5rmsOa5rCmOaxpDmuaw5rmsKY5rGkOa5rDmuawpjmsaQ5rmsOa5rCm+eElhX9ScYfCRcUdCjeKOxSuFHcovKHwpuIOhTcU/qTiDYWfOKxpDmuaw5rmsKb5YVnFJxR+ouJK4U3FJwquFG4ULiquFK4UbhSuFK4U3lT4hOITCp84rGkOa5rDmuawpvnhyxTuULiouENxpXCh8AmFK8UdClcKVwoXiiuFmwrFJxRuFO5QuEPhTsWbDmuaw5rmsKY5rGl+mEThouJC4aLiQuFG8X+icFFxUfGmw5rmsKY5rGkOa5ofvozCnyjuULhQ3KFwUfGGwk3FG4o7FG5U/JMd1jSHNc1hTXNY0/zwZRR3KFxUXCm8SfEmhU8oXFTcVPwTKfzEYU1zWNMc1jSHNc0PX1bxExVvKFworiouFG4UrhReVfxfKdxUfNNhTXNY0xzWNIc1zQ9fpnBRcVFxoXBRuKi4UXhD4RMV31RxofCm4m90WNMc1jSHNc1hTfPDf5zCHRU3CjcKFxVvKFxUXFRcKdwo3FS8qXBTcaFwofimw5rmsKY5rGkOa5ofvkzhRuGi4kLhouJK4Ubhm1RcKHxCcaVwU/GTCp84rGkOa5rDmuawpvnhJYU7FD6hcFPxhuJG4Q6FOxTuULhSuFG4Q+FG4QmFK4WbijsU/qTDmuawpjmsaQ5rmh/+MopXFS4qrhQuKm4U7lC4Q+FC4ULhRuEOhRuFG4U7Ki4qLhTedFjTHNY0hzXNYU3zw5cp3KFwh+INhRuFbypvKlwp3CjcKNxU/I0Oa5rDmuawpjmsaX54SeFC4UrhQuFC4ULhDYWLiiuFK8VPKlxUvKlwo/CJ4k2HNc1hTXNY0xzWND8sq7hD4QmFNxW/SXFR8SYFF4qfOKxpDmuaw5rmsKb54SWFNxQ+oXCjcFFxUXFTcaVwofBNChcVdyjcofAmhZuKnzisaQ5rmsOa5rCm+eElhTcULiqeUHhC4UbhTRVvULhD4aLiDYUrBQZvKNxUfNNhTXNY0xzWNIc1zQ9fVnGHwk+quFG4qbhD4abiDYUbhRuFi4oblYuKNx3WNIc1zWFNc1jT/PCligvFGyouFC4U7lC4UrhDwRU3FRcVdyi8SeFNijcpPnFY0xzWNIc1zWFN88MvU/iEwhsKn6i4ULipuFJ4VcVFxR0KFxV3KLypuEnhJw5rmsOa5rCmOaxpfviyCq4UXqVwofgmhQvFTyh+k+JK4ZsOa5rDmuawpjmsaX5Y/yWFC8VFxRMKNxXfpHBT8UTFGw5rmsOa5rCmOaxpfnhJ4QmFK4UnFK4UbhSuFL5J4ULhRuFC4Ubhb6RwU3GHwjcd1jSHNc1hTXNY0/zwksKbFC4q7lB4k8ITFXcoXFS8QeFG4UbhDQo3FRcKVwo/cVjTHNY0hzXNYU3zw7KKnyQXFW9QuFC4qbiouFG4qbio+KbDmuawpjmsaQ5rmh++TOEOhU8o3FRcKNxUXCj8iYqLipuKJxT+RMUnDmuaw5rmsKY5rGl++DKFi4onFP7JFC4U7lB4ouKi4krhRuEJhYuKbzqsaQ5rmsOa5rCm+eHLKt5UcaVwUfGEwo3CJxTeoHCl8AmFG8UTFW9SuKn4xGFNc1jTHNY0hzXNDy8puKnCSRVXCp9Q3KFwUfGGwpXihZsU/k2HNc1hTXNY0xzWNPmLBmeKw5rmsKY5rGkOa5rDmuawpjmsaQ5rmsOa5rCmOaxpDmuaw5rmsKY5rGkOa5rDmuawpjmsaf4Hp5NkJknQnvEAAAAASUVORK5CYII=';

// Mock recovery codes
const mockRecoveryCodes = [
    'XJ5D-HBCA-W4F2',
    'PLTN-XCFS-JM7B',
    'WTRF-7DEQ-3KH8',
    '9V4X-NKT7-LZPQ',
    'DM6G-B4JH-TVXW',
    '2YSA-P3FX-VEWK',
    'GUZM-HXC4-8JNP',
    'QVLF-XK3Z-BHGW',
];

export default function Security() {
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [showSetup, setShowSetup] = useState(false);
    const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, processing, errors, reset } = useForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
        verification_code: '',
    });

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // You could add a toast notification here
        alert('Copied to clipboard!');
    };

    const handleSetup2FA = () => {
        setShowSetup(true);
    };

    const handleConfirm2FA = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would verify the code and enable 2FA
        setIs2FAEnabled(true);
        setShowSetup(false);
        setShowRecoveryCodes(true);
    };

    const handleDisable2FA = () => {
        // In a real app, there would be a confirmation step
        setIs2FAEnabled(false);
        setShowRecoveryCodes(false);
    };

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();

        if (data.new_password !== data.confirm_password) {
            alert("Passwords don't match");
            return;
        }

        // In a real app, this would submit to the backend
        alert('Password changed successfully!');
        reset();
    };

    // The 3D effect that follows mouse movement
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        card.style.transition = 'transform 0.5s ease';
    };

    return (
        <AdminLayout>
            <Head title="Security Settings" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage your account security settings</p>
            </div>

            <motion.div
                className="grid grid-cols-1 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Two-Factor Authentication Section */}
                <motion.div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
                    variants={itemVariants}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className="flex items-center mb-6">
                        <div className="p-2 rounded-lg bg-[#D3E3FC] dark:bg-[#1e3a60] text-[#00887A] dark:text-[#00ccb4] mr-4">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Two-Factor Authentication (2FA)
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Add an extra layer of security to your account
                            </p>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg mb-6">
                        <div className="flex items-center">
                            {is2FAEnabled ? (
                                <>
                                    <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        Two-factor authentication is enabled
                                    </span>
                                </>
                            ) : (
                                <>
                                    <div className="h-3 w-3 rounded-full bg-gray-300 dark:bg-gray-600 mr-2"></div>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        Two-factor authentication is not enabled
                                    </span>
                                </>
                            )}
                        </div>

                        {is2FAEnabled ? (
                            <button
                                onClick={handleDisable2FA}
                                className="px-3 py-1.5 text-sm bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            >
                                Disable
                            </button>
                        ) : (
                            <button
                                onClick={handleSetup2FA}
                                className="px-3 py-1.5 text-sm bg-[#D3E3FC] text-[#00887A] dark:bg-[#1e3a60] dark:text-[#00ccb4] rounded-md hover:bg-[#c2daff] dark:hover:bg-[#254b7d] transition-colors"
                            >
                                Enable
                            </button>
                        )}
                    </div>

                    {/* Setup instructions */}
                    {showSetup && (
                        <div className="space-y-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                To enable two-factor authentication, follow these steps:
                            </p>

                            <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2">
                                <li>Download an authenticator app like Google Authenticator or Authy.</li>
                                <li>Scan the QR code below with your authenticator app.</li>
                                <li>Enter the verification code from your authenticator app below.</li>
                            </ol>

                            <div className="bg-white dark:bg-gray-700 p-4 rounded-md mx-auto w-fit">
                                <img
                                    src={mockQrCode}
                                    alt="2FA QR Code"
                                    className="w-48 h-48 mx-auto"
                                />
                            </div>

                            <form onSubmit={handleConfirm2FA} className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="verification_code"
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                    >
                                        Verification Code
                                    </label>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            id="verification_code"
                                            value={data.verification_code}
                                            onChange={(e) => setData('verification_code', e.target.value)}
                                            className="block flex-1 border border-gray-200 dark:border-gray-700 rounded-md py-2 px-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-[#00887A] focus:border-[#00887A] dark:focus:ring-[#00ccb4] dark:focus:border-[#00ccb4]"
                                            placeholder="Enter 6-digit code"
                                            maxLength={6}
                                            required
                                        />
                                        <button
                                            type="submit"
                                            className="ml-2 px-4 py-2 bg-[#00887A] hover:bg-[#007a6c] text-white rounded-md transition-colors"
                                        >
                                            Verify
                                        </button>
                                    </div>
                                    {errors.verification_code && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.verification_code}</p>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Recovery codes */}
                    {is2FAEnabled && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                    Recovery Codes
                                </h4>
                                <button
                                    onClick={() => setShowRecoveryCodes(!showRecoveryCodes)}
                                    className="text-sm text-[#00887A] dark:text-[#00ccb4] hover:underline"
                                >
                                    {showRecoveryCodes ? 'Hide' : 'View'} recovery codes
                                </button>
                            </div>

                            {showRecoveryCodes && (
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        Save these recovery codes in a safe place. They can be used to recover access to
                                        your account if you lose your two-factor authentication device.
                                    </p>

                                    <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md mb-3">
                                        {mockRecoveryCodes.map((code, index) => (
                                            <div key={index} className="font-mono text-sm text-gray-800 dark:text-gray-300">
                                                {code}
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => copyToClipboard(mockRecoveryCodes.join('\n'))}
                                        className="flex items-center text-sm text-[#00887A] dark:text-[#00ccb4] hover:underline"
                                    >
                                        <Copy className="h-4 w-4 mr-1" />
                                        Copy all codes
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Password Change Section */}
                <motion.div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
                    variants={itemVariants}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className="flex items-center mb-6">
                        <div className="p-2 rounded-lg bg-[#D3E3FC] dark:bg-[#1e3a60] text-[#00887A] dark:text-[#00ccb4] mr-4">
                            <KeyRound className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Change Password
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Update your password to keep your account secure
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Current Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    id="current_password"
                                    value={data.current_password}
                                    onChange={(e) => setData('current_password', e.target.value)}
                                    className="block w-full pr-10 border border-gray-200 dark:border-gray-700 rounded-md py-2 px-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-[#00887A] focus:border-[#00887A] dark:focus:ring-[#00ccb4] dark:focus:border-[#00ccb4]"
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    {showCurrentPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {errors.current_password && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.current_password}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    id="new_password"
                                    value={data.new_password}
                                    onChange={(e) => setData('new_password', e.target.value)}
                                    className="block w-full pr-10 border border-gray-200 dark:border-gray-700 rounded-md py-2 px-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-[#00887A] focus:border-[#00887A] dark:focus:ring-[#00ccb4] dark:focus:border-[#00ccb4]"
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {errors.new_password && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.new_password}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirm_password"
                                    value={data.confirm_password}
                                    onChange={(e) => setData('confirm_password', e.target.value)}
                                    className="block w-full pr-10 border border-gray-200 dark:border-gray-700 rounded-md py-2 px-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-[#00887A] focus:border-[#00887A] dark:focus:ring-[#00ccb4] dark:focus:border-[#00ccb4]"
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {errors.confirm_password && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.confirm_password}</p>
                            )}
                            {data.new_password !== data.confirm_password && data.confirm_password && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                                    Passwords do not match
                                </p>
                            )}
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-[#00887A] hover:bg-[#007a6c] text-white rounded-md transition-colors flex items-center"
                                disabled={processing || (data.new_password !== data.confirm_password && data.confirm_password !== '')}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {processing ? 'Saving...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AdminLayout>
    );
}
