<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockMovement;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $storeId = $user->store_id;

        $query = Sale::where('store_id', $storeId)
            ->with(['cashier:id,name,username', 'items']);

        // Employees only see their own transactions
        if ($user->isEmployee()) {
            $query->where('user_id', $user->id);
        } elseif ($request->filled('cashier_id')) {
            $query->where('user_id', $request->cashier_id);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where('invoice_number', 'like', "%{$search}%");
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $perPage = min(max((int) $request->input('per_page', 15), 5), 100);
        $transactions = $query->latest('id')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $transactions->items(),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $sale = Sale::where('store_id', $user->store_id)
            ->with(['items', 'cashier:id,name,username', 'store', 'cancelledByUser:id,name'])
            ->where(function ($q) use ($id) {
                if (is_numeric($id)) {
                    $q->where('id', (int) $id)->orWhere('invoice_number', $id);
                } else {
                    $q->where('invoice_number', $id);
                }
            })
            ->first();

        if (!$sale) {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi tidak ditemukan.',
            ], 404);
        }

        // Employee can only view their own transactions
        if ($user->isEmployee() && $sale->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak: Anda hanya dapat melihat transaksi yang Anda buat sendiri.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $sale,
        ]);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if (!$user->isOwner()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Owner yang memiliki wewenang untuk membatalkan transaksi.',
            ], 403);
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:500'],
        ], [
            'reason.required' => 'Alasan pembatalan wajib diisi.',
            'reason.min' => 'Alasan pembatalan minimal 5 karakter.',
        ]);

        $sale = Sale::where('store_id', $user->store_id)->with('items')->find($id);

        if (!$sale) {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi tidak ditemukan.',
            ], 404);
        }

        if ($sale->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi ini sudah berstatus batal sebelumnya.',
            ], 422);
        }

        DB::transaction(function () use ($sale, $validated, $user) {
            $sale->update([
                'status' => 'cancelled',
                'cancellation_reason' => $validated['reason'],
                'cancelled_by' => $user->id,
                'cancelled_at' => now(),
            ]);

            // Restore product stock and record return movements
            foreach ($sale->items as $item) {
                if ($item->product_id) {
                    $product = Product::where('id', $item->product_id)->lockForUpdate()->first();
                    if ($product) {
                        $oldStock = $product->stock;
                        $newStock = $oldStock + $item->quantity;
                        $product->update(['stock' => $newStock]);

                        StockMovement::create([
                            'store_id' => $sale->store_id,
                            'product_id' => $product->id,
                            'user_id' => $user->id,
                            'type' => 'return',
                            'quantity' => $item->quantity,
                            'stock_before' => $oldStock,
                            'stock_after' => $newStock,
                            'reference_type' => Sale::class,
                            'reference_id' => $sale->id,
                            'notes' => "Pembatalan transaksi {$sale->invoice_number}: {$validated['reason']}",
                        ]);
                    }
                }
            }
        });

        ActivityLogger::log(
            module: 'pos',
            action: 'transaction_cancelled',
            description: "{$user->name} membatalkan transaksi #{$sale->invoice_number}. Alasan: {$validated['reason']}.",
            request: $request,
            user: $user,
            subjectType: Sale::class,
            subjectId: $sale->id,
            properties: [
                'reason' => $validated['reason'],
                'invoice_number' => $sale->invoice_number,
                'total_amount' => $sale->total_amount,
            ],
            notify: true,
            notifyTitle: "Transaksi Dibatalkan #{$sale->invoice_number}",
            notifyType: 'danger',
            notifyLink: '/transactions'
        );

        return response()->json([
            'success' => true,
            'message' => 'Transaksi berhasil dibatalkan dan stok produk telah dikembalikan.',
            'data' => $sale->fresh(['items', 'cashier:id,name,username', 'store', 'cancelledByUser:id,name']),
        ]);
    }
}
