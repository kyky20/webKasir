# Kasirku — Sistem Kasir (POS) & Pembukuan Ritel Terpadu

Aplikasi Point of Sale (POS) dan manajemen pembukuan ritel modern berbasis web yang dirancang untuk toko, minimarket, dan UMKM. Memisahkan hak akses antara **Owner** (pemilik bisnis) dan **Kasir** secara ketat demi menjaga privasi omzet, perhitungan HPP otomatis, serta kecepatan transaksi di meja kasir.

---

## 🚀 Fitur Utama Berdasarkan Peran

### 1. Portal Owner (Pemilik Bisnis)
- **Executive Business Dashboard**: Ringkasan omzet real-time, laba bersih otomatis, grafik tren penjualan harian/bulanan, dan metrik performa toko.
- **Katalog Produk & Kategori Master**: Manajemen SKU barang, barcode scanner, satuan multi-level, harga modal (HPP), harga jual bertingkat, dan batas minimum stok.
- **Manajemen Stok & Opname Fisik**: Catatan barang masuk (stock in), barang keluar (stock out), penyesuaian stok (*stock opname*), dan kartu riwayat mutasi barang.
- **Pembelian & Utang Supplier**: Pencatatan faktur kulakan barang, jatuh tempo pembayaran utang dagang, dan status pelunasan supplier.
- **Laporan Keuangan & Laba Rugi Transparan**: Perhitungan HPP otomatis setiap transaksi, rekap laba kotor vs laba bersih, serta ekspor laporan formal cetak/PDF (format A4).
- **Manajemen Akses Pegawai**: Tambah/edit akun kasir, kontrol hak akses, serta proteksi data finansial toko dari staf kasir.
- **Log Aktivitas & Audit Trail**: Rekaman jejak audit sistem (*audit log*) mencakup login, perubahan harga modal, stok opname, dan pembatalan transaksi.
- **Pusat Notifikasi Cerdas**: Peringatan stok menipis (*low stock alert*), stok habis, dan notifikasi transaksi penting.

### 2. Terminal Kasir (Staf Penjualan)
- **Antarmuka Kasir (POS) Bebas Hambatan**: Desain responsif dioptimalkan untuk input barcode kilat, pencarian instan nama barang, filter kategori cepat, dan kalkulasi diskon otomatis.
- **Fleksibilitas Pembayaran**: Dukungan pembayaran tunai (dengan hitungan kembalian otomatis), QRIS, dan transfer bank.
- **Cetak Struk Thermal Multi-Ukuran**: Kompatibel dengan printer thermal struk belanja standar 58mm dan 80mm.
- **Riwayat Transaksi Saya**: Kasir dapat melihat rekap penjualan pada shift kerjanya dan mencetak ulang struk pelanggan tanpa melihat data laba toko.

