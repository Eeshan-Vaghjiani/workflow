<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Barryvdh\DomPDF\Facade\Pdf;

class UserController extends Controller
{
    /**
     * Get paginated list of users
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $query = User::withTrashed()
            ->select('id', 'name', 'email', 'is_admin', 'last_login_at', 'created_at', 'deleted_at')
            ->withCount('groups');

        // Apply filters if provided
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('role')) {
            $role = $request->input('role');
            if ($role === 'admin') {
                $query->where('is_admin', true);
            } elseif ($role === 'user') {
                $query->where('is_admin', false);
            }
        }

        if ($request->has('status')) {
            $status = $request->input('status');
            if ($status === 'active') {
                $query->whereNull('deleted_at');
            } elseif ($status === 'deleted') {
                $query->whereNotNull('deleted_at');
            }
        }

        // Apply sorting
        $sortField = $request->input('sort_field', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        $allowedSortFields = ['name', 'email', 'created_at', 'last_login_at'];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection);
        }

        $perPage = $request->input('per_page', 10);
        $users = $query->paginate($perPage);

        return response()->json([
            'users' => $users->through(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->is_admin ? 'ADMIN' : 'USER',
                    'created_at' => $user->created_at->format('Y-m-d H:i:s'),
                    'last_login_at' => $user->last_login_at ? $user->last_login_at->format('Y-m-d H:i:s') : null,
                    'deleted' => !is_null($user->deleted_at),
                    'groups_count' => $user->groups_count,
                ],
            }),
            'meta' => [
                'total' => $users->total(),
                'per_page' => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
            ],
        ]);
    }

    /**
     * Store a newly created user
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => ['required', Password::defaults()],
                'is_admin' => 'boolean',
            ]);

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'is_admin' => $validated['is_admin'] ?? false,
            ]);

            return response()->json([
                'message' => 'User created successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->is_admin ? 'ADMIN' : 'USER',
                    'created_at' => $user->created_at->format('Y-m-d H:i:s'),
                ],
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update the specified user
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
                'password' => $request->filled('password') ? ['string', Password::defaults()] : '',
                'is_admin' => 'boolean',
            ]);

            $user->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'is_admin' => $validated['is_admin'] ?? false,
            ]);

            if ($request->filled('password')) {
                $user->update(['password' => Hash::make($validated['password'])]);
            }

            return response()->json([
                'message' => 'User updated successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->is_admin ? 'ADMIN' : 'USER',
                    'updated_at' => $user->updated_at->format('Y-m-d H:i:s'),
                ],
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete the specified user
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $user = User::findOrFail($id);

            if ($user->is_admin) {
                return response()->json([
                    'message' => 'Cannot delete admin user',
                ], 403);
            }

            $user->delete();

            return response()->json([
                'message' => 'User deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Restore a soft-deleted user
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function restore($id)
    {
        try {
            $user = User::withTrashed()->findOrFail($id);
            $user->restore();

            return response()->json([
                'message' => 'User restored successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to restore user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate and download user report as PDF
     *
     * @return \Illuminate\Http\Response
     */
    public function generatePdf()
    {
        $users = User::withTrashed()
            ->select('id', 'name', 'email', 'is_admin', 'last_login_at', 'created_at', 'deleted_at')
            ->orderBy('created_at', 'desc')
            ->get();

        $active_users = $users->whereNull('deleted_at')->map(function ($user) {
            return [
                'Name' => $user->name,
                'Email' => $user->email,
                'Role' => $user->is_admin ? 'ADMIN' : 'USER',
                'Created' => $user->created_at->format('Y-m-d'),
                'Last Login' => $user->last_login_at ? $user->last_login_at->format('Y-m-d') : 'Never',
            ];
        });

        $deleted_users = $users->whereNotNull('deleted_at')->map(function ($user) {
            return [
                'Name' => $user->name,
                'Email' => $user->email,
                'Role' => $user->is_admin ? 'ADMIN' : 'USER',
                'Created' => $user->created_at->format('Y-m-d'),
                'Last Login' => $user->last_login_at ? $user->last_login_at->format('Y-m-d') : 'Never',
                'Deleted At' => $user->deleted_at->format('Y-m-d'),
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
            'date' => now()->format('Y-m-d H:i:s')
        ]);

        return $pdf->download('users-report-' . now()->format('Y-m-d') . '.pdf');
    }
}
