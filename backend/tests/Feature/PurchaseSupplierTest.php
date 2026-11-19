<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Payable;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\StockMovement;
use App\Models\Store;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PurchaseSupplierTest extends TestCase
{
    use RefreshDatabase;

    private Store $store;
    private User $owner;
    private User $employee;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Store::create([
            'name' => 'Toko Kasirku Test Phase 4',
            'currency' => 'IDR',
            'timezone' => 'Asia/Jakarta',
            'tax_percentage' => 0.00,
        ]);

        $this->owner = User::create([
            'store_id' => $this->store->id,
            'name' => 'Owner Phase 4',
            'username' => 'ownerp4',
            'email' => 'ownerp4@test.local',
            'password' => Hash::make('password123'),
            'role' => 'owner',
            'status' => 'active',
        ]);

        $this->employee = User::create([
            'store_id' => $this->store->id,
            'name' => 'Kasir Phase 4',
            'username' => 'kasirp4',
            'email' => 'kasirp4@test.local',
            'password' => Hash::make('password123'),
            'role' => 'employee',
            'status' => 'active',
        ]);

        $this->product = Product::create([
            'store_id' => $this->store->id,
            'name' => 'Kopi Robusta 250g',
            'sku' => 'KPB-001',
            'cost_price' => 20000.00,
            'selling_price' => 35000.00,
            'stock' => 10,
            'min_stock' => 3,
            'unit' => 'pcs',
            'is_active' => true,
        ]);
    }

    public function test_owner_can_crud_supplier(): void
    {
        Sanctum::actingAs($this->owner);

        // Create
        $response = $this->postJson('/api/suppliers', [
            'name' => 'PT Sumber Kopi Makmur',
            'contact_person' => 'Budi Santoso',
            'phone' => '081234567890',
            'email' => 'sales@sumberkopi.id',
            'address' => 'Jl. Industri No. 45 Jakarta',
            'notes' => 'Distributor utama biji kopi',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'PT Sumber Kopi Makmur');

        $supplierId = $response->json('data.id');

        // Read list
        $this->getJson('/api/suppliers')
            ->assertStatus(200)
            ->assertJsonFragment(['name' => 'PT Sumber Kopi Makmur']);

        // Update
        $this->putJson("/api/suppliers/{$supplierId}", [
            'name' => 'PT Sumber Kopi Nusantara',
            'contact_person' => 'Budi S.',
        ])->assertStatus(200)
            ->assertJsonPath('data.name', 'PT Sumber Kopi Nusantara');

        // Delete
        $this->deleteJson("/api/suppliers/{$supplierId}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('suppliers', ['id' => $supplierId]);
    }

    public function test_owner_can_crud_customer(): void
    {
        Sanctum::actingAs($this->owner);

        // Create
        $response = $this->postJson('/api/customers', [
            'name' => 'Pelanggan Setia Anton',
            'phone' => '08987654321',
            'email' => 'anton@gmail.com',
            'address' => 'Jl. Melati No. 10',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Pelanggan Setia Anton');

        $customerId = $response->json('data.id');

        // Update
        $this->putJson("/api/customers/{$customerId}", [
            'name' => 'Anton Wijaya',
        ])->assertStatus(200)
            ->assertJsonPath('data.name', 'Anton Wijaya');

        // Delete
        $this->deleteJson("/api/customers/{$customerId}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('customers', ['id' => $customerId]);
    }

    public function test_employee_is_forbidden_from_supplier_and_purchases(): void
    {
        Sanctum::actingAs($this->employee);

        $this->getJson('/api/suppliers')->assertStatus(403);
        $this->postJson('/api/suppliers', ['name' => 'Test'])->assertStatus(403);
        $this->getJson('/api/purchases')->assertStatus(403);
        $this->postJson('/api/purchases', [])->assertStatus(403);
    }

    public function test_owner_can_create_draft_purchase_without_stock_change(): void
    {
        Sanctum::actingAs($this->owner);

        $supplier = Supplier::create([
            'store_id' => $this->store->id,
            'name' => 'Supplier Biji Kopi',
        ]);

        $initialStock = $this->product->stock; // 10

        $response = $this->postJson('/api/purchases', [
            'supplier_id' => $supplier->id,
            'purchase_date' => now()->format('Y-m-d'),
            'status' => 'draft',
            'payment_method' => 'cash',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'unit_cost' => 22000,
                    'quantity' => 15,
                ],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.total_amount', '330000.00');

        // Stock should not change for draft
        $this->assertEquals($initialStock, $this->product->fresh()->stock);
        $this->assertEquals(0, StockMovement::where('product_id', $this->product->id)->count());
    }

    public function test_owner_can_receive_draft_purchase_and_increment_stock_with_movement(): void
    {
        Sanctum::actingAs($this->owner);

        $supplier = Supplier::create([
            'store_id' => $this->store->id,
            'name' => 'Supplier Biji Kopi',
        ]);

        $purchaseRes = $this->postJson('/api/purchases', [
            'supplier_id' => $supplier->id,
            'purchase_date' => now()->format('Y-m-d'),
            'status' => 'draft',
            'payment_method' => 'cash',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'unit_cost' => 21000,
                    'quantity' => 20,
                ],
            ],
        ]);

        $purchaseId = $purchaseRes->json('data.id');

        // Confirm Receive
        $receiveRes = $this->postJson("/api/purchases/{$purchaseId}/receive");
        $receiveRes->assertStatus(200)
            ->assertJsonPath('data.status', 'received');

        // Verify stock incremented (10 + 20 = 30)
        $this->assertEquals(30, $this->product->fresh()->stock);
        // Cost price updated
        $this->assertEquals(21000.00, $this->product->fresh()->cost_price);

        // Verify stock movement logged
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $this->product->id,
            'type' => 'purchase',
            'quantity' => 20,
            'stock_before' => 10,
            'stock_after' => 30,
        ]);
    }

    public function test_credit_purchase_creates_payable_and_can_be_paid(): void
    {
        Sanctum::actingAs($this->owner);

        $supplier = Supplier::create([
            'store_id' => $this->store->id,
            'name' => 'Distributor Kemasan',
        ]);

        $response = $this->postJson('/api/purchases', [
            'supplier_id' => $supplier->id,
            'purchase_date' => now()->format('Y-m-d'),
            'status' => 'received',
            'payment_method' => 'credit',
            'paid_amount' => 50000,
            'due_date' => now()->addDays(14)->format('Y-m-d'),
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'unit_cost' => 20000,
                    'quantity' => 10,
                ],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.payment_status', 'partially_paid')
            ->assertJsonPath('data.total_amount', '200000.00')
            ->assertJsonPath('data.paid_amount', '50000.00');

        // Verify payable record created
        $this->assertDatabaseHas('payables', [
            'supplier_id' => $supplier->id,
            'total_amount' => 200000,
            'paid_amount' => 50000,
            'remaining_amount' => 150000,
            'status' => 'partially_paid',
        ]);

        $payable = Payable::where('supplier_id', $supplier->id)->first();

        // Pay remaining debt installment
        $payRes = $this->postJson("/api/payables/{$payable->id}/pay", [
            'amount' => 150000,
            'notes' => 'Pelunasan transfer BCA',
        ]);

        $payRes->assertStatus(200)
            ->assertJsonPath('data.status', 'paid')
            ->assertJsonPath('data.remaining_amount', '0.00');
    }

    public function test_owner_can_cancel_received_purchase_and_reverse_stock(): void
    {
        Sanctum::actingAs($this->owner);

        $supplier = Supplier::create([
            'store_id' => $this->store->id,
            'name' => 'Supplier Kopi Reject',
        ]);

        // Create received purchase (stock becomes 10 + 5 = 15)
        $purchaseRes = $this->postJson('/api/purchases', [
            'supplier_id' => $supplier->id,
            'purchase_date' => now()->format('Y-m-d'),
            'status' => 'received',
            'payment_method' => 'cash',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'unit_cost' => 20000,
                    'quantity' => 5,
                ],
            ],
        ]);

        $purchaseId = $purchaseRes->json('data.id');
        $this->assertEquals(15, $this->product->fresh()->stock);

        // Cancel the purchase
        $cancelRes = $this->postJson("/api/purchases/{$purchaseId}/cancel", [
            'reason' => 'Barang cacat dan kadaluarsa',
        ]);

        $cancelRes->assertStatus(200)
            ->assertJsonPath('data.status', 'cancelled');

        // Stock reversed back to 10
        $this->assertEquals(10, $this->product->fresh()->stock);

        // Stock movement recorded as return
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $this->product->id,
            'type' => 'return',
            'quantity' => -5,
            'stock_before' => 15,
            'stock_after' => 10,
        ]);
    }
}
