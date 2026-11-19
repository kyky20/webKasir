<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Customer;
use App\Models\ExpenseCategory;
use App\Models\FinancialAccount;
use App\Models\Product;
use App\Models\Store;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $store = Store::firstOrCreate(
            ['email' => 'toko@kasirku.local'],
            [
                'name' => 'Toko Kasirku Makmur',
                'address' => 'Jl. Jenderal Sudirman No. 45, Jakarta Pusat',
                'phone' => '081234567890',
                'currency' => 'IDR',
                'timezone' => 'Asia/Jakarta',
                'tax_percentage' => 0.00,
                'receipt_header' => 'Selamat Datang di Toko Kasirku',
                'receipt_footer' => 'Terima kasih atas kunjungan Anda!',
            ]
        );

        User::firstOrCreate(
            ['username' => 'owner'],
            [
                'store_id' => $store->id,
                'name' => 'Budi Pratama',
                'email' => 'owner@kasirku.local',
                'phone' => '081234567890',
                'password' => Hash::make('password123'),
                'role' => 'owner',
                'status' => 'active',
            ]
        );

        User::firstOrCreate(
            ['username' => 'kasir'],
            [
                'store_id' => $store->id,
                'name' => 'Siti Rahmawati',
                'email' => 'kasir@kasirku.local',
                'phone' => '081234567891',
                'password' => Hash::make('password123'),
                'role' => 'employee',
                'status' => 'active',
            ]
        );

        User::firstOrCreate(
            ['username' => 'kasir_nonaktif'],
            [
                'store_id' => $store->id,
                'name' => 'Ahmad Fauzi',
                'email' => 'fauzi@kasirku.local',
                'phone' => '081234567892',
                'password' => Hash::make('password123'),
                'role' => 'employee',
                'status' => 'inactive',
            ]
        );

        // Categories
        $categoriesData = [
            ['name' => 'Makanan & Minuman', 'slug' => 'makanan-minuman', 'description' => 'Produk makanan ringan, roti, dan minuman dingin'],
            ['name' => 'Sembako & Dapur', 'slug' => 'sembako-dapur', 'description' => 'Beras, minyak, gula, dan kebutuhan dapur pokok'],
            ['name' => 'Kebutuhan Rumah', 'slug' => 'kebutuhan-rumah', 'description' => 'Sabun, pembersih, dan perlengkapan kebersihan'],
            ['name' => 'Alat Tulis & Kantor', 'slug' => 'alat-tulis-kantor', 'description' => 'Buku, pulpen, dan alat tulis sekolah atau kantor'],
        ];

        $categories = [];
        foreach ($categoriesData as $cat) {
            $categories[$cat['slug']] = Category::firstOrCreate(
                ['store_id' => $store->id, 'slug' => $cat['slug']],
                array_merge($cat, ['store_id' => $store->id, 'is_active' => true])
            );
        }

        // Products
        $productsData = [
            [
                'category_id' => $categories['makanan-minuman']->id,
                'name' => 'Kopi Susu Gula Aren 250ml',
                'sku' => 'KOP-001',
                'barcode' => '8991234001',
                'cost_price' => 9000,
                'selling_price' => 15000,
                'stock' => 25,
                'min_stock' => 5,
                'unit' => 'botol',
                'description' => 'Kopi susu gula aren segar siap minum',
            ],
            [
                'category_id' => $categories['makanan-minuman']->id,
                'name' => 'Teh Melati Botol 350ml',
                'sku' => 'TEH-001',
                'barcode' => '8991234002',
                'cost_price' => 3000,
                'selling_price' => 5000,
                'stock' => 40,
                'min_stock' => 10,
                'unit' => 'botol',
                'description' => 'Teh aroma melati segar',
            ],
            [
                'category_id' => $categories['makanan-minuman']->id,
                'name' => 'Air Mineral 600ml',
                'sku' => 'AIR-001',
                'barcode' => '8991234003',
                'cost_price' => 2000,
                'selling_price' => 3500,
                'stock' => 50,
                'min_stock' => 15,
                'unit' => 'botol',
                'description' => 'Air mineral murni higienis',
            ],
            [
                'category_id' => $categories['makanan-minuman']->id,
                'name' => 'Roti Cokelat Keju',
                'sku' => 'ROT-001',
                'barcode' => '8991234004',
                'cost_price' => 5500,
                'selling_price' => 8500,
                'stock' => 20,
                'min_stock' => 5,
                'unit' => 'pcs',
                'description' => 'Roti manis dengan isian cokelat dan keju lezat',
            ],
            [
                'category_id' => $categories['sembako-dapur']->id,
                'name' => 'Beras Premium 5kg',
                'sku' => 'BRS-001',
                'barcode' => '8991234005',
                'cost_price' => 68000,
                'selling_price' => 78000,
                'stock' => 15,
                'min_stock' => 5,
                'unit' => 'sak',
                'description' => 'Beras putih pulen kualitas premium',
            ],
            [
                'category_id' => $categories['sembako-dapur']->id,
                'name' => 'Minyak Goreng 2L Pouch',
                'sku' => 'MYK-001',
                'barcode' => '8991234006',
                'cost_price' => 31000,
                'selling_price' => 36000,
                'stock' => 18,
                'min_stock' => 5,
                'unit' => 'pouch',
                'description' => 'Minyak goreng kelapa sawit bening',
            ],
            [
                'category_id' => $categories['sembako-dapur']->id,
                'name' => 'Gula Pasir Kristal 1kg',
                'sku' => 'GUL-001',
                'barcode' => '8991234007',
                'cost_price' => 14000,
                'selling_price' => 17500,
                'stock' => 30,
                'min_stock' => 10,
                'unit' => 'kg',
                'description' => 'Gula pasir tebu kristal putih',
            ],
            [
                'category_id' => $categories['sembako-dapur']->id,
                'name' => 'Mie Instan Kuah Kari Ayam',
                'sku' => 'MIE-001',
                'barcode' => '8991234008',
                'cost_price' => 2600,
                'selling_price' => 3500,
                'stock' => 80,
                'min_stock' => 20,
                'unit' => 'bungkus',
                'description' => 'Mie instan rasa kari ayam lezat',
            ],
            [
                'category_id' => $categories['kebutuhan-rumah']->id,
                'name' => 'Sabun Cuci Piring Jeruk Nipis 750ml',
                'sku' => 'SBN-001',
                'barcode' => '8991234009',
                'cost_price' => 12000,
                'selling_price' => 16000,
                'stock' => 12,
                'min_stock' => 5,
                'unit' => 'pouch',
                'description' => 'Cairan pembersih lemak beraroma jeruk nipis',
            ],
            [
                'category_id' => $categories['alat-tulis-kantor']->id,
                'name' => 'Buku Tulis Spiral A5 80 Lembar',
                'sku' => 'BUK-001',
                'barcode' => '8991234010',
                'cost_price' => 8000,
                'selling_price' => 13000,
                'stock' => 25,
                'min_stock' => 5,
                'unit' => 'pcs',
                'description' => 'Buku catatan jilid spiral kertas tebal',
            ],
            [
                'category_id' => $categories['alat-tulis-kantor']->id,
                'name' => 'Pulpen Gel Hitam 0.5mm',
                'sku' => 'PUL-001',
                'barcode' => '8991234011',
                'cost_price' => 2500,
                'selling_price' => 4500,
                'stock' => 50,
                'min_stock' => 10,
                'unit' => 'pcs',
                'description' => 'Pulpen tinta gel hitam lancar tidak macet',
            ],
            [
                'category_id' => $categories['makanan-minuman']->id,
                'name' => 'Keripik Singkong Balado 150g',
                'sku' => 'SNK-001',
                'barcode' => '8991234012',
                'cost_price' => 7000,
                'selling_price' => 11000,
                'stock' => 4,
                'min_stock' => 5,
                'unit' => 'bungkus',
                'description' => 'Keripik singkong renyah pedas manis',
            ],
        ];

        foreach ($productsData as $prod) {
            Product::firstOrCreate(
                ['store_id' => $store->id, 'sku' => $prod['sku']],
                array_merge($prod, ['store_id' => $store->id, 'is_active' => true])
            );
        }

        // Suppliers
        $suppliersData = [
            [
                'name' => 'CV Makmur Sejahtera',
                'contact_person' => 'Hendra Wijaya',
                'phone' => '08119876543',
                'email' => 'makmur@supplier.local',
                'address' => 'Kawasan Pergudangan Blok C4, Jakarta Barat',
                'notes' => 'Distributor utama Beras & Sembako',
            ],
            [
                'name' => 'PT Sumber Pangan Nusantara',
                'contact_person' => 'Dewi Lestari',
                'phone' => '08128765432',
                'email' => 'sumberpangan@supplier.local',
                'address' => 'Jl. Raya Bekasi KM 21, Jakarta Timur',
                'notes' => 'Distributor Minyak Goreng, Gula, dan Mie Instan',
            ],
            [
                'name' => 'CV Mitra Snack & Minuman',
                'contact_person' => 'Rian Santoso',
                'phone' => '08137654321',
                'email' => 'mitrasnack@supplier.local',
                'address' => 'Jl. Daan Mogot No. 88, Jakarta Barat',
                'notes' => 'Distributor Kopi, Teh, dan Minuman Dingin',
            ],
            [
                'name' => 'Toko Grosir ATK Cahaya',
                'contact_person' => 'Bambang',
                'phone' => '08146543210',
                'email' => 'cahayaatk@supplier.local',
                'address' => 'Pasar Pagi Mangga Dua, Jakarta Utara',
                'notes' => 'Suplai alat tulis kantor dan sekolah',
            ],
        ];

        foreach ($suppliersData as $sup) {
            Supplier::firstOrCreate(
                ['store_id' => $store->id, 'name' => $sup['name']],
                array_merge($sup, ['store_id' => $store->id, 'is_active' => true])
            );
        }

        // Customers
        $customersData = [
            [
                'name' => 'Ibu Ratna (Warkop Berkah)',
                'phone' => '08561234567',
                'email' => 'ratna@warkop.local',
                'address' => 'Jl. Kebon Sirih No. 10',
                'notes' => 'Pelanggan rutin kopi susu dan mie instan',
            ],
            [
                'name' => 'Pak Anton (Kantin Sekolah)',
                'phone' => '08572345678',
                'email' => 'anton@kantin.local',
                'address' => 'Jl. Wahid Hasyim No. 22',
                'notes' => 'Langganan roti dan air mineral',
            ],
            [
                'name' => 'Mbak Linda (Warga Sekitar)',
                'phone' => '08583456789',
                'email' => 'linda@gmail.local',
                'address' => 'Jl. Sabang Gg. 3 No. 4',
                'notes' => 'Pelanggan sembako bulanan',
            ],
        ];

        foreach ($customersData as $cust) {
            Customer::firstOrCreate(
                ['store_id' => $store->id, 'name' => $cust['name']],
                array_merge($cust, ['store_id' => $store->id, 'is_active' => true])
            );
        }

        // Financial Accounts (Phase 5)
        $accountsData = [
            [
                'name' => 'Kas Utama Toko',
                'account_type' => 'cash',
                'account_number' => null,
                'initial_balance' => 2500000.00,
                'current_balance' => 2500000.00,
                'notes' => 'Kas tunai di laci kasir dan brankas toko',
            ],
            [
                'name' => 'Rekening Bank BCA',
                'account_type' => 'bank',
                'account_number' => '8210992819',
                'initial_balance' => 15000000.00,
                'current_balance' => 15000000.00,
                'notes' => 'Rekening operasional utama Toko Kasirku',
            ],
            [
                'name' => 'Kas Kecil (Petty Cash)',
                'account_type' => 'cash',
                'account_number' => null,
                'initial_balance' => 500000.00,
                'current_balance' => 500000.00,
                'notes' => 'Dana kas kecil untuk keperluan darurat harian',
            ],
            [
                'name' => 'QRIS & E-Wallet',
                'account_type' => 'ewallet',
                'account_number' => '081234567890',
                'initial_balance' => 1200000.00,
                'current_balance' => 1200000.00,
                'notes' => 'Penampung pembayaran QRIS dan dompet elektronik',
            ],
        ];

        foreach ($accountsData as $acc) {
            FinancialAccount::firstOrCreate(
                ['store_id' => $store->id, 'name' => $acc['name']],
                array_merge($acc, ['store_id' => $store->id, 'is_active' => true])
            );
        }

        // Expense Categories (Phase 5)
        $expenseCategoriesData = [
            ['name' => 'Listrik, Air & Internet', 'description' => 'Tagihan utilitas bulanan toko'],
            ['name' => 'Gaji & Upah Karyawan', 'description' => 'Gaji pokok dan insentif kasir atau staf'],
            ['name' => 'Sewa Ruko & Tempat Usaha', 'description' => 'Biaya sewa gedung atau ruko'],
            ['name' => 'Perlengkapan & Kebersihan', 'description' => 'Plastik belanja, kertas struk, sabun pembersih'],
            ['name' => 'Transportasi & Pengiriman', 'description' => 'Bensin, ongkos kirim pengadaan barang'],
            ['name' => 'Pemeliharaan & Servis', 'description' => 'Perbaikan perlengkapan toko, chiller, printer'],
            ['name' => 'Beban Operasional Lainnya', 'description' => 'Beban pengeluaran umum yang tidak terduga'],
        ];

        foreach ($expenseCategoriesData as $exp) {
            ExpenseCategory::firstOrCreate(
                ['store_id' => $store->id, 'name' => $exp['name']],
                array_merge($exp, ['store_id' => $store->id, 'is_active' => true])
            );
        }
    }
}
