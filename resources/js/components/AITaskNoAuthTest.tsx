import { useState } from 'react';
import { MessageSquareCode, AlertCircle } from 'lucide-react';

interface AITaskNoAuthTestProps {
    onResponse?: (data: any) => void;
}

export default function AITaskNoAuthTest({ onResponse }: AITaskNoAuthTestProps) {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [isExpanded, setIsExpanded] = useState(true);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsLoading(true);
        setError(null);
        setResult(null);
        setDebugInfo(null);

        try {
            // Using the test endpoint that doesn't require auth
            const response = await fetch('/api/test-ai-tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ prompt })
            });
            
            const data = await response.json();
            console.log('API response:', data);
            
            if (!response.ok || data.error) {
                setDebugInfo(data);
                throw new Error(data.error || `Server responded with status: ${response.status}`);
            }
            
            setResult(data);
            
            if (onResponse) {
                onResponse(data);
            }
        } catch (err: any) {
            setError(`Error: ${err.message || 'Unknown error'}`);
            console.error('Error details:', err);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="bg-white dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 mb-6">
            <div 
                className="flex items-center gap-2 cursor-pointer" 
                onClick={() => setIsExpanded(prev => !prev)}
            >
                <MessageSquareCode className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold">
                    {isExpanded ? "Hide AI Task Tester (No Auth)" : "Test AI Tasks (No Auth)"}
                </h3>
            </div>
            
            {isExpanded && (
                <div className="mt-4">
                    <div className="p-3 mb-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-md text-sm">
                        <p className="font-medium">This is a test version that doesn't require authentication</p>
                        <p className="mt-1">Use this to test if the OpenRouter API is working correctly</p>
                        <p className="mt-1">This uses the endpoint: /api/test-ai-tasks</p>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-opacity-50 border-gray-300 focus:ring-blue-200 focus:border-blue-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white"
                                rows={4}
                                placeholder="Example: Create a website development project with three tasks."
                                required
                            />
                        </div>
                        
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm flex gap-2 items-start">
                                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium">{error}</p>
                                    
                                    {debugInfo && (
                                        <details className="mt-2">
                                            <summary className="cursor-pointer">Show details</summary>
                                            <pre className="mt-2 whitespace-pre-wrap text-xs bg-white dark:bg-black bg-opacity-50 p-2 rounded overflow-auto max-h-96">
                                                {JSON.stringify(debugInfo, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isLoading ? 'Processing...' : 'Test AI Response'}
                            </button>
                        </div>
                    </form>
                    
                    {result && (
                        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-md">
                            <h4 className="font-medium mb-2">Response:</h4>
                            <pre className="text-xs overflow-auto max-h-96">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 