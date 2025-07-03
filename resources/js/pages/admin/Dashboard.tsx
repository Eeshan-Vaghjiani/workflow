import React, { useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion, Variants } from 'framer-motion';
import AdminLayout from '@/layouts/admin-layout';
import {
    Users,
    UserCheck,
    Clock,
    TrendingUp,
    TrendingDown,
    Download,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    FileDown,
} from 'lucide-react';
import { GlassContainer } from '@/components/ui/glass-container';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import 'jspdf-autotable';
import './pdf-styles.css';

// Animation variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0
    }
};

// Stats Card Component
interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    change?: string;
    positive?: boolean;
    bgColor?: string;
    delay?: number;
}

interface DownloadData {
    [key: string]: string | number;
}

// Enhanced download functionality with UI capture
const downloadEnhancedPDF = async (element: HTMLElement, data: DownloadData, filename: string, title: string = '') => {
    try {
        // Create PDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 20;
        let yPosition = 20;

        // Add title and header
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;

        // Add timestamp
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPosition);
        yPosition += 15;

        // Capture the UI element
        const canvas = await html2canvas(element, {
            scale: 2, // Higher scale for better quality
            logging: false,
            useCORS: true,
            backgroundColor: null
        });

        // Calculate dimensions to fit in PDF
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Add the image to PDF
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 15;

        // Add a new page for detailed data
        pdf.addPage();
        yPosition = margin;

        // Add detailed data title
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Detailed Data', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;

        // Add data in table format
        const tableData = Object.entries(data).map(([key, value]) => [key, value.toString()]);

        // @ts-expect-error - jspdf-autotable types
        pdf.autoTable({
            startY: yPosition,
            head: [['Metric', 'Value']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [240, 240, 240]
            },
            margin: { left: margin, right: margin }
        });

        // Save the PDF
        pdf.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please try again.');
    }
};

// Add refresh functionality
const refreshData = () => {
    router.reload({ preserveUrl: true });
};

const StatsCard = ({ title, value, icon, change, positive = true, delay = 0 }: StatsCardProps) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const downloadableData: DownloadData = {
        [title]: value,
        ...(change ? { 'Change': change } : {}),
        'Status': positive ? 'Positive' : 'Negative',
        'Timestamp': new Date().toLocaleString(),
    };

    return (
        <GlassContainer
            className="p-6"
            blurIntensity="sm"
            hoverEffect
            ref={cardRef}
        >
            <motion.div
                variants={itemVariants}
                className="relative z-10"
                transition={{ delay }}
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                        <div className="p-2 rounded-lg bg-softBlue dark:bg-primary-600/20 text-primary-500 dark:text-neon-green mr-3">
                            {icon}
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => cardRef.current && downloadEnhancedPDF(
                            cardRef.current,
                            downloadableData,
                            title.toLowerCase().replace(/\s+/g, '-'),
                            title
                        )}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
                {change && (
                    <div className="flex items-center">
                        {positive ? (
                            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span className={`text-sm ${positive ? 'text-green-500' : 'text-red-500'}`}>
                            {change}
                        </span>
                    </div>
                )}
            </motion.div>
        </GlassContainer>
    );
};

// Recent Activity Card Component
interface ActivityItem {
    id: number;
    user: string;
    action: string;
    time: string;
    status?: 'success' | 'warning' | 'error';
}

const recentActivities: ActivityItem[] = [
    { id: 1, user: 'John Doe', action: 'Created a new group', time: '5 mins ago', status: 'success' },
    { id: 2, user: 'Sarah Smith', action: 'Updated user profile', time: '10 mins ago', status: 'success' },
    { id: 3, user: 'Mike Johnson', action: 'Failed login attempt', time: '25 mins ago', status: 'error' },
    { id: 4, user: 'Emily Brown', action: 'Deleted a task', time: '1 hour ago', status: 'warning' },
    { id: 5, user: 'David Wilson', action: 'Added new user', time: '2 hours ago', status: 'success' },
];

const ActivityCard = () => {
    return (
        <GlassContainer
            className="p-6"
            blurIntensity="sm"
            hoverEffect
        >
            <motion.div
                variants={itemVariants}
                className="relative z-10"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        View all
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <motion.div
                    className="space-y-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {recentActivities.map((activity, index) => (
                        <motion.div
                            key={activity.id}
                            className="flex items-start"
                            variants={itemVariants}
                            custom={index}
                            whileHover={{ x: 5, transition: { duration: 0.2 } }}
                        >
                            <motion.div
                                className={`p-2 rounded-full mr-3 ${activity.status === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                                    activity.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                                        'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                    }`}
                                whileHover={{ scale: 1.2 }}
                            >
                                {activity.status === 'success' ? <CheckCircle className="h-4 w-4" /> :
                                    activity.status === 'warning' ? <AlertCircle className="h-4 w-4" /> :
                                        <AlertCircle className="h-4 w-4" />}
                            </motion.div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.user}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{activity.action}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{activity.time}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>
        </GlassContainer>
    );
};

