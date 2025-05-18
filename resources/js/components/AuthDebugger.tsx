import { useState, useEffect } from 'react';

export default function AuthDebugger() {
    const [authStatus, setAuthStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [aiEndpointStatus, setAiEndpointStatus] = useState<any>(null);

    async function checkAuth() {
        setLoading(true);
        setError(null);
        
        try {
            // Use fetch instead of axios
            const response = await fetch('/api/auth-status', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                credentials: 'include', // Important for cookies
            });
            
            const data = await response.json();
            setAuthStatus(data);
        } catch (err: any) {
            setError(err.message || 'Error checking authentication status');
            console.error('Auth check error:', err);
        } finally {
            setLoading(false);
        }
    }
    
    async function refreshCsrf() {
        try {
            await fetch('/sanctum/csrf-cookie', {
                method: 'GET',
                credentials: 'include'
            });
            alert('CSRF cookie refreshed. Try your request again.');
        } catch (err) {
            console.error('Error refreshing CSRF token', err);
            alert('Failed to refresh CSRF token.');
        }
    }

    async function testAiEndpoint() {
        try {
            setAiEndpointStatus({ loading: true });
            
            // First refresh the CSRF token
            await fetch('/sanctum/csrf-cookie', {
                method: 'GET',
                credentials: 'include'
            });
            
            // Test the protected ai endpoint
            const groupId = 5; // Using a test group ID
            const response = await fetch(`/api/groups/${groupId}/ai/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
                body: JSON.stringify({ prompt: "Test AI endpoint with a basic task" })
            });
            
            if (response.ok) {
                const data = await response.json();
                setAiEndpointStatus({ 
                    success: true, 
                    status: response.status,
                    data: data
                });
            } else {
                const errorText = await response.text();
                setAiEndpointStatus({ 
                    success: false, 
                    status: response.status,
                    error: errorText
                });
            }
        } catch (err: any) {
            setAiEndpointStatus({ 
                success: false, 
                error: err.message || 'Unknown error occurred' 
            });
        }
    }

    useEffect(() => {
        // Check auth when component mounts
        checkAuth();
    }, []);

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Authentication Debugger</h2>
            
            <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    <button 
                        onClick={checkAuth}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Checking...' : 'Check Auth Status'}
                    </button>
                    
                    <button 
                        onClick={refreshCsrf}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Refresh CSRF Cookie
                    </button>
                    
                    <button 
                        onClick={testAiEndpoint}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                        disabled={aiEndpointStatus?.loading}
                    >
                        {aiEndpointStatus?.loading ? 'Testing...' : 'Test AI Tasks Endpoint'}
                    </button>
                </div>
                
                {error && (
                    <div className="p-4 bg-red-100 text-red-700 rounded-md">
                        Error: {error}
                    </div>
                )}
                
                {aiEndpointStatus && !aiEndpointStatus.loading && (
                    <div className={`p-4 ${aiEndpointStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} rounded-md mt-4`}>
                        <h3 className="font-medium">AI Endpoint Test: {aiEndpointStatus.success ? 'Success' : 'Failed'}</h3>
                        {aiEndpointStatus.status && (
                            <p>Status code: {aiEndpointStatus.status}</p>
                        )}
                        {aiEndpointStatus.error && (
                            <div className="mt-2">
                                <p>Error:</p>
                                <pre className="text-sm bg-red-50 p-2 rounded mt-1 overflow-auto max-h-40">
                                    {aiEndpointStatus.error}
                                </pre>
                            </div>
                        )}
                        {aiEndpointStatus.data && (
                            <div className="mt-2">
                                <p>Response data:</p>
                                <pre className="text-sm bg-green-50 p-2 rounded mt-1 overflow-auto max-h-40">
                                    {JSON.stringify(aiEndpointStatus.data, null, 2)}
                                </pre>
                            </div>
                        )}
                        {!aiEndpointStatus.success && (
                            <div className="mt-4">
                                <h4 className="font-medium">Suggested fixes:</h4>
                                <ul className="list-disc pl-5 mt-1">
                                    <li className="text-sm">Make sure you're logged in (<a href="/login" className="underline">go to login</a>)</li>
                                    <li className="text-sm">Clear your browser cookies and try again</li>
                                    <li className="text-sm">Try the no-auth version at <a href="/ai-test" className="underline">/ai-test</a></li>
                                    <li className="text-sm">Check that your API routes are configured correctly</li>
                                </ul>
                            </div>
                        )}
                    </div>
                )}
                
                {authStatus && (
                    <div>
                        <h3 className="text-lg font-semibold mb-2">
                            Status: {authStatus.authenticated ? 
                                <span className="text-green-600">Authenticated</span> : 
                                <span className="text-red-600">Not Authenticated</span>
                            }
                        </h3>
                        
                        {authStatus.authenticated && authStatus.user && (
                            <div className="mb-4">
                                <h4 className="font-medium">User Info:</h4>
                                <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md mt-2">
                                    <pre className="text-sm">{JSON.stringify(authStatus.user, null, 2)}</pre>
                                </div>
                            </div>
                        )}
                        
                        <div className="mb-4">
                            <h4 className="font-medium">Session Info:</h4>
                            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md mt-2">
                                <pre className="text-sm">{JSON.stringify(authStatus.session, null, 2)}</pre>
                            </div>
                        </div>
                        
                        <div className="mb-4">
                            <h4 className="font-medium">Headers:</h4>
                            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md mt-2">
                                <pre className="text-sm">{JSON.stringify(authStatus.headers, null, 2)}</pre>
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-medium">Cookies:</h4>
                            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md mt-2">
                                <pre className="text-sm">
                                    {Object.keys(authStatus.cookies || {}).length > 0 ? 
                                        JSON.stringify(authStatus.cookies, null, 2) : 
                                        'No cookies found'
                                    }
                                </pre>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="mt-6 border-t pt-4">
                    <h3 className="font-semibold">Common Authentication Issues:</h3>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                        <li>Missing or expired CSRF token</li>
                        <li>Session cookie not being sent with the request</li>
                        <li>CORS issues preventing cookies from being sent</li>
                        <li>SPA and API running on different domains</li>
                        <li>Missing 'credentials: include' in fetch/axios requests</li>
                        <li>Session has expired and user needs to re-login</li>
                    </ul>
                </div>
            </div>
        </div>
    );
} 