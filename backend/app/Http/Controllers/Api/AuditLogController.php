<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $storeId = $currentUser->store_id;

        $query = AuditLog::where('store_id', $storeId)
            ->with('user:id,name,username,role');

        // RBAC Enforcement: Employee can strictly only see their own logs
        if ($currentUser->isEmployee()) {
            $query->where('user_id', $currentUser->id);
        } else {
            // Owner can filter by user_id
            if ($request->filled('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            // Owner can filter by role
            if ($request->filled('role')) {
                $role = $request->role;
                $query->whereHas('user', function ($q) use ($role) {
                    $q->where('role', $role);
                });
            }
        }

        // Module filter
        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }

        // Action filter
        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        // Date presets or custom range
        if ($request->filled('date_range')) {
            $range = $request->date_range;
            $now = Carbon::now('Asia/Jakarta');

            if ($range === 'today') {
                $query->whereDate('created_at', $now->toDateString());
            } elseif ($range === '7_days') {
                $query->where('created_at', '>=', $now->copy()->subDays(7)->startOfDay());
            } elseif ($range === '30_days') {
                $query->where('created_at', '>=', $now->copy()->subDays(30)->startOfDay());
            }
        } else {
            if ($request->filled('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }
            if ($request->filled('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }
        }

        // Text search
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('user_name', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%")
                    ->orWhere('module', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%");
            });
        }

        $perPage = min(max((int) $request->input('per_page', 20), 5), 100);
        $logs = $query->latest('id')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();
        $storeId = $currentUser->store_id;

        $log = AuditLog::where('store_id', $storeId)
            ->with('user:id,name,username,role,email')
            ->find($id);

        if (!$log) {
            return response()->json([
                'success' => false,
                'message' => 'Log aktivitas tidak ditemukan.',
            ], 404);
        }

        // Employee access control: cannot view logs created by other users
        if ($currentUser->isEmployee() && $log->user_id !== $currentUser->id) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak: Anda hanya dapat melihat riwayat aktivitas Anda sendiri.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $log,
        ]);
    }

    public function modules(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $modules = AuditLog::where('store_id', $storeId)
            ->select('module')
            ->distinct()
            ->orderBy('module')
            ->pluck('module');

        return response()->json([
            'success' => true,
            'data' => $modules,
        ]);
    }

    public function actions(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $actions = AuditLog::where('store_id', $storeId)
            ->select('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action');

        return response()->json([
            'success' => true,
            'data' => $actions,
        ]);
    }

    public function users(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $storeId = $currentUser->store_id;

        if ($currentUser->isEmployee()) {
            return response()->json([
                'success' => true,
                'data' => [
                    ['id' => $currentUser->id, 'name' => $currentUser->name, 'role' => $currentUser->role],
                ],
            ]);
        }

        $users = User::where('store_id', $storeId)
            ->select('id', 'name', 'username', 'role')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }
}
