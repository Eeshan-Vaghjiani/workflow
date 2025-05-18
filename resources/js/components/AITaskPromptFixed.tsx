import { useState, useEffect } from 'react';
import { MessageSquareCode, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

interface AITaskPromptFixedProps {
    groupId: string | number;
    onTasksCreated?: (data: any) => void;
}

export default function AITaskPromptFixed({ groupId, onTasksCreated }: AITaskPromptFixedProps) {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(true); // Start expanded to see errors easier
    const [debugInfo, setDebugInfo] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [createdAssignment, setCreatedAssignment] = useState<any>(null);
    const [rawErrorData, setRawErrorData] = useState<any>(null);

    // This effect runs once when the component mounts
    useEffect(() => {
        // Check if the AI service is available
        const checkAiService = async () => {
            try {
                const response = await axios.post('/api/test-ai-tasks', { prompt: 'Test prompt' });
                if (response.data?.success) {
                    setDebugInfo('AI Service is available (no auth mode)');
                }
            } catch (err) {
                console.error('AI service check failed:', err);
                setDebugInfo('AI Service might not be available - check OpenRouter API key');
            }
        };
        
        checkAiService();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsLoading(true);
        setError(null);
        setDebugInfo(null);
        setSuccessMessage(null);
        setCreatedAssignment(null);
        setRawErrorData(null);

        try {
            console.log('Sending request to AI endpoint with groupId:', groupId);
            
            // Use the no-auth endpoint that doesn't require authentication
            const response = await axios.post('/api/no-auth/ai/tasks', {
                prompt,
                group_id: groupId
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
                // No need for withCredentials since this is a public endpoint
            });
            
            console.log('AI response received:', response.data);
            const data = response.data;
            
            if (!data.success) {
                throw new Error(data.error || 'Unknown error in AI processing');
            }
            
            setIsLoading(false);
            setPrompt('');
            setSuccessMessage(`Successfully created assignment "${data.assignment.title}" with ${data.tasks.length} tasks`);
            setCreatedAssignment(data.assignment);
            
            if (onTasksCreated) {
                onTasksCreated({
                    assignment: data.assignment,
                    tasks: data.tasks
                });
            }
        } catch (err: any) {
            setIsLoading(false);
            console.error('Error details:', err);
            
            let errorMessage = 'Unknown error occurred';
            
            if (err.response) {
                // Capture the full error response data
                setRawErrorData(err.response.data);
                
                // Get specific error message if available
                const serverError = err.response.data?.error || 
                                   err.response.data?.message || 
                                   `Server error: ${err.response.status} - ${err.response.statusText || 'Unknown'}`;
                
                errorMessage = serverError;
                
                if (err.response.data?.debug) {
                    setDebugInfo(JSON.stringify(err.response.data.debug));
                } else if (err.response.data?.trace) {
                    // Show part of the trace for debugging
                    const trace = Array.isArray(err.response.data.trace) 
                        ? err.response.data.trace.slice(0, 3).join('\n')
                        : err.response.data.trace;
                        
                    setDebugInfo(`${serverError}\nTrace: ${trace}`);
                } else {
                    setDebugInfo(`Status: ${err.response.status}\nResponse data: ${JSON.stringify(err.response.data || {})}`);
                }
            } else if (err.request) {
                errorMessage = 'No response received from server';
                setDebugInfo('Request was sent but no response was received. Server might be down.');
            } else {
                errorMessage = err.message || 'Request setup error';
            }
            
            setError(`Error: ${errorMessage}`);
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
                    <div className="p-3 mb-4 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md text-sm">
                        <p className="font-medium">No login required! This uses the public AI endpoint.</p>
                        <p className="mt-1">Describe your tasks and the AI will structure them for you.</p>
                        {debugInfo && (
                            <p className="mt-1 text-xs font-mono">{debugInfo}</p>
                        )}
                    </div>
                    
                    {successMessage && (
                        <div className="p-3 mb-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-md text-sm flex gap-2">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <div>
                                <p className="font-medium">{successMessage}</p>
                                {createdAssignment && (
                                    <p className="mt-1 text-sm">
                                        <a 
                                            href={`/groups/${groupId}/assignments/${createdAssignment.id}`}
                                            className="text-blue-600 dark:text-blue-400 underline"
                                        >
                                            View Assignment
                                        </a>
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    
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
                                    <p className="mt-2 text-xs">
                                        Try visiting <a href="/ai-test" className="underline">AI Test Page</a> to check if the OpenRouter API is working.
                                    </p>
                                    
                                    {/* Show raw error data for debugging */}
                                    {rawErrorData && (
                                        <details className="mt-2">
                                            <summary className="cursor-pointer text-xs font-medium">Show detailed error information</summary>
                                            <pre className="mt-2 p-2 bg-red-50 dark:bg-red-900/50 rounded text-xs overflow-auto max-h-60">
                                                {JSON.stringify(rawErrorData, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                                Group ID: {groupId}
                            </div>
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