import React from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

const AnalyticsIndex: React.FC = () => {
    const handleDownloadPdf = () => {
        window.location.href = route('admin.analytics.pdf');
    };

    return (
        <AdminLayout>
            <Head title="Analytics" />
            <div className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold">Analytics</h1>
                    <Button onClick={handleDownloadPdf} className="flex items-center gap-2">
                        <FileDown className="h-4 w-4" />
                        <span>Download PDF</span>
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {/* Placeholder for stat cards */}
                    <div className="bg-white p-6 rounded-lg shadow-md">Stat Card 1</div>
                    <div className="bg-white p-6 rounded-lg shadow-md">Stat Card 2</div>
                    <div className="bg-white p-6 rounded-lg shadow-md">Stat Card 3</div>
                    <div className="bg-white p-6 rounded-lg shadow-md">Stat Card 4</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Analytics Chart</h2>
                    <p>Chart will be displayed here.</p>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AnalyticsIndex;
