import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { motion } from 'framer-motion';
import { useAppearance, Theme } from '@/hooks/use-appearance';
import { Card3D } from '@/components/ui/card-3d';
import {
    Moon,
    Sun,
    Monitor,
    Save,
    RefreshCw,
    Palette
} from 'lucide-react';

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

type ColorScheme = 'teal' | 'blue' | 'purple' | 'emerald' | 'amber';

export default function AppearanceSettings() {
    const { theme, setTheme } = useAppearance();
    const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
        const savedScheme = localStorage.getItem('colorScheme') as ColorScheme;
        return savedScheme || 'teal';
    });
    const [motionReduced, setMotionReduced] = useState(() => {
        return localStorage.getItem('reduceMotion') === 'true';
    });
    const [cardHover3D, setCardHover3D] = useState(() => {
        const saved = localStorage.getItem('cardHover3D');
        return saved === null ? true : saved === 'true';
    });

    // Save settings to local storage when they change
    useEffect(() => {
        localStorage.setItem('colorScheme', colorScheme);
        localStorage.setItem('reduceMotion', motionReduced ? 'true' : 'false');
        localStorage.setItem('cardHover3D', cardHover3D ? 'true' : 'false');
    }, [colorScheme, motionReduced, cardHover3D]);

    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);
    };

    const handleColorSchemeChange = (scheme: ColorScheme) => {
        setColorScheme(scheme);
        // Update CSS variables or classes for the color scheme
        document.documentElement.style.setProperty('--primary-color', getColorForScheme(scheme, 'primary'));
        document.documentElement.style.setProperty('--secondary-color', getColorForScheme(scheme, 'secondary'));
    };

    const handleMotionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMotionReduced(e.target.checked);
        if (e.target.checked) {
            document.body.classList.add('reduce-motion');
        } else {
            document.body.classList.remove('reduce-motion');
        }
    };

    const handleCardHover3DChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCardHover3D(e.target.checked);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Save settings and show confirmation
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300';
        toast.innerText = 'Appearance settings saved!';
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    };

    // Function to get color for a given scheme
    const getColorForScheme = (scheme: ColorScheme, type: 'primary' | 'secondary') => {
        const colorMap = {
            teal: { primary: '#00887A', secondary: '#D3E3FC' },
            blue: { primary: '#2563EB', secondary: '#DBEAFE' },
            purple: { primary: '#7C3AED', secondary: '#EDE9FE' },
            emerald: { primary: '#059669', secondary: '#D1FAE5' },
            amber: { primary: '#D97706', secondary: '#FEF3C7' },
        };
        return colorMap[scheme][type];
    };

    // Color scheme options
    const colorSchemes = [
        { name: 'Teal', value: 'teal', primary: '#00887A', secondary: '#D3E3FC' },
        { name: 'Blue', value: 'blue', primary: '#2563EB', secondary: '#DBEAFE' },
        { name: 'Purple', value: 'purple', primary: '#7C3AED', secondary: '#EDE9FE' },
        { name: 'Emerald', value: 'emerald', primary: '#059669', secondary: '#D1FAE5' },
        { name: 'Amber', value: 'amber', primary: '#D97706', secondary: '#FEF3C7' },
    ];

    return (
        <AdminLayout>
            <Head title="Appearance Settings" />

            <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Appearance</h1>
                <p className="text-gray-500 dark:text-gray-400">Customize the look and feel of the admin interface</p>
            </motion.div>

            <form onSubmit={handleSubmit}>
                <motion.div
                    className="grid grid-cols-1 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Theme Selection */}
                    <motion.div variants={itemVariants}>
                        <Card3D className="bg-white dark:bg-gray-800 p-6 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center mb-6">
                                <div className="p-2 rounded-lg bg-[#D3E3FC] dark:bg-[#1e3a60] text-[#00887A] dark:text-[#00ccb4] mr-4">
                                    <Palette className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Theme</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Select your preferred color theme</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    type="button"
                                    onClick={() => handleThemeChange('light')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${theme === 'light'
                                        ? 'border-[#00887A] dark:border-[#00ccb4] bg-[#D3E3FC]/20 dark:bg-[#1e3a60]/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                >
                                    <Sun className="h-8 w-8 mb-2 text-amber-500" />
                                    <span className="font-medium text-gray-900 dark:text-white">Light</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleThemeChange('dark')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${theme === 'dark'
                                        ? 'border-[#00887A] dark:border-[#00ccb4] bg-[#D3E3FC]/20 dark:bg-[#1e3a60]/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                >
                                    <Moon className="h-8 w-8 mb-2 text-indigo-500" />
                                    <span className="font-medium text-gray-900 dark:text-white">Dark</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleThemeChange('system')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${theme === 'system'
                                        ? 'border-[#00887A] dark:border-[#00ccb4] bg-[#D3E3FC]/20 dark:bg-[#1e3a60]/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                >
                                    <Monitor className="h-8 w-8 mb-2 text-blue-500" />
                                    <span className="font-medium text-gray-900 dark:text-white">System</span>
                                </button>
                            </div>
                        </Card3D>
                    </motion.div>

                    {/* Color Scheme Selection */}
                    <motion.div variants={itemVariants}>
                        <Card3D className="bg-white dark:bg-gray-800 p-6 border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Color Scheme</h3>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {colorSchemes.map((scheme) => (
                                    <button
                                        key={scheme.value}
                                        type="button"
                                        onClick={() => handleColorSchemeChange(scheme.value as ColorScheme)}
                                        className={`relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${colorScheme === scheme.value
                                            ? 'border-[#00887A] dark:border-[#00ccb4]'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <div className="flex space-x-1 mb-3">
                                            <div
                                                className="w-6 h-6 rounded-full"
                                                style={{ backgroundColor: scheme.primary }}
                                            />
                                            <div
                                                className="w-6 h-6 rounded-full"
                                                style={{ backgroundColor: scheme.secondary }}
                                            />
                                        </div>
                                        <span className="font-medium text-gray-900 dark:text-white text-sm">
                                            {scheme.name}
                                        </span>

                                        {colorScheme === scheme.value && (
                                            <div className="absolute top-2 right-2 h-2 w-2 bg-[#00887A] dark:bg-[#00ccb4] rounded-full" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </Card3D>
                    </motion.div>

                    {/* Animation Settings */}
                    <motion.div variants={itemVariants}>
                        <Card3D className="bg-white dark:bg-gray-800 p-6 border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Animation & Effects</h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">Reduced Motion</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Minimize animations throughout the interface
                                        </p>
                                    </div>

                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={motionReduced}
                                            onChange={handleMotionChange}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#D3E3FC] dark:peer-focus:ring-[#1e3a60] rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#00887A] dark:peer-checked:bg-[#00ccb4]"></div>
                                    </label>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">3D Card Effects</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Enable 3D effects on cards with mouse movement
                                        </p>
                                    </div>

                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={cardHover3D}
                                            onChange={handleCardHover3DChange}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#D3E3FC] dark:peer-focus:ring-[#1e3a60] rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#00887A] dark:peer-checked:bg-[#00ccb4]"></div>
                                    </label>
                                </div>
                            </div>
                        </Card3D>
                    </motion.div>

                    {/* Submit Button */}
                    <motion.div variants={itemVariants} className="flex justify-end">
                        <button
                            type="submit"
                            className="inline-flex items-center px-4 py-2 bg-[#00887A] hover:bg-[#007A6C] text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#D3E3FC] dark:focus:ring-[#1e3a60]"
                        >
                            <Save className="w-5 h-5 mr-2" />
                            Save Settings
                        </button>
                    </motion.div>
                </motion.div>
            </form>
        </AdminLayout>
    );
}
