import { useState, useEffect } from 'react';
import axios from 'axios';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, RotateCcw } from 'lucide-react';

export default function AITest() {
    const [loading, setLoading] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);
    
    const testConnection = async () => {
        setLoading(true);
        setErrorDetails(null);
        
        try {
            const response = await axios.get('/api/test-openrouter-connection');
            setTestResult(response.data);
            console.log('API test response:', response.data);
        } catch (error: any) {
            console.error('API test error:', error);
            setTestResult({
                success: false,
                error: error.response?.data?.error || error.message || 'Unknown error'
            });
            
            if (error.response?.data?.details) {
                setErrorDetails(JSON.stringify(error.response.data.details, null, 2));
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
        <AppLayout>
            <Head title="AI Test" />
            <div className="flex flex-col p-4 max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-2">OpenRouter AI API Test</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        This page tests the connection with the OpenRouter API and helps troubleshoot any issues.
                    </p>
                </div>
                
                <div className="bg-white dark:bg-neutral-800 overflow-hidden shadow rounded-lg mb-8">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white">API Connection Status</h2>
                            <Button 
                                variant="outline" 
                                onClick={testConnection}
                                disabled={loading}
                            >
                                {loading ? (
                                    <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                )}
                                Test Connection
                            </Button>
                        </div>
                        
                        {loading ? (
                            <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                <div className="animate-spin mr-3">
                                    <RotateCcw className="h-5 w-5 text-blue-500" />
                                </div>
                                <p>Testing OpenRouter API connection...</p>
                            </div>
                        ) : testResult ? (
                            testResult.success ? (
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md">
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
                                </div>
                            ) : (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md">
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
                                </div>
                            )
                        ) : null}
                    </div>
                </div>
                
                <div className="bg-white dark:bg-neutral-800 overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Troubleshooting Steps</h2>
                        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 space-y-4">
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
                                <ol className="list-decimal pl-5 mt-2 space-y-1">
                                    <li>Run <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">php artisan openrouter:check</code> in your terminal</li>
                                    <li>Run <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">php artisan openrouter:check --fix</code> to update your API key</li>
                                    <li>Get a new API key from <a href="https://openrouter.ai" className="text-blue-600 dark:text-blue-400 underline" target="_blank" rel="noopener">OpenRouter.ai</a></li>
                                    <li>Add the key to your <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">.env</code> file as <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">OPENROUTER_API_KEY=your_key_here</code></li>
                                    <li>Run <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">php artisan config:clear</code> to update your application</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
} 