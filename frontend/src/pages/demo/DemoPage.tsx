import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Play,
  Pause,
  ExternalLink,
  CheckCircle2,
  Sun,
  Moon,
  X,
  Compass,
  Grid,
  Heart,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useThemeContext } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

interface DemoFeature {
  id: string;
  number: string;
  title: string;
  category: string;
  desc: string;
  capabilities: string[];
  image: string;
  routeUrl: string;
  tag: string;
}

const OWNER_FEATURES: DemoFeature[] = [
  {
    id: 'owner-dashboard',
    number: '01',
    title: 'Executive Business Dashboard',
    category: 'Analitik & Ringkasan Eksekutif',
    desc: 'Pusat kendali operasional Owner dengan visualisasi KPI bisnis aktual: omzet penjualan, laba kotor & bersih, grafik tren omzet, produk terlaris, status inventaris, dan rekam aktivitas real-time.',
    capabilities: [
      'Visualisasi tren omzet & perbandingan periode',
      'Kalkulasi laba bersih & pengeluaran operasional',
      'Peringatan otomatis stok minimum & barang habis',
      'Monitoring transaksi terbaru & kasir bertugas',
    ],
    image: '/demo-assets/owner/dashboard.webp',
    routeUrl: '/dashboard',
    tag: 'KPI & Analitik',
  },
  {
    id: 'owner-pos',
    number: '02',
    title: 'Point of Sale (POS) Kasir Terpadu',
    category: 'Penjualan & Kasir',
    desc: 'Antarmuka kasir kilat dengan dukungan barcode scanner, filter kategori cepat, kalkulasi diskon otomatis, dan pembayaran fleksibel (Tunai, QRIS, Transfer Bank).',
    capabilities: [
      'Pencarian produk instan & scanner barcode',
      'Kalkulasi diskon nota & multi-metode bayar',
      'Cetak thermal 58mm & 80mm langsung',
      'Pengurangan stok otomatis saat transaksi tuntas',
    ],
    image: '/demo-assets/owner/pos.webp',
    routeUrl: '/pos',
    tag: 'Mesin POS',
  },
  {
    id: 'owner-transactions',
    number: '03',
    title: 'Riwayat Transaksi & Cetak Ulang Struk',
    category: 'Manajemen Penjualan',
    desc: 'Pusat arsip seluruh invoice transaksi penjualan toko. Dilengkapi filter tanggal, filter metode bayar, status faktur, hingga cetak ulang struk belanja.',
    capabilities: [
      'Filter pencarian invoice, kasir, & rentang tanggal',
      'Modal rincian transaksi lengkap item per item',
      'Cetak ulang nota belanja kapan saja',
      'Fitur pembatalan transaksi dengan pengembalian stok',
    ],
    image: '/demo-assets/owner/transactions.webp',
    routeUrl: '/transactions',
    tag: 'Faktur & Invoice',
  },
  {
    id: 'owner-products',
    number: '04',
    title: 'Katalog Produk & Kategori Master',
    category: 'Master Data',
    desc: 'Kelola seluruh SKU barang dagangan, barcode, modal pokok (HPP), harga jual bertingkat, batas minimum stok, hingga pengelompokan kategori produk secara rapi.',
    capabilities: [
      'Manajemen SKU, barcode, unit satuan & foto produk',
      'Input harga modal (HPP) dan harga jual terpisah',
      'Filter kategori produk & status aktif/nonaktif',
      'Pengaturan stok minimum (safety stock)',
    ],
    image: '/demo-assets/owner/products.webp',
    routeUrl: '/products',
    tag: 'Master Katalog',
  },
  {
    id: 'owner-inventory',
    number: '05',
    title: 'Inventaris & Penyesuaian Stok (Stock Opname)',
    category: 'Logistik & Gudang',
    desc: 'Monitoring mutasi barang masuk, barang keluar, dan penyesuaian stok opname fisik. Kartu stok mencatat setiap selisih barang secara transparan.',
    capabilities: [
      'Pelacakan status stok: aman, menipis, atau habis',
      'Pencatatan penyesuaian fisik (stock opname)',
      'Kartu mutasi stok historis per produk',
      'Pencegahan kebocoran stok di toko',
    ],
    image: '/demo-assets/owner/inventory.webp',
    routeUrl: '/inventory',
    tag: 'Manajemen Stok',
  },
  {
    id: 'owner-purchases',
    number: '06',
    title: 'Pembelian Barang & Utang Supplier (AP)',
    category: 'Pengadaan & Supplier',
    desc: 'Manajemen faktur pembelian barang dari distributor. Otomatis menambah stok persediaan gudang dan mengelola pencatatan pelunasan utang dagang tempo.',
    capabilities: [
      'Pencatatan faktur pembelian supplier',
      'Penambahan kuantitas stok otomatis ke katalog',
      'Pengelolaan utang dagang (Accounts Payable)',
      'Riwayat cicilan & status lunas pembelian',
    ],
    image: '/demo-assets/owner/purchases.webp',
    routeUrl: '/purchases',
    tag: 'Hutang Dagang',
  },
  {
    id: 'owner-contacts',
    number: '07',
    title: 'Direktori Pelanggan & Rekanan Supplier',
    category: 'Hubungan Bisnis',
    desc: 'Buku kontak terpusat untuk data pelanggan toko dan rekanan supplier. Memudahkan pelacakan riwayat transaksi pelanggan dan kontak pemasok barang.',
    capabilities: [
      'Manajemen kontak telepon, email, & alamat pelanggan',
      'Daftar kontak supplier distributor barang',
      'Pencarian instan kontak rekanan usaha',
      'Integrasi dengan faktur transaksi toko',
    ],
    image: '/demo-assets/owner/contacts.webp',
    routeUrl: '/contacts',
    tag: 'Buku Kontak',
  },
  {
    id: 'owner-finance',
    number: '08',
    title: 'Pembukuan Kas Masuk, Keluar & Arus Kas',
    category: 'Finansial & Keuangan',
    desc: 'Pencatatan mutasi kas non-penjualan: beban listrik, sewa, gaji, perlengkapan toko, hingga penarikan modal. Menjaga saldo kas toko tetap akurat.',
    capabilities: [
      'Pencatatan pengeluaran operasional (expense)',
      'Pencatatan pemasukan lain-lain (income)',
      'Transfer saldo antar rekening kas dan bank',
      'Kategori pengeluaran kustom untuk analisis biaya',
    ],
    image: '/demo-assets/owner/finance.webp',
    routeUrl: '/finance',
    tag: 'Kas & Finansial',
  },
  {
    id: 'owner-reports',
    number: '09',
    title: 'Laporan Finansial Laba Rugi Komprehensif',
    category: 'Laporan & Akuntansi',
    desc: 'Laporan keuangan standar akuntansi ritel yang menghitung Pendapatan Bersih (A), Total HPP Barang Terjual (B), Laba Kotor (C = A - B), Beban Usaha (D), hingga Laba Bersih Operasional.',
    capabilities: [
      'Kalkulasi otomatis margin laba bersih toko',
      'Perbandingan pendapatan terhadap beban operasional',
      'Filter periode harian, bulanan, & custom range',
      'Dukungan cetak formal A4 & ekspor PDF laporan',
    ],
    image: '/demo-assets/owner/reports.webp',
    routeUrl: '/reports',
    tag: 'Akuntansi & Pajak',
  },
  {
    id: 'owner-employees',
    number: '10',
    title: 'Manajemen Hak Akses & Karyawan Kasir',
    category: 'SDM & Keamanan',
    desc: 'Pengaturan akun pegawai kasir dengan wewenang terbatas. Owner dapat menambah kasir baru, mereset password, dan menonaktifkan akun yang sudah tidak bertugas.',
    capabilities: [
      'Pembatasan hak akses tegas (Owner vs Kasir)',
      'Aktivasi & penonaktifan akun pegawai instan',
      'Proteksi data sensitif laba dan saldo kas toko',
      'Pencatatan kasir penanggung jawab pada nota',
    ],
    image: '/demo-assets/owner/employees.webp',
    routeUrl: '/employees',
    tag: 'Manajemen Pegawai',
  },
  {
    id: 'owner-activity-logs',
    number: '11',
    title: 'Audit Trail & Rekam Jejak Aktivitas Sistem',
    category: 'Audit & Keamanan',
    desc: 'Log aktivitas otomatis yang merekam seluruh peristiwa penting: login, transaksi POS, perubahan harga jual, penghapusan data, hingga penyesuaian stok oleh staf.',
    capabilities: [
      'Pencatatan identitas pengguna, IP, dan timestamp',
      'Riwayat nilai sebelum dan sesudah perubahan data',
      'Filter log berdasarkan modul (POS, Produk, Finansial)',
      'Pemberitahuan notifikasi sistem secara real-time',
    ],
    image: '/demo-assets/owner/activity-logs.webp',
    routeUrl: '/activity-logs',
    tag: 'Audit Trail',
  },
  {
    id: 'owner-settings',
    number: '12',
    title: 'Profil Usaha & Konfigurasi Printer Struk',
    category: 'Pengaturan Sistem',
    desc: 'Pengaturan identitas toko (nama usaha, logo, kontak, alamat) serta kustomisasi header dan footer struk thermal kasir yang tercetak ke pelanggan.',
    capabilities: [
      'Kustomisasi nama usaha & logo toko pada struk',
      'Pengaturan header sambutan & footer struk',
      'Konfigurasi zona waktu dan format mata uang Rupiah',
      'Pengaturan printer thermal receipt Bluetooth/USB',
    ],
    image: '/demo-assets/owner/settings.webp',
    routeUrl: '/settings',
    tag: 'Konfigurasi Sistem',
  },
];

