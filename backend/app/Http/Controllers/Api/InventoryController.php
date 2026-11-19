<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function summary(Request $request): JsonResponse
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

        if ($request->filled('stock_status')) {
            if ($request->stock_status === 'out_of_stock') {
                $query->where('stock', '<=', 0);
            } elseif ($request->stock_status === 'low_stock') {
                $query->where('stock', '>', 0)->whereRaw('stock <= min_stock');
            } elseif ($request->stock_status === 'in_stock') {
                $query->whereRaw('stock > min_stock');
            }
        }

        // Global KPI Stats for this store (unfiltered)
        $allProducts = Product::where('store_id', $storeId)->get();
        $totalAssetValue = (float) $allProducts->sum(function ($p) {
            return (float) $p->cost_price * $p->stock;
        });
        $totalUnits = (int) $allProducts->sum('stock');
        $lowStockCount = $allProducts->where('stock', '>', 0)->filter(fn ($p) => $p->stock <= $p->min_stock)->count();
        $outOfStockCount = $allProducts->where('stock', '<=', 0)->count();

        $perPage = min(max((int) $request->input('per_page', 15), 5), 100);
        $products = $query->orderBy('stock', 'asc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'kpi' => [
                'total_asset_value' => $totalAssetValue,
                'total_units' => $totalUnits,
                'low_stock_count' => $lowStockCount,
                'out_of_stock_count' => $outOfStockCount,
                'total_products_count' => $allProducts->count(),
            ],
            'data' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    public function movements(Request $request, int $productId): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $product = Product::where('store_id', $storeId)->find($productId);
        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        $movements = StockMovement::where('store_id', $storeId)
            ->where('product_id', $productId)
            ->with('user:id,name,role')
            ->latest('id')
            ->limit(100)
            ->get();

        return response()->json([
            'success' => true,
            'product' => $product->load('category:id,name'),
            'data' => $movements,
        ]);
    }

    public function adjust(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'adjustment_type' => ['required', 'string', 'in:set_stock,add_stock,subtract_stock'],
            'quantity' => ['required', 'integer', 'min:0'],
            'reason' => ['required', 'string', 'min:3', 'max:500'],
        ], [
            'product_id.required' => 'Pilih produk yang akan disesuaikan.',
            'adjustment_type.in' => 'Jenis penyesuaian tidak valid.',
            'reason.required' => 'Alasan penyesuaian stok wajib diisi.',
            'reason.min' => 'Alasan minimal 3 karakter.',
        ]);

        try {
            $result = DB::transaction(function () use ($validated, $storeId, $request) {
                $product = Product::where('id', $validated['product_id'])
                    ->where('store_id', $storeId)
                    ->lockForUpdate()
                    ->first();

                if (!$product) {
                    throw new \RuntimeException('Produk tidak ditemukan.');
                }

                $oldStock = $product->stock;
                $adjQty = (int) $validated['quantity'];
                $adjType = $validated['adjustment_type'];

                if ($adjType === 'set_stock') {
                    $newStock = $adjQty;
                    $movementQty = $newStock - $oldStock;
                } elseif ($adjType === 'add_stock') {
                    if ($adjQty <= 0) {
                        throw new \RuntimeException('Jumlah penambahan harus lebih dari 0.');
                    }
                    $newStock = $oldStock + $adjQty;
                    $movementQty = $adjQty;
                } else { // subtract_stock
                    if ($adjQty <= 0) {
                        throw new \RuntimeException('Jumlah pengurangan harus lebih dari 0.');
                    }
                    if ($oldStock < $adjQty) {
                        throw new \RuntimeException("Stok tidak mencukupi untuk dikurangi (Stok saat ini: {$oldStock}).");
                    }
                    $newStock = $oldStock - $adjQty;
                    $movementQty = -$adjQty;
                }

                $product->update(['stock' => $newStock]);

                $movement = StockMovement::create([
                    'store_id' => $storeId,
                    'product_id' => $product->id,
                    'user_id' => $request->user()->id,
                    'type' => 'adjustment',
                    'quantity' => $movementQty,
                    'stock_before' => $oldStock,
                    'stock_after' => $newStock,
                    'reference_type' => Product::class,
                    'reference_id' => $product->id,
                    'notes' => trim($validated['reason']),
                ]);

                return [
                    'product' => $product->fresh('category:id,name'),
                    'movement' => $movement,
                    'old_stock' => $oldStock,
                    'new_stock' => $newStock,
                ];
            });

            $prod = $result['product'];
            $user = $request->user();
            ActivityLogger::log(
                module: 'inventory',
                action: 'stock_adjusted',
                description: "{$user->name} melakukan penyesuaian stok '{$prod->name}' dari {$result['old_stock']} menjadi {$result['new_stock']} {$prod->unit} (Alasan: {$validated['reason']}).",
                request: $request,
                user: $user,
                subjectType: Product::class,
                subjectId: $prod->id,
                oldValues: ['stock' => $result['old_stock']],
                newValues: ['stock' => $result['new_stock']],
                properties: ['reason' => $validated['reason'], 'type' => $validated['adjustment_type']],
                notify: $result['new_stock'] <= $prod->min_stock,
                notifyTitle: "Penyesuaian Stok: {$prod->name}",
                notifyType: $result['new_stock'] <= 0 ? 'danger' : 'warning',
                notifyLink: '/inventory'
            );

            return response()->json([
                'success' => true,
                'message' => 'Penyesuaian stok berhasil disimpan.',
                'data' => [
                    'product' => $result['product'],
                    'movement' => $result['movement'],
                ],
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem saat menyesuaikan stok.',
            ], 500);
        }
    }
}
