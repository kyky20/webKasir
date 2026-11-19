<?php

namespace Tests\Feature;

use App\Models\CashTransaction;
use App\Models\ExpenseCategory;
use App\Models\FinancialAccount;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FinanceReportTest extends TestCase
{
    use RefreshDatabase;

    private Store $store;
    private User $owner;
    private User $employee;
    private FinancialAccount $cashAccount;
    private FinancialAccount $bankAccount;
    private ExpenseCategory $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Store::create([
            'name' => 'Toko Kasirku Test Phase 5',
            'currency' => 'IDR',
            'timezone' => 'Asia/Jakarta',
            'tax_percentage' => 0.00,
        ]);

        $this->owner = User::create([
            'store_id' => $this->store->id,
            'name' => 'Owner Phase 5',
            'username' => 'ownerp5',
            'email' => 'ownerp5@test.local',
            'password' => Hash::make('password123'),
            'role' => 'owner',
            'status' => 'active',
        ]);

        $this->employee = User::create([
            'store_id' => $this->store->id,
            'name' => 'Kasir Phase 5',
            'username' => 'kasirp5',
            'email' => 'kasirp5@test.local',
            'password' => Hash::make('password123'),
            'role' => 'employee',
            'status' => 'active',
        ]);

        $this->cashAccount = FinancialAccount::create([
            'store_id' => $this->store->id,
            'name' => 'Kas Toko',
            'account_type' => 'cash',
            'initial_balance' => 1000000.00,
            'current_balance' => 1000000.00,
            'is_active' => true,
        ]);

        $this->bankAccount = FinancialAccount::create([
            'store_id' => $this->store->id,
            'name' => 'Bank BCA',
            'account_type' => 'bank',
            'account_number' => '1234567890',
            'initial_balance' => 5000000.00,
            'current_balance' => 5000000.00,
            'is_active' => true,
        ]);

        $this->category = ExpenseCategory::create([
            'store_id' => $this->store->id,
            'name' => 'Listrik & Utilitas',
            'is_active' => true,
        ]);
    }

    public function test_owner_can_manage_financial_accounts(): void
    {
        Sanctum::actingAs($this->owner);

        // Create
        $response = $this->postJson('/api/finance/accounts', [
            'name' => 'Kas Kecil Cabang',
            'account_type' => 'cash',
            'initial_balance' => 200000,
            'notes' => 'Kas operasional kecil',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Kas Kecil Cabang')
            ->assertJsonPath('data.current_balance', '200000.00');

        $accId = $response->json('data.id');

        // Read list
        $this->getJson('/api/finance/accounts')
            ->assertStatus(200)
            ->assertJsonPath('summary.active_accounts_count', 3);

        // Update
        $this->putJson("/api/finance/accounts/{$accId}", [
            'name' => 'Kas Kecil Renamed',
            'account_type' => 'cash',
        ])->assertStatus(200)
            ->assertJsonPath('data.name', 'Kas Kecil Renamed');

        // Delete
        $this->deleteJson("/api/finance/accounts/{$accId}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('financial_accounts', ['id' => $accId]);
    }

    public function test_owner_can_manage_expense_categories(): void
    {
        Sanctum::actingAs($this->owner);

        // Create
        $res = $this->postJson('/api/finance/categories', [
            'name' => 'Gaji Karyawan',
            'description' => 'Upah bulanan staf kasir',
        ]);

        $res->assertStatus(201)
            ->assertJsonPath('data.name', 'Gaji Karyawan');

        $catId = $res->json('data.id');

        // Read list
        $this->getJson('/api/finance/categories')
            ->assertStatus(200)
            ->assertJsonFragment(['name' => 'Gaji Karyawan']);

        // Delete
        $this->deleteJson("/api/finance/categories/{$catId}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('expense_categories', ['id' => $catId]);
    }

    public function test_owner_can_record_expense_and_deducts_account_balance(): void
    {
        Sanctum::actingAs($this->owner);

        $initialBalance = (float) $this->cashAccount->current_balance; // 1,000,000

        $res = $this->postJson('/api/finance/transactions', [
            'type' => 'expense',
            'account_id' => $this->cashAccount->id,
            'category_id' => $this->category->id,
            'transaction_date' => now()->format('Y-m-d'),
            'amount' => 150000,
            'recipient_payer' => 'PLN Token',
            'notes' => 'Beli token listrik toko',
        ]);

        $res->assertStatus(201)
            ->assertJsonPath('data.type', 'expense')
            ->assertJsonPath('data.amount', '150000.00');

        // Verify account balance deducted (1,000,000 - 150,000 = 850,000)
        $this->assertEquals(850000.00, (float) $this->cashAccount->fresh()->current_balance);
    }

    public function test_owner_can_record_income_and_increases_account_balance(): void
    {
        Sanctum::actingAs($this->owner);

        $initialBalance = (float) $this->bankAccount->current_balance; // 5,000,000

        $res = $this->postJson('/api/finance/transactions', [
            'type' => 'income',
            'account_id' => $this->bankAccount->id,
            'transaction_date' => now()->format('Y-m-d'),
            'amount' => 500000,
            'recipient_payer' => 'Hadiah Promosi Distributor',
            'notes' => 'Bonus target penjualan',
        ]);

        $res->assertStatus(201)
            ->assertJsonPath('data.type', 'income');

        // Verify account balance increased (5,000,000 + 500,000 = 5,500,000)
        $this->assertEquals(5500000.00, (float) $this->bankAccount->fresh()->current_balance);
    }

    public function test_owner_can_record_transfer_between_accounts(): void
    {
        Sanctum::actingAs($this->owner);

        // Transfer 300,000 from Bank BCA to Kas Toko
        $res = $this->postJson('/api/finance/transactions', [
            'type' => 'transfer',
            'account_id' => $this->bankAccount->id,
            'to_account_id' => $this->cashAccount->id,
            'transaction_date' => now()->format('Y-m-d'),
            'amount' => 300000,
            'notes' => 'Tarik tunai untuk laci kasir',
        ]);

        $res->assertStatus(201)
            ->assertJsonPath('data.type', 'transfer');

        // Bank balance: 5,000,000 - 300,000 = 4,700,000
        $this->assertEquals(4700000.00, (float) $this->bankAccount->fresh()->current_balance);
        // Cash balance: 1,000,000 + 300,000 = 1,300,000
        $this->assertEquals(1300000.00, (float) $this->cashAccount->fresh()->current_balance);
    }

    public function test_owner_can_delete_transaction_and_reverses_balance(): void
    {
        Sanctum::actingAs($this->owner);

        // Record expense 100,000
        $res = $this->postJson('/api/finance/transactions', [
            'type' => 'expense',
            'account_id' => $this->cashAccount->id,
            'transaction_date' => now()->format('Y-m-d'),
            'amount' => 100000,
        ]);
        $trxId = $res->json('data.id');
        $this->assertEquals(900000.00, (float) $this->cashAccount->fresh()->current_balance);

        // Void/delete transaction
        $delRes = $this->deleteJson("/api/finance/transactions/{$trxId}");
        $delRes->assertStatus(200);

        // Balance restored back to 1,000,000
        $this->assertEquals(1000000.00, (float) $this->cashAccount->fresh()->current_balance);
        $this->assertDatabaseMissing('cash_transactions', ['id' => $trxId]);
    }

    public function test_employee_is_forbidden_from_finance_and_reports(): void
    {
        Sanctum::actingAs($this->employee);

        $this->getJson('/api/finance/accounts')->assertStatus(403);
        $this->postJson('/api/finance/transactions', [])->assertStatus(403);
        $this->getJson('/api/reports/profit-loss')->assertStatus(403);
        $this->getJson('/api/reports/cash-flow')->assertStatus(403);
        $this->getJson('/api/reports/sales-analytics')->assertStatus(403);
        $this->getJson('/api/reports/inventory-valuation')->assertStatus(403);
    }

    public function test_profit_loss_report_calculates_correctly(): void
    {
        Sanctum::actingAs($this->owner);

        // 1. Create a product with cost 20,000 and price 35,000
        $product = Product::create([
            'store_id' => $this->store->id,
            'name' => 'Snack Premium',
            'sku' => 'SNK-01',
            'cost_price' => 20000.00,
            'selling_price' => 35000.00,
            'stock' => 50,
            'is_active' => true,
        ]);

        // 2. Create completed sale of 2 items (Revenue: 70,000, COGS: 40,000, Gross Profit: 30,000)
        $sale = Sale::create([
            'store_id' => $this->store->id,
            'user_id' => $this->owner->id,
            'invoice_number' => 'INV-TEST-001',
            'status' => 'completed',
            'subtotal' => 70000.00,
            'discount_amount' => 0.00,
            'tax_amount' => 0.00,
            'total_amount' => 70000.00,
            'paid_amount' => 70000.00,
            'change_amount' => 0.00,
            'payment_method' => 'cash',
        ]);

        SaleItem::create([
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_sku' => $product->sku,
            'unit_price' => 35000.00,
            'quantity' => 2,
            'subtotal' => 70000.00,
            'discount_amount' => 0.00,
            'tax_amount' => 0.00,
            'total_amount' => 70000.00,
        ]);

        // 3. Record expense of 10,000
        $this->postJson('/api/finance/transactions', [
            'type' => 'expense',
            'account_id' => $this->cashAccount->id,
            'category_id' => $this->category->id,
            'transaction_date' => now()->format('Y-m-d'),
            'amount' => 10000,
            'notes' => 'Beli lakban packing',
        ]);

        // 4. Query P&L report
        $res = $this->getJson('/api/reports/profit-loss?date_from=' . now()->subDay()->toDateString() . '&date_to=' . now()->addDay()->toDateString());

        $res->assertStatus(200)
            ->assertJsonPath('data.revenue.net_sales', 70000)
            ->assertJsonPath('data.cogs.total_cogs', 40000)
            ->assertJsonPath('data.gross_profit.amount', 30000)
            ->assertJsonPath('data.operating_expenses.total', 10000)
            ->assertJsonPath('data.net_profit.amount', 20000); // 30,000 - 10,000 = 20,000
    }

    public function test_cash_flow_and_inventory_valuation_reports(): void
    {
        Sanctum::actingAs($this->owner);

        // Product in stock
        Product::create([
            'store_id' => $this->store->id,
            'name' => 'Barang Valuasi',
            'sku' => 'VAL-01',
            'cost_price' => 10000.00,
            'selling_price' => 15000.00,
            'stock' => 10,
            'is_active' => true,
        ]);

        // Cash flow report
        $cfRes = $this->getJson('/api/reports/cash-flow');
        $cfRes->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'inflow',
                    'outflow',
                    'net_cash_flow',
                    'accounts',
                    'total_liquid_assets',
                ],
            ]);

        // Inventory valuation report
        $ivRes = $this->getJson('/api/reports/inventory-valuation');
        $ivRes->assertStatus(200)
            ->assertJsonPath('data.summary.total_cost_value', 100000) // 10 * 10,000 = 100,000
            ->assertJsonPath('data.summary.total_sales_value', 150000) // 10 * 15,000 = 150,000
            ->assertJsonPath('data.summary.potential_profit', 50000);
    }
}
