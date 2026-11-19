<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $query = Customer::where('store_id', $storeId);

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('all')) {
            $customers = $query->orderBy('name')->get();
            return response()->json([
                'success' => true,
                'data' => $customers,
            ]);
        }

        $perPage = min(max((int) $request->input('per_page', 15), 5), 100);
        $customers = $query->orderBy('name')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $customers->items(),
            'meta' => [
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:150'],
            'address' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
        ], [
            'name.required' => 'Nama pelanggan wajib diisi.',
        ]);

        $customer = Customer::create(array_merge($validated, ['store_id' => $storeId]));

        ActivityLogger::log(
            module: 'contacts',
            action: 'customer_created',
            description: "{$request->user()->name} menambahkan pelanggan baru: '{$customer->name}'.",
            request: $request,
            subjectType: Customer::class,
            subjectId: $customer->id,
            newValues: $customer->only(['name', 'phone', 'email', 'address'])
        );

        return response()->json([
            'success' => true,
            'message' => 'Pelanggan berhasil ditambahkan.',
            'data' => $customer,
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;
        $customer = Customer::where('store_id', $storeId)->find($id);

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Pelanggan tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $customer,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;
        $customer = Customer::where('store_id', $storeId)->find($id);

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Pelanggan tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:150'],
            'address' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
        ], [
            'name.required' => 'Nama pelanggan wajib diisi.',
        ]);

        $old = $customer->only(['name', 'phone', 'email', 'address']);
        $customer->update($validated);

        ActivityLogger::log(
            module: 'contacts',
            action: 'customer_updated',
            description: "{$request->user()->name} memperbarui data pelanggan '{$customer->name}'.",
            request: $request,
            subjectType: Customer::class,
            subjectId: $customer->id,
            oldValues: $old,
            newValues: $customer->fresh()->only(['name', 'phone', 'email', 'address'])
        );

        return response()->json([
            'success' => true,
            'message' => 'Pelanggan berhasil diperbarui.',
            'data' => $customer,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;
        $customer = Customer::where('store_id', $storeId)->find($id);

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Pelanggan tidak ditemukan.',
            ], 404);
        }

        $cName = $customer->name;
        $customer->delete();

        ActivityLogger::log(
            module: 'contacts',
            action: 'customer_deleted',
            description: "{$request->user()->name} menghapus data pelanggan '{$cName}'.",
            request: $request,
            subjectType: Customer::class,
            subjectId: $id
        );

        return response()->json([
            'success' => true,
            'message' => 'Pelanggan berhasil dihapus.',
        ]);
    }
}
