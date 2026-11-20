# Kasirku — Sistem Kasir (POS) & Pembukuan Ritel Terpadu

Aplikasi Point of Sale (POS) dan manajemen pembukuan ritel modern berbasis web yang dirancang untuk toko, minimarket, dan UMKM. Memisahkan hak akses antara **Owner** (pemilik bisnis) dan **Kasir** secara ketat demi menjaga privasi omzet, perhitungan HPP otomatis, serta kecepatan transaksi di meja kasir.

---

## 📸 Tangkapan Layar Aplikasi (Screenshots Showcase)

Berikut adalah galeri antarmuka aktual aplikasi Kasirku yang diambil langsung dari sistem operasional:

### 1. Halaman Publik & 3D Interactive Showcase
Tampilan antarmuka publik yang menyambut pengunjung dan memperkenalkan seluruh kapabilitas aplikasi dalam perspektif spasial 3D.

| Landing Page Publik | 3D Interactive Showcase (`/demo`) |
| :---: | :---: |
| ![Landing Page](hasilss/01_landing_page.png) | ![3D Showcase](hasilss/02_demo_showcase.png) |
| *Hero section & alur nilai tambah aktual* | *Glassy Coverflow 3D dengan gestur usap/swipe* |

<br />

| Halaman Masuk Akun (Login) |
| :---: |
| ![Login Page](hasilss/03_login_page.png) |
| *Autentikasi aman berbasis peran (Role-Based Access Control)* |

---

### 2. Portal Owner: Dashboard, Kasir & Penjualan
Modul operasional harian pemilik usaha untuk memantau performa bisnis dan mengawasi setiap transaksi toko.

| Dashboard Eksekutif Owner | Terminal POS Kasir |
| :---: | :---: |
| ![Dashboard Owner](hasilss/04_owner_dashboard.png) | ![POS Kasir](hasilss/05_owner_pos.png) |
| *Ringkasan omzet, laba bersih & grafik tren penjualan* | *Input barcode instan, diskon & kalkulasi otomatis* |

<br />

| Riwayat Seluruh Transaksi Toko |
| :---: |
| ![Riwayat Transaksi](hasilss/06_owner_transactions.png) |
| *Arsip faktur penjualan, filter tanggal, status bayar & cetak ulang* |

---

### 3. Portal Owner: Produk, Inventaris & Pembelian
Kendali terpusat atas master katalog barang dagangan, mutasi stok fisik, hingga pengadaan supplier.

| Katalog Produk & Kategori Master | Manajemen Inventaris & Stok Opname |
| :---: | :---: |
| ![Katalog Produk](hasilss/07_owner_products.png) | ![Inventaris Stok](hasilss/08_owner_inventory.png) |
| *Kelola SKU, barcode, harga modal HPP & harga jual* | *Kartu stok, penyesuaian opname & log barang masuk/keluar* |

<br />

| Pengadaan Barang & Utang Supplier |
| :---: |
| ![Pembelian & Utang](hasilss/09_owner_purchases.png) |
| *Pencatatan faktur kulakan, jatuh tempo utang & status pelunasan* |

---

### 4. Portal Owner: Bisnis, Keuangan & Laporan
Pencatatan arus kas operasional dan laporan keuangan transparan tanpa estimasi manual.

| Kontak Pelanggan & Supplier | Pembukuan & Arus Kas (Cash Flow) |
| :---: | :---: |
| ![Kontak](hasilss/10_owner_contacts.png) | ![Pembukuan Kas](hasilss/11_owner_finance.png) |
| *Direktori database customer dan rekanan vendor* | *Pencatatan kas masuk, kas keluar, dan mutasi saldo akun* |

<br />

| Laporan Penjualan & Laba Rugi | Pratinjau Cetak Formal Laporan A4 |
| :---: | :---: |
| ![Laporan Keuangan](hasilss/12_owner_reports.png) | ![Cetak Laporan](hasilss/13_owner_reports_print.png) |
| *Laba kotor vs laba bersih dengan kalkulasi HPP riil* | *Format siap cetak printer dan ekspor dokumen PDF A4* |

---

### 5. Portal Owner: Administrasi, Log Audit & Konfigurasi Toko
Kontrol keamanan staf kasir, jejak rekam audit sistem, serta pengaturan identitas toko dan format struk termal.

| Manajemen Pegawai & Hak Akses | Log Aktivitas Audit Toko |
| :---: | :---: |
| ![Manajemen Pegawai](hasilss/14_owner_employees.png) | ![Log Audit](hasilss/15_owner_activity_logs.png) |
| *Tambah kasir, ganti kata sandi & proteksi data laba* | *Jejak audit: login, perubahan harga modal & pembatalan* |

<br />

| Pengaturan Toko & Konfigurasi Struk Termal |
| :---: |
| ![Pengaturan Toko](hasilss/16_owner_settings.png) |
| *Profil identitas usaha, tarif pajak PPN, dan pratinjau live struk belanja* |

---

### 6. Terminal Kasir (Employee Experience)
Antarmuka khusus staf kasir yang dirancang minimalis dan bebas hambatan demi mempercepat antrean meja pembayaran.

| Terminal Kasir POS | Dashboard Operasional Kasir |
| :---: | :---: |
| ![Kasir POS](hasilss/17_kasir_pos.png) | ![Dashboard Kasir](hasilss/18_kasir_dashboard.png) |
| *Layar kasir cepat dengan proteksi data rahasia laba* | *Ringkasan penjualan shift & target harian kasir* |

<br />

| Riwayat Transaksi Shift Kasir | Log & Notifikasi Kasir |
| :---: | :---: |
| ![Riwayat Shift Kasir](hasilss/19_kasir_my_transactions.png) | ![Notifikasi Kasir](hasilss/20_kasir_activity_logs.png) |
| *Daftar transaksi yang diproses selama jam kerja kasir* | *Peringatan stok menipis dan konfirmasi pembayaran* |

---

### 7. Format Struk Belanja Termal
Kompatibilitas cetak instan ke mesin printer thermal kasir standar.

| Struk Belanja Kasir Thermal (58mm / 80mm) |
| :---: |
| ![Struk Thermal](hasilss/21_receipt_thermal.png) |
| *Layout struk belanja presisi dengan informasi diskon, pajak, dan nomor faktur unik* |

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
├── hasilss/                  # Koleksi screenshot aktual seluruh modul aplikasi
├── package.json              # Orkestrasi skrip Concurrently (dev & build)
├── run-all.bat               # Skrip peluncur 1-klik untuk lingkungan Windows/Laragon
└── README.md                 # Dokumentasi proyek
```

---

## 📄 Lisensi

Proyek ini dikembangkan untuk kebutuhan operasional ritel dan UMKM di bawah lisensi terbuka [MIT License](LICENSE).
