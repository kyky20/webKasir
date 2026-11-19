<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PosTransactionTest extends TestCase
{
    use RefreshDatabase;

    private Store $store;
    private User $owner;
    private User $employee1;
    private User $employee2;
    private Product $product1;
    private Product $product2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Store::create([
            'name' => 'Toko Kasirku Test POS',
            'currency' => 'IDR',
            'timezone' => 'Asia/Jakarta',
            'tax_percentage' => 0.00,
        ]);

        $this->owner = User::create([
            'store_id' => $this->store->id,
            'name' => 'Owner Test',
            'username' => 'ownertest',
            'email' => 'owner@test.local',
            'password' => Hash::make('password123'),
            'role' => 'owner',
            'status' => 'active',
        ]);

        $this->employee1 = User::create([
            'store_id' => $this->store->id,
            'name' => 'Kasir 1',
            'username' => 'kasir1',
            'email' => 'kasir1@test.local',
            'password' => Hash::make('password123'),
            'role' => 'employee',
            'status' => 'active',
        ]);

        $this->employee2 = User::create([
            'store_id' => $this->store->id,
            'name' => 'Kasir 2',
            'username' => 'kasir2',
            'email' => 'kasir2@test.local',
            'password' => Hash::make('password123'),
            'role' => 'employee',
            'status' => 'active',
        ]);

        $category = Category::create([
            'store_id' => $this->store->id,
            'name' => 'Minuman',
            'slug' => 'minuman',
            'is_active' => true,
        ]);

        $this->product1 = Product::create([
            'store_id' => $this->store->id,
            'category_id' => $category->id,
            'name' => 'Kopi Susu Test',
            'sku' => 'TEST-001',
            'cost_price' => 5000,
            'selling_price' => 10000,
            'stock' => 20,
            'min_stock' => 5,
            'unit' => 'botol',
            'is_active' => true,
        ]);

        $this->product2 = Product::create([
            'store_id' => $this->store->id,
            'category_id' => $category->id,
            'name' => 'Roti Test',
            'sku' => 'TEST-002',
            'cost_price' => 3000,
            'selling_price' => 6000,
            'stock' => 5,
            'min_stock' => 2,
            'unit' => 'pcs',
            'is_active' => true,
        ]);
    }

    public function test_can_fetch_pos_products_and_categories(): void
    {
        $token = $this->employee1->createToken('test')->plainTextToken;

        $catRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/pos/categories');
        $catRes->assertOk()->assertJsonCount(1, 'data');

        $prodRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/pos/products');
        $prodRes->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_checkout_creates_sale_and_deducts_stock_accurately(): void
    {
        $token = $this->employee1->createToken('test')->plainTextToken;

        $payload = [
            'items' => [
                ['product_id' => $this->product1->id, 'quantity' => 2],
                ['product_id' => $this->product2->id, 'quantity' => 1],
            ],
            'payment_method' => 'cash',
            'paid_amount' => 30000,
            'discount_amount' => 0,
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/pos/checkout', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total_amount', '26000.00')
            ->assertJsonPath('data.paid_amount', '30000.00')
            ->assertJsonPath('data.change_amount', '4000.00')
            ->assertJsonPath('data.items.0.product_name', 'Kopi Susu Test')
            ->assertJsonPath('data.items.0.cost_price', '5000.00');

        $this->assertEquals(18, $this->product1->fresh()->stock);
        $this->assertEquals(4, $this->product2->fresh()->stock);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $this->product1->id,
            'type' => 'sale',
            'quantity' => -2,
            'stock_before' => 20,
            'stock_after' => 18,
        ]);
    }

    public function test_checkout_fails_when_stock_insufficient(): void
    {
        $token = $this->employee1->createToken('test')->plainTextToken;

        $payload = [
            'items' => [
                ['product_id' => $this->product2->id, 'quantity' => 10], // Stock only 5
            ],
            'payment_method' => 'cash',
            'paid_amount' => 100000,
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/pos/checkout', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);

        // Stock must not change
        $this->assertEquals(5, $this->product2->fresh()->stock);
    }

    public function test_checkout_fails_when_paid_amount_less_than_total(): void
    {
        $token = $this->employee1->createToken('test')->plainTextToken;

        $payload = [
            'items' => [
                ['product_id' => $this->product1->id, 'quantity' => 1], // Price 10000
            ],
            'payment_method' => 'cash',
            'paid_amount' => 5000, // Less than 10000
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/pos/checkout', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_idempotency_key_prevents_duplicate_sales(): void
    {
        $token = $this->employee1->createToken('test')->plainTextToken;
        $idempotencyKey = 'unique-key-12345';

        $payload = [
            'items' => [
                ['product_id' => $this->product1->id, 'quantity' => 1],
            ],
            'payment_method' => 'cash',
            'paid_amount' => 10000,
            'idempotency_key' => $idempotencyKey,
        ];

        $firstRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/pos/checkout', $payload);
        $firstRes->assertStatus(201);
        $firstInvoice = $firstRes->json('data.invoice_number');

        // Repeat with same key
        $secondRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/pos/checkout', $payload);
        $secondRes->assertOk();
        $this->assertEquals($firstInvoice, $secondRes->json('data.invoice_number'));

        // Stock only deducted once
        $this->assertEquals(19, $this->product1->fresh()->stock);
        $this->assertEquals(1, Sale::where('store_id', $this->store->id)->count());
    }

    public function test_employee_can_only_view_own_transactions(): void
    {
        // Employee 1 checkout
        \Laravel\Sanctum\Sanctum::actingAs($this->employee1);
        $this->postJson('/api/pos/checkout', [
            'items' => [['product_id' => $this->product1->id, 'quantity' => 1]],
            'payment_method' => 'cash',
            'paid_amount' => 10000,
        ]);

        // Employee 2 checkout
        \Laravel\Sanctum\Sanctum::actingAs($this->employee2);
        $res2 = $this->postJson('/api/pos/checkout', [
            'items' => [['product_id' => $this->product2->id, 'quantity' => 1]],
            'payment_method' => 'cash',
            'paid_amount' => 6000,
        ]);
        $saleId2 = $res2->json('data.id');

        // Employee 1 index should only show 1
        \Laravel\Sanctum\Sanctum::actingAs($this->employee1);
        $list1 = $this->getJson('/api/transactions');
        $list1->assertOk()->assertJsonCount(1, 'data');

        // Owner index shows both 2
        \Laravel\Sanctum\Sanctum::actingAs($this->owner);
        $ownerList = $this->getJson('/api/transactions');
        $ownerList->assertOk()->assertJsonCount(2, 'data');

        // Employee 1 attempting to view sale 2 (created by Employee 2) gets 403 Forbidden
        \Laravel\Sanctum\Sanctum::actingAs($this->employee1);
        $this->getJson("/api/transactions/{$saleId2}")
            ->assertStatus(403);

        // Employee 2 can view own sale 2
        \Laravel\Sanctum\Sanctum::actingAs($this->employee2);
        $this->getJson("/api/transactions/{$saleId2}")
            ->assertOk();
    }

    public function test_owner_can_cancel_sale_and_restores_stock(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->employee1);
        $saleRes = $this->postJson('/api/pos/checkout', [
            'items' => [['product_id' => $this->product1->id, 'quantity' => 3]],
            'payment_method' => 'cash',
            'paid_amount' => 30000,
        ]);
        $saleId = $saleRes->json('data.id');
        $this->assertEquals(17, $this->product1->fresh()->stock);

        // Employee cannot cancel
        \Laravel\Sanctum\Sanctum::actingAs($this->employee1);
        $this->postJson("/api/transactions/{$saleId}/cancel", ['reason' => 'Batal beli'])
            ->assertStatus(403);

        // Owner cancels
        \Laravel\Sanctum\Sanctum::actingAs($this->owner);
        $cancelRes = $this->postJson("/api/transactions/{$saleId}/cancel", ['reason' => 'Pelanggan membatalkan pesanan']);

        $cancelRes->assertOk()
            ->assertJsonPath('data.status', 'cancelled')
            ->assertJsonPath('data.cancellation_reason', 'Pelanggan membatalkan pesanan');

        // Stock restored back to 20
        $this->assertEquals(20, $this->product1->fresh()->stock);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $this->product1->id,
            'type' => 'return',
            'quantity' => 3,
            'stock_before' => 17,
            'stock_after' => 20,
        ]);
    }
}