### 3. Halaman Showcase Interaktif (`/demo`)
- **3D Coverflow Product Showcase**: Eksplorasi seluruh modul aplikasi menggunakan screenshot aktual antarmuka sistem.
- **Interaksi Geser & Usap (Swipe/Drag)**: Mendukung gestur usap layar sentuh (mobile/tablet), klik-dan-tarik (*mouse drag*), serta scroll horizontal trackpad.
- **Dukungan Dark & Light Mode**: Tampilan adaptif tema terang (*warm white*) dan tema gelap (*spatial dark*).
- **Spatial Catalog Drawer & Modal Expand**: Tinjauan cepat seluruh modul operasional dengan modal detail beresolusi tinggi.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animasi & Interaksi**: [Motion (Framer Motion)](https://motion.dev/)
- **Grafik & Ikon**: [Recharts](https://recharts.org/), [Lucide React](https://lucide.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)

### Backend
- **Framework**: [Laravel 11](https://laravel.com/) (PHP 8.2+)
- **Autentikasi**: [Laravel Sanctum](https://laravel.com/docs/11.x/sanctum) (Stateful / Token-based)
- **Database**: [MySQL](https://www.mysql.com/) / MariaDB (Kompatibel dengan Laragon / XAMPP)

---

## 📋 Persyaratan Sistem

Pastikan perangkat Anda telah terpasang:
- **PHP** >= 8.2 (ekstensi: `pdo_mysql`, `mbstring`, `openssl`, `bcmath`, `curl`)
- **Composer** >= 2.0
- **Node.js** >= 18.0 & **npm**
- **MySQL** >= 8.0 atau **MariaDB** >= 10.4 (Disarankan menggunakan **Laragon** di Windows)

---

## ⚡ Instalasi & Menjalankan Proyek

### 1. Clone Repository
```bash
git clone https://github.com/username/webKasir.git
cd webKasir
```

### 2. Konfigurasi Backend (Laravel)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Sesuaikan koneksi database pada file `backend/.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=webkasir
DB_USERNAME=root
DB_PASSWORD=
```

Jalankan migrasi database beserta data awal (seeder):
```bash
php artisan migrate --seed
cd ..
```

### 3. Konfigurasi Frontend (React + Vite)
```bash
cd frontend
npm install
npm run build
cd ..
```

### 4. Menjalankan Aplikasi
Anda dapat menjalankan backend dan frontend sekaligus dari folder root:

#### Menggunakan Terminal (Root):
```bash
npm install
npm run dev
```

#### Atau Menggunakan Shortcut Windows (`run-all.bat`):
Klik ganda file `run-all.bat` di folder utama `webKasir`. Skrip ini akan otomatis membuka peramban di `http://localhost:5173` dan menjalankan backend serta frontend bersamaan.

---

## 🔑 Kredensial Akun Bawaan (Default Demo)

Gunakan kredensial berikut untuk masuk ke dalam aplikasi:

| Peran (Role) | Username / Email | Password | Akses URL |
| :--- | :--- | :--- | :--- |
| **Owner** | `owner` | `password123` | [http://localhost:5173/dashboard](http://localhost:5173/dashboard) |
| **Kasir** | `kasir` | `password123` | [http://localhost:5173/pos](http://localhost:5173/pos) |

---

## 📁 Struktur Direktori

```plaintext
webKasir/
├── backend/                  # REST API & Business Logic (Laravel 11)
│   ├── app/
│   │   ├── Http/Controllers/ # Controller Transaksi, Produk, Laporan, Notifikasi, dsb.
│   │   └── Models/          # Model Eloquent (User, Product, Transaction, dsb.)
│   ├── database/             # Migrasi & Seeder data awal
│   ├── routes/api.php        # Endpoint API terproteksi Sanctum
│   └── public/               # Entrypoint API & Asset statis screenshot demo
│
├── frontend/                 # Single Page Application (React 19 + TypeScript)
│   ├── src/
│   │   ├── components/       # Komponen UI bersama (Navbar, Modal, Struk, dsb.)
│   │   ├── context/          # State global (AuthContext, ThemeContext)
│   │   ├── pages/            # Halaman fitur (Landing, Demo, POS, Dashboard, dsb.)
│   │   │   ├── demo/         # 3D Glassy Showcase (/demo)
│   │   │   ├── landing/      # Landing Page Publik (/)
│   │   │   ├── pos/          # Antarmuka Kasir POS (/pos)
│   │   │   └── dashboard/    # Portal Eksekutif Owner (/dashboard)
│   │   └── services/         # Klien Axios & integrasi API
│   └── package.json
│
├── package.json              # Orkestrasi skrip Concurrently (dev & build)
├── run-all.bat               # Skrip peluncur 1-klik untuk lingkungan Windows/Laragon
└── README.md                 # Dokumentasi proyek
```

---

## 📄 Lisensi

Proyek ini dikembangkan untuk kebutuhan operasional ritel dan UMKM di bawah lisensi terbuka [MIT License](LICENSE).
