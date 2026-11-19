<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class EmployeeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $query = User::where('store_id', $storeId)
            ->withCount(['sales as completed_sales_count' => fn ($q) => $q->where('status', 'completed')])
            ->withSum(['sales as total_sales_amount' => fn ($q) => $q->where('status', 'completed')], 'total_amount');

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $perPage = min(max((int) $request->input('per_page', 15), 5), 100);
        $employees = $query->orderBy('role')->orderBy('name')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $employees->items(),
            'meta' => [
                'current_page' => $employees->currentPage(),
                'last_page' => $employees->lastPage(),
                'per_page' => $employees->perPage(),
                'total' => $employees->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $storeId = $currentUser->store_id;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'username' => ['required', 'string', 'alpha_dash', 'min:3', 'max:50', 'unique:users,username'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', Password::min(6)],
            'role' => ['required', 'in:owner,employee'],
            'status' => ['nullable', 'in:active,inactive'],
        ], [
            'name.required' => 'Nama pegawai wajib diisi.',
            'username.required' => 'Username wajib diisi.',
            'username.unique' => 'Username sudah digunakan oleh akun lain.',
            'email.required' => 'Email wajib diisi.',
            'email.unique' => 'Email sudah terdaftar di sistem.',
            'password.required' => 'Password wajib diisi minimal 6 karakter.',
        ]);

        $user = User::create([
            'store_id' => $storeId,
            'name' => $validated['name'],
            'username' => strtolower($validated['username']),
            'email' => strtolower($validated['email']),
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'status' => $validated['status'] ?? 'active',
        ]);

        ActivityLogger::log(
            module: 'employees',
            action: 'employee_created',
            description: "{$currentUser->name} menambahkan pegawai baru: {$user->name} ({$user->username}) dengan peran {$user->role}.",
            request: $request,
            user: $currentUser,
            subjectType: User::class,
            subjectId: $user->id,
            newValues: $user->only(['name', 'username', 'email', 'role', 'status']),
            notify: true,
            notifyTitle: "Pegawai Baru Ditambahkan",
            notifyType: 'info',
            notifyLink: '/employees'
        );

        return response()->json([
            'success' => true,
            'message' => 'Pegawai baru berhasil ditambahkan.',
            'data' => $user,
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $user = User::where('store_id', $storeId)
            ->withCount(['sales as completed_sales_count' => fn ($q) => $q->where('status', 'completed')])
            ->withSum(['sales as total_sales_amount' => fn ($q) => $q->where('status', 'completed')], 'total_amount')
            ->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Data pegawai tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();
        $storeId = $currentUser->store_id;

        $user = User::where('store_id', $storeId)->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Data pegawai tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['required', 'in:owner,employee'],
            'status' => ['required', 'in:active,inactive'],
        ], [
            'name.required' => 'Nama pegawai wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.unique' => 'Email sudah digunakan oleh akun lain.',
        ]);

        // Security check: cannot deactivate or demote self
        if ($currentUser->id === $user->id) {
            if ($validated['status'] === 'inactive') {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak dapat menonaktifkan akun Anda sendiri.',
                ], 422);
            }
            if ($validated['role'] !== 'owner') {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak dapat menurunkan peran akun Anda sendiri.',
                ], 422);
            }
        }

        // If deactivated, revoke active tokens
        if ($validated['status'] === 'inactive' && $user->status === 'active') {
            $user->tokens()->delete();
        }

        $oldRole = $user->role;
        $oldStatus = $user->status;

        $user->update($validated);

        ActivityLogger::log(
            module: 'employees',
            action: 'employee_updated',
            description: "{$currentUser->name} memperbarui profil pegawai {$user->name}: Status ({$oldStatus} -> {$user->status}), Peran ({$oldRole} -> {$user->role}).",
            request: $request,
            user: $currentUser,
            subjectType: User::class,
            subjectId: $user->id,
            oldValues: ['role' => $oldRole, 'status' => $oldStatus],
            newValues: ['role' => $user->role, 'status' => $user->status],
            notify: true,
            notifyTitle: "Data Pegawai Diperbarui: {$user->name}",
            notifyType: 'info',
            notifyLink: '/employees'
        );

        return response()->json([
            'success' => true,
            'message' => 'Data pegawai berhasil diperbarui.',
            'data' => $user,
        ]);
    }

    public function changePassword(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();
        $storeId = $currentUser->store_id;

        $user = User::where('store_id', $storeId)->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Data pegawai tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'password' => ['required', 'string', Password::min(6)],
        ], [
            'password.required' => 'Password baru wajib diisi minimal 6 karakter.',
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        // Revoke active sessions for security so they must re-login
        if ($currentUser->id !== $user->id) {
            $user->tokens()->delete();
        }

        ActivityLogger::log(
            module: 'employees',
            action: 'password_reset',
            description: "{$currentUser->name} mereset password untuk pegawai {$user->name} ({$user->username}).",
            request: $request,
            user: $currentUser,
            subjectType: User::class,
            subjectId: $user->id,
            notify: true,
            notifyTitle: "Password Pegawai Diubah",
            notifyType: 'warning',
            notifyUserId: $user->id
        );

        return response()->json([
            'success' => true,
            'message' => "Password untuk {$user->name} berhasil diperbarui.",
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();
        $storeId = $currentUser->store_id;

        $user = User::where('store_id', $storeId)
            ->withCount('sales')
            ->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Data pegawai tidak ditemukan.',
            ], 404);
        }

        if ($currentUser->id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri.',
            ], 422);
        }

        if ($user->sales_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Pegawai ini memiliki riwayat transaksi penjualan kasir. Untuk menjaga integritas data keuangan dan audit, nonaktifkan akun pegawai ini sebagai gantinya.',
            ], 422);
        }

        $userName = $user->name;
        $userUsername = $user->username;

        $user->tokens()->delete();
        $user->delete();

        ActivityLogger::log(
            module: 'employees',
            action: 'employee_deleted',
            description: "{$currentUser->name} menghapus akun pegawai {$userName} ({$userUsername}).",
            request: $request,
            user: $currentUser,
            subjectType: User::class,
            subjectId: $id,
            notify: true,
            notifyTitle: "Akun Pegawai Dihapus",
            notifyType: 'danger'
        );

        return response()->json([
            'success' => true,
            'message' => "Pegawai {$userName} berhasil dihapus.",
        ]);
    }
}
