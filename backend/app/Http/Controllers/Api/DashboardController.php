<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\CashTransaction;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Executive Business Dashboard Stats for Store Owner.
     */
    public function stats(Request $request): JsonResponse
    {
        $storeId = (int) $request->user()->store_id;
        $period = (string) $request->query('period', '7days');

        $dates = $this->resolvePeriodDates($period);
        $today = now()->toDateString();

        $sales = $this->getPeriodSales($storeId, $dates['start_date'], $dates['end_date']);
        $todaySales = $this->getPeriodSales($storeId, $today, $today);
        $profit = $this->getPeriodGrossProfit($storeId, $dates['start_date'], $dates['end_date'], $sales['amount']);
        $growth = $this->getPreviousGrowth($storeId, $dates['prev_start_date'], $dates['prev_end_date'], $sales['amount'], $sales['count']);
        $expenses = $this->getPeriodExpenses($storeId, $dates['start_date'], $dates['end_date']);
        $inventory = $this->getInventorySummary($storeId);
        $recentTransactions = $this->getRecentTransactions($storeId);
        $topProducts = $this->getTopProducts($storeId, $dates['start_date'], $dates['end_date']);
        $employeePerf = $this->getEmployeePerformance($storeId, $dates['start_date'], $dates['end_date']);
        $chartRevenue = $this->getChartRevenue($storeId, $dates['start_date'], $dates['end_date'], $dates['num_days'], $period);
        $paymentMethods = $this->getPaymentMethods($storeId, $dates['start_date'], $dates['end_date']);
        $categorySales = $this->getCategorySales($storeId, $dates['start_date'], $dates['end_date']);
        $activities = $this->getRecentActivities($storeId);
        $monthlySummary = $this->getMonthlySummary($storeId);

        return response()->json([
            'success' => true,
            'data' => [
                // Preserved keys for backward compatibility
                'today_sales_amount'        => $todaySales['amount'],
                'today_sales_count'         => $todaySales['count'],
                'estimated_gross_profit'    => $profit['profit'],
                'low_stock_count'           => $inventory['low_stock_count'],
                'recent_transactions'       => $recentTransactions,
                'top_products'              => $topProducts,
                'employee_performance'      => $employeePerf,
                'weekly_revenue'            => $chartRevenue,
                'monthly_summary'           => $monthlySummary,

                // Enhanced CRM Dashboard v2 metrics
                'period'                    => $period,
                'period_label'              => $dates['label'],
                'period_sales_amount'       => $sales['amount'],
                'period_sales_count'        => $sales['count'],
                'average_order_value'       => $sales['aov'],
                'period_expense_amount'     => $expenses,
                'profit_margin_percent'     => $profit['margin_percent'],
                'revenue_growth_percent'    => $growth['revenue_growth'],
                'transactions_growth_percent'=> $growth['transactions_growth'],
                'inventory_summary'         => $inventory,
                'payment_methods'           => $paymentMethods,
                'category_sales'            => $categorySales,
                'recent_activities'         => $activities,
            ],
        ]);
    }

    /**
     * Operational Dashboard Stats for Cashier / Employee.
     */
    public function employeeStats(Request $request): JsonResponse
    {
        $user = $request->user();
        $storeId = (int) $user->store_id;
        $userId = (int) $user->id;
        $today = now()->toDateString();

        $myTodayQuery = Sale::where('store_id', $storeId)
            ->where('user_id', $userId)
            ->where('status', 'completed')
            ->whereDate('created_at', $today);

        $myTodayAmount = (float) (clone $myTodayQuery)->sum('total_amount');
        $myTodayCount  = (int)   (clone $myTodayQuery)->count();
        $myAov = $myTodayCount > 0 ? (float) round($myTodayAmount / $myTodayCount) : 0.0;

        $cashCollected = (float) Sale::where('store_id', $storeId)
            ->where('user_id', $userId)
            ->where('status', 'completed')
            ->whereDate('created_at', $today)
            ->where('payment_method', 'cash')
            ->sum('total_amount');

        $nonCashCollected = (float) Sale::where('store_id', $storeId)
            ->where('user_id', $userId)
            ->where('status', 'completed')
            ->whereDate('created_at', $today)
            ->where('payment_method', '!=', 'cash')
            ->sum('total_amount');

        $recentTransactions = Sale::where('store_id', $storeId)
            ->where('user_id', $userId)
            ->with(['items'])
            ->latest('id')
            ->limit(8)
            ->get();

        $lowStockProducts = Product::where('store_id', $storeId)
            ->where('is_active', true)
            ->whereRaw('stock <= min_stock')
            ->orderBy('stock')
            ->limit(6)
            ->get(['id', 'name', 'stock', 'min_stock', 'unit', 'selling_price']);

        return response()->json([
            'success' => true,
            'data' => [
                'today_sales_amount'  => $myTodayAmount,
                'today_sales_count'   => $myTodayCount,
                'average_order_value' => $myAov,
                'cash_collected'      => $cashCollected,
                'non_cash_collected'  => $nonCashCollected,
                'recent_transactions' => $recentTransactions,
                'low_stock_products'  => $lowStockProducts,
            ],
        ]);
    }

    // ── Private Decomposition Helpers ──

    /**
     * Resolve date ranges and boundaries for period filtering.
     *
     * @return array{start_date: string, end_date: string, prev_start_date: string, prev_end_date: string, num_days: int, label: string}
     */
    private function resolvePeriodDates(string $period): array
    {
        $now = now();
        $today = $now->toDateString();

        switch ($period) {
            case 'today':
                return [
                    'start_date'      => $today,
                    'end_date'        => $today,
                    'prev_start_date' => $now->copy()->subDay()->toDateString(),
                    'prev_end_date'   => $now->copy()->subDay()->toDateString(),
                    'num_days'        => 1,
                    'label'           => 'Hari Ini',
                ];
            case '30days':
                return [
                    'start_date'      => $now->copy()->subDays(29)->toDateString(),
                    'end_date'        => $today,
                    'prev_start_date' => $now->copy()->subDays(59)->toDateString(),
                    'prev_end_date'   => $now->copy()->subDays(30)->toDateString(),
                    'num_days'        => 30,
                    'label'           => '30 Hari Terakhir',
                ];
            case 'this_month':
                return [
                    'start_date'      => $now->copy()->startOfMonth()->toDateString(),
                    'end_date'        => $today,
                    'prev_start_date' => $now->copy()->subMonth()->startOfMonth()->toDateString(),
                    'prev_end_date'   => $now->copy()->subMonth()->endOfMonth()->toDateString(),
                    'num_days'        => $now->day,
                    'label'           => 'Bulan Ini',
                ];
            case '7days':
            default:
                return [
                    'start_date'      => $now->copy()->subDays(6)->toDateString(),
                    'end_date'        => $today,
                    'prev_start_date' => $now->copy()->subDays(13)->toDateString(),
                    'prev_end_date'   => $now->copy()->subDays(7)->toDateString(),
                    'num_days'        => 7,
                    'label'           => '7 Hari Terakhir',
                ];
        }
    }

    /**
     * Compute sales totals and average order value for a date window.
     *
     * @return array{amount: float, count: int, aov: float}
     */
    private function getPeriodSales(int $storeId, string $startDate, string $endDate): array
    {
        $query = Sale::where('store_id', $storeId)
            ->where('status', 'completed')
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate);

        $amount = (float) (clone $query)->sum('total_amount');
        $count  = (int)   (clone $query)->count();
        $aov    = $count > 0 ? (float) round($amount / $count) : 0.0;

        return [
            'amount' => $amount,
            'count'  => $count,
            'aov'    => $aov,
        ];
    }

    /**
     * Compute estimated gross profit and margin percentage.
     *
     * @return array{profit: float, margin_percent: float}
     */
    private function getPeriodGrossProfit(int $storeId, string $startDate, string $endDate, float $salesAmount): array
    {
        $sales = Sale::where('store_id', $storeId)
            ->where('status', 'completed')
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->with('items')
            ->get();

        $cogs = (float) $sales->sum(function ($sale) {
            return $sale->items->sum(function ($item) {
                return (float) $item->cost_price * $item->quantity;
            });
        });

        $profit = max(0.0, $salesAmount - $cogs);
        $marginPercent = $salesAmount > 0
            ? round(($profit / $salesAmount) * 100, 1)
            : 0.0;

        return [
            'profit'         => $profit,
            'margin_percent' => $marginPercent,
        ];
    }

    /**
     * Calculate growth percentages compared with previous period.
     *
     * @return array{revenue_growth: float, transactions_growth: float}
     */
    private function getPreviousGrowth(
        int $storeId,
        string $prevStartDate,
        string $prevEndDate,
        float $currAmount,
        int $currCount
    ): array {
        $prevAmount = (float) Sale::where('store_id', $storeId)
            ->where('status', 'completed')
            ->whereDate('created_at', '>=', $prevStartDate)
            ->whereDate('created_at', '<=', $prevEndDate)
            ->sum('total_amount');

        $prevCount = (int) Sale::where('store_id', $storeId)
            ->where('status', 'completed')
            ->whereDate('created_at', '>=', $prevStartDate)
            ->whereDate('created_at', '<=', $prevEndDate)
            ->count();

        $revenueGrowth = $prevAmount > 0
            ? round((($currAmount - $prevAmount) / $prevAmount) * 100, 1)
            : ($currAmount > 0 ? 100.0 : 0.0);

        $transactionsGrowth = $prevCount > 0
            ? round((($currCount - $prevCount) / $prevCount) * 100, 1)
            : ($currCount > 0 ? 100.0 : 0.0);

        return [
            'revenue_growth'      => $revenueGrowth,
            'transactions_growth' => $transactionsGrowth,
        ];
    }

    /**
     * Compute total operational expenses for date window.
     */
    private function getPeriodExpenses(int $storeId, string $startDate, string $endDate): float
    {
        return (float) CashTransaction::where('store_id', $storeId)
            ->where('type', 'expense')
            ->whereDate('transaction_date', '>=', $startDate)
            ->whereDate('transaction_date', '<=', $endDate)
            ->sum('amount');
    }

    /**
     * Compute inventory breakdown: total, healthy, low, and out of stock.
     *
     * @return array{total_products: int, healthy_stock_count: int, low_stock_count: int, out_of_stock_count: int}
     */
    private function getInventorySummary(int $storeId): array
    {
        $totalProducts = Product::where('store_id', $storeId)->where('is_active', true)->count();
        $lowStockCount = Product::where('store_id', $storeId)
            ->where('is_active', true)
            ->whereRaw('stock <= min_stock AND stock > 0')
            ->count();
        $outOfStockCount = Product::where('store_id', $storeId)
            ->where('is_active', true)
            ->where('stock', '<=', 0)
            ->count();
        $healthyStockCount = max(0, $totalProducts - $lowStockCount - $outOfStockCount);

        return [
            'total_products'      => $totalProducts,
            'healthy_stock_count' => $healthyStockCount,
            'low_stock_count'     => $lowStockCount,
            'out_of_stock_count'  => $outOfStockCount,
        ];
    }

    /**
     * Get recent transactions with items and cashier relation.
     */
    private function getRecentTransactions(int $storeId)
    {
        return Sale::where('store_id', $storeId)
            ->with(['cashier:id,name', 'items'])
            ->latest('id')
            ->limit(6)
            ->get();
    }

    /**
     * Compute top products by revenue.
     */
    private function getTopProducts(int $storeId, string $startDate, string $endDate): array
    {
        return DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.store_id', $storeId)
            ->where('sales.status', 'completed')
            ->whereDate('sales.created_at', '>=', $startDate)
            ->whereDate('sales.created_at', '<=', $endDate)
            ->select(
                'sale_items.product_name',
                DB::raw('SUM(sale_items.quantity) as total_qty'),
                DB::raw('SUM(sale_items.total_amount) as total_revenue')
            )
            ->groupBy('sale_items.product_name')
            ->orderByDesc('total_revenue')
            ->limit(5)
            ->get()
            ->map(function ($row) {
                return [
                    'product_name'  => $row->product_name,
                    'total_qty'     => (int) $row->total_qty,
                    'total_revenue' => (float) $row->total_revenue,
                ];
            })
            ->toArray();
    }

    /**
     * Compute cashier / employee leaderboard.
     */
    private function getEmployeePerformance(int $storeId, string $startDate, string $endDate): array
    {
        return DB::table('sales')
            ->join('users', 'sales.user_id', '=', 'users.id')
            ->where('sales.store_id', $storeId)
            ->where('sales.status', 'completed')
            ->whereDate('sales.created_at', '>=', $startDate)
            ->whereDate('sales.created_at', '<=', $endDate)
            ->select(
                'users.name as cashier_name',
                DB::raw('COUNT(sales.id) as sales_count'),
                DB::raw('SUM(sales.total_amount) as total_amount')
            )
            ->groupBy('sales.user_id', 'users.name')
            ->orderByDesc('total_amount')
            ->limit(5)
            ->get()
            ->map(function ($row) {
                return [
                    'cashier_name' => $row->cashier_name,
                    'sales_count'  => (int) $row->sales_count,
                    'total_amount' => (float) $row->total_amount,
                ];
            })
            ->toArray();
    }

    /**
     * Compute daily chart revenue and profit.
     */
    private function getChartRevenue(
        int $storeId,
        string $startDate,
        string $endDate,
        int $numDays,
        string $period
    ): array {
        $now = now();
        $today = $now->toDateString();

        $chartRaw = DB::table('sales')
            ->join('sale_items', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.store_id', $storeId)
            ->where('sales.status', 'completed')
            ->whereDate('sales.created_at', '>=', $startDate)
            ->whereDate('sales.created_at', '<=', $endDate)
            ->select(
                DB::raw('DATE(sales.created_at) as date'),
                DB::raw('SUM(sales.total_amount) as revenue'),
                DB::raw('SUM(sale_items.total_amount - sale_items.cost_price * sale_items.quantity) as profit')
            )
            ->groupBy(DB::raw('DATE(sales.created_at)'))
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $result = [];
        for ($i = $numDays - 1; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i)->toDateString();
            if ($period === 'this_month') {
                $dayNum = $numDays - $i;
                $date = $now->copy()->startOfMonth()->addDays($dayNum - 1)->toDateString();
                if ($date > $today) break;
            }
            $row = $chartRaw->get($date);
            $result[] = [
                'date'    => $date,
                'revenue' => $row ? (float) $row->revenue : 0.0,
                'profit'  => $row ? (float) max(0.0, $row->profit) : 0.0,
            ];
        }

        return $result;
    }

    /**
     * Compute distribution of payment methods.
     */
    private function getPaymentMethods(int $storeId, string $startDate, string $endDate): array
    {
        $raw = DB::table('sales')
            ->where('store_id', $storeId)
            ->where('status', 'completed')
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->select('payment_method', DB::raw('COUNT(*) as count'), DB::raw('SUM(total_amount) as amount'))
            ->groupBy('payment_method')
            ->get();

        $totalCount = $raw->sum('count');
        $labelMap = [
            'cash'          => 'Tunai',
            'qris'          => 'QRIS',
            'bank_transfer' => 'Transfer Bank',
            'debit'         => 'Kartu Debit',
            'credit'        => 'Kartu Kredit',
        ];

        return $raw->map(function ($pm) use ($totalCount, $labelMap) {
            return [
                'method'     => $pm->payment_method,
                'label'      => $labelMap[$pm->payment_method] ?? ucfirst($pm->payment_method),
                'count'      => (int) $pm->count,
                'amount'     => (float) $pm->amount,
                'percentage' => $totalCount > 0 ? round(($pm->count / $totalCount) * 100, 1) : 0.0,
            ];
        })->toArray();
    }

    /**
     * Compute category sales breakdown.
     */
    private function getCategorySales(int $storeId, string $startDate, string $endDate): array
    {
        return DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->leftJoin('products', 'sale_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->where('sales.store_id', $storeId)
            ->where('sales.status', 'completed')
            ->whereDate('sales.created_at', '>=', $startDate)
            ->whereDate('sales.created_at', '<=', $endDate)
            ->select(
                DB::raw('COALESCE(categories.name, "Umum") as category_name'),
                DB::raw('SUM(sale_items.quantity) as total_qty'),
                DB::raw('SUM(sale_items.total_amount) as total_revenue')
            )
            ->groupBy(DB::raw('COALESCE(categories.name, "Umum")'))
            ->orderByDesc('total_revenue')
            ->limit(5)
            ->get()
            ->toArray();
    }

    /**
     * Fetch recent business activity stream.
     */
    private function getRecentActivities(int $storeId): array
    {
        $activities = [];
        $auditLogs = AuditLog::where('store_id', $storeId)->latest('id')->limit(8)->get();

        if ($auditLogs->isNotEmpty()) {
            foreach ($auditLogs as $log) {
                $activities[] = [
                    'id'          => 'log-' . $log->id,
                    'type'        => $log->action,
                    'user_name'   => $log->user_name,
                    'title'       => ucwords(str_replace('_', ' ', $log->action)),
                    'description' => $log->description,
                    'created_at'  => $log->created_at ? $log->created_at->toIso8601String() : null,
                ];
            }
        } else {
            // Real activities synthesized from recent sales
            $recentSales = Sale::where('store_id', $storeId)
                ->with('cashier:id,name')
                ->latest('id')
                ->limit(5)
                ->get();
            foreach ($recentSales as $s) {
                $activities[] = [
                    'id'          => 'sale-' . $s->id,
                    'type'        => 'sale',
                    'user_name'   => $s->cashier->name ?? 'Kasir',
                    'title'       => 'Transaksi Penjualan',
                    'description' => 'Invoice #' . $s->invoice_number . ' senilai Rp ' . number_format((float) $s->total_amount, 0, ',', '.'),
                    'created_at'  => $s->created_at ? $s->created_at->toIso8601String() : null,
                ];
            }

            // Real activities synthesized from recent purchases
            $recentPurchases = Purchase::where('store_id', $storeId)
                ->with('supplier:id,name')
                ->latest('id')
                ->limit(3)
                ->get();
            foreach ($recentPurchases as $p) {
                $activities[] = [
                    'id'          => 'purchase-' . $p->id,
                    'type'        => 'purchase',
                    'user_name'   => 'Owner',
                    'title'       => 'Pencatatan Pembelian Stok',
                    'description' => 'PO #' . $p->purchase_number . ' dari ' . ($p->supplier->name ?? 'Supplier'),
                    'created_at'  => $p->created_at ? $p->created_at->toIso8601String() : null,
                ];
            }
        }

        // Sort by timestamp descending
        usort($activities, function ($a, $b) {
            return strcmp($b['created_at'] ?? '', $a['created_at'] ?? '');
        });

        return array_values($activities);
    }

    /**
     * Compute monthly summary for backward compatibility.
     *
     * @return array{this_month_revenue: float, last_month_revenue: float, growth_percent: float}
     */
    private function getMonthlySummary(int $storeId): array
    {
        $thisMonthStart = now()->startOfMonth()->toDateString();
        $lastMonthStart = now()->subMonth()->startOfMonth()->toDateString();
        $lastMonthEnd = now()->subMonth()->endOfMonth()->toDateString();

        $thisMonthRevenue = (float) Sale::where('store_id', $storeId)
            ->where('status', 'completed')
            ->whereDate('created_at', '>=', $thisMonthStart)
            ->sum('total_amount');

        $lastMonthRevenue = (float) Sale::where('store_id', $storeId)
            ->where('status', 'completed')
            ->whereDate('created_at', '>=', $lastMonthStart)
            ->whereDate('created_at', '<=', $lastMonthEnd)
            ->sum('total_amount');

        $growthPercent = $lastMonthRevenue > 0
            ? round((($thisMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 2)
            : ($thisMonthRevenue > 0 ? 100.0 : 0.0);

        return [
            'this_month_revenue' => $thisMonthRevenue,
            'last_month_revenue' => $lastMonthRevenue,
            'growth_percent'     => $growthPercent,
        ];
    }
}