const KASIR_FEATURES: DemoFeature[] = [
  {
    id: 'kasir-pos',
    number: '01',
    title: 'Antarmuka Kasir (POS) Bebas Hambatan',
    category: 'Operasional Kasir',
    desc: 'Fokus 100% pada kecepatan pelayanan pelanggan di meja kasir. Input barcode kilat, navigasi kategori, hitung diskon otomatis, dan pilihan pembayaran tunai/non-tunai instan.',
    capabilities: [
      'Pencarian nama produk & barcode instan',
      'Kalkulasi kembalian tunai akurat otomatis',
      'Pilihan pembayaran QRIS & Transfer Bank',
      'Cetak struk belanja thermal dalam hitungan detik',
    ],
    image: '/demo-assets/kasir/pos.webp',
    routeUrl: '/pos',
    tag: 'Terminal Kasir',
  },
  {
    id: 'kasir-dashboard',
    number: '02',
    title: 'Dashboard Shift & Ringkasan Harian Kasir',
    category: 'Ringkasan Kerja Kasir',
    desc: 'Tampilan beranda yang disederhanakan khusus petugas kasir. Menampilkan informasi shift yang sedang berjalan, ringkasan transaksi harian kasir, dan pintasan menuju mesin POS.',
    capabilities: [
      'Informasi identitas kasir yang sedang bertugas',
      'Pintasan satu klik langsung membuka mesin kasir',
      'Privasi terlindungi: tanpa menampilkan rahasia laba toko',
      'Tampilan bersih, ringan, dan fokus pada tugas kasir',
    ],
    image: '/demo-assets/kasir/dashboard.webp',
    routeUrl: '/dashboard',
    tag: 'Shift Kasir',
  },
  {
    id: 'kasir-transactions',
    number: '03',
    title: 'Transaksi Kasir Saya & Cetak Ulang Nota',
    category: 'Riwayat Penjualan Kasir',
    desc: 'Daftar riwayat pesanan yang diproses oleh kasir bersangkutan selama bertugas. Memudahkan kasir melayani permintaan cetak ulang struk pelanggan yang hilang atau rusak.',
    capabilities: [
      'Pencarian invoice transaksi yang ditangani kasir',
      'Detail rincian belanja pelanggan per invoice',
      'Tombol cetak ulang struk thermal langsung',
      'Daftar transparan tanpa akses membatalkan transaksi rahasia',
    ],
    image: '/demo-assets/kasir/my-transactions.webp',
    routeUrl: '/my-transactions',
    tag: 'Riwayat Nota',
  },
  {
    id: 'kasir-activity-logs',
    number: '04',
    title: 'Riwayat Aktivitas & Notifikasi Kasir',
    category: 'Notifikasi & Riwayat Kasir',
    desc: 'Pusat notifikasi dan log aktivitas yang mencatat transaksi yang diselesaikan oleh kasir, memudahkan verifikasi dan serah terima shift antar-pegawai.',
    capabilities: [
      'Riwayat transaksi yang berhasil diselesaikan kasir',
      'Pemberitahuan sistem relevan untuk operasional kasir',
      'Verifikasi aktivitas harian sebelum tutup shift',
      'Transparansi rekam jejak kerja kasir',
    ],
    image: '/demo-assets/kasir/activity-logs.webp',
    routeUrl: '/activity-logs',
    tag: 'Log Kasir',
  },
];

