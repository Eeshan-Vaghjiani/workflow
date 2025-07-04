import React from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { FileDown, Users, Box, Activity, BarChart } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

interface StatCardProps {
    icon: React.ElementType;
    title: string;
    value: string | number;
    change?: string;
    positive?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, change, positive }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
        <div className="bg-blue-100 p-3 rounded-full mr-4">
            <Icon className="h-6 w-6 text-blue-500" />
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
                <p className={`text-sm ${positive ? 'text-green-500' : 'text-red-500'}`}>
                    {change}
                </p>
            )}
        </div>
    </div>
);

interface Props {
    userCount: number;
    groupCount: number;
    activeUsers: number;
    activeGroups: number;
}

const AnalyticsIndex: React.FC<Props> = ({ userCount, groupCount, activeUsers, activeGroups }) => {
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
                    <StatCard icon={Users} title="Total Users" value={userCount} />
                    <StatCard icon={Box} title="Total Groups" value={groupCount} />
                    <StatCard icon={Activity} title="Active Users" value={activeUsers} />
                    <StatCard icon={BarChart} title="Active Groups" value={activeGroups} />
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">User Activity Chart</h2>
                    <div className="h-64 bg-gray-100 flex items-center justify-center rounded-md">
                        <p className="text-gray-500">Chart will be implemented here.</p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AnalyticsIndex;
