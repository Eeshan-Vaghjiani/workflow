import React from 'react';
import { Head } from '@inertiajs/react';
import MpesaPayment from '@/components/MpesaPayment';
import { AppShell } from '@/components/app-shell';
import { AppHeader } from '@/components/app-header';
import { AppContent } from '@/components/app-content';

export default function MpesaPaymentPage() {
    const breadcrumbs = [
        { title: 'Home', href: '/' },
        { title: 'Payment', href: '/mpesa' }
    ];

    return (
        <AppShell>
            <Head title="Make Payment" />
            <AppHeader breadcrumbs={breadcrumbs} />
            <AppContent>
                <div className="container py-6">
                    <div className="max-w-xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold">Make Payment with M-Pesa</h1>
                        </div>
                        <p className="text-muted-foreground mb-6">Complete your payment securely using M-Pesa</p>
                        <MpesaPayment
                            title="Complete Your Payment"
                            description="Enter your phone number to receive an M-Pesa payment prompt"
                        />
                    </div>
                </div>
            </AppContent>
        </AppShell>
    );
}
