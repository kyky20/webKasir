<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payable;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Services\ActivityLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PurchaseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $query = Purchase::where('store_id', $storeId)
            ->with([
                'supplier:id,name,phone,contact_person',
                'creator:id,name',
                'receiver:id,name',
                'payable:id,purchase_id,total_amount,paid_amount,remaining_amount,due_date,status',
            ])
            ->withCount('items');

        // Filters
        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('purchase_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('purchase_date', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhere('reference_no', 'like', "%{$search}%")
                    ->orWhereHas('supplier', function ($sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Summary KPI statistics for purchases
        $summary = [
            'total_received_amount' => (float) Purchase::where('store_id', $storeId)
                ->where('status', 'received')
                ->sum('total_amount'),
            'total_unpaid_payables' => (float) Payable::where('store_id', $storeId)
                ->whereIn('status', ['unpaid', 'partially_paid'])
                ->sum('remaining_amount'),
            'draft_count' => Purchase::where('store_id', $storeId)
                ->where('status', 'draft')
                ->count(),
            'total_purchases_count' => Purchase::where('store_id', $storeId)->count(),
        ];

        $perPage = min(max((int) $request->input('per_page', 15), 5), 100);
        $purchases = $query->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $purchases->items(),
            'summary' => $summary,
            'meta' => [
                'current_page' => $purchases->currentPage(),
                'last_page' => $purchases->lastPage(),
                'per_page' => $purchases->perPage(),
                'total' => $purchases->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $storeId = $user->store_id;

        $validated = $request->validate([
            'supplier_id' => [
                'nullable',
                Rule::exists('suppliers', 'id')->where(fn ($q) => $q->where('store_id', $storeId)),
            ],
            'reference_no' => ['nullable', 'string', 'max:100'],
            'purchase_date' => ['required', 'date'],
            'status' => ['required', 'in:draft,received'],
            'payment_method' => ['required', 'in:cash,bank_transfer,credit'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'additional_cost' => ['nullable', 'numeric', 'min:0'],
            'paid_amount' => ['nullable', 'numeric', 'min:0'],
            'due_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => [
                'required',
                Rule::exists('products', 'id')->where(fn ($q) => $q->where('store_id', $storeId)),
            ],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ], [
            'purchase_date.required' => 'Tanggal pembelian wajib diisi.',
            'items.required' => 'Daftar barang pembelian wajib diisi minimal 1 item.',
            'items.*.product_id.required' => 'Produk harus dipilih.',
            'items.*.unit_cost.required' => 'Harga beli satuan wajib diisi.',
            'items.*.quantity.required' => 'Jumlah barang wajib diisi.',
        ]);

        $purchase = DB::transaction(function () use ($validated, $user, $storeId) {
            // Generate Invoice Number
            $datePrefix = Carbon::parse($validated['purchase_date'])->format('Ymd');
            $countToday = Purchase::where('store_id', $storeId)
                ->whereDate('created_at', Carbon::today())
                ->lockForUpdate()
                ->count();
            $invoiceNumber = 'PB-' . $datePrefix . '-' . str_pad($countToday + 1, 4, '0', STR_PAD_LEFT);

            // Fetch products to verify and snapshot
            $productIds = collect($validated['items'])->pluck('product_id')->unique();
            $products = Product::where('store_id', $storeId)
                ->whereIn('id', $productIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $subtotal = 0;
            $itemsData = [];

            foreach ($validated['items'] as $item) {
                $product = $products->get($item['product_id']);
                $itemSubtotal = $item['unit_cost'] * $item['quantity'];
                $subtotal += $itemSubtotal;

                $itemsData[] = [
                    'product' => $product,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'unit_cost' => $item['unit_cost'],
                    'quantity' => $item['quantity'],
                    'subtotal' => $itemSubtotal,
                ];
            }

            $discountAmount = (float) ($validated['discount_amount'] ?? 0);
            $additionalCost = (float) ($validated['additional_cost'] ?? 0);
            $totalAmount = max(0, $subtotal - $discountAmount + $additionalCost);

            $paidAmount = (float) ($validated['paid_amount'] ?? 0);
            if ($validated['payment_method'] === 'cash' && !isset($validated['paid_amount'])) {
                $paidAmount = $totalAmount;
            }

            if ($paidAmount >= $totalAmount) {
                $paymentStatus = 'paid';
            } elseif ($paidAmount > 0) {
                $paymentStatus = 'partially_paid';
            } else {
                $paymentStatus = 'unpaid';
            }

            $isReceived = $validated['status'] === 'received';

            $purchase = Purchase::create([
                'store_id' => $storeId,
                'user_id' => $user->id,
                'supplier_id' => $validated['supplier_id'] ?? null,
                'invoice_number' => $invoiceNumber,
                'reference_no' => $validated['reference_no'] ?? null,
                'purchase_date' => $validated['purchase_date'],
                'status' => $validated['status'],
                'payment_status' => $paymentStatus,
                'payment_method' => $validated['payment_method'],
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'additional_cost' => $additionalCost,
                'total_amount' => $totalAmount,
                'paid_amount' => $paidAmount,
                'due_date' => $validated['due_date'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'received_at' => $isReceived ? now() : null,
                'received_by' => $isReceived ? $user->id : null,
            ]);

            // Save items & update stock if received
            foreach ($itemsData as $row) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $row['product_id'],
                    'product_name' => $row['product_name'],
                    'product_sku' => $row['product_sku'],
                    'unit_cost' => $row['unit_cost'],
                    'quantity' => $row['quantity'],
                    'subtotal' => $row['subtotal'],
                ]);

                if ($isReceived) {
                    /** @var Product $product */
                    $product = $row['product'];
                    $stockBefore = $product->stock;
                    $stockAfter = $stockBefore + $row['quantity'];

                    $product->stock = $stockAfter;
                    $product->cost_price = $row['unit_cost'];
                    $product->save();

                    StockMovement::create([
                        'store_id' => $storeId,
                        'product_id' => $product->id,
                        'user_id' => $user->id,
                        'type' => 'purchase',
                        'quantity' => $row['quantity'],
                        'stock_before' => $stockBefore,
                        'stock_after' => $stockAfter,
                        'reference_type' => 'purchase',
                        'reference_id' => $purchase->id,
                        'notes' => "Penerimaan stok pembelian invoice {$purchase->invoice_number}",
                    ]);
                }
            }

            // Create payable if not fully paid and supplier is selected
            if ($totalAmount > $paidAmount && !empty($validated['supplier_id'])) {
                Payable::create([
                    'store_id' => $storeId,
                    'purchase_id' => $purchase->id,
                    'supplier_id' => $validated['supplier_id'],
                    'invoice_number' => $purchase->invoice_number,
                    'total_amount' => $totalAmount,
                    'paid_amount' => $paidAmount,
                    'remaining_amount' => $totalAmount - $paidAmount,
                    'due_date' => $validated['due_date'] ?? null,
                    'status' => $paidAmount > 0 ? 'partially_paid' : 'unpaid',
                    'notes' => "Utang pembelian {$purchase->invoice_number}",
                ]);
            }

            return $purchase->load(['items', 'supplier', 'payable']);
        });

        ActivityLogger::log(
            module: 'purchases',
            action: 'purchase_created',
            description: "{$user->name} membuat transaksi pembelian #{$purchase->invoice_number} senilai Rp " . number_format((float) $purchase->total_amount, 0, ',', '.') . ".",
            request: $request,
            user: $user,
            subjectType: Purchase::class,
            subjectId: $purchase->id,
            properties: [
                'invoice_number' => $purchase->invoice_number,
                'total_amount' => $purchase->total_amount,
                'status' => $purchase->status,
            ],
            notify: true,
            notifyTitle: "Pembelian Baru #{$purchase->invoice_number}",
            notifyType: 'info',
            notifyLink: '/purchases'
        );

        return response()->json([
            'success' => true,
            'message' => 'Transaksi pembelian berhasil dibuat.',
            'data' => $purchase,
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $purchase = Purchase::where('store_id', $storeId)
            ->with([
                'supplier',
                'creator:id,name,role',
                'receiver:id,name,role',
                'items.product:id,name,sku,unit',
                'payable',
            ])
            ->find($id);

        if (!$purchase) {
            return response()->json([
                'success' => false,
                'message' => 'Data pembelian tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $purchase,
        ]);
    }

    public function receive(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $storeId = $user->store_id;

        $purchase = Purchase::where('store_id', $storeId)
            ->with('items.product')
            ->find($id);

        if (!$purchase) {
            return response()->json([
                'success' => false,
                'message' => 'Data pembelian tidak ditemukan.',
            ], 404);
        }

        if ($purchase->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pesanan pembelian berstatus draft yang dapat dikonfirmasi penerimaannya.',
            ], 422);
        }

        DB::transaction(function () use ($purchase, $user, $storeId) {
            foreach ($purchase->items as $item) {
                $product = Product::where('store_id', $storeId)
                    ->lockForUpdate()
                    ->find($item->product_id);

                if ($product) {
                    $stockBefore = $product->stock;
                    $stockAfter = $stockBefore + $item->quantity;

                    $product->stock = $stockAfter;
                    $product->cost_price = $item->unit_cost;
                    $product->save();

                    StockMovement::create([
                        'store_id' => $storeId,
                        'product_id' => $product->id,
                        'user_id' => $user->id,
                        'type' => 'purchase',
                        'quantity' => $item->quantity,
                        'stock_before' => $stockBefore,
                        'stock_after' => $stockAfter,
                        'reference_type' => 'purchase',
                        'reference_id' => $purchase->id,
                        'notes' => "Konfirmasi penerimaan pesanan draft {$purchase->invoice_number}",
                    ]);
                }
            }

            $purchase->update([
                'status' => 'received',
                'received_at' => now(),
                'received_by' => $user->id,
            ]);
        });

        ActivityLogger::log(
            module: 'purchases',
            action: 'purchase_received',
            description: "{$user->name} mengonfirmasi penerimaan barang untuk faktur #{$purchase->invoice_number}. Stok produk otomatis bertambah.",
            request: $request,
            user: $user,
            subjectType: Purchase::class,
            subjectId: $purchase->id,
            notify: true,
            notifyTitle: "Barang Pembelian Diterima",
            notifyType: 'success',
            notifyLink: '/purchases'
        );

        return response()->json([
            'success' => true,
            'message' => 'Barang pembelian berhasil diterima dan stok produk telah bertambah.',
            'data' => $purchase->fresh(['items', 'supplier', 'payable']),
        ]);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $storeId = $user->store_id;

        $purchase = Purchase::where('store_id', $storeId)
            ->with(['items', 'payable'])
            ->find($id);

        if (!$purchase) {
            return response()->json([
                'success' => false,
                'message' => 'Data pembelian tidak ditemukan.',
            ], 404);
        }

        if ($purchase->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Pembelian ini sudah dibatalkan sebelumnya.',
            ], 422);
        }

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $reason = $validated['reason'] ?? 'Dibatalkan oleh ' . $user->name;

        DB::transaction(function () use ($purchase, $user, $storeId, $reason) {
            // If already received, reverse the stock
            if ($purchase->status === 'received') {
                foreach ($purchase->items as $item) {
                    $product = Product::where('store_id', $storeId)
                        ->lockForUpdate()
                        ->find($item->product_id);

                    if ($product) {
                        $stockBefore = $product->stock;
                        $stockAfter = max(0, $stockBefore - $item->quantity);

                        $product->stock = $stockAfter;
                        $product->save();

                        StockMovement::create([
                            'store_id' => $storeId,
                            'product_id' => $product->id,
                            'user_id' => $user->id,
                            'type' => 'return',
                            'quantity' => -$item->quantity,
                            'stock_before' => $stockBefore,
                            'stock_after' => $stockAfter,
                            'reference_type' => 'purchase_cancel',
                            'reference_id' => $purchase->id,
                            'notes' => "Pembatalan pembelian {$purchase->invoice_number}: {$reason}",
                        ]);
                    }
                }
            }

            // If payable exists, mark it cancelled/paid so debt is removed
            if ($purchase->payable) {
                $purchase->payable->update([
                    'status' => 'paid',
                    'remaining_amount' => 0,
                    'notes' => ($purchase->payable->notes ? $purchase->payable->notes . ' | ' : '') . "Dibatalkan: {$reason}",
                ]);
            }

            $currentNotes = $purchase->notes ? $purchase->notes . "\n" : '';
            $purchase->update([
                'status' => 'cancelled',
                'notes' => $currentNotes . "[DIBATALKAN: " . now()->format('Y-m-d H:i') . "] {$reason}",
            ]);
        });

        ActivityLogger::log(
            module: 'purchases',
            action: 'purchase_cancelled',
            description: "{$user->name} membatalkan pesanan pembelian #{$purchase->invoice_number}. Alasan: {$reason}.",
            request: $request,
            user: $user,
            subjectType: Purchase::class,
            subjectId: $purchase->id,
            notify: true,
            notifyTitle: "Pembelian Dibatalkan",
            notifyType: 'warning',
            notifyLink: '/purchases'
        );

        return response()->json([
            'success' => true,
            'message' => 'Pembelian berhasil dibatalkan dan penyesuaian stok/utang telah dicatat.',
            'data' => $purchase->fresh(['items', 'supplier', 'payable']),
        ]);
    }

    public function payPayable(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $payable = Payable::where('store_id', $storeId)
            ->with('purchase')
            ->find($id);

        if (!$payable) {
            return response()->json([
                'success' => false,
                'message' => 'Data utang supplier tidak ditemukan.',
            ], 404);
        }

        if ($payable->status === 'paid' || $payable->remaining_amount <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Utang ini sudah lunas.',
            ], 422);
        }

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:1', 'max:' . $payable->remaining_amount],
            'payment_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:255'],
        ], [
            'amount.required' => 'Jumlah pembayaran utang wajib diisi.',
            'amount.max' => 'Jumlah pembayaran tidak boleh melebihi sisa utang (Rp ' . number_format((float) $payable->remaining_amount, 0, ',', '.') . ').',
        ]);

        $amount = (float) $validated['amount'];

        DB::transaction(function () use ($payable, $amount, $validated) {
            $newPaid = $payable->paid_amount + $amount;
            $newRemaining = max(0, $payable->total_amount - $newPaid);
            $newStatus = $newRemaining <= 0 ? 'paid' : 'partially_paid';

            $payable->update([
                'paid_amount' => $newPaid,
                'remaining_amount' => $newRemaining,
                'status' => $newStatus,
                'notes' => $payable->notes ? $payable->notes . '; ' . ($validated['notes'] ?? 'Cicilan utang') : $validated['notes'] ?? null,
            ]);

            // Sync with purchase record
            if ($payable->purchase) {
                $purchase = $payable->purchase;
                $newPurchasePaid = $purchase->paid_amount + $amount;
                $purchasePaymentStatus = $newPurchasePaid >= $purchase->total_amount ? 'paid' : 'partially_paid';

                $purchase->update([
                    'paid_amount' => $newPurchasePaid,
                    'payment_status' => $purchasePaymentStatus,
                ]);
            }
        });

        ActivityLogger::log(
            module: 'purchases',
            action: 'payable_paid',
            description: "{$request->user()->name} mencatat pembayaran utang supplier faktur #{$payable->invoice_number} sebesar Rp " . number_format((float) $amount, 0, ',', '.') . ".",
            request: $request,
            subjectType: Payable::class,
            subjectId: $payable->id,
            properties: ['amount' => $amount, 'invoice_number' => $payable->invoice_number],
            notify: false
        );

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran utang berhasil dicatat.',
            'data' => $payable->fresh(['purchase', 'supplier']),
        ]);
    }
}
