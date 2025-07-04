import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Save } from 'lucide-react';

interface SettingsData {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
    siteName: string;
    maintenanceMode: boolean;
    enable2FA: boolean;
    passwordMinLength: number;
    emailOnNewUser: boolean;
    emailOnGroupInvite: boolean;
}

interface Props {
    settings: SettingsData;
}

const SettingsIndex: React.FC<Props> = ({ settings }) => {
    const { data, setData, post, processing, errors } = useForm({
        siteName: settings?.siteName || 'Workflow App',
        maintenanceMode: settings?.maintenanceMode || false,
        enable2FA: settings?.enable2FA ?? true,
        passwordMinLength: settings?.passwordMinLength || 8,
        emailOnNewUser: settings?.emailOnNewUser ?? true,
        emailOnGroupInvite: settings?.emailOnGroupInvite ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.settings.update'), {
            onSuccess: () => {
                // show success toast
            },
        });
    };

    return (
        <AdminLayout>
            <Head title="Settings" />
            <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                onSubmit={handleSubmit}
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Settings</h1>
                        <p className="text-gray-500 dark:text-gray-400">Manage application settings and preferences.</p>
                    </div>
                    <Button type="submit" disabled={processing}>
                        <Save className="h-4 w-4 mr-2" />
                        {processing ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>

                {/* General Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 mb-6">
                    <h2 className="text-xl font-semibold mb-4">General Settings</h2>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="siteName">Site Name</Label>
                            <Input
                                id="siteName"
                                type="text"
                                value={data.siteName || ''}
                                onChange={(e) => setData('siteName', e.target.value)}
                            />
                            {errors.siteName && <p className="text-red-500 text-xs mt-1">{errors.siteName}</p>}
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                            <Switch
                                id="maintenanceMode"
                                checked={data.maintenanceMode ?? false}
                                onCheckedChange={(checked) => setData('maintenanceMode', checked)}
                            />
                        </div>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="enable2FA">Enable Two-Factor Authentication</Label>
                            <Switch
                                id="enable2FA"
                                checked={data.enable2FA ?? false}
                                onCheckedChange={(checked) => setData('enable2FA', checked)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                            <Select
                                value={String(data.passwordMinLength || 8)}
                                onValueChange={(value) => setData('passwordMinLength', Number(value))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select length" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="8">8 characters</SelectItem>
                                    <SelectItem value="10">10 characters</SelectItem>
                                    <SelectItem value="12">12 characters</SelectItem>
                                    <SelectItem value="14">14 characters</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="emailOnNewUser">Email on New User Signup</Label>
                            <Switch
                                id="emailOnNewUser"
                                checked={data.emailOnNewUser ?? false}
                                onCheckedChange={(checked) => setData('emailOnNewUser', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="emailOnGroupInvite">Email on Group Invitation</Label>
                            <Switch
                                id="emailOnGroupInvite"
                                checked={data.emailOnGroupInvite ?? false}
                                onCheckedChange={(checked) => setData('emailOnGroupInvite', checked)}
                            />
                        </div>
                    </div>
                </div>
            </motion.form>
        </AdminLayout>
    );
};

export default SettingsIndex;
