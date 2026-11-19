import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  ShoppingBag,
  Receipt,
  Package,
  BarChart3,
  Users,
  ArrowRight,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { useThemeContext } from '@/context/ThemeContext';
import axios from 'axios';
import { LandingNavbar } from './LandingNavbar';

interface PublicStoreProfile {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
  receipt_header: string | null;
  receipt_footer: string | null;
}

export const LandingPage: React.FC = () => {
  const { user, store: authStore } = useAuth();
  const { theme, toggleTheme } = useThemeContext();
  const shouldReduceMotion = useReducedMotion();

  const [profile, setProfile] = useState<PublicStoreProfile | null>(() => {
    if (authStore) {
      return {
        name: authStore.name,
        address: authStore.address || null,
        phone: authStore.phone || null,
        email: authStore.email || null,
        logo: authStore.logo || null,
        receipt_header: authStore.receipt_header || null,
        receipt_footer: authStore.receipt_footer || null,
      };
    }
    return null;
  });

  useEffect(() => {
    // Fetch public store profile
    let isMounted = true;
    axios
      .get('/api/public/company-profile')
      .then((res) => {
        if (isMounted && res.data?.success && res.data?.data) {
          setProfile(res.data.data);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch public store profile, using fallback', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const storeName = profile?.name || authStore?.name || 'Kasirku POS';

  // Smooth scroll handler
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { name: 'Beranda', href: '#beranda' },
    { name: 'Tentang', href: '#tentang' },
    { name: 'Fitur', href: '#fitur' },
    { name: 'Keunggulan', href: '#keunggulan' },
    { name: 'Kontak', href: '#kontak' },
  ];

  const features = [
    {
      icon: ShoppingBag,
      title: 'Point of Sale (POS) Cepat',
      desc: 'Proses kasir kilat dengan pencarian instan, filter kategori, kalkulasi diskon otomatis, dan dukungan barcode scanner.',
      tag: 'Kasir & Kas',
    },
    {
      icon: Receipt,
      title: 'Cetak Struk & Riwayat',
      desc: 'Cetak struk thermal 58mm & 80mm langsung, cetak ulang struk kapan saja, serta fitur pembatalan transaksi dengan pengembalian stok otomatis.',
      tag: 'Operasional',
    },
    {
      icon: Package,
      title: 'Inventaris & Stok Opname',
      desc: 'Pelacakan kartu stok dan mutasi barang masuk/keluar secara real-time. Sistem peringatan dini untuk stok menipis dan habis.',
      tag: 'Logistik',
    },
    {
      icon: BarChart3,
      title: 'Laporan Laba Rugi & Arus Kas',
      desc: 'Perhitungan HPP otomatis, laporan laba kotor, laba bersih, beban operasional, dan cash flow bulanan sesuai standar pembukuan.',
      tag: 'Finansial',
    },
    {
      icon: Layers,
      title: 'Katalog & Multi Kategori',
      desc: 'Kelola SKU, harga pokok (HPP), harga jual bertingkat, dan satuan produk secara terstruktur tanpa batas kuota.',
      tag: 'Master Data',
    },
    {
      icon: Users,
      title: 'Manajemen Pegawai & Audit',
      desc: 'Pemisahan wewenang yang tegas antara Owner dan Kasir. Rekam jejak aktivitas audit log untuk menjaga integritas transaksi.',
      tag: 'Keamanan',
    },
  ];

  const advantages = [
    {
      title: 'Perhitungan HPP Otomatis',
      desc: 'Setiap barang yang terjual langsung dihitung modal pokoknya secara real-time, menyajikan margin laba yang transparan dan akurat.',
    },
    {
      title: 'Proteksi Data Finansial Kasir',
      desc: 'Kasir hanya dapat mengakses modul transaksi penjualan, menjaga privasi omzet total, laba bersih, dan pengeluaran rahasia toko.',
    },
    {
      title: 'Dukungan Cetak Multi-Ukuran',
      desc: 'Kompatibel dengan mesin kasir thermal ukuran 58mm dan 80mm serta format PDF standar cetak laporan formal A4.',
    },
    {
      title: 'Arsitektur Ritel Cepat & Responsif',
      desc: 'Antarmuka responsif yang bekerja mulus di komputer kasir desktop, tablet konter, hingga smartphone kasir keliling.',
    },
  ];

  // Animation variants
  const fadeInVariant = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)] transition-colors duration-200">
      {/* 1. APPLE STYLE FLOATING NAVBAR */}
      <LandingNavbar
        storeName={storeName}
        storeLogo={profile?.logo}
        user={user}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* 2. HERO SECTION (MERCURY INSPIRED HEAD) */}
      <section id="beranda" className="relative pt-16 sm:pt-20 md:pt-24 pb-16 md:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center max-w-4xl mx-auto space-y-6"
          >
            {/* Headline (Mercury Style) */}
            <motion.h1
              variants={fadeInVariant}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-[1.08]"
            >
              Sistem Kasir &amp; Pembukuan Presisi
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeInVariant}
              className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed max-w-2xl mx-auto"
            >
              Dirancang untuk kecepatan transaksi kasir, otomasi stok mutasi, dan laporan laba rugi akuntansi yang transparan untuk pertumbuhan bisnis Anda.
            </motion.p>

            {/* Mercury Action Capsule Bar */}
            <motion.div variants={fadeInVariant} className="pt-2 flex justify-center">
              <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-[var(--color-surface)] dark:bg-stone-900 border border-[var(--color-border)] shadow-md">
                <Link
                  to={user ? (user.role === 'owner' ? '/dashboard' : '/pos') : '/login'}
                  className="inline-flex items-center gap-2 px-6 sm:px-7 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-xs transition-all"
                >
                  <span>{user ? 'Akses Dashboard' : 'Mulai Sekarang'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/demo"
                  className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors pr-5"
                >
                  <span>Lihat Demo</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                </Link>
              </div>
            </motion.div>
          </motion.div>

          {/* 3. MERCURY DEVICE MOCKUP PREVIEW */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative mt-14 sm:mt-18 md:mt-22 max-w-5xl mx-auto"
          >
            {/* Mercury Ethereal Ambient Glow Haze */}
            <div
              aria-hidden="true"
              className="absolute -top-14 left-1/2 -translate-x-1/2 w-4/5 max-w-4xl h-80 rounded-full bg-gradient-to-r from-orange-400/25 via-amber-300/20 to-purple-400/15 dark:from-orange-500/20 dark:via-amber-500/15 dark:to-purple-900/20 blur-[110px] pointer-events-none"
            />

            {/* Device Mockup Frame */}
            <div className="relative rounded-t-[28px] sm:rounded-t-[38px] md:rounded-t-[44px] border-[8px] sm:border-[12px] md:border-[14px] border-[#18181B] bg-[#18181B] shadow-[0_-20px_80px_rgba(0,0,0,0.18)] dark:shadow-[0_-20px_80px_rgba(0,0,0,0.6)] overflow-hidden">
              {/* Window Header */}
              <div className="px-4 py-2.5 bg-[#18181B] flex items-center justify-between text-white/60">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-700 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-700 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-700 inline-block" />
                </div>
                <div className="px-4 py-1 rounded-full bg-stone-800/90 text-[11px] font-mono text-stone-300 border border-white/5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  <span>webkasir.test/dashboard</span>
                </div>
                <div className="text-[11px] font-medium text-stone-400 hidden sm:block">
                  {storeName} &bull; POS &amp; Pembukuan
                </div>
              </div>

              {/* Screen Content: Actual Dashboard Screenshot */}
              <div className="relative bg-stone-900">
                <img
                  src="/images/dashboard-actual.png"
                  alt="Tampilan Aktual Dashboard Kasirku"
                  loading="eager"
                  className="w-full h-auto object-cover block"
                />

                {/* Mercury Floating Pill Disclaimer Banner */}
                <div className="absolute bottom-4 sm:bottom-6 inset-x-4 sm:inset-x-8 flex justify-center pointer-events-none">
                  <div className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#18181B]/90 backdrop-blur-md border border-white/10 text-white/85 text-[10px] sm:text-xs text-center shadow-xl max-w-2xl">
                    Kasirku adalah platform kasir &amp; pembukuan terintegrasi untuk ritel modern. Data transaksi, stok mutasi, dan laporan laba rugi tersinkronisasi secara real-time.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. TENTANG APLIKASI */}
      <section id="tentang" className="py-16 md:py-20 border-t border-[var(--color-border-muted)] bg-[var(--color-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Context Stock Photo */}
            <motion.div
              initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35 }}
              className="relative rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-md group"
            >
              <img
                src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1200&q=80"
                alt="Aktivitas Kasir dan Pelayanan Pelanggan Ritel"
                loading="lazy"
                className="w-full h-72 sm:h-96 object-cover transition-transform duration-500 group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                <div className="text-white space-y-1">
                  <p className="text-xs uppercase tracking-wider font-semibold text-emerald-300">
                    Kecepatan & Pelayanan
                  </p>
                  <p className="text-sm sm:text-base font-bold">
                    Transaksi mulus di meja kasir meningkatkan kepuasan pelanggan toko.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Explanatory Content */}
            <motion.div
              initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35 }}
              className="space-y-5"
            >
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider">
                <Store className="w-4 h-4" />
                <span>Tentang Solusi Kasirku</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] leading-snug">
                Dirancang untuk Kebutuhan Operasional Ritel Modern yang Praktis & Akurat
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Banyak pelaku usaha ritel terjebak antara sistem kasir sederhana yang tidak mencatat pembukuan, atau aplikasi akuntansi rumit yang lambat digunakan di meja kasir.
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                <strong className="text-[var(--color-text-primary)]">{storeName}</strong> menghadirkan keseimbangan sempurna: proses checkout kasir yang cepat dalam hitungan detik, terhubung langsung dengan kartu stok persediaan, pencatatan biaya operasional, dan kalkulasi otomatis laba bersih.
              </p>

              <div className="pt-2 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Integrasi Penjualan & HPP Otomatis</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">Nilai laba kotor langsung terhitung setiap transaksi tanpa perlu rekapitulasi manual di akhir hari.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Kontrol Stok & Peringatan Dini</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">Cegah kehabisan barang terlaris dengan notifikasi stok menipis dan pencatatan stok opname berkala.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Privasi Finansial Terjamin</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">Staf kasir hanya fokus bertransaksi, sementara informasi keuangan rahasia tetap terlindungi dalam kendali Owner.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5. FITUR UNGGULAN */}
      <section id="fitur" className="py-16 md:py-20 border-t border-[var(--color-border-muted)] bg-[var(--color-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider">
              Kemampuan Inti
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
              Semua Fitur yang Anda Butuhkan untuk Mengelola Toko
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
              Dikembangkan berdasarkan alur kerja nyata ritel dari transaksi kasir harian hingga penutupan buku periodik.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  variants={fadeInVariant}
                  className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 transition-colors shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] bg-[var(--color-surface-raised)] px-2.5 py-1 rounded-md border border-[var(--color-border-muted)]">
                        {item.tag}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* 6. RETAIL CONTEXT & INVENTORY SHOWCASE */}
      <section className="py-14 border-t border-[var(--color-border-muted)] bg-[var(--color-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider">
                Manajemen Ritel
              </span>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                Stok Rapi, Pembelian Terpantau, Arus Kas Terkendali
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Kombinasi modul pembelian barang dari supplier, pencatatan utang usaha, serta penyesuaian stok opname menjaga agar persediaan di etalase toko selalu sesuai dengan data di sistem.
              </p>
              <div className="pt-2">
                <Link
                  to={user ? (user.role === 'owner' ? '/dashboard' : '/pos') : '/login'}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] hover:underline"
                >
                  <span>Buka Modul Transaksi & POS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=1200&q=80"
                  alt="Etalase dan Penataan Stok Barang Toko Modern"
                  loading="lazy"
                  className="w-full h-64 sm:h-80 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. KEUNGGULAN BISNIS (VERTICAL ZIG-ZAG TIMELINE WITH GLASSMORPHISM) */}
      <section id="keunggulan" className="relative py-20 md:py-28 border-t border-[var(--color-border-muted)] bg-[var(--color-bg)] overflow-hidden">
        {/* Ambient background glow accents centered directly behind the cards and timeline */}
        <div
          aria-hidden="true"
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[340px] rounded-full bg-orange-500/20 dark:bg-orange-500/15 blur-[100px] pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute top-2/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[360px] rounded-full bg-amber-500/20 dark:bg-amber-500/15 blur-[110px] pointer-events-none"
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16 md:mb-20">
            <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider">
              Nilai Tambah Nyata
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
              Keunggulan Berdasarkan Fitur Aktual Aplikasi
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-[var(--color-text-secondary)] leading-relaxed">
              Solusi yang dibangun tanpa klaim berlebihan, fokus pada keandalan operasional setiap hari.
            </p>
          </div>

          {/* Timeline Container */}
          <div className="relative">
            {/* Center Vertical Connecting Line (Collinear with Header Center) */}
            <div
              aria-hidden="true"
              className="absolute top-6 bottom-6 left-5 sm:left-6 md:left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-orange-400/20 via-orange-500/50 to-amber-500/20 dark:from-orange-500/20 dark:via-orange-400/50 dark:to-amber-400/20 rounded-full"
            />

            {/* Zig-Zag Flow Items: 01 (Left) -> 02 (Right) -> 03 (Left) -> 04 (Right) */}
            <div className="space-y-10 md:space-y-14">
              {advantages.map((adv, idx) => {
                const isLeft = idx % 2 === 0;
                return (
                  <div
                    key={idx}
                    className="relative grid grid-cols-1 md:grid-cols-2 md:gap-x-20 items-center"
                  >
                    {/* Left Column (Desktop: 01 & 03; Mobile: 01 & 03 only) */}
                    <div className={`pl-12 sm:pl-14 md:pl-0 ${isLeft ? 'block' : 'hidden md:block'}`}>
                      {isLeft && (
                        <div className="group relative p-6 sm:p-7 rounded-2xl bg-white/65 dark:bg-slate-900/60 backdrop-blur-xl border border-white/80 dark:border-white/10 dark:border-orange-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/15 hover:border-orange-400/50 dark:hover:border-orange-400/50 transition-all duration-300">
                          {/* Desktop Connector Line: right edge of Left card towards center node */}
                          <div
                            aria-hidden="true"
                            className="hidden md:block absolute -right-10 top-1/2 -translate-y-1/2 w-10 h-0.5 bg-gradient-to-r from-orange-500/30 to-orange-500 group-hover:from-orange-500 group-hover:to-orange-500 transition-colors"
                          />

                          <div className="flex items-start gap-4">
                            <div className="w-9 h-9 shrink-0 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] dark:bg-[var(--color-primary)]/20 dark:text-[var(--color-primary-muted)] flex items-center justify-center font-extrabold text-xs shadow-xs border border-[var(--color-primary)]/20 group-hover:scale-105 transition-transform duration-200">
                              0{idx + 1}
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] tracking-tight group-hover:text-[var(--color-primary)] transition-colors">
                                {adv.title}
                              </h3>
                              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                {adv.desc}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timeline Node / Circle (Precisely in Center on Desktop, Left on Mobile) */}
                    <div
                      aria-hidden="true"
                      className="absolute left-5 sm:left-6 md:left-1/2 -translate-x-1/2 top-6 md:top-1/2 md:-translate-y-1/2 flex items-center justify-center z-10 pointer-events-none"
                    >
                      {/* Outer pulse aura */}
                      <div className="w-5 h-5 rounded-full bg-orange-500/20 dark:bg-orange-400/20 flex items-center justify-center animate-pulse">
                        {/* Core node with soft glow */}
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] border-2 border-white dark:border-stone-900 shadow-[0_0_12px_rgba(232,116,12,0.9)]" />
                      </div>

                      {/* Mobile Horizontal Connector: node to card */}
                      <div className="md:hidden absolute left-full top-1/2 -translate-y-1/2 w-7 h-0.5 bg-gradient-to-r from-orange-500 to-orange-500/30" />
                    </div>

                    {/* Right Column (Desktop: 02 & 04; Mobile: 02 & 04 only) */}
                    <div className={`pl-12 sm:pl-14 md:pl-0 ${!isLeft ? 'block' : 'hidden md:block'}`}>
                      {!isLeft && (
                        <div className="group relative p-6 sm:p-7 rounded-2xl bg-white/65 dark:bg-slate-900/60 backdrop-blur-xl border border-white/80 dark:border-white/10 dark:border-orange-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/15 hover:border-orange-400/50 dark:hover:border-orange-400/50 transition-all duration-300">
                          {/* Desktop Connector Line: left edge of Right card towards center node */}
                          <div
                            aria-hidden="true"
                            className="hidden md:block absolute -left-10 top-1/2 -translate-y-1/2 w-10 h-0.5 bg-gradient-to-l from-orange-500/30 to-orange-500 group-hover:from-orange-500 group-hover:to-orange-500 transition-colors"
                          />

                          <div className="flex items-start gap-4">
                            <div className="w-9 h-9 shrink-0 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] dark:bg-[var(--color-primary)]/20 dark:text-[var(--color-primary-muted)] flex items-center justify-center font-extrabold text-xs shadow-xs border border-[var(--color-primary)]/20 group-hover:scale-105 transition-transform duration-200">
                              0{idx + 1}
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] tracking-tight group-hover:text-[var(--color-primary)] transition-colors">
                                {adv.title}
                              </h3>
                              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                {adv.desc}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 8. COMPANY PROFILE & KONTAK */}
      <section id="kontak" className="py-16 md:py-20 border-t border-[var(--color-border-muted)] bg-[var(--color-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider">
                Profil Usaha & Informasi Kontak
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
                {storeName}
              </h2>
              {profile?.receipt_header && (
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] italic">
                  &ldquo;{profile.receipt_header}&rdquo;
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Alamat */}
              <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-[var(--color-text-primary)] uppercase">Alamat Toko</h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {profile?.address || 'Lokasi usaha telah terdaftar di sistem.'}
                </p>
              </div>

              {/* Telepon */}
              <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-[var(--color-text-primary)] uppercase">Kontak Telepon</h3>
                <p className="text-xs text-[var(--color-text-secondary)] font-mono">
                  {profile?.phone || 'Tersedia di meja kasir'}
                </p>
              </div>

              {/* Email */}
              <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-[var(--color-text-primary)] uppercase">Email Resmi</h3>
                <p className="text-xs text-[var(--color-text-secondary)] font-mono truncate">
                  {profile?.email || 'admin@kasirku.local'}
                </p>
              </div>
            </div>

            {profile?.receipt_footer && (
              <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-center text-xs text-[var(--color-text-secondary)]">
                <span className="font-semibold block mb-0.5 text-[var(--color-text-primary)]">Pesan Layanan:</span>
                &ldquo;{profile.receipt_footer}&rdquo;
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 9. CTA BANNER */}
      <section className="py-14 border-t border-[var(--color-border-muted)] bg-[var(--color-bg)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Siap Mengoptimalkan Operasional Toko Anda?
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
                Buka kasir sekarang untuk mulai melayani pelanggan, mencatat penjualan, dan memantau laba harian Anda.
              </p>
            </div>

            <div className="shrink-0">
              <Link
                to={user ? (user.role === 'owner' ? '/dashboard' : '/pos') : '/login'}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-white text-[var(--color-primary)] hover:bg-emerald-50 transition-colors shadow-sm"
              >
                <span>{user ? 'Buka Dashboard' : 'Masuk ke Kasirku'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <span className="font-bold text-[var(--color-text-primary)]">Kasirku POS</span>
              <span className="text-[var(--color-text-muted)]">&bull; Kasirku Retail POS System</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.href.replace('#', ''))}
                  className="hover:text-[var(--color-primary)] transition-colors cursor-pointer"
                >
                  {link.name}
                </a>
              ))}
            </div>

            <p className="text-[var(--color-text-muted)]">
              &copy; {new Date().getFullYear()} Kasirku POS. Hak Cipta Dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
