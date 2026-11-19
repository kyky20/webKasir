import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Receipt,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Printer,
} from 'lucide-react';
import type { Sale, TransactionFilterParams } from '@/types/pos';
import { transactionService } from '@/services/transactionService';
import { formatRupiah, formatDateTime, formatPaymentMethod } from '@/utils/formatters';
import { TransactionDetailModal } from '@/components/pos/TransactionDetailModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Select } from '@/components/ui/Select';

export const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // Detail Modal
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params: TransactionFilterParams = {
        page,
        search: search.trim() || undefined,
        status: status || undefined,
        payment_method: paymentMethod || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      };

      const result = await transactionService.getTransactions(params);
      setTransactions(result.data);
      setMeta({
        current_page: result.meta.current_page,
        last_page: result.meta.last_page,
        total: result.meta.total,
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, search, status, paymentMethod, dateFrom, dateTo]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleOpenDetail = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailModalOpen(true);
  };

  const handleSaleCancelled = (updatedSale: Sale) => {
    setTransactions((prev) =>
      prev.map((s) => (s.id === updatedSale.id ? updatedSale : s))
    );
    setSelectedSale(updatedSale);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setPaymentMethod('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Page Title Header */}
      <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-colors">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Riwayat Seluruh Transaksi</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Audit dan pantau data penjualan toko, cetak ulang nota, atau batalkan transaksi jika diperlukan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)]">
            Total {meta.total} Transaksi
          </span>
          <button
            type="button"
            onClick={fetchTransactions}
            disabled={loading}
            className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-border-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[var(--color-surface)] p-3.5 rounded-xl border border-[var(--color-border)] shadow-xs space-y-3 transition-colors">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search by Invoice */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Cari nomor nota..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] focus:bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-primary)]"
            />
          </div>

          {/* Status Filter */}
          <div>
            <Select
              value={status}
              onChange={(val) => {
                setStatus(String(val));
                setPage(1);
              }}
              options={[
                { value: '', label: 'Semua Status' },
                { value: 'completed', label: 'Selesai' },
                { value: 'cancelled', label: 'Dibatalkan' },
              ]}
            />
          </div>

          {/* Payment Method Filter */}
          <div>
            <Select
              value={paymentMethod}
              onChange={(val) => {
                setPaymentMethod(String(val));
                setPage(1);
              }}
              options={[
                { value: '', label: 'Semua Metode Bayar' },
                { value: 'cash', label: 'Tunai' },
                { value: 'bank_transfer', label: 'Transfer Bank' },
                { value: 'qris', label: 'QRIS' },
              ]}
            />
          </div>

          {/* Date From */}
          <div className="relative">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] focus:bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-primary)]"
            />
          </div>

          {/* Date To */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] focus:bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-primary)]"
            />
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)] rounded-lg whitespace-nowrap cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-xs overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center">
            <LoadingSpinner size="md" label="Memuat riwayat transaksi..." />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-2" />
            <h4 className="text-sm font-bold text-[var(--color-text-primary)]">Belum Ada Data Transaksi</h4>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 max-w-sm mx-auto">
              {search || status || paymentMethod || dateFrom || dateTo
                ? 'Tidak ada transaksi yang cocok dengan filter pencarian.'
                : 'Lakukan penjualan pertama Anda di halaman POS untuk mulai mencatat transaksi.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--color-border-muted)] border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Nomor Nota & Waktu</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Kasir</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Metode Bayar</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">Jumlah Item</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Total Transaksi</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">Status</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-muted)]">
                {transactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-[var(--color-border-muted)]/50 transition-colors">
                    <td className="py-2.5 px-4">
                      <span className="font-bold text-[var(--color-text-primary)] block font-mono">
                        {trx.invoice_number}
                      </span>
                      <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {formatDateTime(trx.created_at)}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-[var(--color-text-primary)]">
                      {trx.cashier?.name || '-'}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--color-border-muted)] text-[var(--color-text-primary)]">
                        {formatPaymentMethod(trx.payment_method)}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-medium text-[var(--color-text-primary)] tabular-nums">
                      {trx.items?.length || 0} barang
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-[var(--color-primary)] text-sm tabular-nums">
                      {formatRupiah(trx.total_amount)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          trx.status === 'completed'
                            ? 'bg-[var(--color-success-light)] text-[var(--color-success)]'
                            : 'bg-[var(--color-danger-light)] text-[var(--color-danger)]'
                        }`}
                      >
                        {trx.status === 'completed' ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>Selesai</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>Batal</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/receipt/${trx.id}?autoprint=1`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors inline-flex items-center"
                          title="Cetak Struk"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(trx)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {meta.last_page > 1 && (
          <div className="p-3 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>
              Halaman {meta.current_page} dari {meta.last_page} ({meta.total} transaksi)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={meta.current_page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-border-muted)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-border-muted)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        sale={selectedSale}
        isOwner={true}
        onSaleCancelled={handleSaleCancelled}
      />
    </div>
  );
};
