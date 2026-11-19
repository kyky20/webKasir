<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductInventoryTest extends TestCase
{
    use RefreshDatabase;

    private Store $store;
    private User $owner;
    private User $employee;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Store::create([
            'name' => 'Toko Kasirku Test Inventory',
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

        $this->employee = User::create([
            'store_id' => $this->store->id,
            'name' => 'Kasir Test',
            'username' => 'kasirtest',
            'email' => 'kasir@test.local',
            'password' => Hash::make('password123'),
            'role' => 'employee',
            'status' => 'active',
        ]);
    }

    public function test_owner_can_manage_categories(): void
    {
        Sanctum::actingAs($this->owner);

        // Create category
        $createRes = $this->postJson('/api/categories', [
            'name' => 'Minuman Dingin',
            'description' => 'Aneka minuman segar',
        ]);
        $createRes->assertStatus(201)
            ->assertJsonPath('data.name', 'Minuman Dingin')
            ->assertJsonPath('data.slug', 'minuman-dingin');
        $catId = $createRes->json('data.id');

        // Update category
        $updateRes = $this->putJson("/api/categories/{$catId}", [
            'name' => 'Minuman Dingin & Hangat',
        ]);
        $updateRes->assertOk()
            ->assertJsonPath('data.name', 'Minuman Dingin & Hangat');

        // Delete category
        $deleteRes = $this->deleteJson("/api/categories/{$catId}");
        $deleteRes->assertOk();
        $this->assertDatabaseMissing('categories', ['id' => $catId]);
    }

    public function test_owner_can_create_update_and_soft_delete_product(): void
    {
        Sanctum::actingAs($this->owner);

        $category = Category::create([
            'store_id' => $this->store->id,
            'name' => 'Makanan',
            'slug' => 'makanan',
        ]);

        // Create product
        $createRes = $this->postJson('/api/products', [
            'category_id' => $category->id,
            'name' => 'Keripik Tempe Renyah',
            'sku' => 'KRP-001',
            'cost_price' => 5000,
            'selling_price' => 8500,
            'stock' => 30,
            'min_stock' => 5,
            'unit' => 'bungkus',
        ]);

        $createRes->assertStatus(201)
            ->assertJsonPath('data.name', 'Keripik Tempe Renyah')
            ->assertJsonPath('data.stock', 30);
        $productId = $createRes->json('data.id');

        // Initial stock movement logged
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $productId,
            'type' => 'adjustment',
            'quantity' => 30,
            'stock_before' => 0,
            'stock_after' => 30,
        ]);

        // Update product
        $updateRes = $this->putJson("/api/products/{$productId}", [
            'name' => 'Keripik Tempe Gurih 150g',
            'sku' => 'KRP-001',
            'cost_price' => 5500,
            'selling_price' => 9000,
        ]);
        $updateRes->assertOk()
            ->assertJsonPath('data.name', 'Keripik Tempe Gurih 150g')
            ->assertJsonPath('data.selling_price', '9000.00');

        // Soft delete product
        $deleteRes = $this->deleteJson("/api/products/{$productId}");
        $deleteRes->assertOk();

        // Product is soft deleted
        $this->assertSoftDeleted('products', ['id' => $productId]);
    }

    public function test_sku_must_be_unique_within_store(): void
    {
        Sanctum::actingAs($this->owner);

        Product::create([
            'store_id' => $this->store->id,
            'name' => 'Produk A',
            'sku' => 'SKU-UNIQUE',
            'cost_price' => 1000,
            'selling_price' => 2000,
            'stock' => 10,
        ]);

        // Try creating another with duplicate SKU
        $res = $this->postJson('/api/products', [
            'name' => 'Produk B',
            'sku' => 'SKU-UNIQUE',
            'cost_price' => 1000,
            'selling_price' => 2000,
            'stock' => 5,
        ]);

        $res->assertStatus(422)
            ->assertJsonValidationErrors(['sku']);
    }

    public function test_employee_cannot_manage_products_or_inventory(): void
    {
        Sanctum::actingAs($this->employee);

        $this->getJson('/api/products')->assertStatus(403);
        $this->postJson('/api/products', ['name' => 'Test'])->assertStatus(403);
        $this->getJson('/api/categories')->assertStatus(403);
        $this->getJson('/api/inventory/summary')->assertStatus(403);
        $this->postJson('/api/inventory/adjust', [])->assertStatus(403);
    }

    public function test_owner_can_adjust_stock_with_audit_trail(): void
    {
        Sanctum::actingAs($this->owner);

        $product = Product::create([
            'store_id' => $this->store->id,
            'name' => 'Beras Pandan Wangi 5kg',
            'sku' => 'BRS-PW',
            'cost_price' => 70000,
            'selling_price' => 85000,
            'stock' => 20,
            'min_stock' => 5,
        ]);

        // 1. Subtract stock (Barang rusak)
        $subRes = $this->postJson('/api/inventory/adjust', [
            'product_id' => $product->id,
            'adjustment_type' => 'subtract_stock',
            'quantity' => 2,
            'reason' => 'Karung beras bocor dan rusak terkena air',
        ]);
        $subRes->assertOk();
        $this->assertEquals(18, $product->fresh()->stock);

        // 2. Add stock (Bonus supplier)
        $addRes = $this->postJson('/api/inventory/adjust', [
            'product_id' => $product->id,
            'adjustment_type' => 'add_stock',
            'quantity' => 5,
            'reason' => 'Tambahan bonus dari distributor',
        ]);
        $addRes->assertOk();
        $this->assertEquals(23, $product->fresh()->stock);

        // 3. Set stock (Hasil opname fisik)
        $setRes = $this->postJson('/api/inventory/adjust', [
            'product_id' => $product->id,
            'adjustment_type' => 'set_stock',
            'quantity' => 25,
            'reason' => 'Penyesuaian stok opname akhir bulan',
        ]);
        $setRes->assertOk();
        $this->assertEquals(25, $product->fresh()->stock);

        // Check movements history (kartu stok)
        $cardRes = $this->getJson("/api/inventory/{$product->id}/movements");
        $cardRes->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.notes', 'Penyesuaian stok opname akhir bulan');
    }
}
