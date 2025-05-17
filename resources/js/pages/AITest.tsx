import { Head } from '@inertiajs/react';
import AITaskNoAuthTest from '@/components/AITaskNoAuthTest';

export default function AITest() {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12">
            <Head title="AI Test Page" />
            
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
                        AI Task Creation Test
                    </h1>
                    <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400 sm:mt-4">
                        Test the OpenRouter API integration without authentication
                    </p>
                </div>
                
                <div className="mt-12">
                    <AITaskNoAuthTest 
                        onResponse={(data) => console.log('AI response:', data)}
                    />
                </div>
                
                <div className="mt-12 bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Troubleshooting Steps</h2>
                        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 space-y-4">
                            <p>
                                This page is designed to test the OpenRouter API without requiring authentication.
                                If you see errors here, it's likely an issue with the API key or OpenRouter service.
                            </p>
                            
                            <h3 className="text-md font-medium text-gray-900 dark:text-white mt-4">Common Issues:</h3>
                            <ul className="list-disc pl-5">
                                <li>Invalid or expired OpenRouter API key</li>
                                <li>Model not available on your OpenRouter account</li>
                                <li>Rate limiting on OpenRouter's side</li>
                                <li>Network connectivity issues</li>
                            </ul>
                            
                            <h3 className="text-md font-medium text-gray-900 dark:text-white mt-4">Solutions:</h3>
                            <ul className="list-disc pl-5">
                                <li>Check your .env file for a valid OPENROUTER_API_KEY</li>
                                <li>Verify model availability in your OpenRouter dashboard</li>
                                <li>Check OpenRouter for any service status messages</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 