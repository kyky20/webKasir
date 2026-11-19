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
import { useAuth } from '@/context/AuthContext';
import type { Sale, TransactionFilterParams } from '@/types/pos';
import { transactionService } from '@/services/transactionService';
import { formatRupiah, formatDateTime, formatPaymentMethod } from '@/utils/formatters';
import { TransactionDetailModal } from '@/components/pos/TransactionDetailModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Select } from '@/components/ui/Select';

export const MyTransactionsPage: React.FC = () => {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // Detail Modal
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchMyTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params: TransactionFilterParams = {
        page,
        search: search.trim() || undefined,
        status: status || undefined,
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
  }, [page, search, status]);

  useEffect(() => {
    fetchMyTransactions();
  }, [fetchMyTransactions]);

  const handleOpenDetail = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition-colors">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Riwayat Transaksi Saya</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Daftar penjualan kasir yang Anda proses ({user?.name})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)]">
            {meta.total} Transaksi Selesai
          </span>
          <button
            type="button"
            onClick={fetchMyTransactions}
            disabled={loading}
            className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-border-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-border)] shadow-xs flex flex-wrap items-center gap-2.5 transition-colors">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Cari nomor nota transaksi..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-primary)]"
          />
        </div>

        <div className="w-full sm:w-44">
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
      </div>

      {/* Transactions Table */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-xs overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center">
            <LoadingSpinner size="md" label="Memuat riwayat transaksi Anda..." />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-2" />
            <h4 className="text-sm font-bold text-[var(--color-text-primary)]">Belum Ada Transaksi</h4>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Transaksi yang Anda selesaikan di kasir akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--color-border-muted)] border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Nomor Nota & Waktu</th>
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
        isOwner={false}
      />
    </div>
  );
};
