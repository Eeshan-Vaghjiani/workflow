import React, { useRef } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Card3D } from '@/components/ui/card-3d';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import { generatePDFReport, chartToImage } from '@/lib/pdfUtils';
import { format } from 'date-fns';

interface AnalyticsData {
    total_syncs?: number;
    total_users?: number;
    total_groups?: number;
    user_registrations?: {
        date: string;
        count: number;
    }[];
    group_creations?: {
        date: string;
        count: number;
    }[];
}

interface AnalyticsPageProps {
    analytics_data?: AnalyticsData;
}

export default function Analytics({ analytics_data }: AnalyticsPageProps) {
    const userChartRef = useRef<HTMLDivElement>(null);
    const groupChartRef = useRef<HTMLDivElement>(null);

    // Safely access analytics data with fallbacks
    const {
        total_syncs = 0,
        total_users = 0,
        total_groups = 0,
        user_registrations = [],
        group_creations = []
    } = analytics_data || {};

    const handleExportPDF = async () => {
        try {
            // Convert charts to images
            const userChartImage = userChartRef.current ? await chartToImage(userChartRef.current) : null;
            const groupChartImage = groupChartRef.current ? await chartToImage(groupChartRef.current) : null;

            await generatePDFReport({
                fileName: `analytics-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
                reportTitle: 'Analytics Report',
                tables: [
                    {
                        title: 'Summary Statistics',
                        head: [['Metric', 'Value']],
                        body: [
                            ['Total Users', total_users],
                            ['Total Groups', total_groups],
                            ['Total Syncs', total_syncs]
                        ]
                    },
                    {
                        title: 'User Registration Data',
                        head: [['Date', 'New Users']],
                        body: user_registrations.map(data => [
                            format(new Date(data.date), 'PPP'),
                            data.count
                        ])
                    },
                    {
                        title: 'Group Creation Data',
                        head: [['Date', 'New Groups']],
                        body: group_creations.map(data => [
                            format(new Date(data.date), 'PPP'),
                            data.count
                        ])
                    }
                ],
                charts: [
                    ...(userChartImage ? [{
                        title: 'User Registration Trend',
                        imageData: userChartImage,
                        width: 180,
                        height: 100
                    }] : []),
                    ...(groupChartImage ? [{
                        title: 'Group Creation Trend',
                        imageData: groupChartImage,
                        width: 180,
                        height: 100
                    }] : [])
                ]
            });
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Failed to generate PDF report. Please try again.');
        }
    };

    return (
        <AdminLayout>
            <Head title="Analytics" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
                        <p className="text-gray-600 dark:text-gray-400">System performance and usage statistics</p>
                    </div>

                    <Button onClick={handleExportPDF} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card3D className="p-6">
                        <h3 className="text-lg font-semibold mb-2">Total Users</h3>
                        <p className="text-3xl font-bold">{total_users.toLocaleString()}</p>
                    </Card3D>

                    <Card3D className="p-6">
                        <h3 className="text-lg font-semibold mb-2">Total Groups</h3>
                        <p className="text-3xl font-bold">{total_groups.toLocaleString()}</p>
                    </Card3D>

                    <Card3D className="p-6">
                        <h3 className="text-lg font-semibold mb-2">Total Syncs</h3>
                        <p className="text-3xl font-bold">{total_syncs.toLocaleString()}</p>
                    </Card3D>
                </div>

                {/* Charts */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* User Registrations Chart */}
                    <Card3D className="p-6">
                        <h3 className="text-lg font-semibold mb-4">User Registrations</h3>
                        <div ref={userChartRef} className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={user_registrations}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(date) => format(new Date(date), 'MMM d')}
                                    />
                                    <YAxis />
                                    <Tooltip
                                        labelFormatter={(date) => format(new Date(date as string), 'PPP')}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        name="New Users"
                                        stroke="rgb(0, 136, 122)"
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card3D>

                    {/* Group Creations Chart */}
                    <Card3D className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Group Creations</h3>
                        <div ref={groupChartRef} className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={group_creations}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(date) => format(new Date(date), 'MMM d')}
                                    />
                                    <YAxis />
                                    <Tooltip
                                        labelFormatter={(date) => format(new Date(date as string), 'PPP')}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="count"
                                        name="New Groups"
                                        fill="rgb(0, 136, 122)"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card3D>
                </div>
            </div>
        </AdminLayout>
    );
}
