<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PosController extends Controller
{
    public function categories(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $categories = Category::where('store_id', $storeId)
            ->where('is_active', true)
            ->select('id', 'name', 'slug', 'description')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    public function products(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $query = Product::where('store_id', $storeId)
            ->where('is_active', true)
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

        $products = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'payment_method' => ['required', 'string', 'in:cash,bank_transfer,qris,other'],
            'paid_amount' => ['required', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],
            'idempotency_key' => ['nullable', 'string', 'max:100'],
        ], [
            'items.required' => 'Keranjang belanja tidak boleh kosong.',
            'items.min' => 'Minimal 1 produk harus dipilih.',
            'items.*.quantity.min' => 'Kuantitas minimal 1.',
            'payment_method.in' => 'Metode pembayaran tidak valid.',
            'paid_amount.required' => 'Nominal pembayaran wajib diisi.',
        ]);

        $user = $request->user();
        $store = $user->store;

        // Idempotency check: prevent duplicate transactions from repeat clicks
        if (!empty($validated['idempotency_key'])) {
            $existingSale = Sale::where('store_id', $store->id)
                ->where('idempotency_key', $validated['idempotency_key'])
                ->with(['items', 'cashier:id,name,username', 'store'])
                ->first();

            if ($existingSale) {
                return response()->json([
                    'success' => true,
                    'message' => 'Transaksi sudah diproses sebelumnya.',
                    'data' => $existingSale,
                ]);
            }
        }

        try {
            $sale = DB::transaction(function () use ($validated, $user, $store) {
                $subtotal = 0;
                $itemsToInsert = [];
                $productUpdates = [];

                // Lock product rows and calculate subtotal
                foreach ($validated['items'] as $item) {
                    $product = Product::where('id', $item['product_id'])
                        ->where('store_id', $store->id)
                        ->lockForUpdate()
                        ->first();

                    if (!$product || !$product->is_active) {
                        throw new \RuntimeException("Produk tidak ditemukan atau tidak aktif.");
                    }

                    if ($product->stock < $item['quantity']) {
                        throw new \RuntimeException("Stok produk '{$product->name}' tidak mencukupi (Sisa: {$product->stock}, Diminta: {$item['quantity']}).");
                    }

                    $unitPrice = (float) $product->selling_price;
                    $costPrice = (float) $product->cost_price;
                    $qty = (int) $item['quantity'];
                    $itemSubtotal = $unitPrice * $qty;
                    $subtotal += $itemSubtotal;

                    $itemsToInsert[] = [
                        'product' => $product,
                        'unit_price' => $unitPrice,
                        'cost_price' => $costPrice,
                        'quantity' => $qty,
                        'subtotal' => $itemSubtotal,
                        'discount_amount' => 0.00,
                        'tax_amount' => 0.00,
                        'total_amount' => $itemSubtotal,
                    ];

                    $productUpdates[] = [
                        'product' => $product,
                        'quantity' => $qty,
                    ];
                }

                $discount = isset($validated['discount_amount']) ? (float) $validated['discount_amount'] : 0.00;
                if ($discount > $subtotal) {
                    $discount = $subtotal;
                }

                $taxRate = (float) $store->tax_percentage;
                $taxAmount = $taxRate > 0 ? round(($subtotal - $discount) * ($taxRate / 100), 2) : 0.00;
                $totalAmount = ($subtotal - $discount) + $taxAmount;

                $paymentMethod = $validated['payment_method'];
                $paidAmount = (float) $validated['paid_amount'];

                if ($paymentMethod === 'cash') {
                    if ($paidAmount < $totalAmount) {
                        throw new \RuntimeException("Nominal pembayaran tunai kurang dari total tagihan (Total: Rp " . number_format((float) $totalAmount, 0, ',', '.') . ").");
                    }
                    $changeAmount = $paidAmount - $totalAmount;
                } else {
                    $paidAmount = $totalAmount;
                    $changeAmount = 0.00;
                }

                // Generate unique invoice number: INV-YYYYMMDD-XXXX
                $dateCode = now()->format('Ymd');
                $todaySalesCount = Sale::where('store_id', $store->id)
                    ->whereDate('created_at', now()->toDateString())
                    ->count() + 1;
                $sequence = str_pad((string) $todaySalesCount, 4, '0', STR_PAD_LEFT);
                $randomSuffix = strtoupper(Str::random(2));
                $invoiceNumber = "INV-{$dateCode}-{$sequence}{$randomSuffix}";

                $sale = Sale::create([
                    'store_id' => $store->id,
                    'user_id' => $user->id,
                    'invoice_number' => $invoiceNumber,
                    'status' => 'completed',
                    'subtotal' => $subtotal,
                    'discount_amount' => $discount,
                    'tax_amount' => $taxAmount,
                    'total_amount' => $totalAmount,
                    'paid_amount' => $paidAmount,
                    'change_amount' => $changeAmount,
                    'payment_method' => $paymentMethod,
                    'notes' => $validated['notes'] ?? null,
                    'idempotency_key' => $validated['idempotency_key'] ?? null,
                ]);

                // Insert items and adjust stock
                foreach ($itemsToInsert as $entry) {
                    $prod = $entry['product'];
                    $qty = $entry['quantity'];

                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $prod->id,
                        'product_name' => $prod->name,
                        'product_sku' => $prod->sku,
                        'unit_price' => $entry['unit_price'],
                        'cost_price' => $entry['cost_price'],
                        'quantity' => $qty,
                        'subtotal' => $entry['subtotal'],
                        'discount_amount' => $entry['discount_amount'],
                        'tax_amount' => $entry['tax_amount'],
                        'total_amount' => $entry['total_amount'],
                    ]);

                    $oldStock = $prod->stock;
                    $newStock = $oldStock - $qty;
                    $prod->update(['stock' => $newStock]);

                    StockMovement::create([
                        'store_id' => $store->id,
                        'product_id' => $prod->id,
                        'user_id' => $user->id,
                        'type' => 'sale',
                        'quantity' => -$qty,
                        'stock_before' => $oldStock,
                        'stock_after' => $newStock,
                        'reference_type' => Sale::class,
                        'reference_id' => $sale->id,
                        'notes' => "Penjualan faktur {$invoiceNumber}",
                    ]);
                }

                return $sale;
            });

            // Log activity for sale checkout
            $formattedTotal = 'Rp ' . number_format((float) $sale->total_amount, 0, ',', '.');
            ActivityLogger::log(
                module: 'pos',
                action: 'transaction_completed',
                description: "{$user->name} menyelesaikan transaksi #{$sale->invoice_number} senilai {$formattedTotal}.",
                request: $request,
                user: $user,
                subjectType: Sale::class,
                subjectId: $sale->id,
                newValues: [
                    'invoice_number' => $sale->invoice_number,
                    'total_amount' => $sale->total_amount,
                    'payment_method' => $sale->payment_method,
                    'item_count' => count($validated['items']),
                ],
                notify: true,
                notifyTitle: "Transaksi Baru #{$sale->invoice_number}",
                notifyType: 'success',
                notifyLink: '/transactions'
            );

            // Check stock alerts for purchased items
            foreach ($sale->items as $item) {
                if ($item->product_id) {
                    $p = Product::find($item->product_id);
                    if ($p) {
                        $currStock = $p->stock;
                        if ($currStock <= 0) {
                            ActivityLogger::log(
                                module: 'inventory',
                                action: 'stock_empty',
                                description: "Stok produk '{$p->name}' telah habis (0 {$p->unit})!",
                                request: $request,
                                user: $user,
                                subjectType: Product::class,
                                subjectId: $p->id,
                                notify: true,
                                notifyTitle: "Peringatan Stok Habis: {$p->name}",
                                notifyType: 'danger',
                                notifyLink: '/inventory'
                            );
                        } elseif ($currStock <= ($p->min_stock ?? 5)) {
                            ActivityLogger::log(
                                module: 'inventory',
                                action: 'stock_low',
                                description: "Stok produk '{$p->name}' menipis, tersisa {$currStock} {$p->unit} (Batas minimum: " . ($p->min_stock ?? 5) . ").",
                                request: $request,
                                user: $user,
                                subjectType: Product::class,
                                subjectId: $p->id,
                                notify: true,
                                notifyTitle: "Peringatan Stok Menipis: {$p->name}",
                                notifyType: 'warning',
                                notifyLink: '/inventory'
                            );
                        }
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil diselesaikan.',
                'data' => $sale->load(['items', 'cashier:id,name,username', 'store']),
            ], 201);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem saat memproses transaksi.',
            ], 500);
        }
    }
}
