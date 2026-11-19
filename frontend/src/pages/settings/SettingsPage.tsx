import React, { useState, useEffect } from 'react';
import {
  Store as StoreIcon,
  Save,
  Receipt,
  Printer,
  Percent,
  Clock,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { employeeService } from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';

export const SettingsPage = () => {
  const { store, refreshAuth } = useAuth();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('IDR');
  const [timezone, setTimezone] = useState('Asia/Jakarta');
  const [taxPercentage, setTaxPercentage] = useState<number | ''>(0);
  const [receiptHeader, setReceiptHeader] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [receiptPaperSize, setReceiptPaperSize] = useState<'58mm' | '80mm'>('58mm');
  const [showCashierName, setShowCashierName] = useState(true);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    employeeService
      .getStoreSettings()
      .then((res) => {
        const s = res.data;
        setName(s.name || '');
        setAddress(s.address || '');
        setPhone(s.phone || '');
        setEmail(s.email || '');
        setCurrency(s.currency || 'IDR');
        setTimezone(s.timezone || 'Asia/Jakarta');
        setTaxPercentage(Number(s.tax_percentage) || 0);
        setReceiptHeader(s.receipt_header || '');
        setReceiptFooter(s.receipt_footer || '');
        setReceiptPaperSize(s.receipt_paper_size || '58mm');
        setShowCashierName(s.show_cashier_name ?? true);
      })
      .catch((err) => console.error('Failed to load store settings', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama toko wajib diisi.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await employeeService.updateStoreSettings({
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        currency,
        timezone,
        tax_percentage: Number(taxPercentage) || 0,
        receipt_header: receiptHeader.trim() || undefined,
        receipt_footer: receiptFooter.trim() || undefined,
        receipt_paper_size: receiptPaperSize,
        show_cashier_name: showCashierName,
      });

      setSuccessMsg('Pengaturan toko dan konfigurasi struk berhasil disimpan!');
      await refreshAuth();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan pengaturan toko.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-[var(--color-text-muted)] text-xs">
        Memuat konfigurasi toko...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Pengaturan Toko & Struk"
        subtitle="Konfigurasi profil usaha, tarif pajak, dan format cetak struk kasir termal."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Pengaturan' },
        ]}
      />

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs text-[var(--color-danger)] bg-[var(--color-danger-light)] border border-[var(--color-danger)]/20 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3 text-xs text-[var(--color-success)] bg-[var(--color-success-light)] border border-[var(--color-success)]/20 rounded-xl">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--color-success)]" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Profile & Receipt */}
        <div className="lg:col-span-7 space-y-6">
          {/* Store Profile Card */}
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--color-border)] text-[var(--color-primary)]">
              <StoreIcon className="w-5 h-5" />
              <h3 className="font-bold text-sm text-[var(--color-text-primary)]">Profil Identitas Usaha</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                Nama Toko / Usaha <span className="text-[var(--color-danger)]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Toko Kasirku Makmur"
                className="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)] transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                  No. Telepon Toko
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)]"
                  />
                  <Phone className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                  Email Toko
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="toko@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)]"
                  />
                  <Mail className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                Alamat Lengkap Toko
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jl. Raya No. XX, Kota, Provinsi..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)]"
                />
                <MapPin className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--color-border)]">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                  Mata Uang
                </label>
                <Select
                  value={currency}
                  onChange={(val) => setCurrency(String(val))}
                  options={[
                    { value: 'IDR', label: 'IDR (Rupiah)' },
                    { value: 'USD', label: 'USD (Dollar)' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                  Zona Waktu
                </label>
                <Select
                  value={timezone}
                  onChange={(val) => setTimezone(String(val))}
                  icon={<Clock className="w-3.5 h-3.5" />}
                  options={[
                    { value: 'Asia/Jakarta', label: 'WIB (Jakarta)' },
                    { value: 'Asia/Makassar', label: 'WITA (Makassar)' },
                    { value: 'Asia/Jayapura', label: 'WIT (Jayapura)' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                  Pajak Toko (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={taxPercentage}
                    onChange={(e) => setTaxPercentage(e.target.value ? Number(e.target.value) : '')}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)]"
                  />
                  <Percent className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Receipt Settings Card */}
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--color-border)] text-[var(--color-primary)]">
              <Receipt className="w-5 h-5" />
              <h3 className="font-bold text-sm text-[var(--color-text-primary)]">Konfigurasi Struk Kasir Termal</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                Pesan Header Struk
              </label>
              <textarea
                rows={2}
                value={receiptHeader}
                onChange={(e) => setReceiptHeader(e.target.value)}
                placeholder="Contoh: Selamat Datang di Toko Kasirku"
                className="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                Pesan Footer Struk
              </label>
              <textarea
                rows={2}
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="Contoh: Barang yang sudah dibeli tidak dapat ditukar. Terima kasih!"
                className="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1.5">
                  Ukuran Kertas Default
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReceiptPaperSize('58mm')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      receiptPaperSize === '58mm'
                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                        : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-border-muted)]'
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>58mm (Kecil)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReceiptPaperSize('80mm')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      receiptPaperSize === '80mm'
                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                        : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-border-muted)]'
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>80mm (Standar)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1.5">
                  Tampilkan Nama Kasir
                </label>
                <button
                  type="button"
                  onClick={() => setShowCashierName(!showCashierName)}
                  className={`w-full py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    showCashierName
                      ? 'bg-[var(--color-success-light)] text-[var(--color-success)] border-[var(--color-success)]/20'
                      : 'bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] border-[var(--color-border)]'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${showCashierName ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)]'}`} />
                  <span>{showCashierName ? 'Nama Kasir Ditampilkan' : 'Nama Kasir Disembunyikan'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}</span>
            </button>
          </div>
        </div>

        {/* Right: Live Receipt Preview Box */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Live Preview Struk ({receiptPaperSize})
              </span>
              <span className="text-[11px] text-[var(--color-text-muted)] font-mono">Thermal Simulator</span>
            </div>

            {/* Receipt Simulated Paper */}
            <div
              className={`mx-auto mt-4 p-5 bg-white text-gray-900 border border-stone-200 rounded-xl shadow-xs font-mono text-xs space-y-3 ${
                receiptPaperSize === '58mm' ? 'max-w-[270px]' : 'max-w-[340px]'
              }`}
            >
              <div className="text-center space-y-1">
                <div className="font-bold text-sm text-gray-900 uppercase tracking-tight">
                  {name || store?.name || 'Toko Kasirku'}
                </div>
                {address && <div className="text-[10px] text-gray-600 leading-tight">{address}</div>}
                {phone && <div className="text-[10px] text-gray-500">Telp: {phone}</div>}
                {receiptHeader && (
                  <div className="text-[10px] italic text-gray-600 pt-1 border-t border-dashed border-gray-300">
                    {receiptHeader}
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-gray-400 pt-2 text-[10px] space-y-0.5">
                <div className="flex justify-between">
                  <span>No: INV-20261119-0012</span>
                  <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {showCashierName && (
                  <div>Kasir: Siti Rahmawati</div>
                )}
              </div>

              <div className="border-t border-dashed border-gray-400 pt-2 space-y-1 text-[11px]">
                <div>
                  <div className="font-semibold text-gray-900">Kopi Susu Aren 250ml</div>
                  <div className="flex justify-between text-gray-600">
                    <span>2 x Rp 15.000</span>
                    <span>Rp 30.000</span>
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Keripik Singkong Balado</div>
                  <div className="flex justify-between text-gray-600">
                    <span>1 x Rp 12.000</span>
                    <span>Rp 12.000</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-400 pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rp 42.000</span>
                </div>
                {Number(taxPercentage) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>PPN ({taxPercentage}%):</span>
                    <span>Rp {Math.round(42000 * (Number(taxPercentage) / 100)).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-gray-900 pt-1 border-t border-dashed border-gray-400">
                  <span>TOTAL:</span>
                  <span>
                    Rp {Math.round(42000 * (1 + Number(taxPercentage) / 100)).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>TUNAI:</span>
                  <span>Rp 50.000</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>KEMBALI:</span>
                  <span>
                    Rp {Math.max(0, 50000 - Math.round(42000 * (1 + Number(taxPercentage) / 100))).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-400 pt-2 text-center text-[10px] text-gray-600 space-y-1">
                {receiptFooter ? (
                  <div className="whitespace-pre-line">{receiptFooter}</div>
                ) : (
                  <div>Terima kasih atas kunjungan Anda!</div>
                )}
                <div className="text-[9px] text-gray-400">Powered by Kasirku POS</div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
