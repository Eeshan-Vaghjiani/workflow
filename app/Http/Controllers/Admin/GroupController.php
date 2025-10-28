<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Group;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;

class GroupController extends Controller
{
    public function index(Request $request)
    {
        $query = Group::with('owner')
            ->withCount('members')
            ->withTrashed() // Include soft-deleted groups for restoration
            ->latest();

        if ($request->filled('search')) {
            $searchTerm = $request->input('search');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                  ->orWhereHas('owner', function ($q_owner) use ($searchTerm) {
                      $q_owner->where('name', 'like', "%{$searchTerm}%");
                  });
            });
        }

        $groups = $query->paginate(10)->withQueryString();

        return Inertia::render('admin/groups/Index', [
            'groups' => $groups,
            'filters' => $request->only(['search'])
        ]);
    }

    public function downloadPdf()
    {
        $groups = Group::withTrashed()->with('owner')->withCount('members')->get();

        // Count active and deleted groups
        $activeGroups = $groups->where('deleted_at', null)->count();
        $deletedGroups = $groups->where('deleted_at', '!=', null)->count();

        $pdf = Pdf::loadView('admin.groups.pdf', [
            'groups' => $groups,
            'primaryColor' => '#007a6c',
            'stats' => [
                'total' => $groups->count(),
                'active' => $activeGroups,
                'deleted' => $deletedGroups
            ]
        ]);

        return $pdf->download('groups-report.pdf');
    }

    public function show(Group $group)
    {
        $group->load(['owner', 'members', 'assignments']);

        return Inertia::render('admin/groups/Show', [
            'group' => $group
        ]);
    }

    public function edit(Group $group)
    {
        $group->load('owner');

        return Inertia::render('admin/groups/Edit', [
            'group' => $group
        ]);
    }

    public function update(Request $request, Group $group)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_public' => 'boolean',
        ]);

        $group->update($validated);

        return redirect()->route('admin.groups.index')
            ->with('success', 'Group updated successfully.');
    }

    public function destroy(Group $group)
    {
        $group->delete();

        return redirect()->route('admin.groups.index')
            ->with('success', 'Group deleted successfully.');
    }

    public function restore($id)
    {
        $group = Group::withTrashed()->findOrFail($id);
        $group->restore();

        return redirect()->route('admin.groups.index')
            ->with('success', 'Group restored successfully.');
    }
}
