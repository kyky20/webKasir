<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Sale;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EmployeeSettingTest extends TestCase
{
    use RefreshDatabase;

    private Store $store;
    private User $owner;
    private User $employee;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Store::create([
            'name' => 'Toko Kasirku Test Phase 6',
            'currency' => 'IDR',
            'timezone' => 'Asia/Jakarta',
            'tax_percentage' => 0.00,
            'receipt_paper_size' => '58mm',
            'show_cashier_name' => true,
        ]);

        $this->owner = User::create([
            'store_id' => $this->store->id,
            'name' => 'Owner Phase 6',
            'username' => 'ownerp6',
            'email' => 'ownerp6@test.local',
            'password' => Hash::make('password123'),
            'role' => 'owner',
            'status' => 'active',
        ]);

        $this->employee = User::create([
            'store_id' => $this->store->id,
            'name' => 'Kasir Phase 6',
            'username' => 'kasirp6',
            'email' => 'kasirp6@test.local',
            'password' => Hash::make('password123'),
            'role' => 'employee',
            'status' => 'active',
        ]);
    }

    public function test_owner_can_crud_employees_and_records_audit_log(): void
    {
        Sanctum::actingAs($this->owner);

        // 1. Create employee
        $createRes = $this->postJson('/api/employees', [
            'name' => 'Kasir Baru Ahmad',
            'username' => 'ahmadkasir',
            'email' => 'ahmad@kasirku.local',
            'phone' => '081299998888',
            'password' => 'password123',
            'role' => 'employee',
            'status' => 'active',
        ]);

        $createRes->assertStatus(201)
            ->assertJsonPath('data.username', 'ahmadkasir')
            ->assertJsonPath('data.role', 'employee');

        $empId = $createRes->json('data.id');

        // Verify audit log created
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'employee_created',
            'user_id' => $this->owner->id,
        ]);

        // 2. Read list
        $this->getJson('/api/employees')
            ->assertStatus(200)
            ->assertJsonFragment(['username' => 'ahmadkasir']);

        // 3. Update employee
        $this->putJson("/api/employees/{$empId}", [
            'name' => 'Ahmad Fauzi Kasir',
            'email' => 'ahmad.fauzi@kasirku.local',
            'phone' => '081299998888',
            'role' => 'employee',
            'status' => 'active',
        ])->assertStatus(200)
            ->assertJsonPath('data.name', 'Ahmad Fauzi Kasir');

        // 4. Delete employee
        $this->deleteJson("/api/employees/{$empId}")
            ->assertStatus(200);

        $this->assertSoftDeleted('users', ['id' => $empId]);
    }

    public function test_owner_cannot_deactivate_or_delete_self(): void
    {
        Sanctum::actingAs($this->owner);

        // Cannot deactivate self
        $this->putJson("/api/employees/{$this->owner->id}", [
            'name' => $this->owner->name,
            'email' => $this->owner->email,
            'role' => 'owner',
            'status' => 'inactive',
        ])->assertStatus(422);

        // Cannot delete self
        $this->deleteJson("/api/employees/{$this->owner->id}")
            ->assertStatus(422);
    }

    public function test_owner_cannot_delete_employee_with_sales_history(): void
    {
        Sanctum::actingAs($this->owner);

        // Create sale under this employee
        Sale::create([
            'store_id' => $this->store->id,
            'user_id' => $this->employee->id,
            'invoice_number' => 'INV-EMP-001',
            'status' => 'completed',
            'subtotal' => 25000,
            'total_amount' => 25000,
            'paid_amount' => 25000,
        ]);

        // Attempt to delete should fail with 422
        $res = $this->deleteJson("/api/employees/{$this->employee->id}");
        $res->assertStatus(422);

        $this->assertDatabaseHas('users', ['id' => $this->employee->id]);
    }

    public function test_owner_can_change_employee_password(): void
    {
        Sanctum::actingAs($this->owner);

        $res = $this->postJson("/api/employees/{$this->employee->id}/change-password", [
            'password' => 'newsecurepass123',
        ]);

        $res->assertStatus(200);

        // Verify employee can login with new password
        $this->postJson('/api/auth/login', [
            'login' => $this->employee->username,
            'password' => 'newsecurepass123',
        ])->assertStatus(200);
    }

    public function test_employee_cannot_access_employee_management_or_settings(): void
    {
        Sanctum::actingAs($this->employee);

        $this->getJson('/api/employees')->assertStatus(403);
        $this->postJson('/api/employees', [])->assertStatus(403);
        $this->getJson('/api/audit-logs')->assertStatus(403);
        $this->getJson('/api/settings/store')->assertStatus(403);
        $this->putJson('/api/settings/store', [])->assertStatus(403);
    }

    public function test_owner_can_view_and_filter_audit_logs(): void
    {
        Sanctum::actingAs($this->owner);

        AuditLog::record(
            null,
            $this->store->id,
            $this->owner,
            'test_action',
            'Ini adalah log tes audit'
        );

        $res = $this->getJson('/api/audit-logs?search=tes+audit');
        $res->assertStatus(200)
            ->assertJsonFragment(['action' => 'test_action']);

        $actRes = $this->getJson('/api/audit-logs/actions');
        $actRes->assertStatus(200)
            ->assertJsonFragment(['test_action']);
    }

    public function test_owner_can_get_and_update_store_settings(): void
    {
        Sanctum::actingAs($this->owner);

        // Get settings
        $this->getJson('/api/settings/store')
            ->assertStatus(200)
            ->assertJsonPath('data.name', 'Toko Kasirku Test Phase 6');

        // Update settings
        $res = $this->putJson('/api/settings/store', [
            'name' => 'Toko Kasirku Baru',
            'address' => 'Jl. Merdeka Barat No. 12',
            'phone' => '081234567890',
            'email' => 'info@tokobarukita.id',
            'currency' => 'IDR',
            'timezone' => 'Asia/Jakarta',
            'tax_percentage' => 11.00,
            'receipt_header' => 'Selamat datang di Toko Baru',
            'receipt_footer' => 'Terima kasih atas belanja Anda',
            'receipt_paper_size' => '80mm',
            'show_cashier_name' => true,
        ]);

        $res->assertStatus(200)
            ->assertJsonPath('data.name', 'Toko Kasirku Baru')
            ->assertJsonPath('data.receipt_paper_size', '80mm');

        // Verify audit log recorded
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'store_updated',
            'user_id' => $this->owner->id,
        ]);
    }
}
