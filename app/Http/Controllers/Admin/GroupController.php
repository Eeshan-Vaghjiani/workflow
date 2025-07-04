<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Group;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;

class GroupController extends Controller
{
    public function index()
    {
        $groups = Group::all();
        return Inertia::render('admin/groups/Index', ['groups' => $groups]);
    }

    public function downloadPdf()
    {
        $groups = Group::all();
        $pdf = Pdf::loadView('admin.groups.pdf', compact('groups'));
        return $pdf->download('groups.pdf');
    }
}
