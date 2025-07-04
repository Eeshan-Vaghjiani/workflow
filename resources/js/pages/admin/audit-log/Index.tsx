import React from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout'; // Assuming this layout exists
import { motion } from 'framer-motion';

interface AuditLog {
    id: number;
    user: { name: string };
    action: string;
    created_at: string;
}

interface Props {
    auditLogs: AuditLog[];
}

const AuditLogIndex: React.FC<Props> = ({ auditLogs }) => {
    const handleDownloadPdf = () => {
        window.location.href = route('admin.audit-log.pdf');
    };

    return (
        <AdminLayout>
            <Head title="Audit Log" />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Audit Log</h1>
                        <p className="text-gray-500 dark:text-gray-400">Track user activities and system events.</p>
                    </div>
                    <Button onClick={handleDownloadPdf} className="flex items-center gap-2">
                        <FileDown className="h-4 w-4" />
                        <span>Download PDF</span>
                    </Button>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
                    {/* Placeholder for audit log table */}
                    <p>Audit log data will be displayed here.</p>
                </div>
            </motion.div>
        </AdminLayout>
    );
};

export default AuditLogIndex;
