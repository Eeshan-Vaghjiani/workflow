<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\StudySession;
use App\Models\StudyTask;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class StudyPlannerController extends Controller
{
    /**
     * Constructor to apply auth middleware
     */
    public function __construct()
    {
        $this->middleware(['web', 'auth']);
    }

    /**
     * Display the study planner page.
     */
    public function index(Request $request)
    {
        // Add debug logging
        Log::info('StudyPlannerController::index called', [
            'user_id' => Auth::id(),
            'is_api' => $request->is('api/*'),
            'route' => $request->route()->getName(),
            'path' => $request->path(),
            'method' => $request->method(),
            'auth_check' => Auth::check(),
            'accept_header' => $request->header('Accept'),
            'csrf_token' => $request->header('X-CSRF-TOKEN'),
            'session_id' => session()->getId()
        ]);

        try {
            // Get the authenticated user's study sessions and tasks
            $studySessions = StudySession::where('user_id', Auth::id())
                ->orderBy('session_date', 'asc')
                ->orderBy('start_time', 'asc')
                ->get();

            Log::info('Study sessions loaded', [
                'count' => $studySessions->count(),
                'user_id' => Auth::id()
            ]);

            $studyTasks = StudyTask::where('user_id', Auth::id())
                ->orderBy('created_at', 'desc')
                ->get();

            Log::info('Study tasks loaded', [
                'count' => $studyTasks->count(),
                'user_id' => Auth::id()
            ]);

            return Inertia::render('StudyPlanner/Index', [
                'userId' => Auth::id(),
                'studySessions' => $studySessions,
                'studyTasks' => $studyTasks,
            ]);
        } catch (\Exception $e) {
            Log::error('Error in StudyPlannerController::index', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return Inertia::render('StudyPlanner/Index', [
                'userId' => Auth::id(),
                'studySessions' => [],
                'studyTasks' => [],
                'error' => 'Failed to load study data: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Store a new study session
     */
    public function storeSession(Request $request)
    {
        Log::info('StudyPlannerController::storeSession called', [
            'request_data' => $request->all(),
            'user_id' => Auth::id(),
            'is_api' => $request->is('api/*'),
            'path' => $request->path(),
            'method' => $request->method(),
            'auth_check' => Auth::check(),
            'session_id' => session()->getId()
        ]);

        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'session_date' => 'required|date',
                'start_time' => 'required|string',
                'end_time' => 'required|string|after:start_time',
                'group_id' => 'nullable|exists:groups,id',
                'assignment_id' => 'nullable|exists:group_assignments,id',
            ]);

            // Use transaction for database reliability
            DB::beginTransaction();
            try {
                $session = StudySession::create([
                    'user_id' => Auth::id(),
                    'title' => $validated['title'],
                    'description' => $validated['description'] ?? null,
                    'session_date' => $validated['session_date'],
                    'start_time' => $validated['start_time'],
                    'end_time' => $validated['end_time'],
                    'group_id' => $validated['group_id'] ?? null,
                    'assignment_id' => $validated['assignment_id'] ?? null,
                    'completed' => false,
                    'is_deleted' => false,
                ]);

                DB::commit();

                Log::info('Study session created', [
                    'session_id' => $session->id,
                    'user_id' => Auth::id()
                ]);

                // Check if request wants JSON response (API call)
                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'success' => true,
                        'session' => $session
                    ]);
                }

                return redirect()->route('study-planner.index');
            } catch (\Exception $dbError) {
                DB::rollBack();
                throw $dbError;
            }
        } catch (\Exception $e) {
            Log::error('Error in StudyPlannerController::storeSession', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to save study session: ' . $e->getMessage()
                ], 500);
            }

            return back()->withErrors(['error' => 'Failed to save study session: ' . $e->getMessage()]);
        }
    }

    /**
     * Store a new study task
     */
    public function storeTask(Request $request)
    {
        Log::info('StudyPlannerController::storeTask called', [
            'request_data' => $request->all(),
            'user_id' => Auth::id(),
            'is_api' => $request->is('api/*'),
            'path' => $request->path(),
            'method' => $request->method(),
            'auth_check' => Auth::check(),
            'session_id' => session()->getId()
        ]);

        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'study_session_id' => 'nullable|exists:study_sessions,id',
            ]);

            // Use transaction for database reliability
            DB::beginTransaction();
            try {
                $task = StudyTask::create([
                    'user_id' => Auth::id(),
                    'title' => $validated['title'],
                    'description' => $validated['description'] ?? null,
                    'study_session_id' => $validated['study_session_id'] ?? null,
                    'completed' => false,
                    'is_deleted' => false,
                ]);

                DB::commit();

                Log::info('Study task created', [
                    'task_id' => $task->id,
                    'user_id' => Auth::id()
                ]);

                // Check if request wants JSON response (API call)
                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'success' => true,
                        'task' => $task
                    ]);
                }

                return redirect()->route('study-planner.index');
            } catch (\Exception $dbError) {
                DB::rollBack();
                throw $dbError;
            }
        } catch (\Exception $e) {
            Log::error('Error in StudyPlannerController::storeTask', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to save study task: ' . $e->getMessage()
                ], 500);
            }

            return back()->withErrors(['error' => 'Failed to save study task: ' . $e->getMessage()]);
        }
    }

    /**
     * Update a study session
     */
    public function updateSession(Request $request, StudySession $session)
    {
        Log::info('StudyPlannerController::updateSession called', [
            'request_data' => $request->all(),
            'session_id' => $session->id,
            'user_id' => Auth::id(),
            'is_api' => $request->is('api/*'),
            'path' => $request->path(),
            'method' => $request->method()
        ]);

        // Check ownership
        if ($session->user_id !== Auth::id()) {
            abort(403);
        }

        try {
            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'session_date' => 'sometimes|required|date',
                'start_time' => 'sometimes|required|string',
                'end_time' => 'sometimes|required|string|after:start_time',
                'completed' => 'sometimes|boolean',
                'group_id' => 'nullable|exists:groups,id',
                'assignment_id' => 'nullable|exists:group_assignments,id',
            ]);

            // Use transaction for database reliability
            DB::beginTransaction();
            try {
                $session->update($validated);
                DB::commit();

                Log::info('Study session updated', [
                    'session_id' => $session->id,
                    'user_id' => Auth::id()
                ]);

                // Check if request wants JSON response (API call)
                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'success' => true,
                        'session' => $session
                    ]);
                }

                return redirect()->route('study-planner.index');
            } catch (\Exception $dbError) {
                DB::rollBack();
                throw $dbError;
            }
        } catch (\Exception $e) {
            Log::error('Error in StudyPlannerController::updateSession', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to update study session: ' . $e->getMessage()
                ], 500);
            }

            return back()->withErrors(['error' => 'Failed to update study session: ' . $e->getMessage()]);
        }
    }

    /**
     * Update a study task
     */
    public function updateTask(Request $request, StudyTask $task)
    {
        Log::info('StudyPlannerController::updateTask called', [
            'request_data' => $request->all(),
            'task_id' => $task->id,
            'user_id' => Auth::id(),
            'is_api' => $request->is('api/*'),
            'path' => $request->path(),
            'method' => $request->method()
        ]);

        // Check ownership
        if ($task->user_id !== Auth::id()) {
            abort(403);
        }

        try {
            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'completed' => 'sometimes|boolean',
                'study_session_id' => 'nullable|exists:study_sessions,id',
            ]);

            // Use transaction for database reliability
            DB::beginTransaction();
            try {
                $task->update($validated);
                DB::commit();

                Log::info('Study task updated', [
                    'task_id' => $task->id,
                    'user_id' => Auth::id()
                ]);

                // Check if request wants JSON response (API call)
                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'success' => true,
                        'task' => $task
                    ]);
                }

                return redirect()->route('study-planner.index');
            } catch (\Exception $dbError) {
                DB::rollBack();
                throw $dbError;
            }
        } catch (\Exception $e) {
            Log::error('Error in StudyPlannerController::updateTask', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to update study task: ' . $e->getMessage()
                ], 500);
            }

            return back()->withErrors(['error' => 'Failed to update study task: ' . $e->getMessage()]);
        }
    }

    /**
     * Delete a study session
     */
    public function deleteSession(StudySession $session)
    {
        Log::info('StudyPlannerController::deleteSession called', [
            'session_id' => $session->id,
            'user_id' => Auth::id()
        ]);

        // Check ownership
        if ($session->user_id !== Auth::id()) {
            abort(403);
        }

        try {
            // Use transaction for database reliability
            DB::beginTransaction();
            $session->delete();
            DB::commit();

            Log::info('Study session deleted', [
                'session_id' => $session->id,
                'user_id' => Auth::id()
            ]);

            // Check if request wants JSON response (API call)
            if (request()->expectsJson() || request()->is('api/*')) {
                return response()->json([
                    'success' => true,
                    'message' => 'Session deleted successfully'
                ]);
            }

            return redirect()->route('study-planner.index');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error in StudyPlannerController::deleteSession', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            if (request()->expectsJson() || request()->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to delete study session: ' . $e->getMessage()
                ], 500);
            }

            return back()->withErrors(['error' => 'Failed to delete study session: ' . $e->getMessage()]);
        }
    }

    /**
     * Delete a study task
     */
    public function deleteTask(StudyTask $task)
    {
        Log::info('StudyPlannerController::deleteTask called', [
            'task_id' => $task->id,
            'user_id' => Auth::id()
        ]);

        // Check ownership
        if ($task->user_id !== Auth::id()) {
            abort(403);
        }

        try {
            // Use transaction for database reliability
            DB::beginTransaction();
            $task->delete();
            DB::commit();

            Log::info('Study task deleted', [
                'task_id' => $task->id,
                'user_id' => Auth::id()
            ]);

            // Check if request wants JSON response (API call)
            if (request()->expectsJson() || request()->is('api/*')) {
                return response()->json([
                    'success' => true,
                    'message' => 'Task deleted successfully'
                ]);
            }

            return redirect()->route('study-planner.index');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error in StudyPlannerController::deleteTask', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            if (request()->expectsJson() || request()->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to delete study task: ' . $e->getMessage()
                ], 500);
            }

            return back()->withErrors(['error' => 'Failed to delete study task: ' . $e->getMessage()]);
        }
    }

    /**
     * Get all study sessions for the authenticated user.
     */
    public function getSessions(Request $request)
    {
        Log::info('StudyPlannerController::getSessions called', [
            'user_id' => Auth::id(),
            'is_api' => $request->is('api/*'),
            'path' => $request->path(),
            'method' => $request->method(),
            'auth_check' => Auth::check(),
            'session_id' => session()->getId()
        ]);

        try {
            $sessions = StudySession::where('user_id', Auth::id())
                ->orderBy('session_date', 'asc')
                ->orderBy('start_time', 'asc')
                ->get();

            Log::info('Study sessions fetched for API', [
                'count' => $sessions->count(),
                'user_id' => Auth::id()
            ]);

            return response()->json($sessions);
        } catch (\Exception $e) {
            Log::error('Error in StudyPlannerController::getSessions', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to get study sessions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all study tasks for the authenticated user.
     */
    public function getTasks(Request $request)
    {
        Log::info('StudyPlannerController::getTasks called', [
            'user_id' => Auth::id(),
            'is_api' => $request->is('api/*'),
            'path' => $request->path(),
            'method' => $request->method(),
            'auth_check' => Auth::check(),
            'session_id' => session()->getId()
        ]);

        try {
            $tasks = StudyTask::where('user_id', Auth::id())
                ->orderBy('created_at', 'desc')
                ->get();

            Log::info('Study tasks fetched for API', [
                'count' => $tasks->count(),
                'user_id' => Auth::id()
            ]);

            return response()->json($tasks);
        } catch (\Exception $e) {
            Log::error('Error in StudyPlannerController::getTasks', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to get study tasks: ' . $e->getMessage()
            ], 500);
        }
    }
}
