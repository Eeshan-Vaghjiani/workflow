import { useState } from 'react';
import axios from 'axios';
import { MessageSquareCode, AlertCircle } from 'lucide-react';

interface AITaskPromptProps {
    groupId: string | number;
    onTasksCreated?: (data: any) => void;
}

export default function AITaskPrompt({ groupId, onTasksCreated }: AITaskPromptProps) {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsLoading(true);
        setError(null);
        setDebugInfo(null);

        try {
            // Get the CSRF token from the meta tag
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            // Configure axios with the CSRF token
            axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
            axios.defaults.headers.common['Accept'] = 'application/json';
            axios.defaults.withCredentials = true; // Important for sending cookies with the request

            const response = await axios.post(`/api/groups/${groupId}/ai/tasks`, { prompt });
            
            setIsLoading(false);
            setPrompt('');
            
            if (onTasksCreated) {
                onTasksCreated(response.data);
            }
        } catch (err: any) {
            setIsLoading(false);
            console.error('Error details:', err);
            
            // Set more detailed error information
            if (err.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                setError(`Server error: ${err.response.status} - ${err.response?.data?.error || err.response?.data?.message || 'Unknown error'}`);
                setDebugInfo(JSON.stringify(err.response.data, null, 2));
                
                if (err.response.status === 401) {
                    setError('Authentication error: You are not logged in or your session has expired. Please refresh the page and try again.');
                }
            } else if (err.request) {
                // The request was made but no response was received
                setError('Network error: No response received from server. Please check your internet connection.');
            } else {
                // Something happened in setting up the request that triggered an Error
                setError(`Error: ${err.message}`);
            }
        }
    }
    
    // Function to check authentication status
    async function checkAuth() {
        try {
            const response = await axios.get('/api/user');
            setDebugInfo(`Authentication successful: ${JSON.stringify(response.data, null, 2)}`);
        } catch (err: any) {
            setDebugInfo(`Authentication error: ${err.response?.status} - ${err.response?.data?.message || 'Unknown error'}`);
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
                    {isExpanded ? "Hide AI Task Creator" : "Use AI to Create Tasks"}
                </h3>
            </div>
            
            {isExpanded && (
                <div className="mt-4">
                    <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                        Describe your assignment and tasks in natural language. The AI will help create structured tasks automatically.
                    </p>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-opacity-50 border-gray-300 focus:ring-blue-200 focus:border-blue-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white"
                                rows={4}
                                placeholder="Example: Create a website development project for our client XYZ Company. The project needs UI design by Alice due next Friday, backend development by Bob with high priority due in 2 weeks, and deployment by Charlie with medium priority due by the end of the month."
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
                                            <summary className="cursor-pointer">Show technical details</summary>
                                            <pre className="mt-2 whitespace-pre-wrap text-xs bg-white dark:bg-black bg-opacity-50 p-2 rounded">
                                                {debugInfo}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <div className="flex justify-between">
                            <button
                                type="button"
                                onClick={checkAuth}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md font-semibold text-xs tracking-widest hover:bg-gray-50 dark:hover:bg-neutral-700"
                            >
                                Check Auth Status
                            </button>
                            
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isLoading ? 'Processing...' : 'Generate Tasks with AI'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
} 