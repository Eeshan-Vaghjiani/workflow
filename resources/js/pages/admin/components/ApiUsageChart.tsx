import React from 'react';
import { motion, Variants } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GlassContainer } from '@/components/ui/glass-container';

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0
    }
};

interface ApiUsageChartProps {
    data: { date: string; count: number }[];
}

const ApiUsageChart: React.FC<ApiUsageChartProps> = ({ data }) => {
    return (
        <GlassContainer>
            <motion.div variants={itemVariants}>
                <h3 className="text-lg font-semibold text-[rgb(17,24,39)] dark:text-white mb-4">API Usage (Last 7 Days)</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)" />
                            <XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.7)" />
                            <YAxis stroke="rgba(255, 255, 255, 0.7)" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(30, 41, 59, 0.8)',
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                    color: 'rgb(255, 255, 255)'
                                }}
                            />
                            <Legend wrapperStyle={{ color: 'rgb(255, 255, 255)' }} />
                            <Line type="monotone" dataKey="count" name="API Calls" stroke="rgb(136, 132, 216)" activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </GlassContainer>
    );
};

export default ApiUsageChart;
