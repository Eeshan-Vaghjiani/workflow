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
        return Inertia::render('StudyPlanner/Index', [
            'userId' => Auth::id(),
            'studySessions' => [], // These would be loaded from the database in a real implementation
            'studyTasks' => [],    // These would be loaded from the database in a real implementation
        ]);
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
            'group_id' => $validated['group_id'],
            'assignment_id' => $validated['assignment_id'],
            'completed' => false,
        ]);

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
            'description' => $validated['description'],
            'study_session_id' => $validated['study_session_id'],
            'completed' => false,
        ]);

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

        return redirect()->route('study-planner.index');
    }
}
