import React from 'react';
import { Head } from '@inertiajs/react';
import MpesaPayment from '@/components/MpesaPayment';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps } from '@/types';

export default function MpesaPaymentPage({ auth }: PageProps) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Pro Membership Payment</h2>}
        >
            <Head title="Pro Membership Payment" />
            <div className="py-8">
                <div className="max-w-xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="mb-6">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pro Membership Payment</h1>
                                <p className="text-gray-600 dark:text-gray-400">Upgrade to Pro Membership by paying via M-Pesa</p>
                            </div>
                            <MpesaPayment
                                title="Pro Membership Payment"
                                description="Pay your Pro Membership fee of KES 1,000 via M-Pesa"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
