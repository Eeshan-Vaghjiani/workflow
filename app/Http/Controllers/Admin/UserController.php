<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class UserController extends Controller
{
    public function index()
    {
        $users = User::withTrashed()
            ->select('id', 'name', 'email', 'is_admin', 'last_login_at', 'created_at', 'deleted_at')
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->through(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->is_admin ? 'ADMIN' : 'USER',
                    'created' => $user->created_at->format('d/m/Y'),
                    'lastLogin' => $user->last_login_at ? $user->last_login_at->format('d/m/Y') : 'Never',
                    'deleted' => !is_null($user->deleted_at),
                ];
            });

        return Inertia::render('admin/users/Index', [
            'users' => $users
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/users/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', Password::defaults()],
            'is_admin' => 'boolean',
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_admin' => $request->is_admin ?? false,
        ]);

        return redirect()->back()->with('success', 'User created successfully.');
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => $request->password ? [Password::defaults()] : '',
            'is_admin' => 'boolean',
        ]);

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'is_admin' => $request->is_admin ?? false,
        ]);

        if ($request->password) {
            $user->update(['password' => Hash::make($request->password)]);
        }

        return redirect()->back()->with('success', 'User updated successfully.');
    }

    public function destroy(User $user)
    {
        $user->delete();
        return redirect()->back()->with('success', 'User deleted successfully.');
    }

    public function restore($id)
    {
        $user = User::withTrashed()->findOrFail($id);
        $user->restore();
        return redirect()->back()->with('success', 'User restored successfully.');
    }

    public function export()
    {
        $users = User::withTrashed()
            ->select('name', 'email', 'is_admin', 'last_login_at', 'created_at', 'deleted_at')
            ->orderBy('created_at', 'desc')
            ->get();

        $active_users = $users->whereNull('deleted_at')->map(function ($user) {
            return [
                'Name' => $user->name,
                'Email' => $user->email,
                'Role' => $user->is_admin ? 'ADMIN' : 'USER',
                'Created' => $user->created_at->format('d/m/Y'),
                'Last Login' => $user->last_login_at ? $user->last_login_at->format('d/m/Y') : 'Never',
            ];
        });

        $deleted_users = $users->whereNotNull('deleted_at')->map(function ($user) {
            return [
                'Name' => $user->name,
                'Email' => $user->email,
                'Role' => $user->is_admin ? 'ADMIN' : 'USER',
                'Created' => $user->created_at->format('d/m/Y'),
                'Last Login' => $user->last_login_at ? $user->last_login_at->format('d/m/Y') : 'Never',
                'Deleted At' => $user->deleted_at->format('d/m/Y'),
            ];
        });

        $analytics = [
            'total_users' => $users->count(),
            'active_users' => $active_users->count(),
            'deleted_users' => $deleted_users->count(),
            'admin_users' => $users->where('is_admin', true)->count(),
        ];

        $pdf = PDF::loadView('admin.users.export', [
            'active_users' => $active_users,
            'deleted_users' => $deleted_users,
            'analytics' => $analytics,
            'date' => now()->format('d/m/Y H:i:s')
        ]);

        return $pdf->download('users-report-' . now()->format('Y-m-d') . '.pdf');
    }
} 