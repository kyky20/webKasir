<?php

namespace Tests\Feature;

use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private Store $store;
    private User $owner;
    private User $employee;
    private User $inactiveEmployee;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Store::create([
            'name' => 'Toko Kasirku Test',
            'currency' => 'IDR',
            'timezone' => 'Asia/Jakarta',
            'tax_percentage' => 0.00,
        ]);

        $this->owner = User::create([
            'store_id' => $this->store->id,
            'name' => 'Owner Test',
            'username' => 'ownertest',
            'email' => 'owner@test.local',
            'password' => Hash::make('secret123'),
            'role' => 'owner',
            'status' => 'active',
        ]);

        $this->employee = User::create([
            'store_id' => $this->store->id,
            'name' => 'Kasir Test',
            'username' => 'kasirtest',
            'email' => 'kasir@test.local',
            'password' => Hash::make('secret123'),
            'role' => 'employee',
            'status' => 'active',
        ]);

        $this->inactiveEmployee = User::create([
            'store_id' => $this->store->id,
            'name' => 'Kasir Inactive',
            'username' => 'kasir_off',
            'email' => 'off@test.local',
            'password' => Hash::make('secret123'),
            'role' => 'employee',
            'status' => 'inactive',
        ]);
    }

    public function test_owner_can_login_with_username_and_email(): void
    {
        $responseUsername = $this->postJson('/api/auth/login', [
            'login' => 'ownertest',
            'password' => 'secret123',
        ]);

        $responseUsername->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.role', 'owner')
            ->assertJsonStructure(['data' => ['token', 'user', 'store']]);

        $responseEmail = $this->postJson('/api/auth/login', [
            'login' => 'owner@test.local',
            'password' => 'secret123',
        ]);

        $responseEmail->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.role', 'owner');
    }

    public function test_employee_can_login(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'login' => 'kasirtest',
            'password' => 'secret123',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.role', 'employee');
    }

    public function test_inactive_user_cannot_login(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'login' => 'kasir_off',
            'password' => 'secret123',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_invalid_password_is_rejected(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'login' => 'ownertest',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['login']);
    }

    public function test_owner_can_access_owner_protected_routes(): void
    {
        $token = $this->owner->createToken('test', ['role:owner'])->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/owner/ping');

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_employee_cannot_access_owner_protected_routes(): void
    {
        $token = $this->employee->createToken('test', ['role:employee'])->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/owner/ping');

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_both_can_access_pos_route(): void
    {
        $ownerToken = $this->owner->createToken('test')->plainTextToken;
        $employeeToken = $this->employee->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$ownerToken}")
            ->getJson('/api/pos/ping')
            ->assertOk();

        $this->withHeader('Authorization', "Bearer {$employeeToken}")
            ->getJson('/api/pos/ping')
            ->assertOk();
    }

    public function test_authenticated_user_can_fetch_profile_and_logout(): void
    {
        $token = $this->owner->createToken('test')->plainTextToken;

        $meResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me');

        $meResponse->assertOk()
            ->assertJsonPath('data.user.email', 'owner@test.local');

        $logoutResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/logout');

        $logoutResponse->assertOk()
            ->assertJsonPath('success', true);
    }
}
