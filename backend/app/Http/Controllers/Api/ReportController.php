<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashTransaction;
use App\Models\FinancialAccount;
use App\Models\Payable;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\SaleItem;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function profitLoss(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());

        // 1. Sales Revenue
        $salesQuery = Sale::where('store_id', $storeId)
            ->where('status', 'completed')
            ->whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo);

        $grossSales = (float) (clone $salesQuery)->sum('subtotal');
        $salesDiscount = (float) (clone $salesQuery)->sum('discount_amount');
        $netSales = (float) (clone $salesQuery)->sum('total_amount');
        $completedTransactionsCount = (clone $salesQuery)->count();

        // 2. Cost of Goods Sold (COGS / HPP)
        $cogs = (float) SaleItem::join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.store_id', $storeId)
            ->where('sales.status', 'completed')
            ->whereDate('sales.created_at', '>=', $dateFrom)
            ->whereDate('sales.created_at', '<=', $dateTo)
            ->sum(DB::raw('sale_items.quantity * products.cost_price'));

        // 3. Gross Profit
        $grossProfit = $netSales - $cogs;
        $grossProfitMargin = $netSales > 0 ? round(($grossProfit / $netSales) * 100, 2) : 0.0;

        // 4. Operating Expenses breakdown by category
        $expensesByCategory = CashTransaction::where('cash_transactions.store_id', $storeId)
            ->where('cash_transactions.type', 'expense')
            ->whereDate('cash_transactions.transaction_date', '>=', $dateFrom)
            ->whereDate('cash_transactions.transaction_date', '<=', $dateTo)
            ->leftJoin('expense_categories', 'cash_transactions.category_id', '=', 'expense_categories.id')
            ->select(
                DB::raw("COALESCE(expense_categories.name, 'Tanpa Kategori') as category_name"),
                DB::raw('SUM(cash_transactions.amount) as total_amount'),
                DB::raw('COUNT(cash_transactions.id) as count')
            )
            ->groupBy('category_name')
            ->orderByDesc('total_amount')
            ->get()
            ->map(fn ($row) => [
                'category_name' => $row->category_name,
                'total_amount' => (float) $row->total_amount,
                'count' => (int) $row->count,
            ]);

        $totalOperatingExpenses = (float) $expensesByCategory->sum('total_amount');

        // 5. Other Income
        $totalOtherIncome = (float) CashTransaction::where('store_id', $storeId)
            ->where('type', 'income')
            ->whereDate('transaction_date', '>=', $dateFrom)
            ->whereDate('transaction_date', '<=', $dateTo)
            ->sum('amount');

        // 6. Net Profit
        $netProfit = $grossProfit - $totalOperatingExpenses + $totalOtherIncome;
        $netProfitMargin = $netSales > 0 ? round(($netProfit / $netSales) * 100, 2) : 0.0;

        return response()->json([
            'success' => true,
            'period' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'data' => [
                'revenue' => [
                    'gross_sales' => $grossSales,
                    'sales_discount' => $salesDiscount,
                    'net_sales' => $netSales,
                    'transactions_count' => $completedTransactionsCount,
                ],
                'cogs' => [
                    'total_cogs' => $cogs,
                ],
                'gross_profit' => [
                    'amount' => $grossProfit,
                    'margin_percentage' => $grossProfitMargin,
                ],
                'operating_expenses' => [
                    'total' => $totalOperatingExpenses,
                    'categories' => $expensesByCategory,
                ],
                'other_income' => [
                    'total' => $totalOtherIncome,
                ],
                'net_profit' => [
                    'amount' => $netProfit,
                    'margin_percentage' => $netProfitMargin,
                ],
            ],
        ]);
    }

    public function cashFlow(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());

        // Cash Inflow:
        // 1. Sales revenue (paid amount from completed sales)
        $salesInflow = (float) Sale::where('store_id', $storeId)
            ->where('status', 'completed')
            ->whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo)
            ->sum('total_amount');

        // 2. Other Cash Incomes
        $otherIncomeInflow = (float) CashTransaction::where('store_id', $storeId)
            ->where('type', 'income')
            ->whereDate('transaction_date', '>=', $dateFrom)
            ->whereDate('transaction_date', '<=', $dateTo)
            ->sum('amount');

        $totalInflow = $salesInflow + $otherIncomeInflow;

        // Cash Outflow:
        // 1. Purchases paid amount
        $purchasesOutflow = (float) Purchase::where('store_id', $storeId)
            ->where('status', '!=', 'cancelled')
            ->whereDate('purchase_date', '>=', $dateFrom)
            ->whereDate('purchase_date', '<=', $dateTo)
            ->sum('paid_amount');

        // 2. Operating Expenses
        $expensesOutflow = (float) CashTransaction::where('store_id', $storeId)
            ->where('type', 'expense')
            ->whereDate('transaction_date', '>=', $dateFrom)
            ->whereDate('transaction_date', '<=', $dateTo)
            ->sum('amount');

        $totalOutflow = $purchasesOutflow + $expensesOutflow;
        $netCashFlow = $totalInflow - $totalOutflow;

        // Current Liquid Balances
        $accounts = FinancialAccount::where('store_id', $storeId)
            ->where('is_active', true)
            ->get(['id', 'name', 'account_type', 'current_balance']);

        return response()->json([
            'success' => true,
            'period' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'data' => [
                'inflow' => [
                    'sales' => $salesInflow,
                    'other_income' => $otherIncomeInflow,
                    'total' => $totalInflow,
                ],
                'outflow' => [
                    'purchases' => $purchasesOutflow,
                    'operating_expenses' => $expensesOutflow,
                    'total' => $totalOutflow,
                ],
                'net_cash_flow' => $netCashFlow,
                'accounts' => $accounts,
                'total_liquid_assets' => (float) $accounts->sum('current_balance'),
            ],
        ]);
    }

    public function salesAnalytics(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $dateFrom = $request->input('date_from', Carbon::now()->subDays(29)->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->toDateString());

        // Daily trend
        $dailyTrend = Sale::where('store_id', $storeId)
            ->where('status', 'completed')
            ->whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo)
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total_amount) as total_sales'),
                DB::raw('COUNT(id) as transaction_count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => [
                'date' => $row->date,
                'total_sales' => (float) $row->total_sales,
                'transaction_count' => (int) $row->transaction_count,
            ]);

        // Payment Methods Breakdown
        $paymentMethods = Sale::where('store_id', $storeId)
            ->where('status', 'completed')
            ->whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo)
            ->select(
                'payment_method',
                DB::raw('SUM(total_amount) as total_amount'),
                DB::raw('COUNT(id) as count')
            )
            ->groupBy('payment_method')
            ->orderByDesc('total_amount')
            ->get()
            ->map(fn ($row) => [
                'method' => $row->payment_method,
                'total_amount' => (float) $row->total_amount,
                'count' => (int) $row->count,
            ]);

        // Top 10 Best Selling Products
        $topProducts = SaleItem::join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.store_id', $storeId)
            ->where('sales.status', 'completed')
            ->whereDate('sales.created_at', '>=', $dateFrom)
            ->whereDate('sales.created_at', '<=', $dateTo)
            ->select(
                'products.id',
                'products.name',
                'products.sku',
                'products.unit',
                DB::raw('SUM(sale_items.quantity) as total_quantity'),
                DB::raw('SUM(sale_items.total_amount) as total_revenue'),
                DB::raw('SUM(sale_items.total_amount - (sale_items.quantity * products.cost_price)) as estimated_profit')
            )
            ->groupBy('products.id', 'products.name', 'products.sku', 'products.unit')
            ->orderByDesc('total_quantity')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'id' => $row->id,
                'name' => $row->name,
                'sku' => $row->sku,
                'unit' => $row->unit,
                'total_quantity' => (int) $row->total_quantity,
                'total_revenue' => (float) $row->total_revenue,
                'estimated_profit' => (float) $row->estimated_profit,
            ]);

        return response()->json([
            'success' => true,
            'period' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'data' => [
                'daily_trend' => $dailyTrend,
                'payment_methods' => $paymentMethods,
                'top_products' => $topProducts,
            ],
        ]);
    }

    public function inventoryValuation(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $products = Product::where('store_id', $storeId)
            ->with('category:id,name')
            ->get();

        $totalItemsCount = $products->count();
        $totalStockUnits = $products->sum('stock');
        $totalCostValue = (float) $products->sum(fn ($p) => $p->stock * (float) $p->cost_price);
        $totalSalesValue = (float) $products->sum(fn ($p) => $p->stock * (float) $p->selling_price);
        $potentialProfit = $totalSalesValue - $totalCostValue;

        $lowStockCount = $products->filter(fn ($p) => $p->stock > 0 && $p->stock <= $p->min_stock)->count();
        $outOfStockCount = $products->filter(fn ($p) => $p->stock <= 0)->count();

        // Group by category
        $byCategory = $products->groupBy(fn ($p) => $p->category?->name ?? 'Tanpa Kategori')
            ->map(function ($items, $categoryName) {
                $units = $items->sum('stock');
                $costVal = (float) $items->sum(fn ($p) => $p->stock * (float) $p->cost_price);
                $saleVal = (float) $items->sum(fn ($p) => $p->stock * (float) $p->selling_price);
                return [
                    'category_name' => $categoryName,
                    'items_count' => $items->count(),
                    'stock_units' => $units,
                    'cost_value' => $costVal,
                    'sales_value' => $saleVal,
                    'potential_profit' => $saleVal - $costVal,
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'total_products_count' => $totalItemsCount,
                    'total_stock_units' => $totalStockUnits,
                    'total_cost_value' => $totalCostValue,
                    'total_sales_value' => $totalSalesValue,
                    'potential_profit' => $potentialProfit,
                    'low_stock_count' => $lowStockCount,
                    'out_of_stock_count' => $outOfStockCount,
                ],
                'by_category' => $byCategory,
            ],
        ]);
    }
}
