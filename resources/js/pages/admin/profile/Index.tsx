// Profile Page
import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { motion } from 'framer-motion';
import { User, Mail, Camera, Trash2, Save, Briefcase, Calendar } from 'lucide-react';

// Define the User type
interface User {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    created_at: string;
    is_admin: boolean;
}

interface ProfileProps {
    user: User;
}

// Animation variants
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

export default function AdminProfile({ user }: ProfileProps) {
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar || null);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: user.name || '',
        email: user.email || '',
        jobTitle: 'System Administrator',
        department: 'IT Department',
        avatar: null as File | null,
        _method: 'PUT'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.profile.update'), {
            forceFormData: true,
            onSuccess: () => {
                // Show success message or handle success as needed
            }
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setData('avatar', file);

        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
            setAvatarPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    return (
        <AdminLayout>
            <Head title="Admin Profile" />

            <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage your account information</p>
            </motion.div>

            <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Profile Overview Card */}
                <motion.div
                    className="md:col-span-1"
                    variants={itemVariants}
                >
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-[#D3E3FC] dark:bg-[#1e3a60] flex items-center justify-center overflow-hidden">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl font-bold text-[#00887A] dark:text-[#00ccb4]">
                                            {data.name?.charAt(0) || 'A'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{data.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{data.email}</p>

                            <div className="w-full mt-6 space-y-3">
                                <div className="flex items-center text-sm">
                                    <Briefcase className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                                    <span className="text-gray-700 dark:text-gray-300">{data.jobTitle}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Calendar className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Joined {user.created_at ? formatDate(user.created_at) : 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div className="w-full mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Account Status</h4>
                                <div className="flex items-center">
                                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Profile Edit Form */}
                <motion.div
                    className="md:col-span-2"
                    variants={itemVariants}
                >
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Profile Information</h3>

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-6">
                                {/* Avatar Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Profile Photo
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-[#D3E3FC] dark:bg-[#1e3a60] flex items-center justify-center overflow-hidden">
                                            {avatarPreview ? (
                                                <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-2xl font-bold text-[#00887A] dark:text-[#00ccb4]">
                                                    {data.name?.charAt(0) || 'A'}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <label htmlFor="avatar-upload" className="cursor-pointer px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center">
                                                <Camera className="h-4 w-4 mr-2" />
                                                <span>Change Photo</span>
                                                <input
                                                    id="avatar-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleFileChange}
                                                />
                                            </label>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                JPG, PNG, or GIF. Max 1MB.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Name */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            id="name"
                                            className="block w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-[#00887A] focus:border-[#00887A] dark:focus:ring-[#00ccb4] dark:focus:border-[#00ccb4]"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.name}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="email"
                                            id="email"
                                            className="block w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-[#00887A] focus:border-[#00887A] dark:focus:ring-[#00ccb4] dark:focus:border-[#00ccb4]"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.email}</p>
                                    )}
                                </div>

                                {/* Job Title */}
                                <div>
                                    <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Job Title
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Briefcase className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            id="jobTitle"
                                            className="block w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-[#00887A] focus:border-[#00887A] dark:focus:ring-[#00ccb4] dark:focus:border-[#00ccb4]"
                                            value={data.jobTitle}
                                            onChange={(e) => setData('jobTitle', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Department */}
                                <div>
                                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Department
                                    </label>
                                    <select
                                        id="department"
                                        className="block w-full py-2 px-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-[#00887A] focus:border-[#00887A] dark:focus:ring-[#00ccb4] dark:focus:border-[#00ccb4]"
                                        value={data.department}
                                        onChange={(e) => setData('department', e.target.value)}
                                    >
                                        <option value="IT Department">IT Department</option>
                                        <option value="Administration">Administration</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Operations">Operations</option>
                                    </select>
                                </div>

                                {/* Form Buttons */}
                                <div className="pt-4 flex justify-end space-x-4">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
                                        onClick={() => {
                                            reset();
                                            setAvatarPreview(user.avatar);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Reset
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-[#00887A] hover:bg-[#007a6c] text-white rounded-md transition-colors flex items-center"
                                        disabled={processing}
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {processing ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </motion.div>
        </AdminLayout>
    );
}
