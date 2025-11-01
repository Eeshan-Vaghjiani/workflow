import { type BreadcrumbItem, type PageProps } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, Fragment, useState, useRef } from 'react';
import { motion } from 'framer-motion';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Calendar, Upload, Camera, Check, Info } from 'lucide-react';
import { GlassContainer } from '@/components/ui/glass-container';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: '/settings/profile',
    },
];

type ProfileForm = {
    name: string;
    email: string;
    bio?: string;
    phone?: string;
    location?: string;
    website?: string;
    avatar?: File | null;
}

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<PageProps>().props;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm<ProfileForm>({
        name: auth.user.name,
        email: auth.user.email,
        bio: auth.user.bio || '',
        phone: auth.user.phone || '',
        location: auth.user.location || '',
        website: auth.user.website || '',
        avatar: null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('email', data.email);
        if (data.bio) formData.append('bio', data.bio);
        if (data.phone) formData.append('phone', data.phone);
        if (data.location) formData.append('location', data.location);
        if (data.website) formData.append('website', data.website);
        if (data.avatar) formData.append('avatar', data.avatar);

        patch(route('profile.update'), {
            preserveScroll: true,
            data: formData,
        });
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('avatar', file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setAvatarPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <motion.div 
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <HeadingSmall 
                        title="Profile information" 
                        description="Update your account's profile information and email address" 
                    />

                    <GlassContainer className="p-6">
                        <CardHeader className="px-0 pb-6">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <User className="h-5 w-5" />
                                Personal Information
                            </CardTitle>
                        </CardHeader>

                        <form onSubmit={submit} className="space-y-6">
                            {/* Avatar Section */}
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <Avatar className="h-24 w-24">
                                        <AvatarImage 
                                            src={avatarPreview || auth.user.avatar} 
                                            alt={auth.user.name}
                                        />
                                        <AvatarFallback className="text-2xl">
                                            {auth.user.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <button
                                        type="button"
                                        onClick={triggerFileInput}
                                        className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors shadow-lg"
                                    >
                                        <Camera className="h-4 w-4" />
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleAvatarChange}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Profile Photo
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Upload a new avatar. Recommended size: 400x400px or larger.
                                    </p>
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={triggerFileInput}
                                        className="mt-3"
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Choose File
                                    </Button>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-medium">
                                        Full Name *
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        autoComplete="name"
                                        placeholder="Enter your full name"
                                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium">
                                        Email Address *
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                        autoComplete="username"
                                        placeholder="Enter your email address"
                                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-sm font-medium">
                                        Phone Number
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={data.phone || ''}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        autoComplete="tel"
                                        placeholder="Enter your phone number"
                                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                    />
                                    <InputError message={errors.phone} />
                                </div>

                                {/* Location */}
                                <div className="space-y-2">
                                    <Label htmlFor="location" className="text-sm font-medium">
                                        Location
                                    </Label>
                                    <Input
                                        id="location"
                                        value={data.location || ''}
                                        onChange={(e) => setData('location', e.target.value)}
                                        placeholder="City, Country"
                                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                    />
                                    <InputError message={errors.location} />
                                </div>

                                {/* Website */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="website" className="text-sm font-medium">
                                        Website
                                    </Label>
                                    <Input
                                        id="website"
                                        type="url"
                                        value={data.website || ''}
                                        onChange={(e) => setData('website', e.target.value)}
                                        placeholder="https://your-website.com"
                                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                    />
                                    <InputError message={errors.website} />
                                </div>
                            </div>

                            {/* Bio */}
                            <div className="space-y-2">
                                <Label htmlFor="bio" className="text-sm font-medium">
                                    Bio
                                </Label>
                                <Textarea
                                    id="bio"
                                    value={data.bio || ''}
                                    onChange={(e) => setData('bio', e.target.value)}
                                    placeholder="Tell us about yourself..."
                                    rows={4}
                                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {(data.bio || '').length}/500 characters
                                </p>
                                <InputError message={errors.bio} />
                            </div>

                            {/* Email Verification */}
                            {mustVerifyEmail && auth.user.email_verified_at === null && (
                                <motion.div 
                                    className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="flex items-start gap-3">
                                        <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                                Your email address is unverified.{' '}
                                                <Link
                                                    href={route('verification.send')}
                                                    method="post"
                                                    as="button"
                                                    className="font-medium underline hover:no-underline"
                                                >
                                                    Click here to resend the verification email.
                                                </Link>
                                            </p>

                                            {status === 'verification-link-sent' && (
                                                <motion.div 
                                                    className="mt-2 flex items-center gap-2 text-green-600 dark:text-green-400"
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <Check className="h-4 w-4" />
                                                    <span className="text-sm font-medium">
                                                        A new verification link has been sent to your email address.
                                                    </span>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div className="flex items-center gap-4 pt-4">
                                <Button disabled={processing} className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>

                                <Transition
                                    as={Fragment}
                                    show={recentlySuccessful}
                                    enter="transition ease-in-out duration-300"
                                    enterFrom="opacity-0"
                                    enterTo="opacity-100"
                                    leave="transition ease-in-out duration-300"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                >
                                    <motion.div
                                        className="flex items-center gap-2 text-green-600 dark:text-green-400"
                                        initial={{ scale: 0.9 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Check className="h-4 w-4" />
                                        <span className="text-sm font-medium">Profile updated successfully!</span>
                                    </motion.div>
                                </Transition>
                            </div>
                        </form>
                    </GlassContainer>

                    {/* Account Information */}
                    <GlassContainer className="p-6">
                        <CardHeader className="px-0 pb-4">
                            <CardTitle className="text-lg">Account Information</CardTitle>
                        </CardHeader>
                        <div className="grid gap-4">
                            <div className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm">Email Status</span>
                                </div>
                                <Badge variant={auth.user.email_verified_at ? "default" : "secondary"}>
                                    {auth.user.email_verified_at ? "Verified" : "Unverified"}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm">Member Since</span>
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {auth.user.created_at ? 
                                        new Date(auth.user.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }) : 
                                        'Unknown'
                                    }
                                </span>
                            </div>
                        </div>
                    </GlassContainer>

                    <DeleteUser />
                </motion.div>
            </SettingsLayout>
        </AppLayout>
    );
}
