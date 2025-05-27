<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\StudySession;
use App\Models\StudyTask;
use Illuminate\Support\Facades\Auth;

class StudyPlannerController extends Controller
{
    /**
     * Display the study planner page.
     */
    public function index(Request $request)
    {
        // Add debug logging
        \Illuminate\Support\Facades\Log::info('StudyPlannerController::index called');

        try {
            // Get the authenticated user's study sessions and tasks
            $studySessions = StudySession::where('user_id', Auth::id())
                ->orderBy('session_date', 'asc')
                ->orderBy('start_time', 'asc')
                ->get();

            \Illuminate\Support\Facades\Log::info('Study sessions loaded', [
                'count' => $studySessions->count(),
                'user_id' => Auth::id()
            ]);

            $studyTasks = StudyTask::where('user_id', Auth::id())
                ->orderBy('created_at', 'desc')
                ->get();

            \Illuminate\Support\Facades\Log::info('Study tasks loaded', [
                'count' => $studyTasks->count(),
                'user_id' => Auth::id()
            ]);

            return Inertia::render('StudyPlanner/Index', [
                'userId' => Auth::id(),
                'studySessions' => $studySessions,
                'studyTasks' => $studyTasks,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error in StudyPlannerController::index', [
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
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'session_date' => 'required|date',
            'start_time' => 'required|string',
            'end_time' => 'required|string|after:start_time',
            'group_id' => 'nullable|exists:groups,id',
            'assignment_id' => 'nullable|exists:group_assignments,id',
        ]);

        $session = StudySession::create([
            'user_id' => Auth::id(),
            'title' => $validated['title'],
            'description' => $validated['description'],
            'session_date' => $validated['session_date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'group_id' => $validated['group_id'] ?? null,
            'assignment_id' => $validated['assignment_id'] ?? null,
            'completed' => false,
        ]);

        // Check if request wants JSON response (API call)
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'session' => $session
            ]);
        }

        return redirect()->route('study-planner.index');
    }

    /**
     * Store a new study task
     */
    public function storeTask(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'study_session_id' => 'nullable|exists:study_sessions,id',
        ]);

        $task = StudyTask::create([
            'user_id' => Auth::id(),
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'study_session_id' => $validated['study_session_id'] ?? null,
            'completed' => false,
        ]);

        // Check if request wants JSON response (API call)
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'task' => $task
            ]);
        }

        return redirect()->route('study-planner.index');
    }

    /**
     * Update a study session
     */
    public function updateSession(Request $request, StudySession $session)
    {
        // Check ownership
        if ($session->user_id !== Auth::id()) {
            abort(403);
        }

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

        $session->update($validated);

        // Check if request wants JSON response (API call)
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'session' => $session
            ]);
        }

        return redirect()->route('study-planner.index');
    }

    /**
     * Update a study task
     */
    public function updateTask(Request $request, StudyTask $task)
    {
        // Check ownership
        if ($task->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'completed' => 'sometimes|boolean',
            'study_session_id' => 'nullable|exists:study_sessions,id',
        ]);

        $task->update($validated);

        // Check if request wants JSON response (API call)
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'task' => $task
            ]);
        }

        return redirect()->route('study-planner.index');
    }

    /**
     * Delete a study session
     */
    public function deleteSession(StudySession $session)
    {
        // Check ownership
        if ($session->user_id !== Auth::id()) {
            abort(403);
        }

        $session->delete();

        // Check if request wants JSON response (API call)
        if (request()->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Session deleted successfully'
            ]);
        }

        return redirect()->route('study-planner.index');
    }

    /**
     * Delete a study task
     */
    public function deleteTask(StudyTask $task)
    {
        // Check ownership
        if ($task->user_id !== Auth::id()) {
            abort(403);
        }

        $task->delete();

        // Check if request wants JSON response (API call)
        if (request()->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Task deleted successfully'
            ]);
        }

        return redirect()->route('study-planner.index');
    }

    /**
     * Get all study sessions for the authenticated user.
     */
    public function getSessions(Request $request)
    {
        $sessions = StudySession::where('user_id', Auth::id())
            ->orderBy('session_date', 'asc')
            ->orderBy('start_time', 'asc')
            ->get();

        return response()->json($sessions);
    }

    /**
     * Get all study tasks for the authenticated user.
     */
    public function getTasks(Request $request)
    {
        $tasks = StudyTask::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($tasks);
    }
}
