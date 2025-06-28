import { useState, useEffect } from 'react';
import axios from 'axios';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { Card3D } from '@/components/ui/card-3d';
import { GlassContainer } from '@/components/ui/glass-container';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { containerVariants, itemVariants } from '@/lib/theme-constants';

interface TestResult {
    success: boolean;
    message?: string;
    error?: string;
    response?: string;
}

export default function AITest() {
    const [loading, setLoading] = useState(false);
    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);

    const breadcrumbs = [
        {
            title: 'AI Test',
            href: '/ai-test',
        },
    ];

    const testConnection = async () => {
        setLoading(true);
        setErrorDetails(null);

        try {
            const response = await axios.get('/api/test-openrouter-connection');
            setTestResult(response.data);
            console.log('API test response:', response.data);
        } catch (error: unknown) {
            console.error('API test error:', error);
            const errorObj = error as {
                response?: {
                    data?: {
                        error?: string;
                        details?: Record<string, unknown>;
                    }
                };
                message?: string;
            };

            setTestResult({
                success: false,
                error: errorObj.response?.data?.error || errorObj.message || 'Unknown error'
            });

            if (errorObj.response?.data?.details) {
                setErrorDetails(JSON.stringify(errorObj.response.data.details, null, 2));
            }
        } finally {
            setLoading(false);
        }
    };

    // Test on component mount
    useEffect(() => {
        testConnection();
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Test" />
            <motion.div
                className="flex h-full flex-1 flex-col gap-6 p-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    className="max-w-4xl mx-auto w-full"
                    variants={itemVariants}
                >
                    <Card3D className="p-6 mb-6">
                        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">OpenRouter AI API Test</h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            This page tests the connection with the OpenRouter API and helps troubleshoot any issues.
                        </p>
                    </Card3D>

                    <motion.div variants={itemVariants}>
                        <GlassContainer className="p-6 mb-6" blurIntensity="sm">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-medium text-gray-900 dark:text-white">API Connection Status</h2>
                                <EnhancedButton
                                    variant="outline"
                                    size="sm"
                                    magnetic={true}
                                    onClick={testConnection}
                                    disabled={loading}
                                    icon={loading ?
                                        <RotateCcw className="h-4 w-4 animate-spin" /> :
                                        <RotateCcw className="h-4 w-4" />
                                    }
                                    iconPosition="left"
                                >
                                    Test Connection
                                </EnhancedButton>
                            </div>

                            {loading ? (
                                <motion.div
                                    className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="animate-spin mr-3">
                                        <RotateCcw className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                                    </div>
                                    <p className="text-blue-800 dark:text-blue-300">Testing OpenRouter API connection...</p>
                                </motion.div>
                            ) : testResult ? (
                                testResult.success ? (
                                    <motion.div
                                        className="p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <div className="flex items-center">
                                            <CheckCircle className="h-5 w-5 mr-2" />
                                            <span className="font-medium">API connection successful!</span>
                                        </div>
                                        <p className="mt-2">{testResult.message}</p>
                                        {testResult.response && (
                                            <div className="mt-2 p-2 bg-white dark:bg-black/20 rounded border border-green-200 dark:border-green-900">
                                                <p className="font-mono text-sm">{testResult.response}</p>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        className="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <div className="flex items-center">
                                            <XCircle className="h-5 w-5 mr-2" />
                                            <span className="font-medium">API connection failed!</span>
                                        </div>
                                        <p className="mt-1">{testResult.error}</p>

                                        {errorDetails && (
                                            <details className="mt-2">
                                                <summary className="cursor-pointer font-medium">Error details</summary>
                                                <pre className="mt-2 p-2 bg-white dark:bg-black/20 rounded border border-red-200 dark:border-red-900 overflow-auto text-xs font-mono">
                                                    {errorDetails}
                                                </pre>
                                            </details>
                                        )}
                                    </motion.div>
                                )
                            ) : null}
                        </GlassContainer>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card3D className="p-6">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Troubleshooting Steps</h2>
                            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-4">
                                <p>
                                    If you're experiencing issues with OpenRouter API, follow these troubleshooting steps:
                                </p>

                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                                    <h3 className="flex items-center text-amber-800 dark:text-amber-200 font-medium">
                                        <AlertCircle className="h-4 w-4 mr-1" />
                                        Common Issues:
                                    </h3>
                                    <ul className="list-disc pl-5 mt-2 text-amber-700 dark:text-amber-300">
                                        <li>Missing or invalid OpenRouter API key</li>
                                        <li>Expired API key</li>
                                        <li>Rate limiting on OpenRouter's side</li>
                                        <li>Network connectivity issues</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-md font-medium text-gray-900 dark:text-white">How to fix:</h3>
                                    <ol className="list-decimal pl-5 mt-2 space-y-1 text-gray-600 dark:text-gray-300">
                                        <li>Run <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">php artisan openrouter:check</code> in your terminal</li>
                                        <li>Run <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">php artisan openrouter:check --fix</code> to update your API key</li>
                                        <li>Get a new API key from <a href="https://openrouter.ai" className="text-primary-600 dark:text-primary-400 underline" target="_blank" rel="noopener">OpenRouter.ai</a></li>
                                        <li>Add the key to your <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">.env</code> file as <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">OPENROUTER_API_KEY=your_key_here</code></li>
                                        <li>Run <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">php artisan config:clear</code> to update your application</li>
                                    </ol>
                                </div>
                            </div>
                        </Card3D>
                    </motion.div>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
}
