import React, { useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    Users,
    UserCheck,
    TrendingUp,
    RefreshCw,
    FileDown,
    BrainCircuit,
    Calendar,
    CreditCard,
    AlertCircle,
    FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';
import './pdf-styles.css';
import { StatCard } from '@/components/ui/stat-card';
import { ActivityCard } from '@/components/ui/ActivityCard';
import { DownloadData } from '@/lib/pdfUtils';
import AdminRouteTester from '@/components/admin/components/AdminRouteTester';
import { Card3D } from '@/components/ui/card-3d';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: UserOptions) => jsPDF;
        lastAutoTable: {
            finalY: number;
        } | undefined;
    }
}

interface DashboardProps {
    stats: {
        users: { total: number };
        groups: { total: number };
        mpesa: { total_revenue: string };
        assignments: { total: number };
    };
    charts?: {
        api_usage_last_7_days: Array<{ date: string; count: number }>;
        mpesa_prompts_status: {
            completed: number;
            failed: number;
        };
    };
    aiStats?: {
        totalPrompts: number;
        promptsToday: number;
        calendarSyncs: number;
        activeCalendarSyncs: number;
    };
}

export default function Dashboard({ stats, charts, aiStats }: DashboardProps) {
    const dashboardRef = useRef<HTMLDivElement>(null);
    const apiChartRef = useRef<HTMLDivElement>(null);
    const mpesaChartRef = useRef<HTMLDivElement>(null);

    // Data for MPesa status pie chart
    const mpesaStatusData = charts?.mpesa_prompts_status ? [
        { name: 'Completed', value: charts.mpesa_prompts_status.completed },
        { name: 'Failed', value: charts.mpesa_prompts_status.failed }
    ] : [];

    const downloadDashboardReport = async () => {
        try {
            // Prepare data for PDF report
            const reportData: DownloadData = {
                'Key Metrics': {
                    'Total Users': stats.users.total,
                    'Total Groups': stats.groups.total,
                    'Total M-Pesa Revenue': stats.mpesa.total_revenue,
                },
                'AI & Integration': {
                    'Total AI Prompts': aiStats?.totalPrompts || 0,
                    'AI Prompts Today': aiStats?.promptsToday || 0,
                    'Calendar Syncs': aiStats?.calendarSyncs || 0,
                    'Active Calendar Syncs': aiStats?.activeCalendarSyncs || 0,
                },
                'MPesa Transactions': {
                    'Completed Transactions': charts?.mpesa_prompts_status?.completed || 0,
                    'Failed Transactions': charts?.mpesa_prompts_status?.failed || 0,
                },
            };

            // Convert charts to images if they exist
            let apiChartImage = null;
            let mpesaChartImage = null;

            if (apiChartRef.current) {
                try {
                    apiChartImage = await import('@/lib/pdfUtils').then(module =>
                        module.chartToImage(apiChartRef.current!)
                    );
                } catch (err) {
                    console.error('Error converting API chart to image:', err);
                }
            }

            if (mpesaChartRef.current) {
                try {
                    mpesaChartImage = await import('@/lib/pdfUtils').then(module =>
                        module.chartToImage(mpesaChartRef.current!)
                    );
                } catch (err) {
                    console.error('Error converting MPesa chart to image:', err);
                }
            }

            await import('@/lib/pdfUtils').then(module =>
                module.generatePDFReport({
                    fileName: 'admin-dashboard-report.pdf',
                    reportTitle: 'Admin Dashboard Report',
                    tables: [
                        {
                            title: 'Key Metrics',
                            head: [['Metric', 'Value']],
                            body: [
                                ['Total Users', stats.users.total],
                                ['Total Groups', stats.groups.total],
                                ['Total M-Pesa Revenue', `KES ${stats.mpesa.total_revenue}`],
                                ['Total AI Prompts', aiStats?.totalPrompts || 0],
                                ['AI Prompts Today', aiStats?.promptsToday || 0],
                                ['Calendar Syncs', aiStats?.calendarSyncs || 0],
                                ['Active Calendar Syncs', aiStats?.activeCalendarSyncs || 0],
                                ['Completed MPesa Transactions', charts?.mpesa_prompts_status?.completed || 0],
                                ['Failed MPesa Transactions', charts?.mpesa_prompts_status?.failed || 0],
                            ]
                        },
                        ...(charts?.api_usage_last_7_days?.length ? [{
                            title: 'API Usage (Last 7 Days)',
                            head: [['Date', 'API Calls']],
                            body: charts.api_usage_last_7_days.map(item => [
                                item.date,
                                item.count
                            ])
                        }] : [])
                    ],
                    charts: [
                        ...(apiChartImage ? [{
                            title: 'API Usage Trend',
                            imageData: apiChartImage,
                            width: 180,
                            height: 100
                        }] : []),
                        ...(mpesaChartImage ? [{
                            title: 'MPesa Transaction Status',
                            imageData: mpesaChartImage,
                            width: 180,
                            height: 100
                        }] : [])
                    ]
                })
            );
        } catch (error) {
            console.error('Error generating PDF report:', error);
            alert('Failed to generate PDF report. Please try again.');
        }
    };

    const handleGenerateReport = () => {
        window.open(route('admin.analytics.pdf'), '_blank');
    };

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />
            <div className="p-4 md:p-8" ref={dashboardRef}>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-[rgb(17,24,39)] dark:text-white">Dashboard</h1>
                        <p className="text-[rgb(75,85,99)] dark:text-[rgb(156,163,175)]">Overview of your system</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => router.reload()} variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                        <Button onClick={handleGenerateReport} variant="primary" size="sm">
                            <FileDown className="h-4 w-4 mr-2" />
                            Full Report
                        </Button>
                    </div>
                </div>

                {/* Main Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                    <StatCard
                        title="Total Users"
                        value={stats?.users?.total || 0}
                        icon={<Users className="h-6 w-6" />}
                    />
                    <StatCard
                        title="Active Groups"
                        value={stats?.groups?.total || 0}
                        icon={<UserCheck className="h-6 w-6" />}
                    />
                    <StatCard
                        title="Total Assignments"
                        value={stats?.assignments?.total || 0}
                        icon={<FileText className="h-6 w-6" />}
                        variant="primary"
                    />
                </div>

                {/* AI & Integration Stats */}
                <h2 className="text-xl font-semibold mb-4 text-[rgb(17,24,39)] dark:text-white">AI & Integration</h2>
                <div className="grid gap-4 md:grid-cols-4 mb-8">
                    <StatCard
                        title="Total AI Prompts"
                        value={aiStats?.totalPrompts || 0}
                        icon={<BrainCircuit className="h-6 w-6" />}
                        variant="secondary"
                    />
                    <StatCard
                        title="AI Prompts Today"
                        value={aiStats?.promptsToday || 0}
                        icon={<BrainCircuit className="h-6 w-6" />}
                        variant="secondary"
                    />
                    <StatCard
                        title="Calendar Syncs"
                        value={aiStats?.calendarSyncs || 0}
                        icon={<Calendar className="h-6 w-6" />}
                        variant="secondary"
                    />
                    <StatCard
                        title="Active Calendar Syncs"
                        value={aiStats?.activeCalendarSyncs || 0}
                        icon={<Calendar className="h-6 w-6" />}
                        variant="secondary"
                    />
                </div>

                {/* MPesa Stats */}
                <h2 className="text-xl font-semibold mb-4 text-[rgb(17,24,39)] dark:text-white">MPesa Transactions</h2>
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                    <StatCard
                        title="Completed Transactions"
                        value={charts?.mpesa_prompts_status?.completed || 0}
                        icon={<CreditCard className="h-6 w-6" />}
                        variant="success"
                    />
                    <StatCard
                        title="Failed Transactions"
                        value={charts?.mpesa_prompts_status?.failed || 0}
                        icon={<AlertCircle className="h-6 w-6" />}
                        variant="danger"
                    />
                    <StatCard
                        title="Total Revenue"
                        value={`KES ${stats?.mpesa?.total_revenue || '0.00'}`}
                        icon={<TrendingUp className="h-6 w-6" />}
                    />

                </div>

                {/* Charts */}
                <div className="grid gap-6 md:grid-cols-2 mb-8">
                    {/* API Usage Chart */}
                    <Card3D className="p-6">
                        <h3 className="text-lg font-semibold mb-4">API Usage (Last 7 Days)</h3>
                        <div ref={apiChartRef} className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={charts?.api_usage_last_7_days || []}
                                    margin={{
                                        top: 5,
                                        right: 30,
                                        left: 20,
                                        bottom: 5,
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="count" name="API Calls" fill="#007a6c" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card3D>

                    {/* MPesa Status Chart */}
                    <Card3D className="p-6">
                        <h3 className="text-lg font-semibold mb-4">MPesa Transaction Status</h3>
                        <div ref={mpesaChartRef} className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={mpesaStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => percent ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {mpesaStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#007a6c' : '#ff6b6b'} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card3D>
                </div>

                {/* Recent Activity */}
                <ActivityCard />

                {/* Route Tester (Development Only) */}
                {process.env.NODE_ENV !== 'production' && (
                    <div className="mt-8">
                        <AdminRouteTester />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
