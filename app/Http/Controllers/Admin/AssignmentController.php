<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\GroupAssignment;
use Barryvdh\DomPDF\Facade\Pdf;

class AssignmentController extends Controller
{
    /**
     * Display a listing of the assignments.
     */
    public function index(Request $request)
    {
        $query = GroupAssignment::with(['group', 'creator'])
            ->withCount('tasks')
            ->withTrashed() // Include soft-deleted assignments
            ->latest();

        if ($request->filled('search')) {
            $searchTerm = $request->input('search');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('title', 'like', "%{$searchTerm}%")
                  ->orWhere('description', 'like', "%{$searchTerm}%")
                  ->orWhereHas('group', function ($q_group) use ($searchTerm) {
                      $q_group->where('name', 'like', "%{$searchTerm}%");
                  });
            });
        }

        $assignments = $query->paginate(10)->withQueryString();

        return Inertia::render('admin/assignments/Index', [
            'assignments' => $assignments,
            'filters' => $request->only(['search'])
        ]);
    }

    /**
     * Display the specified assignment.
     */
    public function show(GroupAssignment $assignment)
    {
        $assignment->load(['group', 'creator', 'tasks']);

        return Inertia::render('admin/assignments/Show', [
            'assignment' => $assignment
        ]);
    }

    /**
     * Show the form for editing the specified assignment.
     */
    public function edit(GroupAssignment $assignment)
    {
        $assignment->load(['group', 'creator']);

        return Inertia::render('admin/assignments/Edit', [
            'assignment' => $assignment
        ]);
    }

    /**
     * Update the specified assignment.
     */
    public function update(Request $request, GroupAssignment $assignment)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'unit_name' => 'nullable|string|max:255',
        ]);

        $assignment->update($validated);

        return redirect()->route('admin.assignments.index')
            ->with('success', 'Assignment updated successfully.');
    }

    /**
     * Soft delete the specified assignment.
     */
    public function destroy(GroupAssignment $assignment)
    {
        $assignment->delete();

        return redirect()->route('admin.assignments.index')
            ->with('success', 'Assignment deleted successfully.');
    }

    /**
     * Restore the specified soft-deleted assignment.
     */
    public function restore($id)
    {
        $assignment = GroupAssignment::withTrashed()->findOrFail($id);
        $assignment->restore();

        return redirect()->route('admin.assignments.index')
            ->with('success', 'Assignment restored successfully.');
    }

    /**
     * Generate PDF report for assignments.
     */
    public function downloadPdf()
    {
        $assignments = GroupAssignment::withTrashed()
            ->with(['group', 'creator'])
            ->withCount('tasks')
            ->get();

        // Count active and deleted assignments
        $activeAssignments = $assignments->where('deleted_at', null)->count();
        $deletedAssignments = $assignments->where('deleted_at', '!=', null)->count();

        $pdf = Pdf::loadView('admin.assignments.pdf', [
            'assignments' => $assignments,
            'primaryColor' => '#007a6c',
            'stats' => [
                'total' => $assignments->count(),
                'active' => $activeAssignments,
                'deleted' => $deletedAssignments
            ]
        ]);

        return $pdf->download('assignments-report.pdf');
    }
}
