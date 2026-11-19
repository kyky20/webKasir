<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $query = Product::where('store_id', $storeId)
            ->with(['category:id,name,slug']);

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        if ($request->filled('stock_status')) {
            if ($request->stock_status === 'out_of_stock') {
                $query->where('stock', '<=', 0);
            } elseif ($request->stock_status === 'low_stock') {
                $query->where('stock', '>', 0)->whereRaw('stock <= min_stock');
            } elseif ($request->stock_status === 'in_stock') {
                $query->whereRaw('stock > min_stock');
            }
        }

        if ($request->boolean('all')) {
            $products = $query->orderBy('name')->get();
            return response()->json([
                'success' => true,
                'data' => $products,
            ]);
        }

        $perPage = min(max((int) $request->input('per_page', 15), 5), 100);
        $products = $query->latest('id')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'category_id' => [
                'nullable',
                Rule::exists('categories', 'id')->where('store_id', $storeId),
            ],
            'sku' => [
                'required',
                'string',
                'max:100',
                Rule::unique('products', 'sku')->where('store_id', $storeId),
            ],
            'barcode' => ['nullable', 'string', 'max:100'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'min_stock' => ['nullable', 'integer', 'min:0'],
            'unit' => ['nullable', 'string', 'max:30'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['nullable', 'boolean'],
        ], [
            'name.required' => 'Nama produk wajib diisi.',
            'sku.required' => 'SKU produk wajib diisi.',
            'sku.unique' => 'SKU ini sudah digunakan oleh produk lain di toko Anda.',
            'cost_price.required' => 'Harga modal (HPP) wajib diisi.',
            'selling_price.required' => 'Harga jual wajib diisi.',
        ]);

        $product = DB::transaction(function () use ($validated, $storeId, $request) {
            $initialStock = (int) ($validated['stock'] ?? 0);

            $prod = Product::create([
                'store_id' => $storeId,
                'category_id' => $validated['category_id'] ?? null,
                'name' => trim($validated['name']),
                'sku' => strtoupper(trim($validated['sku'])),
                'barcode' => !empty($validated['barcode']) ? trim($validated['barcode']) : null,
                'cost_price' => $validated['cost_price'],
                'selling_price' => $validated['selling_price'],
                'stock' => $initialStock,
                'min_stock' => $validated['min_stock'] ?? 5,
                'unit' => !empty($validated['unit']) ? trim($validated['unit']) : 'pcs',
                'description' => $validated['description'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            if ($initialStock > 0) {
                StockMovement::create([
                    'store_id' => $storeId,
                    'product_id' => $prod->id,
                    'user_id' => $request->user()->id,
                    'type' => 'adjustment',
                    'quantity' => $initialStock,
                    'stock_before' => 0,
                    'stock_after' => $initialStock,
                    'reference_type' => Product::class,
                    'reference_id' => $prod->id,
                    'notes' => 'Pencatatan stok awal produk baru',
                ]);
            }

            return $prod;
        });

        ActivityLogger::log(
            module: 'products',
            action: 'product_created',
            description: "{$request->user()->name} menambahkan produk baru: '{$product->name}' (SKU: {$product->sku}).",
            request: $request,
            subjectType: Product::class,
            subjectId: $product->id,
            newValues: $product->only(['name', 'sku', 'selling_price', 'cost_price', 'stock', 'unit']),
            notify: false
        );

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil ditambahkan.',
            'data' => $product->load('category:id,name,slug'),
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $product = Product::where('store_id', $storeId)
            ->with(['category:id,name,slug'])
            ->find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;
        $product = Product::where('store_id', $storeId)->find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'category_id' => [
                'nullable',
                Rule::exists('categories', 'id')->where('store_id', $storeId),
            ],
            'sku' => [
                'required',
                'string',
                'max:100',
                Rule::unique('products', 'sku')->where('store_id', $storeId)->ignore($id),
            ],
            'barcode' => ['nullable', 'string', 'max:100'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'min_stock' => ['nullable', 'integer', 'min:0'],
            'unit' => ['nullable', 'string', 'max:30'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['nullable', 'boolean'],
        ], [
            'name.required' => 'Nama produk wajib diisi.',
            'sku.required' => 'SKU produk wajib diisi.',
            'sku.unique' => 'SKU ini sudah digunakan oleh produk lain di toko Anda.',
            'cost_price.required' => 'Harga modal (HPP) wajib diisi.',
            'selling_price.required' => 'Harga jual wajib diisi.',
        ]);

        $oldValues = $product->only(['name', 'sku', 'selling_price', 'cost_price', 'category_id', 'unit', 'min_stock', 'is_active']);

        $product->update([
            'category_id' => $validated['category_id'] ?? null,
            'name' => trim($validated['name']),
            'sku' => strtoupper(trim($validated['sku'])),
            'barcode' => !empty($validated['barcode']) ? trim($validated['barcode']) : null,
            'cost_price' => $validated['cost_price'],
            'selling_price' => $validated['selling_price'],
            'min_stock' => $validated['min_stock'] ?? 5,
            'unit' => !empty($validated['unit']) ? trim($validated['unit']) : 'pcs',
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? $product->is_active,
        ]);

        $newValues = $product->fresh()->only(['name', 'sku', 'selling_price', 'cost_price', 'category_id', 'unit', 'min_stock', 'is_active']);
        $user = $request->user();

        // Check if selling price changed
        if (floatval($oldValues['selling_price']) !== floatval($newValues['selling_price'])) {
            $oldPrice = 'Rp ' . number_format((float) $oldValues['selling_price'], 0, ',', '.');
            $newPrice = 'Rp ' . number_format((float) $newValues['selling_price'], 0, ',', '.');
            ActivityLogger::log(
                module: 'products',
                action: 'product_price_changed',
                description: "{$user->name} mengubah harga jual '{$product->name}' dari {$oldPrice} menjadi {$newPrice}.",
                request: $request,
                subjectType: Product::class,
                subjectId: $product->id,
                oldValues: $oldValues,
                newValues: $newValues,
                notify: true,
                notifyTitle: "Perubahan Harga: {$product->name}",
                notifyType: 'info',
                notifyLink: '/products'
            );
        } else {
            ActivityLogger::log(
                module: 'products',
                action: 'product_updated',
                description: "{$user->name} memperbarui informasi produk '{$product->name}'.",
                request: $request,
                subjectType: Product::class,
                subjectId: $product->id,
                oldValues: $oldValues,
                newValues: $newValues
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil diperbarui.',
            'data' => $product->fresh('category:id,name,slug'),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;
        $product = Product::where('store_id', $storeId)->find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        $prodInfo = $product->only(['name', 'sku', 'selling_price', 'cost_price', 'stock']);
        $product->delete();

        ActivityLogger::log(
            module: 'products',
            action: 'product_deleted',
            description: "{$request->user()->name} menghapus produk '{$prodInfo['name']}' (SKU: {$prodInfo['sku']}).",
            request: $request,
            subjectType: Product::class,
            subjectId: $id,
            oldValues: $prodInfo,
            notify: true,
            notifyTitle: "Produk Dihapus",
            notifyType: 'warning',
            notifyLink: '/products'
        );

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus (arsip historis tetap terjaga).',
        ]);
    }
}
