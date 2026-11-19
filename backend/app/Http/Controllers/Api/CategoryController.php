<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $categories = Category::where('store_id', $storeId)
            ->withCount('products')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
        ], [
            'name.required' => 'Nama kategori wajib diisi.',
            'name.max' => 'Nama kategori maksimal 100 karakter.',
        ]);

        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;
        while (Category::where('store_id', $storeId)->where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $category = Category::create([
            'store_id' => $storeId,
            'name' => trim($validated['name']),
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        ActivityLogger::log(
            module: 'products',
            action: 'category_created',
            description: "{$request->user()->name} menambahkan kategori produk baru: '{$category->name}'.",
            request: $request,
            subjectType: Category::class,
            subjectId: $category->id,
            newValues: $category->only(['name', 'slug', 'description'])
        );

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil ditambahkan.',
            'data' => $category,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;
        $category = Category::where('store_id', $storeId)->find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
        ], [
            'name.required' => 'Nama kategori wajib diisi.',
        ]);

        $updateData = [
            'name' => trim($validated['name']),
            'description' => $validated['description'] ?? null,
        ];

        if (isset($validated['is_active'])) {
            $updateData['is_active'] = $validated['is_active'];
        }

        if ($category->name !== $validated['name']) {
            $baseSlug = Str::slug($validated['name']);
            $slug = $baseSlug;
            $counter = 1;
            while (Category::where('store_id', $storeId)->where('slug', $slug)->where('id', '!=', $id)->exists()) {
                $slug = "{$baseSlug}-{$counter}";
                $counter++;
            }
            $updateData['slug'] = $slug;
        }

        $oldName = $category->name;
        $category->update($updateData);

        ActivityLogger::log(
            module: 'products',
            action: 'category_updated',
            description: "{$request->user()->name} memperbarui kategori '{$oldName}'" . ($oldName !== $category->name ? " menjadi '{$category->name}'." : "."),
            request: $request,
            subjectType: Category::class,
            subjectId: $category->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil diperbarui.',
            'data' => $category,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;
        $category = Category::where('store_id', $storeId)->find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori tidak ditemukan.',
            ], 404);
        }

        $catName = $category->name;
        $category->delete();

        ActivityLogger::log(
            module: 'products',
            action: 'category_deleted',
            description: "{$request->user()->name} menghapus kategori '{$catName}'.",
            request: $request,
            subjectType: Category::class,
            subjectId: $id
        );

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil dihapus.',
        ]);
    }
}
