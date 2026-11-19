<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $query = Supplier::where('store_id', $storeId)
            ->withCount('purchases');

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('contact_person', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('all')) {
            $suppliers = $query->orderBy('name')->get();
            return response()->json([
                'success' => true,
                'data' => $suppliers,
            ]);
        }

        $perPage = min(max((int) $request->input('per_page', 15), 5), 100);
        $suppliers = $query->orderBy('name')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $suppliers->items(),
            'meta' => [
                'current_page' => $suppliers->currentPage(),
                'last_page' => $suppliers->lastPage(),
                'per_page' => $suppliers->perPage(),
                'total' => $suppliers->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'contact_person' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:150'],
            'address' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
        ], [
            'name.required' => 'Nama supplier wajib diisi.',
        ]);

        $supplier = Supplier::create(array_merge($validated, ['store_id' => $storeId]));

        ActivityLogger::log(
            module: 'contacts',
            action: 'supplier_created',
            description: "{$request->user()->name} menambahkan supplier baru: '{$supplier->name}'.",
            request: $request,
            subjectType: Supplier::class,
            subjectId: $supplier->id,
            newValues: $supplier->only(['name', 'phone', 'contact_person', 'email'])
        );

        return response()->json([
            'success' => true,
            'message' => 'Supplier berhasil ditambahkan.',
            'data' => $supplier,
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $supplier = Supplier::where('store_id', $storeId)
            ->with(['purchases' => fn ($q) => $q->latest('id')->limit(10), 'payables'])
            ->find($id);

        if (!$supplier) {
            return response()->json([
                'success' => false,
                'message' => 'Supplier tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $supplier,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;
        $supplier = Supplier::where('store_id', $storeId)->find($id);

        if (!$supplier) {
            return response()->json([
                'success' => false,
                'message' => 'Supplier tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'contact_person' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:150'],
            'address' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
        ], [
            'name.required' => 'Nama supplier wajib diisi.',
        ]);

        $old = $supplier->only(['name', 'phone', 'contact_person', 'email', 'address']);
        $supplier->update($validated);

        ActivityLogger::log(
            module: 'contacts',
            action: 'supplier_updated',
            description: "{$request->user()->name} memperbarui data supplier '{$supplier->name}'.",
            request: $request,
            subjectType: Supplier::class,
            subjectId: $supplier->id,
            oldValues: $old,
            newValues: $supplier->fresh()->only(['name', 'phone', 'contact_person', 'email', 'address'])
        );

        return response()->json([
            'success' => true,
            'message' => 'Supplier berhasil diperbarui.',
            'data' => $supplier,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;
        $supplier = Supplier::where('store_id', $storeId)->find($id);

        if (!$supplier) {
            return response()->json([
                'success' => false,
                'message' => 'Supplier tidak ditemukan.',
            ], 404);
        }

        $sName = $supplier->name;
        $supplier->delete();

        ActivityLogger::log(
            module: 'contacts',
            action: 'supplier_deleted',
            description: "{$request->user()->name} menghapus data supplier '{$sName}'.",
            request: $request,
            subjectType: Supplier::class,
            subjectId: $id
        );

        return response()->json([
            'success' => true,
            'message' => 'Supplier berhasil dihapus.',
        ]);
    }
}
