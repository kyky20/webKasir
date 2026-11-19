import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  Building2,
  Calendar,
  Eye,
  PackageCheck,
} from 'lucide-react';
import type { Purchase, PurchaseSummary, Supplier, Payable } from '../../types/purchase';
import { purchaseService } from '../../services/purchaseService';
import { contactService } from '../../services/contactService';
import { PurchaseFormModal } from '../../components/purchases/PurchaseFormModal';
import { PurchaseDetailModal } from '../../components/purchases/PurchaseDetailModal';
import { PayDebtModal } from '../../components/purchases/PayDebtModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Select } from '@/components/ui/Select';

export const PurchasesPage = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [summary, setSummary] = useState<PurchaseSummary | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);

  // Fetch initial suppliers for filter dropdown
  useEffect(() => {
    contactService
      .getSuppliers({ all: true })
      .then((res) => setSuppliers(res.data))
      .catch((err) => console.error('Failed to load suppliers for filter', err));
  }, []);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await purchaseService.getPurchases({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        payment_status: paymentFilter || undefined,
        supplier_id: supplierFilter ? Number(supplierFilter) : undefined,
      });
      setPurchases(res.data);
      setSummary(res.summary);
    } catch (err) {
      console.error('Failed to fetch purchases', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, paymentFilter, supplierFilter]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handleOpenDetail = (p: Purchase) => {
    setSelectedPurchase(p);
    setDetailModalOpen(true);
  };

  const handleQuickReceive = async (p: Purchase) => {
    if (!window.confirm(`Konfirmasi penerimaan barang untuk faktur ${p.invoice_number}? Stok akan bertambah otomatis.`)) {
      return;
    }

    try {
      await purchaseService.receivePurchase(p.id);
      fetchPurchases();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menerima barang.');
    }
  };

  const handleQuickPayDebt = (p: Purchase) => {
    if (!p.payable) return;
    setSelectedPayable(p.payable);
    setPayModalOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs transition-colors">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)] tracking-tight">Pembelian & Pasokan Stok</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Catat pesanan barang dari supplier, penerimaan stok, dan kelola utang usaha.
          </p>
        </div>

        <button
          onClick={() => setFormModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Pembelian Baru</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Total Pembelian Diterima
            </span>
            <div className="p-2 bg-[var(--color-success-light)] text-[var(--color-success)] rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--color-text-primary)] mt-2 tabular-nums">
            Rp {(summary?.total_received_amount || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mt-1">Barang masuk & tercatat di stok</div>
        </div>

        <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Utang Belum Lunas
            </span>
            <div className="p-2 bg-[var(--color-danger-light)] text-[var(--color-danger)] rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--color-danger)] mt-2 tabular-nums">
            Rp {(summary?.total_unpaid_payables || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mt-1">Total kewajiban utang ke supplier</div>
        </div>

        <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Draft Menunggu Masuk
            </span>
            <div className="p-2 bg-[var(--color-warning-light)] text-[var(--color-warning)] rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--color-text-primary)] mt-2 tabular-nums">
            {summary?.draft_count || 0} Faktur
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mt-1">Pesanan PO belum dikonfirmasi terima</div>
        </div>

        <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Total Transaksi
            </span>
            <div className="p-2 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-lg">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--color-text-primary)] mt-2 tabular-nums">
            {summary?.total_purchases_count || 0} Transaksi
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mt-1">Semua riwayat pembelian</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-xs flex flex-wrap items-center justify-between gap-3 transition-colors">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari No. Faktur, No. Ref, Supplier..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)]"
          />
          <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-2" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <div className="w-36">
            <Select
              value={statusFilter}
              onChange={(val) => setStatusFilter(String(val))}
              options={[
                { value: '', label: 'Status: Semua' },
                { value: 'received', label: 'Diterima' },
                { value: 'draft', label: 'Draft PO' },
                { value: 'cancelled', label: 'Dibatalkan' },
              ]}
            />
          </div>

          <div className="w-44">
            <Select
              value={paymentFilter}
              onChange={(val) => setPaymentFilter(String(val))}
              options={[
                { value: '', label: 'Pembayaran: Semua' },
                { value: 'paid', label: 'Lunas' },
                { value: 'partially_paid', label: 'Sebagian (Sisa Utang)' },
                { value: 'unpaid', label: 'Belum Bayar' },
              ]}
            />
          </div>

          <div className="w-44">
            <Select
              value={supplierFilter}
              onChange={(val) => setSupplierFilter(String(val))}
              options={[
                { value: '', label: 'Supplier: Semua' },
                ...suppliers.map((s) => ({
                  value: s.id,
                  label: s.name,
                })),
              ]}
            />
          </div>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden shadow-xs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--color-border-muted)] border-b border-[var(--color-border)] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider text-[11px]">
                <th className="px-5 py-2.5">Faktur & Tanggal</th>
                <th className="px-5 py-2.5">Supplier</th>
                <th className="px-5 py-2.5 text-center">Status Penerimaan</th>
                <th className="px-5 py-2.5 text-center">Status Bayar</th>
                <th className="px-5 py-2.5 text-right">Total Pembelian</th>
                <th className="px-5 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-muted)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    <LoadingSpinner size="md" label="Memuat data pembelian..." />
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[var(--color-text-muted)]">
                    <ShoppingBag className="w-10 h-10 mx-auto text-[var(--color-border)] mb-2" />
                    Belum ada transaksi pembelian yang tercatat.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => {
                  const remainingDebt = p.payable ? Number(p.payable.remaining_amount) : 0;
                  return (
                    <tr key={p.id} className="hover:bg-[var(--color-border-muted)]/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-[var(--color-text-primary)]">{p.invoice_number}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{p.purchase_date}</span>
                          {p.reference_no && (
                            <span className="text-[var(--color-text-muted)]">| Ref: {p.reference_no}</span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 font-medium text-[var(--color-text-primary)]">
                          <Building2 className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                          <span>{p.supplier?.name || 'Tanpa Supplier (Umum)'}</span>
                        </div>
                        {p.supplier?.phone && (
                          <div className="text-[10px] text-[var(--color-text-muted)] ml-5">{p.supplier.phone}</div>
                        )}
                      </td>

                      <td className="px-5 py-3 text-center">
                        {p.status === 'received' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--color-success-light)] text-[var(--color-success)]">
                            <CheckCircle2 className="w-3 h-3" /> Diterima
                          </span>
                        )}
                        {p.status === 'draft' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--color-warning-light)] text-[var(--color-warning)]">
                            <Clock className="w-3 h-3" /> Draft PO
                          </span>
                        )}
                        {p.status === 'cancelled' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--color-danger-light)] text-[var(--color-danger)]">
                            <XCircle className="w-3 h-3" /> Dibatalkan
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3 text-center">
                        {p.payment_status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--color-success-light)] text-[var(--color-success)]">
                            Lunas
                          </span>
                        ) : p.payment_status === 'partially_paid' ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--color-warning-light)] text-[var(--color-warning)]">
                              Sebagian
                            </span>
                            {remainingDebt > 0 && (
                              <span className="text-[10px] text-[var(--color-danger)] font-bold mt-0.5 tabular-nums">
                                Sisa: Rp {remainingDebt.toLocaleString('id-ID')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--color-danger-light)] text-[var(--color-danger)]">
                              Belum Bayar
                            </span>
                            {remainingDebt > 0 && (
                              <span className="text-[10px] text-[var(--color-danger)] font-bold mt-0.5 tabular-nums">
                                Sisa: Rp {remainingDebt.toLocaleString('id-ID')}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3 text-right">
                        <div className="font-bold text-[var(--color-text-primary)] tabular-nums">
                          Rp {Number(p.total_amount).toLocaleString('id-ID')}
                        </div>
                        <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                          {p.items_count || 0} item barang
                        </div>
                      </td>

                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status === 'draft' && (
                            <button
                              onClick={() => handleQuickReceive(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-lg transition-colors cursor-pointer"
                              title="Konfirmasi Penerimaan Barang"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Terima</span>
                            </button>
                          )}

                          {p.payable && remainingDebt > 0 && (
                            <button
                              onClick={() => handleQuickPayDebt(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-[var(--color-success)] hover:opacity-90 rounded-lg transition-colors cursor-pointer"
                              title="Bayar Utang"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Bayar</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenDetail(p)}
                            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border-muted)] rounded-lg transition-colors cursor-pointer"
                            title="Lihat Detail Faktur"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <PurchaseFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSuccess={fetchPurchases}
      />

      <PurchaseDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onRefresh={fetchPurchases}
        purchase={selectedPurchase}
      />

      <PayDebtModal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        onSuccess={fetchPurchases}
        payable={selectedPayable}
      />
    </div>
  );
};
