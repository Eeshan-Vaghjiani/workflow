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

// Define error response type for better type safety
interface ErrorResponse {
    response?: {
        data?: {
            error?: string;
            message?: string;
            details?: Record<string, unknown>;
            [key: string]: unknown;
        };
        status?: number;
    };
    request?: unknown;
    message?: string;
    [key: string]: unknown;
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
        } catch (err: unknown) {
            setIsLoading(false);
            console.error('Error details:', err);

            // Cast to our defined error type
            const error = err as ErrorResponse;

            // Set more detailed error information
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                setError(`Server error: ${error.response.status} - ${error.response?.data?.error || error.response?.data?.message || 'Unknown error'}`);
                setDebugInfo(JSON.stringify(error.response.data, null, 2));

                if (error.response.status === 401) {
                    setError('Authentication error: You are not logged in or your session has expired. Please refresh the page and try again.');

                    // Additional debug info for auth issues
                    try {
                        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                        setDebugInfo(JSON.stringify({
                            ...error.response.data,
                            debug: {
                                csrf_token_exists: !!csrfToken,
                                csrf_token_length: csrfToken ? csrfToken.length : 0
                            }
                        }, null, 2));
                    } catch (debugErr) {
                        console.error('Debug error:', debugErr);
                    }
                }
            } else if (error.request) {
                // The request was made but no response was received
                setError('Network error: No response received from server. Please check your internet connection.');
            } else {
                // Something happened in setting up the request that triggered an Error
                setError(`Error: ${error.message}`);
            }
        }
    }

    // Function to check authentication status
    async function checkAuth() {
        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await axios.get('/api/user', {
                headers: {
                    'X-CSRF-TOKEN': token // Add explicit header
                }
            });
            setDebugInfo(`Authentication successful: ${JSON.stringify(response.data, null, 2)}`);
        } catch (err: unknown) {
            const error = err as ErrorResponse;
            setDebugInfo(`Authentication error: ${error.response?.status} - ${error.response?.data?.message || 'Unknown error'}`);
        }
    }

    return (
        <Card3D className="p-4 mb-6">
            <motion.div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setIsExpanded(prev => !prev)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
            >
                <MessageSquareCode className="w-5 h-5 text-primary-500 dark:text-primary-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {isExpanded ? "Hide AI Task Creator" : "Use AI to Create Tasks"}
                </h3>
            </motion.div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        className="mt-4"
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
                                    className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-opacity-50 border-gray-300 focus:ring-primary-200 focus:border-primary-500 dark:bg-neutral-900/80 dark:border-neutral-700 dark:text-white"
                                    rows={4}
                                    placeholder="Example: Create a website development project for our client XYZ Company. The project needs UI design by Alice due next Friday, backend development by Bob with high priority due in 2 weeks, and deployment by Charlie with medium priority due by the end of the month."
                                    required
                                />
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm flex gap-2 items-start"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium">{error}</p>
                                            {debugInfo && (
                                                <details className="mt-2">
                                                    <summary className="cursor-pointer hover:text-red-600">Show technical details</summary>
                                                    <pre className="mt-2 whitespace-pre-wrap text-xs bg-white dark:bg-black/50 bg-opacity-50 p-2 rounded">
                                                        {debugInfo}
                                                    </pre>
                                                </details>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex justify-between">
                                <EnhancedButton
                                    type="button"
                                    onClick={checkAuth}
                                    variant="outline"
                                    size="sm"
                                    magnetic={true}
                                >
                                    Check Auth Status
                                </EnhancedButton>

                                <EnhancedButton
                                    type="submit"
                                    disabled={isLoading}
                                    variant="primary"
                                    size="sm"
                                    magnetic={true}
                                    className={isLoading ? 'opacity-80' : ''}
                                    icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                                    iconPosition={isLoading ? "left" : undefined}
                                >
                                    {isLoading ? 'Processing...' : 'Generate Tasks with AI'}
                                </EnhancedButton>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card3D>
    );
}
