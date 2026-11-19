<?php

use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PosController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\StoreSettingController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\TransactionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public routes
Route::get('/public/company-profile', [StoreSettingController::class, 'getPublicProfile']);

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

// POS & Transactions (Accessible by Owner and Employee)
Route::middleware(['auth:sanctum', 'role:owner,employee'])->group(function () {
    Route::prefix('pos')->group(function () {
        Route::get('/categories', [PosController::class, 'categories']);
        Route::get('/products', [PosController::class, 'products']);
        Route::post('/checkout', [PosController::class, 'checkout']);
        Route::get('/ping', function (Request $request) {
            return response()->json([
                'success' => true,
                'message' => 'POS access granted',
                'user' => $request->user()->only('id', 'name', 'role'),
            ]);
        });
    });

    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::get('/transactions/{id}', [TransactionController::class, 'show']);
    Route::get('/employee/dashboard-stats', [DashboardController::class, 'employeeStats']);

    // Activity Logs & Audit Trail (Accessible by Owner & Employee with strict controller-level RBAC)
    Route::prefix('activity-logs')->group(function () {
        Route::get('/', [AuditLogController::class, 'index']);
        Route::get('/modules', [AuditLogController::class, 'modules']);
        Route::get('/actions', [AuditLogController::class, 'actions']);
        Route::get('/users', [AuditLogController::class, 'users']);
        Route::get('/{id}', [AuditLogController::class, 'show']);
    });
    // Backward compatibility for /audit-logs
    Route::get('/audit-logs', [AuditLogController::class, 'index']);
    Route::get('/audit-logs/actions', [AuditLogController::class, 'actions']);

    // Notifications (Accessible by Owner & Employee with user/store scoping)
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::delete('/{id}', [NotificationController::class, 'destroy']);
    });
});

// Owner Only Modules (Products, Categories, Inventory, Admin Controls)
Route::middleware(['auth:sanctum', 'role:owner'])->group(function () {
    // Categories CRUD
    Route::apiResource('categories', CategoryController::class)->except(['create', 'edit']);

    // Products CRUD
    Route::apiResource('products', ProductController::class)->except(['create', 'edit']);

    // Inventory & Stock Opname / Movements
    Route::prefix('inventory')->group(function () {
        Route::get('/summary', [InventoryController::class, 'summary']);
        Route::get('/{productId}/movements', [InventoryController::class, 'movements']);
        Route::post('/adjust', [InventoryController::class, 'adjust']);
    });

    // Transactions Cancel
    Route::post('/transactions/{id}/cancel', [TransactionController::class, 'cancel']);

    // Suppliers & Customers CRUD
    Route::apiResource('suppliers', SupplierController::class)->except(['create', 'edit']);
    Route::apiResource('customers', CustomerController::class)->except(['create', 'edit']);

    // Purchases & Payables
    Route::apiResource('purchases', PurchaseController::class)->except(['create', 'edit']);
    Route::post('/purchases/{id}/receive', [PurchaseController::class, 'receive']);
    Route::post('/purchases/{id}/cancel', [PurchaseController::class, 'cancel']);
    Route::post('/payables/{id}/pay', [PurchaseController::class, 'payPayable']);

    // Finance & Cash Flow (Phase 5)
    Route::prefix('finance')->group(function () {
        // Accounts
        Route::get('/accounts', [FinanceController::class, 'getAccounts']);
        Route::post('/accounts', [FinanceController::class, 'storeAccount']);
        Route::put('/accounts/{id}', [FinanceController::class, 'updateAccount']);
        Route::delete('/accounts/{id}', [FinanceController::class, 'destroyAccount']);

        // Expense Categories
        Route::get('/categories', [FinanceController::class, 'getCategories']);
        Route::post('/categories', [FinanceController::class, 'storeCategory']);
        Route::put('/categories/{id}', [FinanceController::class, 'updateCategory']);
        Route::delete('/categories/{id}', [FinanceController::class, 'destroyCategory']);

        // Cash Transactions (Expense / Income / Transfer)
        Route::get('/transactions', [FinanceController::class, 'getTransactions']);
        Route::post('/transactions', [FinanceController::class, 'storeTransaction']);
        Route::delete('/transactions/{id}', [FinanceController::class, 'destroyTransaction']);
    });

    // Business Reports & Analytics (Phase 5)
    Route::prefix('reports')->group(function () {
        Route::get('/profit-loss', [ReportController::class, 'profitLoss']);
        Route::get('/cash-flow', [ReportController::class, 'cashFlow']);
        Route::get('/sales-analytics', [ReportController::class, 'salesAnalytics']);
        Route::get('/inventory-valuation', [ReportController::class, 'inventoryValuation']);
    });

    // Employee Management & Security (Phase 6)
    Route::apiResource('employees', EmployeeController::class)->except(['create', 'edit']);
    Route::post('/employees/{id}/change-password', [EmployeeController::class, 'changePassword']);

    // Store Settings & Receipt Profile (Phase 6)
    Route::get('/settings/store', [StoreSettingController::class, 'getSettings']);
    Route::put('/settings/store', [StoreSettingController::class, 'updateSettings']);

    // Owner Dashboard & Admin Ping
    Route::prefix('owner')->group(function () {
        Route::get('/dashboard-stats', [DashboardController::class, 'stats']);
        Route::get('/ping', function (Request $request) {
            return response()->json([
                'success' => true,
                'message' => 'Owner access granted',
                'user' => $request->user()->only('id', 'name', 'role'),
            ]);
        });
    });
});
