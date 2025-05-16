<?php

namespace App\Http\Controllers;

use App\Models\GroupTask;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TaskController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $tasks = GroupTask::query()
            ->with(['assignment:id,title', 'assignment.group:id,name'])
            ->whereHas('assignment.group.members', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->latest()
            ->get();

        return Inertia::render('TaskList', [
            'tasks' => $tasks
        ]);
    }
}
