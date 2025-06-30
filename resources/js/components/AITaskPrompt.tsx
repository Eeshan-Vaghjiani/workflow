import { useState } from 'react';
import axios from 'axios';
import { MessageSquareCode, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card3D } from '@/components/ui/card-3d';
import { EnhancedButton } from '@/components/ui/enhanced-button';

interface AITaskPromptProps {
    groupId: string | number;
    onTasksCreated?: (data: unknown) => void;
}



export default function AITaskPrompt({ groupId, onTasksCreated }: AITaskPromptProps) {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string | null>(null);

    // Handle keyboard shortcut for submission
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            handleSubmit(e as unknown as React.FormEvent);
        }
    };

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

            // Enhanced fix: Also set the token explicitly for this request
            const response = await axios.post(`/api/groups/${groupId}/ai/tasks`, {
                prompt,
                _token: token // Add explicit token field
            }, {
                headers: {
                    'X-CSRF-TOKEN': token // Add explicit header
                }
            });

            setIsLoading(false);
            setPrompt('');

            if (onTasksCreated) {
                onTasksCreated(response.data);
            }
        } catch (error) {
            console.error('Error generating AI tasks:', error);
            setIsLoading(false);

            // Handle different types of errors
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    // Server responded with an error status
                    if (error.response.status === 403 && error.response.data?.redirect) {
                        // Redirect to pricing page if out of prompts
                        window.location.href = error.response.data.redirect;
                        return;
                    }

                    if (error.response.data?.error) {
                        setError(error.response.data.error);
                        if (error.response.data?.debug) {
                            setDebugInfo(JSON.stringify(error.response.data.debug, null, 2));
                        }
                    } else {
                        setError(`Server error: ${error.response.status}`);
                    }
                } else if (error.request) {
                    // Request made but no response received
                    setError('No response from server. Please check your connection and try again.');
                } else {
                    // Error setting up the request
                    setError('Failed to make request.');
                }
            } else {
                // Non-Axios error
                setError('An unknown error occurred.');
            }
        }
    }



    return (
        <Card3D className="mb-6">
            <div
                className="p-4 flex items-center gap-3 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <MessageSquareCode className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {isExpanded ? "Hide AI Task Generator" : "Generate Tasks with AI"}
                </h3>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        className="mt-4 px-4 pb-4"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                            Describe your assignment and tasks in natural language. The AI will help create structured tasks automatically.
                        </p>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-opacity-50 border-gray-300 focus:ring-primary-200 focus:border-primary-500 dark:bg-neutral-900/80 dark:border-neutral-700 dark:text-white"
                                    rows={4}
                                    placeholder="Example: Create a website development project for our client XYZ Company. The project needs UI design by Alice due next Friday, backend development by Bob with high priority due in 2 weeks, and deployment by Charlie with medium priority due by the end of the month."
                                    disabled={isLoading}
                                    required
                                />
                                <div className="flex justify-between mt-2">
                                    <div></div>
                                    <p className="text-xs text-muted-foreground">
                                        Press <kbd className="px-1 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">Ctrl+Enter</kbd> to generate
                                    </p>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
                                    <div className="flex items-center text-red-700 dark:text-red-400 mb-1">
                                        <AlertCircle className="h-4 w-4 mr-2" />
                                        <p className="text-sm font-medium">{error}</p>
                                    </div>
                                    {debugInfo && (
                                        <pre className="mt-2 text-xs overflow-auto p-2 bg-red-50 dark:bg-red-900/50 rounded text-red-800 dark:text-red-300">
                                            {debugInfo}
                                        </pre>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end">
                                <EnhancedButton
                                    type="submit"
                                    disabled={isLoading || !prompt.trim()}
                                    className="w-auto"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>Generate Tasks (Ctrl + Enter)</>
                                    )}
                                </EnhancedButton>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card3D>
    );
}
