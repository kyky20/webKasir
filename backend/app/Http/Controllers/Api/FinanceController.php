<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashTransaction;
use App\Models\ExpenseCategory;
use App\Models\FinancialAccount;
use App\Services\ActivityLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class FinanceController extends Controller
{
    // ==================== FINANCIAL ACCOUNTS ====================

    public function getAccounts(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $accounts = FinancialAccount::where('store_id', $storeId)
            ->withCount('transactions')
            ->orderBy('id')
            ->get();

        $totalBalance = $accounts->where('is_active', true)->sum('current_balance');

        return response()->json([
            'success' => true,
            'data' => $accounts,
            'summary' => [
                'total_liquid_assets' => (float) $totalBalance,
                'active_accounts_count' => $accounts->where('is_active', true)->count(),
            ],
        ]);
    }

    public function storeAccount(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'account_type' => ['required', 'in:cash,bank,ewallet,other'],
            'account_number' => ['nullable', 'string', 'max:60'],
            'initial_balance' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],
        ], [
            'name.required' => 'Nama akun kas/bank wajib diisi.',
            'account_type.required' => 'Tipe akun wajib dipilih.',
        ]);

        $initialBalance = (float) ($validated['initial_balance'] ?? 0);

        $account = FinancialAccount::create([
            'store_id' => $storeId,
            'name' => $validated['name'],
            'account_type' => $validated['account_type'],
            'account_number' => $validated['account_number'] ?? null,
            'initial_balance' => $initialBalance,
            'current_balance' => $initialBalance,
            'is_active' => true,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Akun keuangan berhasil ditambahkan.',
            'data' => $account,
        ], 201);
    }

    public function updateAccount(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;
        $account = FinancialAccount::where('store_id', $storeId)->find($id);

        if (!$account) {
            return response()->json([
                'success' => false,
                'message' => 'Akun tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'account_type' => ['required', 'in:cash,bank,ewallet,other'],
            'account_number' => ['nullable', 'string', 'max:60'],
            'is_active' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $account->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Akun berhasil diperbarui.',
            'data' => $account,
        ]);
    }

    public function destroyAccount(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;
        $account = FinancialAccount::where('store_id', $storeId)->withCount('transactions')->find($id);

        if (!$account) {
            return response()->json([
                'success' => false,
                'message' => 'Akun tidak ditemukan.',
            ], 404);
        }

        if ($account->transactions_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Akun tidak dapat dihapus karena sudah memiliki riwayat transaksi arus kas. Anda dapat menonaktifkannya.',
            ], 422);
        }

        $account->delete();

        return response()->json([
            'success' => true,
            'message' => 'Akun berhasil dihapus.',
        ]);
    }

    // ==================== EXPENSE CATEGORIES ====================

    public function getCategories(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $categories = ExpenseCategory::where('store_id', $storeId)
            ->withCount('transactions')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
        ], [
            'name.required' => 'Nama kategori beban wajib diisi.',
        ]);

        $category = ExpenseCategory::create(array_merge($validated, ['store_id' => $storeId, 'is_active' => true]));

        return response()->json([
            'success' => true,
            'message' => 'Kategori beban berhasil ditambahkan.',
            'data' => $category,
        ], 201);
    }

    public function updateCategory(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;
        $category = ExpenseCategory::where('store_id', $storeId)->find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori beban tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $category->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Kategori beban berhasil diperbarui.',
            'data' => $category,
        ]);
    }

    public function destroyCategory(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;
        $category = ExpenseCategory::where('store_id', $storeId)->find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori beban tidak ditemukan.',
            ], 404);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kategori beban berhasil dihapus.',
        ]);
    }

    // ==================== CASH TRANSACTIONS (EXPENSE / INCOME / TRANSFER) ====================

    public function getTransactions(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $query = CashTransaction::where('store_id', $storeId)
            ->with([
                'account:id,name,account_type',
                'toAccount:id,name,account_type',
                'category:id,name',
                'user:id,name',
            ]);

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('account_id')) {
            $accId = $request->account_id;
            $query->where(function ($q) use ($accId) {
                $q->where('account_id', $accId)
                    ->orWhere('to_account_id', $accId);
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('transaction_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('transaction_date', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('transaction_number', 'like', "%{$search}%")
                    ->orWhere('recipient_payer', 'like', "%{$search}%")
                    ->orWhere('reference_no', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        // Summary calculations
        $totalExpense = (float) (clone $query)->where('type', 'expense')->sum('amount');
        $totalIncome = (float) (clone $query)->where('type', 'income')->sum('amount');

        $perPage = min(max((int) $request->input('per_page', 15), 5), 100);
        $transactions = $query->orderByDesc('transaction_date')->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $transactions->items(),
            'summary' => [
                'total_expense' => $totalExpense,
                'total_income' => $totalIncome,
                'net_cash' => $totalIncome - $totalExpense,
            ],
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
        ]);
    }

    public function storeTransaction(Request $request): JsonResponse
    {
        $user = $request->user();
        $storeId = $user->store_id;

        $validated = $request->validate([
            'type' => ['required', 'in:expense,income,transfer'],
            'account_id' => [
                'required',
                Rule::exists('financial_accounts', 'id')->where(fn ($q) => $q->where('store_id', $storeId)->where('is_active', true)),
            ],
            'to_account_id' => [
                'nullable',
                'different:account_id',
                Rule::exists('financial_accounts', 'id')->where(fn ($q) => $q->where('store_id', $storeId)->where('is_active', true)),
            ],
            'category_id' => [
                'nullable',
                Rule::exists('expense_categories', 'id')->where(fn ($q) => $q->where('store_id', $storeId)),
            ],
            'transaction_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:1'],
            'recipient_payer' => ['nullable', 'string', 'max:150'],
            'reference_no' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ], [
            'type.required' => 'Jenis transaksi wajib dipilih.',
            'account_id.required' => 'Akun kas/bank wajib dipilih.',
            'to_account_id.different' => 'Akun tujuan transfer tidak boleh sama dengan akun sumber.',
            'amount.required' => 'Nominal transaksi wajib diisi.',
            'amount.min' => 'Nominal transaksi minimal Rp 1.',
        ]);

        if ($validated['type'] === 'transfer' && empty($validated['to_account_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Akun tujuan transfer wajib dipilih.',
            ], 422);
        }

        $transaction = DB::transaction(function () use ($validated, $user, $storeId) {
            $amount = (float) $validated['amount'];
            $datePrefix = Carbon::parse($validated['transaction_date'])->format('Ymd');
            $typePrefix = $validated['type'] === 'expense' ? 'EXP' : ($validated['type'] === 'income' ? 'INC' : 'TRF');

            $countToday = CashTransaction::where('store_id', $storeId)
                ->whereDate('created_at', Carbon::today())
                ->lockForUpdate()
                ->count();
            $trxNumber = "{$typePrefix}-{$datePrefix}-" . str_pad($countToday + 1, 4, '0', STR_PAD_LEFT);

            // Fetch and lock source account
            $account = FinancialAccount::where('store_id', $storeId)
                ->lockForUpdate()
                ->find($validated['account_id']);

            // Update account balance based on transaction type
            if ($validated['type'] === 'expense') {
                $account->current_balance -= $amount;
                $account->save();
            } elseif ($validated['type'] === 'income') {
                $account->current_balance += $amount;
                $account->save();
            } elseif ($validated['type'] === 'transfer') {
                $account->current_balance -= $amount;
                $account->save();

                $toAccount = FinancialAccount::where('store_id', $storeId)
                    ->lockForUpdate()
                    ->find($validated['to_account_id']);
                $toAccount->current_balance += $amount;
                $toAccount->save();
            }

            return CashTransaction::create([
                'store_id' => $storeId,
                'user_id' => $user->id,
                'account_id' => $validated['account_id'],
                'to_account_id' => $validated['to_account_id'] ?? null,
                'category_id' => $validated['category_id'] ?? null,
                'transaction_number' => $trxNumber,
                'transaction_date' => $validated['transaction_date'],
                'type' => $validated['type'],
                'amount' => $amount,
                'recipient_payer' => $validated['recipient_payer'] ?? null,
                'reference_no' => $validated['reference_no'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        $typeLabel = $transaction->type === 'expense' ? 'pengeluaran' : ($transaction->type === 'income' ? 'pemasukan' : 'transfer kas');
        $formattedAmt = 'Rp ' . number_format((float) $transaction->amount, 0, ',', '.');
        ActivityLogger::log(
            module: 'finance',
            action: "finance_{$transaction->type}",
            description: "{$user->name} mencatat {$typeLabel} sebesar {$formattedAmt} ({$transaction->transaction_number}).",
            request: $request,
            user: $user,
            subjectType: CashTransaction::class,
            subjectId: $transaction->id,
            newValues: $transaction->only(['type', 'amount', 'transaction_number', 'recipient_payer', 'notes']),
            notify: $transaction->type === 'expense' && $transaction->amount >= 100000,
            notifyTitle: "Catatan Keuangan: {$typeLabel}",
            notifyType: 'info',
            notifyLink: '/finance'
        );

        return response()->json([
            'success' => true,
            'message' => 'Transaksi keuangan berhasil dicatat.',
            'data' => $transaction->load(['account', 'toAccount', 'category', 'user']),
        ], 201);
    }

    public function destroyTransaction(Request $request, int $id): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $transaction = CashTransaction::where('store_id', $storeId)->find($id);

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi tidak ditemukan.',
            ], 404);
        }

        DB::transaction(function () use ($transaction, $storeId) {
            $amount = (float) $transaction->amount;

            $account = FinancialAccount::where('store_id', $storeId)
                ->lockForUpdate()
                ->find($transaction->account_id);

            // Reverse balance
            if ($account) {
                if ($transaction->type === 'expense') {
                    $account->current_balance += $amount;
                    $account->save();
                } elseif ($transaction->type === 'income') {
                    $account->current_balance -= $amount;
                    $account->save();
                } elseif ($transaction->type === 'transfer') {
                    $account->current_balance += $amount;
                    $account->save();

                    if ($transaction->to_account_id) {
                        $toAccount = FinancialAccount::where('store_id', $storeId)
                            ->lockForUpdate()
                            ->find($transaction->to_account_id);
                        if ($toAccount) {
                            $toAccount->current_balance -= $amount;
                            $toAccount->save();
                        }
                    }
                }
            }

            $transaction->delete();
        });

        ActivityLogger::log(
            module: 'finance',
            action: 'finance_transaction_deleted',
            description: "{$request->user()->name} menghapus transaksi keuangan #{$transaction->transaction_number} senilai Rp " . number_format((float) $transaction->amount, 0, ',', '.') . ".",
            request: $request,
            subjectType: CashTransaction::class,
            subjectId: $id,
            oldValues: $transaction->only(['type', 'amount', 'transaction_number', 'notes']),
            notify: true,
            notifyTitle: "Catatan Keuangan Dihapus",
            notifyType: 'warning'
        );

        return response()->json([
            'success' => true,
            'message' => 'Transaksi berhasil dihapus dan saldo akun telah disesuaikan kembali.',
        ]);
    }
}
