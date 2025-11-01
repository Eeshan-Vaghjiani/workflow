import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';

import AppearanceTabs from '@/components/appearance-tabs';
import HeadingSmall from '@/components/heading-small';
import { type BreadcrumbItem } from '@/types';
import { Card3D } from '@/components/ui/card-3d';
import { containerVariants, itemVariants } from '@/lib/theme-constants';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Appearance settings',
        href: '/settings/appearance',
    },
];

export default function Appearance() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Appearance settings" />

            <SettingsLayout>
                <motion.div
                    className="space-y-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={itemVariants}>
                        <HeadingSmall title="Appearance settings" description="Update your account's appearance settings" />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card3D className="p-6">
                            <AppearanceTabs />
                        </Card3D>
                    </motion.div>
                </motion.div>
            </SettingsLayout>
        </AppLayout>
    );
}
