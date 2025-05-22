import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, ActivitySquare, Users, AlertCircle, AlertTriangle, RefreshCw, LogIn } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TaskAssignmentPanelProps {
  groupId: number;
  assignmentId: number;
  onAssignmentChange?: () => void;
}

interface Task {
  id: number;
  title: string;
  assigned_to: number | null;
  assigned_user?: {
    id: number;
    name: string;
  };
  effort_hours: number;
  importance: number;
  priority: string;
  status: string;
  creator?: {
    id: number;
    name: string;
  };
}

interface GroupMember {
  id: number;
  name: string;
}

interface WorkloadDistribution {
  id: number;
  name: string;
  taskCount: number;
  totalEffort: number;
  totalImportance: number;
  weightedWorkload: number;
  percentage: number;
  tasks: {
    id: number;
    title: string;
    effort: number;
    importance: number;
  }[];
}

export default function TaskAssignmentPanel({ groupId, assignmentId, onAssignmentChange }: TaskAssignmentPanelProps) {
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any[] | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [workloadDistribution, setWorkloadDistribution] = useState<WorkloadDistribution[]>([]);
  const [hasUnassignedTasks, setHasUnassignedTasks] = useState(false);
  const [invalidAssignmentsFixed, setInvalidAssignmentsFixed] = useState(0);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    fetchAssignmentStats();
  }, [groupId, assignmentId]);

  const checkAuthentication = async () => {
    try {
      // First try to check auth status using web route
      const response = await axios.get('/auth/status');
      
      if (response.data.authenticated) {
        console.log('User authenticated:', response.data.user?.name);
        return true;
      }
      
      // If not authenticated, try to refresh the session
      console.log('Not authenticated, trying to refresh session...');
      const refreshResponse = await axios.get('/auth/refresh-session');
      
      // Check authentication again after refresh
      const statusResponse = await axios.get('/auth/status');
      return statusResponse.data.authenticated;
    } catch (err) {
      console.error('Authentication check failed:', err);
      return false;
    }
  };

  const fetchAssignmentStats = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorDetails(null);
      setAuthError(false);
      
      // Verify we're authenticated first
      const isAuthenticated = await checkAuthentication();
      if (!isAuthenticated) {
        setAuthError(true);
        setError('Authentication required. Please log in and try again.');
        setLoading(false);
        return;
      }
      
      // Use only the regular web routes, not API routes
      console.log('Using direct web route for task stats');
      const response = await axios.get(`/groups/${groupId}/assignments/${assignmentId}/get-stats`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        }
      });
      
      if (response?.data?.success) {
        setTasks(response.data.tasks);
        setGroupMembers(response.data.groupMembers);
        setWorkloadDistribution(response.data.workloadDistribution);
        setHasUnassignedTasks(response.data.hasUnassignedTasks);
        
        if (response.data.invalidAssignmentsFixed > 0) {
          setInvalidAssignmentsFixed(response.data.invalidAssignmentsFixed);
        }
      } else if (response?.data) {
        setError(response.data.error || 'Failed to fetch assignment statistics');
        if (response.data.error_details) {
          setErrorDetails(response.data.error_details);
        }
      } else {
        setError('Failed to fetch assignment statistics. No valid response received.');
      }
    } catch (err: any) {
      console.error('Error fetching assignment stats:', err);
      console.error('Error details:', err.response?.data);
      
      if (err.response?.status === 401) {
        setAuthError(true);
        setError('Authentication required. Please log in and try again.');
      } else {
        const errorMessage = err.response?.data?.error || 'Failed to load task assignments. Please try again.';
        setError(errorMessage);
        
        // Set detailed error information
        if (err.response?.data?.error_details) {
          setErrorDetails(err.response.data.error_details);
        } else if (err.response?.data) {
          setErrorDetails([{
            message: JSON.stringify(err.response.data, null, 2)
          }]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDistributeTasks = async () => {
    try {
      setDistributing(true);
      setError(null);
      setErrorDetails(null);
      
      // Verify we're authenticated first
      const isAuthenticated = await checkAuthentication();
      if (!isAuthenticated) {
        setAuthError(true);
        setError('Authentication required. Please log in and try again.');
        setDistributing(false);
        return;
      }
      
      console.log('Starting task distribution...');
      const response = await axios.post(`/groups/${groupId}/assignments/${assignmentId}/distribute-tasks`, {}, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        },
        withCredentials: true
      });
      
      console.log('Distribution response:', response.data);
      
      if (response?.data?.success) {
        setTasks(response.data.tasks);
        setWorkloadDistribution(response.data.workloadDistribution);
        setHasUnassignedTasks(false);
        
        // Check if there were any errors during distribution
        if (response.data.stats && response.data.stats.errors > 0) {
          setErrorDetails(response.data.stats.error_details || []);
          setError(`Task distribution completed with ${response.data.stats.errors} errors. Some tasks may not be assigned correctly.`);
        }
        
        if (onAssignmentChange) {
          onAssignmentChange();
        }
      } else if (response?.data) {
        setError(response.data.error || 'Failed to distribute tasks');
        if (response.data.error_details) {
          setErrorDetails(response.data.error_details);
        }
      } else {
        setError('Failed to distribute tasks. No valid response received.');
      }
    } catch (err: any) {
      console.error('Error distributing tasks:', err);
      console.error('Error response:', err.response?.data);
      
      const errorMessage = err.response?.data?.error || 'Failed to distribute tasks. Please try again.';
      setError(errorMessage);
      
      if (err.response?.data?.error_details) {
        setErrorDetails(err.response.data.error_details);
      } else if (err.response?.data) {
        setErrorDetails([{
          message: JSON.stringify(err.response.data, null, 2)
        }]);
      }
    } finally {
      setDistributing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-500 hover:bg-red-600';
      case 'medium': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'low': return 'bg-blue-500 hover:bg-blue-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-500 text-white';
      case 'in_progress': return 'bg-blue-500 text-white';
      case 'pending': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex space-x-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-40" />
        </CardFooter>
      </Card>
    );
  }

  // Show auth error with option to refresh
  if (authError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-red-500" /> 
            Authentication Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Session Expired</AlertTitle>
            <AlertDescription>
              Your session has expired or you are not logged in. Please refresh the page or log in again.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={fetchAssignmentStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/login'}>
            <LogIn className="h-4 w-4 mr-2" />
            Log In
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Users className="mr-2 h-5 w-5" /> 
              Task Assignment
            </CardTitle>
            <CardDescription>
              Manage and visualize task distribution among team members
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={fetchAssignmentStats} 
              className="flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button 
              onClick={handleAutoDistributeTasks} 
              disabled={distributing || tasks.length === 0}
              className="flex items-center gap-2"
            >
              {distributing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Assigning...
                </>
              ) : (
                <>
                  <ActivitySquare className="h-4 w-4" />
                  Auto-Assign Tasks
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              <div>{error}</div>
              {errorDetails && errorDetails.length > 0 && (
                <div className="mt-2">
                  <details>
                    <summary className="cursor-pointer font-medium">View error details</summary>
                    <ul className="mt-2 list-disc pl-5 text-sm">
                      {errorDetails.map((detail, index) => (
                        <li key={index}>Task ID {detail.task_id}: {detail.message}</li>
                      ))}
                    </ul>
                  </details>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {invalidAssignmentsFixed > 0 && (
          <Alert className="mb-4 bg-blue-50 border-blue-200 text-blue-800">
            <AlertTriangle className="h-4 w-4 text-blue-800" />
            <AlertTitle>Assignment Issues Fixed</AlertTitle>
            <AlertDescription>
              {invalidAssignmentsFixed} task{invalidAssignmentsFixed !== 1 ? 's' : ''} had invalid user assignments that have been automatically fixed.
            </AlertDescription>
          </Alert>
        )}

        {hasUnassignedTasks && (
          <Alert className="mb-4 bg-yellow-50 border-yellow-200 text-yellow-800">
            <AlertCircle className="h-4 w-4 text-yellow-800" />
            <AlertTitle>Unassigned Tasks</AlertTitle>
            <AlertDescription>
              Some tasks are not assigned to any team member. Use the Auto-Assign button to distribute tasks evenly.
            </AlertDescription>
          </Alert>
        )}

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ActivitySquare className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No Tasks Found</h3>
            <p className="text-gray-500 max-w-md mt-2">
              There are no tasks for this assignment yet. Create some tasks first to see them here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mt-6">
              <h3 className="font-medium text-lg mb-3 flex items-center">
                <BarChart className="mr-2 h-5 w-5" /> Task Distribution
              </h3>
              <div className="overflow-auto rounded-lg border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Effort
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Importance
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {task.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {task.assigned_user ? (
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                                {task.assigned_user.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="ml-2">{task.assigned_user.name}</span>
                            </div>
                          ) : (
                            <span className="text-red-500">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {task.effort_hours} hrs
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {task.importance}/5
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ').charAt(0).toUpperCase() + task.status.replace('_', ' ').slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {task.creator ? (
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                                {task.creator.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="ml-2">{task.creator.name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">System</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium text-lg mb-3 flex items-center">
                <Users className="mr-2 h-5 w-5" /> Member Workload
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workloadDistribution.map((member) => (
                  <div key={member.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="font-medium ml-2">{member.name}</h3>
                      </div>
                      <Badge variant="outline">
                        {member.taskCount} task{member.taskCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Workload</span>
                        <span>{member.percentage}%</span>
                      </div>
                      <Progress value={member.percentage} className="h-2" />
                    </div>
                    <div className="mt-3">
                      <div className="text-sm text-gray-500 mb-1">Task Details:</div>
                      <div className="text-sm">
                        <span className="font-medium">Total Effort:</span> {member.totalEffort} hours
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Importance Score:</span> {member.totalImportance}
                      </div>
                    </div>
                    {member.tasks.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm text-gray-500 mb-1">Assigned Tasks:</div>
                        <ul className="text-sm space-y-1">
                          {member.tasks.map((task) => (
                            <li key={task.id} className="flex items-center justify-between">
                              <span className="truncate">{task.title}</span>
                              <span className="text-gray-500 ml-2">
                                {task.effort}h • {task.importance}/5
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 