export const DemoPage: React.FC = () => {
  const [activeRole, setActiveRole] = useState<'owner' | 'kasir'>('owner');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [expandedFeature, setExpandedFeature] = useState<DemoFeature | null>(null);
  const [isGridOpen, setIsGridOpen] = useState(false);

  const [dragOffset, setDragOffset] = useState(0);
  const isDraggingRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const dragStartX = useRef<number | null>(null);
  const dragStartY = useRef<number | null>(null);
  const wheelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { theme, toggleTheme } = useThemeContext();
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const carouselContainerRef = useRef<HTMLDivElement>(null);

  const currentFeatures = activeRole === 'owner' ? OWNER_FEATURES : KASIR_FEATURES;
  const activeFeature = currentFeatures[currentIndex] || currentFeatures[0];

  // Reset index when changing role
  useEffect(() => {
    setCurrentIndex(0);
    setDragOffset(0);
  }, [activeRole]);

  // Autoplay functionality
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % currentFeatures.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPlaying, currentFeatures.length]);

  const handlePrev = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setCurrentIndex((prev) => (prev - 1 + currentFeatures.length) % currentFeatures.length);
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 350);
  }, [currentFeatures.length]);

  const handleNext = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setCurrentIndex((prev) => (prev + 1) % currentFeatures.length);
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 350);
  }, [currentFeatures.length]);

  // Pointer drag & touch swipe gesture handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only respond to primary button (left click) or touch
    if (e.button !== 0) return;
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    isDraggingRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    const deltaX = e.clientX - dragStartX.current;
    const deltaY = e.clientY - (dragStartY.current ?? e.clientY);

    // If movement is mostly horizontal, start drag
    if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
      isDraggingRef.current = true;
      // Dampened elastic offset (max 130px)
      const damped = Math.sign(deltaX) * Math.min(Math.abs(deltaX) * 0.75, 130);
      setDragOffset(damped);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartX.current !== null) {
      const deltaX = e.clientX - dragStartX.current;
      const deltaY = e.clientY - (dragStartY.current ?? e.clientY);

      // Trigger slide change if horizontal drag threshold (>40px) is met
      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }
    setDragOffset(0);
    dragStartX.current = null;
    dragStartY.current = null;
    // Keep isDragging true briefly to suppress immediate click on cards/buttons
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 120);
  };

  const handlePointerCancel = () => {
    setDragOffset(0);
    dragStartX.current = null;
    dragStartY.current = null;
    isDraggingRef.current = false;
  };

  // Trackpad / Mouse wheel horizontal swipe support
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > 35 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      if (wheelTimeoutRef.current) return;
      if (e.deltaX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
      wheelTimeoutRef.current = setTimeout(() => {
        wheelTimeoutRef.current = null;
      }, 400);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (expandedFeature) {
        if (e.key === 'Escape') setExpandedFeature(null);
        return;
      }
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, expandedFeature]);

  return (
    <div className="relative min-h-screen bg-[#FAFAF9] dark:bg-[#0C0B0E] text-stone-900 dark:text-stone-100 selection:bg-orange-500 selection:text-white overflow-x-hidden font-sans transition-colors duration-300">
      {/* 1. SPATIAL GEOMETRIC BACKGROUND & AMBIENT AURA */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle geometric grid / polygon backdrop texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#d6d3d1_1px,transparent_1px)] dark:bg-[radial-gradient(#28252c_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:opacity-25" />

        {/* Dynamic center light cone */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[650px] rounded-full bg-gradient-to-tr from-orange-500/15 via-amber-400/10 to-transparent dark:from-orange-500/20 dark:via-amber-500/10 dark:to-transparent blur-[140px] opacity-75"
        />

        {/* Top subtle highlight */}
        <div
          aria-hidden="true"
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-96 rounded-full bg-orange-400/15 dark:bg-orange-400/15 blur-[120px]"
        />
      </div>

      {/* 2. TOP NAV / STATUS BAR */}
      <header className="relative z-40 w-full px-4 sm:px-8 pt-6 pb-2 flex items-center justify-between gap-4">
        {/* Left: Back to Landing Page */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-stone-200/80 dark:border-white/10 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shadow-sm dark:shadow-lg"
        >
          <ArrowLeft className="w-4 h-4 text-orange-500 dark:text-orange-400" />
          <span className="hidden sm:inline">Landing Page</span>
        </Link>

        {/* Center: Glowing Spatial Badge (like reference: SPATIAL VISION CINEMA) */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border border-stone-200/80 dark:border-white/15 text-xs font-bold tracking-widest uppercase shadow-sm dark:shadow-[0_0_20px_rgba(232,116,12,0.2)]">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_#f97316]" />
          <span className="text-stone-800 dark:text-stone-200">KASIRKU SPATIAL SHOWCASE</span>
        </div>

        {/* Right: Theme & App CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-stone-200/80 dark:border-white/10 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shadow-sm"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
          </button>

          <Link
            to={user ? (user.role === 'owner' ? '/dashboard' : '/pos') : '/login'}
            className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/30 transition-all duration-200"
          >
            <span>{user ? 'Buka Aplikasi' : 'Login'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* 3. ROLE SWITCHER TABS (OWNER vs KASIR) */}
      <div className="relative z-40 max-w-md mx-auto mt-4 px-4 flex justify-center">
        <div className="p-1 rounded-full bg-white/90 dark:bg-stone-900/90 backdrop-blur-2xl border border-stone-200 dark:border-white/10 flex items-center gap-1 shadow-lg dark:shadow-2xl">
          <button
            type="button"
            onClick={() => setActiveRole('owner')}
            className={`px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 ${activeRole === 'owner'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Owner Portal (12)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRole('kasir')}
            className={`px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 ${activeRole === 'kasir'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Kasir Terminal (4)</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN 3D CURVED CAROUSEL CONTAINER (GLASSY CAROUSEL V2) */}
      <main
        onWheel={handleWheel}
        className="relative z-30 w-full min-h-[580px] sm:min-h-[640px] md:min-h-[700px] flex items-center justify-center pt-6 pb-24 overflow-hidden touch-pan-y"
      >
        {/* 3D Stage with perspective */}
        <div
          ref={carouselContainerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          style={{ perspective: '1600px' }}
          className="relative w-full max-w-6xl h-[460px] sm:h-[520px] md:h-[580px] flex items-center justify-center select-none cursor-grab active:cursor-grabbing touch-pan-y"
        >
          {currentFeatures.map((feat, idx) => {
            const total = currentFeatures.length;
            // Calculate circular offset relative to currentIndex (-2, -1, 0, 1, 2)
            let offset = (idx - currentIndex + total) % total;
            if (offset > total / 2) {
              offset -= total;
            }

            const isCenter = offset === 0;
            const isVisible = Math.abs(offset) <= 2;

            if (!isVisible) return null;

            // 3D positioning coordinates with live dragOffset for physical responsiveness
            const baseTranslateX = offset * (window.innerWidth < 640 ? 160 : window.innerWidth < 1024 ? 260 : 340);
            const translateX = baseTranslateX + dragOffset;
            const rotateY = offset * -28 - (dragOffset * 0.04);
            const scale = isCenter ? 1 : Math.max(0.72, 1 - Math.abs(offset) * 0.16);
            const zIndex = isCenter ? 30 : 20 - Math.abs(offset) * 5;
            const opacity = isCenter ? 1 : Math.max(0.35, 1 - Math.abs(offset) * 0.35);

            return (
              <motion.div
                key={feat.id}
                layoutId={shouldReduceMotion ? undefined : `card-${feat.id}`}
                onClick={() => {
                  if (isDraggingRef.current) return;
                  if (!isCenter) setCurrentIndex(idx);
                }}
                animate={{
                  x: translateX,
                  rotateY,
                  scale,
                  opacity,
                  zIndex,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 280,
                  damping: 28,
                }}
                style={{
                  transformStyle: 'preserve-3d',
                }}
                className={`absolute w-[300px] sm:w-[380px] md:w-[460px] h-[430px] sm:h-[490px] md:h-[550px] rounded-3xl cursor-grab active:cursor-grabbing transition-shadow duration-300 select-none ${isCenter
                  ? 'shadow-[0_20px_50px_rgba(0,0,0,0.12),0_0_35px_rgba(232,116,12,0.2)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_40px_rgba(232,116,12,0.25)] ring-1 ring-stone-300/80 dark:ring-white/20'
                  : 'shadow-lg dark:shadow-2xl hover:opacity-80'
                  }`}
              >
                {/* Frosted Glass Card Body */}
                <div className="relative w-full h-full rounded-3xl overflow-hidden bg-white/90 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-200/80 dark:border-white/15 flex flex-col justify-between group">
                  {/* Card Background Screenshot */}
                  <div className="absolute inset-0 z-0">
                    <img
                      src={feat.image}
                      alt={feat.title}
                      loading="lazy"
                      draggable={false}
                      className="w-full h-full object-cover object-top filter brightness-95 dark:brightness-90 contrast-105 transition-transform duration-700 group-hover:scale-105 pointer-events-none select-none"
                    />
                    {/* Dark gradient overlay for typography readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-stone-950/20" />
                  </div>

                  {/* Card Top Glass Header (Expand button & More) */}
                  <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between">
                    {/* Expand Pill Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isDraggingRef.current) return;
                        setExpandedFeature(feat);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-stone-900/80 backdrop-blur-md border border-stone-200/90 dark:border-white/20 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:text-black dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shadow-md cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
                      <span>Expand</span>
                    </button>

                    {/* Category Tag */}
                    <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider text-orange-400 shadow-sm">
                      {feat.tag}
                    </div>
                  </div>

                  {/* Card Bottom Glass Info Panel (Inception style) */}
                  <div className="relative z-10 p-5 sm:p-6 bg-white/95 dark:bg-stone-950/85 backdrop-blur-xl border-t border-stone-200/90 dark:border-white/10 space-y-2.5">
                    {/* Title & Counter */}
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-extrabold text-base sm:text-lg md:text-xl text-stone-900 dark:text-white tracking-tight line-clamp-1">
                        {feat.title}
                      </h3>
                      <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400 shrink-0">
                        {idx + 1}/{total}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
                      {feat.desc}
                    </p>

                    {/* Metadata Footer */}
                    <div className="pt-2 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 border-t border-stone-200 dark:border-white/10">
                      <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400/90 font-medium truncate">
                        <Compass className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{feat.category}</span>
                      </span>

                      <span className="font-mono text-stone-500 dark:text-stone-400 shrink-0">
                        {feat.routeUrl}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* 5. BOTTOM FLOATING CONTROL PILL BAR (Reference Bottom Player Bar) */}
      <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-2.5 rounded-full bg-white/95 dark:bg-stone-900/90 backdrop-blur-2xl border border-stone-200/90 dark:border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          {/* Previous Arrow */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Fitur Sebelumnya"
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Autoplay Play/Pause Button */}
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            aria-label={isPlaying ? 'Jeda Otomatis' : 'Putar Otomatis'}
            className="w-8 h-8 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* Center Info Thumbnail & Title */}
          <div className="flex items-center gap-2.5 px-2 border-x border-stone-200 dark:border-white/10 max-w-[200px] sm:max-w-[280px]">
            <img
              src={activeFeature.image}
              alt={activeFeature.title}
              className="w-7 h-7 rounded-full object-cover border border-stone-300 dark:border-white/20 shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-stone-900 dark:text-white truncate">
                  {activeFeature.title}
                </span>
                <span className="px-1.5 py-0.2 rounded-sm bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] font-bold border border-amber-500/30">
                  {activeFeature.number}
                </span>
              </div>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                {activeFeature.tag}
              </span>
            </div>
          </div>

          {/* Expand / Details modal button */}
          <button
            type="button"
            onClick={() => setExpandedFeature(activeFeature)}
            aria-label="Buka Detail Fitur"
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Next Arrow */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Fitur Berikutnya"
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 6. LEFT FLOATING VERTICAL DOCK (Reference Left Dock Pill) */}
      <aside className="fixed left-4 sm:left-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-2.5 p-2 rounded-2xl bg-white/90 dark:bg-stone-900/85 backdrop-blur-xl border border-stone-200 dark:border-white/10 shadow-xl dark:shadow-2xl">
        {/* Toggle Grid Modal */}
        <button
          type="button"
          onClick={() => setIsGridOpen(true)}
          title="Lihat Semua Fitur (Grid View)"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <Grid className="w-4 h-4" />
        </button>

        {/* Role Quick Toggle */}
        <button
          type="button"
          onClick={() => setActiveRole((r) => (r === 'owner' ? 'kasir' : 'owner'))}
          title={`Ganti ke ${activeRole === 'owner' ? 'Kasir' : 'Owner'}`}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          {activeRole === 'owner' ? <Shield className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
        </button>

        {/* Direct Link to Route */}
        <Link
          to={user ? activeFeature.routeUrl : '/login'}
          title={`Buka Halaman Langsung: ${activeFeature.routeUrl}`}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      </aside>

      {/* 7. EXPANDED DETAIL MODAL */}
      <AnimatePresence>
        {expandedFeature && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpandedFeature(null)}
              className="fixed inset-0 bg-black/80 dark:bg-black/85 backdrop-blur-md"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-4xl rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/20 shadow-2xl overflow-hidden z-10 my-auto"
            >
              {/* Modal Top Header */}
              <div className="px-6 py-4 bg-stone-50 dark:bg-stone-950/90 border-b border-stone-200 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-orange-600/10 dark:bg-orange-600/20 text-orange-600 dark:text-orange-400 font-extrabold text-xs flex items-center justify-center border border-orange-500/20 dark:border-orange-500/30">
                    {expandedFeature.number}
                  </span>
                  <div>
                    <h4 className="font-extrabold text-base text-stone-900 dark:text-white">
                      {expandedFeature.title}
                    </h4>
                    <span className="text-xs text-stone-500 dark:text-stone-400">{expandedFeature.category}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedFeature(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Full Screenshot View */}
              <div className="relative bg-stone-100 dark:bg-stone-950/90 border-b border-stone-200 dark:border-white/10 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
                <img
                  src={expandedFeature.image}
                  alt={expandedFeature.title}
                  className="max-h-[460px] w-auto max-w-full object-contain mx-auto rounded-xl shadow-xl dark:shadow-2xl border border-stone-200 dark:border-white/10 block"
                />
              </div>

              {/* Modal Content Info */}
              <div className="p-6 sm:p-8 space-y-4">
                <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                  {expandedFeature.desc}
                </p>

                {/* Checklist */}
                <div className="pt-2 border-t border-stone-200 dark:border-white/10">
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider block mb-2.5">
                    Kapabilitas Sistem Aktual:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {expandedFeature.capabilities.map((cap, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 flex items-center justify-between border-t border-stone-200 dark:border-white/10">
                  <span className="text-xs font-mono text-stone-500">
                    Route: webkasir.test{expandedFeature.routeUrl}
                  </span>

                  <Link
                    to={user ? expandedFeature.routeUrl : '/login'}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white transition-colors shadow-lg"
                  >
                    <span>{user ? 'Akses Modul Ini' : 'Login untuk Mengakses'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. SPATIAL CATALOG SIDE DRAWER (Reference: Spatial Cinema Catalog) */}
      <AnimatePresence>
        {isGridOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGridOpen(false)}
              className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm"
            />

            {/* Side Drawer Container (Left Panel) */}
            <motion.div
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-[390px] sm:max-w-[430px] h-full bg-white/95 dark:bg-[#111014]/95 backdrop-blur-2xl border-r border-stone-200 dark:border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.15)] dark:shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10 flex flex-col justify-between"
            >
              {/* Drawer Top Header (Matching: Spatial Cinema Catalog) */}
              <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {/* Pink/Red/Orange Grid Icon Badge */}
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-500 to-orange-500 text-white flex items-center justify-center shadow-md">
                      <Grid className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-stone-900 dark:text-white text-base tracking-tight">
                      Spatial {activeRole === 'owner' ? 'Owner' : 'Kasir'} Catalog
                    </h3>
                  </div>

                  {/* Circular Close Button */}
                  <button
                    type="button"
                    onClick={() => setIsGridOpen(false)}
                    aria-label="Tutup Katalog"
                    className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-white/10 flex items-center justify-center text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Browse through all {currentFeatures.length} operational features for {activeRole === 'owner' ? 'business owner' : 'counter cashier'}
                </p>
              </div>

              {/* Items List (Vertical Scrollable Cards) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-stone-800">
                {currentFeatures.map((feat, i) => {
                  const isActive = currentIndex === i;
                  return (
                    <button
                      key={feat.id}
                      type="button"
                      onClick={() => {
                        setCurrentIndex(i);
                        setIsGridOpen(false);
                      }}
                      className={`w-full text-left p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-3.5 group ${isActive
                          ? 'bg-rose-50 dark:bg-rose-950/25 border-rose-300 dark:border-rose-500/40 shadow-sm dark:shadow-[0_0_20px_rgba(244,63,94,0.15)] ring-1 ring-rose-400/40 dark:ring-rose-500/30'
                          : 'bg-stone-50/80 dark:bg-stone-900/50 hover:bg-stone-100 dark:hover:bg-stone-900/90 border-stone-200/80 dark:border-white/5 hover:border-stone-300 dark:hover:border-white/15'
                        }`}
                    >
                      {/* Square Thumbnail with Rounded Corners */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-stone-200 dark:bg-black border border-stone-200 dark:border-white/10 relative">
                        <img
                          src={feat.image}
                          alt={feat.title}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Info Center */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4
                            className={`font-bold text-xs sm:text-sm truncate ${isActive ? 'text-rose-900 dark:text-white' : 'text-stone-800 dark:text-stone-200 group-hover:text-black dark:group-hover:text-white'
                              }`}
                          >
                            {feat.title}
                          </h4>
                          <span className="font-mono text-[11px] text-stone-400 dark:text-stone-500 shrink-0">
                            #{feat.number}
                          </span>
                        </div>

                        <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate leading-tight">
                          {feat.category}
                        </p>

                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            POS
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-stone-200/80 dark:bg-white/5 text-stone-700 dark:text-stone-300 border border-stone-300/60 dark:border-white/5">
                            {feat.tag}
                          </span>
                        </div>
                      </div>

                      {/* Right Heart / Favorite Icon */}
                      <div className="shrink-0 p-1">
                        {isActive ? (
                          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                        ) : (
                          <Heart className="w-4 h-4 text-stone-400 dark:text-stone-600 group-hover:text-stone-600 dark:group-hover:text-stone-400 transition-colors" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Drawer Footer Status */}
              <div className="p-4 bg-stone-50 dark:bg-stone-950/80 border-t border-stone-200 dark:border-white/10 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <span className="font-mono text-[11px]">
                  Mode: {activeRole === 'owner' ? 'Owner Portal' : 'Kasir Terminal'}
                </span>
                <span className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold">
                  {currentFeatures.length} Modul Aktif
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