// System Health Component
interface SystemMetric {
    name: string;
    value: number;
    status: 'good' | 'warning' | 'critical';
}

const SystemHealthCard = ({ metrics }: { metrics: SystemMetric[] }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const downloadableMetrics: DownloadData = Object.fromEntries(
        metrics.map(metric => [
            metric.name,
            `${metric.value}${metric.name.includes('Response') ? 'ms' : metric.name.includes('Memory') || metric.name.includes('Size') ? 'MB' : ''} (${metric.status})`
        ])
    );

    return (
        <GlassContainer
            className="p-6"
            blurIntensity="sm"
            hoverEffect
            ref={cardRef}
        >
            <motion.div
                variants={itemVariants}
                className="relative z-10"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Health</h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => cardRef.current && downloadEnhancedPDF(
                            cardRef.current,
                            downloadableMetrics,
                            'system-health',
                            'System Health Metrics'
                        )}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
                <div className="space-y-4">
                    {metrics.map((metric, index) => (
                        <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">{metric.name}</p>
                                <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${metric.status === 'good'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : metric.status === 'warning'
                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        }`}
                                >
                                    {metric.status}
                                </span>
                            </div>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {metric.value}
                                {metric.name.includes('Response') && 'ms'}
                                {(metric.name.includes('Memory') || metric.name.includes('Size')) && 'MB'}
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                <div
                                    className={`h-2 rounded-full ${metric.status === 'good'
                                        ? 'bg-green-500'
                                        : metric.status === 'warning'
                                            ? 'bg-yellow-500'
                                            : 'bg-red-500'
                                        }`}
                                    style={{
                                        width: `${metric.name.includes('Response')
                                            ? Math.min(100, (metric.value / 1000) * 100)
                                            : Math.min(100, (metric.value / 500) * 100)
                                            }%`,
                                    }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </GlassContainer>
    );
};

// AI Stats Card Component
interface AIStats {
    totalPrompts: number;
    promptsToday: number;
    calendarSyncs: number;
    activeCalendarSyncs: number;
}

const AIStatsCard = ({ stats }: { stats: AIStats }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const downloadableStats: DownloadData = {
        'Total AI Prompts': stats.totalPrompts,
        'Prompts Today': stats.promptsToday,
        'Calendar Syncs': stats.calendarSyncs,
        'Active Syncs': stats.activeCalendarSyncs,
        'Last Updated': new Date().toLocaleString(),
    };

    return (
        <GlassContainer
            className="p-6"
            blurIntensity="sm"
            hoverEffect
            ref={cardRef}
        >
            <motion.div
                variants={itemVariants}
                className="relative z-10"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI & Integration Stats</h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => cardRef.current && downloadEnhancedPDF(
                            cardRef.current,
                            downloadableStats,
                            'ai-integration-stats',
                            'AI & Integration Statistics'
                        )}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total AI Prompts</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalPrompts.toLocaleString()}</p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Prompts Today</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.promptsToday.toLocaleString()}</p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Calendar Syncs</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.calendarSyncs.toLocaleString()}</p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Active Syncs</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.activeCalendarSyncs.toLocaleString()}</p>
                    </div>
                </div>
            </motion.div>
        </GlassContainer>
    );
};

// Recent Messages Card Component
interface Message {
    id: number;
    user: string;
    message: string;
    time: string;
}

interface Report {
    id: number;
    title: string;
    summary: string;
    time: string;
}

const MessagesAndReportsCard = ({ messages, reports }: { messages: Message[], reports: Report[] }) => {
    return (
        <GlassContainer
            className="p-6"
            blurIntensity="sm"
            hoverEffect
        >
            <motion.div
                variants={itemVariants}
                className="relative z-10"
            >
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Messages</h3>
                        <div className="space-y-4">
                            {messages.map((message) => (
                                <div key={message.id} className="border-l-4 border-primary-500 pl-4">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{message.user}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{message.message}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{message.time}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Reports</h3>
                        <div className="space-y-4">
                            {reports.map((report) => (
                                <div key={report.id} className="border-l-4 border-neon-green pl-4">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{report.title}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{report.summary}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{report.time}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </GlassContainer>
    );
};

interface DashboardProps {
    stats: {
        totalUsers: {
            value: number;
            change: string;
            positive: boolean;
        };
        activeGroups: {
            value: number;
            change: string;
            positive: boolean;
        };
        systemHealth: {
            value: string;
            change: string;
            positive: boolean;
        };
        uptime: {
            value: string;
            change: string | null;
            positive: boolean;
        };
    };
    systemMetrics: SystemMetric[];
    recentMessages: Message[];
    recentReports: Report[];
    aiStats: AIStats;
}

export default function Dashboard({
    stats,
    systemMetrics,
    recentMessages,
    recentReports,
    aiStats
}: DashboardProps) {
    const dashboardRef = useRef<HTMLDivElement>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    // Generate comprehensive dashboard report
    const downloadDashboardReport = async (
        dashboardRef: React.RefObject<HTMLDivElement>,
        stats: {
            totalUsers: {
                value: number;
                change: string;
                positive: boolean;
            };
            activeGroups: {
                value: number;
                change: string;
                positive: boolean;
            };
            systemHealth: {
                value: string;
                change: string;
                positive: boolean;
            };
            uptime: {
                value: string;
                change: string | null;
                positive: boolean;
            };
        },
        systemMetrics: SystemMetric[],
        aiStats: AIStats
    ) => {
        try {
            setIsGeneratingPDF(true);
            if (!dashboardRef.current) return;

            // Add PDF export class
            dashboardRef.current.classList.add('pdf-export');

            // Create PDF
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Capture the dashboard overview
            const canvas = await html2canvas(dashboardRef.current, {
                scale: 1.5,
                logging: false,
                useCORS: true,
                backgroundColor: '#ffffff',
                removeContainer: true,
                onclone: (document, element) => {
                    // Force light theme for PDF
                    element.classList.remove('dark');
                    const meta = document.createElement('meta');
                    meta.setAttribute('name', 'color-scheme');
                    meta.setAttribute('content', 'light');
                    document.head.appendChild(meta);
                }
            });

            // Remove PDF export class
            dashboardRef.current.classList.remove('pdf-export');

            // Add title
            pdf.setFontSize(20);
            pdf.setFont('helvetica', 'bold');
            const title = 'Dashboard Report';
            const titleWidth = pdf.getStringUnitWidth(title) * 20 / pdf.internal.scaleFactor;
            const titleX = (pdf.internal.pageSize.getWidth() - titleWidth) / 2;
            pdf.text(title, titleX, 20);

            // Add timestamp
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            const timestamp = `Generated on: ${new Date().toLocaleString()}`;
            pdf.text(timestamp, 20, 30);

            // Add the dashboard overview
            const imgWidth = pdf.internal.pageSize.getWidth() - 40;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 20, 40, imgWidth, imgHeight);

            // Add system metrics table
            pdf.addPage();
            // @ts-expect-error - jspdf-autotable types
            pdf.autoTable({
                head: [['Metric', 'Value', 'Status']],
                body: systemMetrics.map(metric => [
                    metric.name,
                    metric.value.toString(),
                    metric.status
                ]),
                startY: 20,
                theme: 'grid',
                headStyles: {
                    fillColor: [59, 130, 246],
                    textColor: 255
                },
                alternateRowStyles: {
                    fillColor: [245, 247, 250]
                }
            });

            // Add AI stats table
            const pdfWithTable = pdf as jsPDF & { lastAutoTable: { finalY: number } };
            // @ts-expect-error - jspdf-autotable types
            pdf.autoTable({
                head: [['AI Metric', 'Value']],
                body: [
                    ['Total Prompts', aiStats.totalPrompts],
                    ['Prompts Today', aiStats.promptsToday],
                    ['Calendar Syncs', aiStats.calendarSyncs],
                    ['Active Calendar Syncs', aiStats.activeCalendarSyncs]
                ],
                startY: pdfWithTable.lastAutoTable?.finalY + 20 || 20,
                theme: 'grid',
                headStyles: {
                    fillColor: [59, 130, 246],
                    textColor: 255
                },
                alternateRowStyles: {
                    fillColor: [245, 247, 250]
                }
            });

            // Save the PDF
            pdf.save(`dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`);

        } catch (error) {
            console.error('Error generating dashboard report:', error);
            alert('There was an error generating the report. Please try again.');
        } finally {
            setIsGeneratingPDF(false);
            if (dashboardRef.current) {
                dashboardRef.current.classList.remove('pdf-export');
            }
        }
    };

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />
            <div className={`p-6 ${isGeneratingPDF ? 'pdf-export' : ''}`}>
                <motion.div
                    className="space-y-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    ref={dashboardRef}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={refreshData}
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Refresh Data
                            </Button>
                            <Button
                                variant="default"
                                onClick={() => downloadDashboardReport(dashboardRef, stats, systemMetrics, aiStats)}
                                className="flex items-center gap-2"
                            >
                                <FileDown className="h-4 w-4" />
                                Download Full Report
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatsCard
                            title="Total Users"
                            value={stats.totalUsers.value}
                            icon={<Users className="h-6 w-6" />}
                            change={stats.totalUsers.change}
                            positive={stats.totalUsers.positive}
                            delay={0.1}
                        />
                        <StatsCard
                            title="Active Groups"
                            value={stats.activeGroups.value}
                            icon={<UserCheck className="h-6 w-6" />}
                            change={stats.activeGroups.change}
                            positive={stats.activeGroups.positive}
                            delay={0.2}
                        />
                        <StatsCard
                            title="Uptime"
                            value={stats.uptime.value}
                            icon={<Clock className="h-6 w-6" />}
                            positive={stats.uptime.positive}
                            delay={0.4}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ActivityCard />
                        <SystemHealthCard metrics={systemMetrics} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <AIStatsCard stats={aiStats} />
                        <MessagesAndReportsCard messages={recentMessages} reports={recentReports} />
                    </div>
                </motion.div>
            </div>
        </AdminLayout>
    );
}
