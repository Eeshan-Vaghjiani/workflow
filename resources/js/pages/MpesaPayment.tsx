import React from 'react';
import { Head } from '@inertiajs/react';
import MpesaPayment from '@/components/MpesaPayment';
import AppLayout from '@/layouts/app-layout';
import { motion } from 'framer-motion';
import { Card3D } from '@/components/ui/card-3d';
import { containerVariants, itemVariants } from '@/lib/theme-constants';

export default function MpesaPaymentPage() {
    const breadcrumbs = [
        {
            title: 'Pro Membership Payment',
            href: '/mpesa-payment',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pro Membership Payment" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex h-full flex-1 flex-col gap-6 p-6"
            >
                <motion.div variants={itemVariants} className="max-w-xl mx-auto w-full">
                    <Card3D className="p-6">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pro Membership Payment</h1>
                            <p className="text-gray-600 dark:text-gray-300 mt-1">Upgrade to Pro Membership by paying via M-Pesa</p>
                        </div>

                        <motion.div variants={itemVariants}>
                            <MpesaPayment
                                title="Pro Membership Payment"
                                description="Pay your Pro Membership fee of KES 1,000 via M-Pesa"
                            />
                        </motion.div>
                    </Card3D>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}
