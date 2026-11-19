<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
        ], [
            'login.required' => 'Email atau username wajib diisi.',
            'password.required' => 'Password wajib diisi.',
        ]);

        $user = User::where('email', $validated['login'])
            ->orWhere('username', $validated['login'])
            ->with('store')
            ->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            ActivityLogger::log(
                module: 'auth',
                action: 'login_failed',
                description: "Percobaan login gagal untuk akun: '{$validated['login']}'.",
                request: $request,
                storeId: $user?->store_id ?? 1,
                notify: true,
                notifyTitle: 'Peringatan Login Gagal',
                notifyType: 'warning'
            );

            throw ValidationException::withMessages([
                'login' => ['Kredensial yang dimasukkan tidak sesuai.'],
            ]);
        }

        if (!$user->isActive()) {
            ActivityLogger::log(
                module: 'auth',
                action: 'login_blocked',
                description: "Akun nonaktif '{$user->name}' mencoba masuk ke sistem.",
                request: $request,
                storeId: $user->store_id,
                user: $user,
                notify: true,
                notifyTitle: 'Percobaan Akses Akun Nonaktif',
                notifyType: 'warning'
            );

            return response()->json([
                'success' => false,
                'message' => 'Akun Anda berstatus nonaktif. Silakan hubungi pemilik toko.',
            ], 403);
        }

        $user->update([
            'last_login_at' => now(),
        ]);

        ActivityLogger::log(
            module: 'auth',
            action: 'login_success',
            description: "{$user->name} berhasil masuk ke sistem.",
            request: $request,
            user: $user
        );

        $token = $user->createToken('auth-token', ["role:{$user->role}"])->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'status' => $user->status,
                    'last_login_at' => $user->last_login_at,
                ],
                'store' => $user->store,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('store');

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'status' => $user->status,
                    'last_login_at' => $user->last_login_at,
                ],
                'store' => $user->store,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        ActivityLogger::log(
            module: 'auth',
            action: 'logout',
            description: "{$user->name} keluar dari sistem.",
            request: $request,
            user: $user
        );

        $user->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
        ]);
    }
}
