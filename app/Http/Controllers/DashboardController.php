<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\GroupAssignment;
use App\Models\GroupTask;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $groups = Group::whereHas('members', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->withCount(['members', 'assignments'])->get();

        $assignments = GroupAssignment::whereHas('group.members', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->with('group:id,name')->latest()->take(5)->get();

        $tasks = GroupTask::whereHas('assignment.group.members', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->with('assignment:id,title')->latest()->take(5)->get();

        return Inertia::render('Dashboard', [
            'groups' => $groups,
            'assignments' => $assignments,
            'tasks' => $tasks,
        ]);
    }

    public function tasks()
    {
        $user = request()->user();

        $tasks = \App\Models\GroupTask::whereHas('assignment.group.members', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->with(['assignment:id,title', 'assignment.group:id,name'])->latest()->get();

        return Inertia::render('tasks/Index', [
            'tasks' => $tasks,
        ]);
    }
} 