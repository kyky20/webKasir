<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Store;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoreSettingController extends Controller
{
    public function getPublicProfile(): JsonResponse
    {
        $store = Store::first();

        if (!$store) {
            return response()->json([
                'success' => false,
                'message' => 'Profil perusahaan belum diatur.',
                'data' => null,
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'name' => $store->name,
                'address' => $store->address,
                'phone' => $store->phone,
                'email' => $store->email,
                'logo' => $store->logo,
                'receipt_header' => $store->receipt_header,
                'receipt_footer' => $store->receipt_footer,
            ],
        ]);
    }

    public function getSettings(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        $store = Store::find($storeId);

        if (!$store) {
            return response()->json([
                'success' => false,
                'message' => 'Data toko tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $store,
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $storeId = $currentUser->store_id;

        $store = Store::find($storeId);

        if (!$store) {
            return response()->json([
                'success' => false,
                'message' => 'Data toko tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:150'],
            'currency' => ['required', 'string', 'max:10'],
            'timezone' => ['required', 'string', 'max:50'],
            'tax_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'receipt_header' => ['nullable', 'string', 'max:500'],
            'receipt_footer' => ['nullable', 'string', 'max:500'],
            'receipt_paper_size' => ['required', 'in:58mm,80mm'],
            'show_cashier_name' => ['required', 'boolean'],
        ], [
            'name.required' => 'Nama toko wajib diisi.',
            'currency.required' => 'Mata uang wajib dipilih.',
            'timezone.required' => 'Zona waktu wajib dipilih.',
            'tax_percentage.required' => 'Persentase pajak wajib diisi.',
            'receipt_paper_size.required' => 'Ukuran kertas struk wajib dipilih (58mm atau 80mm).',
        ]);

        $store->update($validated);

        ActivityLogger::log(
            module: 'settings',
            action: 'store_settings_updated',
            description: "{$currentUser->name} memperbarui profil dan konfigurasi toko: {$store->name}.",
            request: $request,
            user: $currentUser,
            subjectType: Store::class,
            subjectId: $storeId,
            newValues: $store->only(['name', 'address', 'phone', 'email', 'currency', 'tax_percentage', 'receipt_paper_size']),
            notify: true,
            notifyTitle: "Pengaturan Toko Diperbarui",
            notifyType: 'info',
            notifyLink: '/settings'
        );

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan toko berhasil disimpan.',
            'data' => $store,
        ]);
    }
}
