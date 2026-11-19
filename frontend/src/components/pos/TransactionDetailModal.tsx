import React, { useState } from 'react';
import {
  X,
  Printer,
  Calendar,
  User,
  AlertTriangle,
  Receipt,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { Sale } from '@/types/pos';
import { formatRupiah, formatDateTime, formatPaymentMethod } from '@/utils/formatters';
import { transactionService } from '@/services/transactionService';

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  isOwner: boolean;
  onSaleCancelled?: (updatedSale: Sale) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  onClose,
  sale,
  isOwner,
  onSaleCancelled,
}) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    const receiptUrl = `/receipt/${sale.id}?autoprint=1`;
    const popup = window.open(
      receiptUrl,
      'KasirkuReceiptPrint',
      'width=420,height=680,left=200,top=100,toolbar=0,menubar=0,location=0,status=0,scrollbars=1'
    );
    if (!popup) {
      window.open(receiptUrl, '_blank');
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      setErrorMessage('Alasan pembatalan wajib diisi.');
      return;
    }

    setCancelLoading(true);
    setErrorMessage(null);

    try {
      const updated = await transactionService.cancelTransaction(sale.id, cancelReason.trim());
      if (onSaleCancelled) {
        onSaleCancelled(updated);
      }
      setShowCancelConfirm(false);
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setErrorMessage(axiosErr.response?.data?.message || 'Gagal membatalkan transaksi.');
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Terjadi kesalahan sistem.');
      }
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs print:p-0 print:bg-white print:static">
      <div className="bg-[var(--color-surface)] w-full max-w-xl rounded-2xl border border-[var(--color-border)] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border-muted)] flex items-center justify-between bg-[var(--color-surface-raised)] print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Detail Transaksi</h3>
              <p className="text-xs text-[var(--color-text-muted)] font-mono">{sale.invoice_number}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${sale.status === 'completed'
                ? 'bg-[var(--color-success-light)] text-[var(--color-success)]'
                : 'bg-[var(--color-danger-light)] text-[var(--color-danger)]'
                }`}
            >
              {sale.status === 'completed' ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Selesai</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Dibatalkan</span>
                </>
              )}
            </span>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-[#FDECEA] border border-[#F5C6CB] text-[#C0392B] text-xs">
              {errorMessage}
            </div>
          )}

          {/* Cancellation Info Banner (if cancelled) */}
          {sale.status === 'cancelled' && (
            <div className="p-3.5 rounded-xl bg-[#FDECEA] border border-[#F5C6CB] space-y-1 text-xs text-[#C0392B]">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Transaksi Telah Dibatalkan</span>
              </div>
              <p className="text-gray-700">
                <span className="font-semibold">Alasan:</span> {sale.cancellation_reason || '-'}
              </p>
              <p className="text-[11px] text-gray-500">
                Dibatalkan pada: {formatDateTime(sale.cancelled_at)} oleh{' '}
                {sale.cancelled_by_user?.name || 'Owner'}
              </p>
            </div>
          )}

          {/* Meta Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-[var(--color-surface-raised)] p-4 rounded-xl border border-[var(--color-border)]">
            <div>
              <span className="text-[var(--color-text-muted)] block mb-0.5 flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" /> Tanggal Transaksi:
              </span>
              <p className="font-semibold text-[var(--color-text-primary)]">{formatDateTime(sale.created_at)}</p>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] block mb-0.5 flex items-center gap-1 font-medium">
                <User className="w-3.5 h-3.5 text-[var(--color-text-muted)]" /> Kasir Bertugas:
              </span>
              <p className="font-semibold text-[var(--color-text-primary)]">{sale.cashier?.name || '-'}</p>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] block mb-0.5 font-medium">Metode Pembayaran:</span>
              <p className="font-semibold text-[var(--color-text-primary)]">{formatPaymentMethod(sale.payment_method)}</p>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] block mb-0.5 font-medium">Catatan:</span>
              <p className="font-semibold text-[var(--color-text-primary)]">{sale.notes || '-'}</p>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h4 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider mb-2">
              Daftar Barang ({sale.items.length} item)
            </h4>
            <div className="border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-surface)]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--color-surface-raised)] border-b border-[var(--color-border-muted)] text-[var(--color-text-muted)]">
                  <tr>
                    <th className="py-2.5 px-3.5 font-semibold">Produk</th>
                    <th className="py-2.5 px-3.5 font-semibold text-right">Harga</th>
                    <th className="py-2.5 px-3.5 font-semibold text-center">Qty</th>
                    <th className="py-2.5 px-3.5 font-semibold text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-muted)]">
                  {sale.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[var(--color-border-muted)]/50 transition-colors">
                      <td className="py-2.5 px-3.5 font-medium text-[var(--color-text-primary)]">
                        {item.product_name}
                        <span className="block text-[10px] text-[var(--color-text-muted)] font-mono">
                          {item.product_sku}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-[var(--color-text-secondary)] font-mono">
                        {formatRupiah(item.unit_price)}
                      </td>
                      <td className="py-2.5 px-3.5 text-center font-bold text-[var(--color-text-primary)] tabular-nums">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-[var(--color-primary)] font-mono">
                        {formatRupiah(item.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="bg-[var(--color-surface-raised)] p-4 rounded-xl border border-[var(--color-border)] space-y-2 text-xs">
            <div className="flex justify-between text-[var(--color-text-secondary)]">
              <span>Subtotal</span>
              <span className="font-mono">{formatRupiah(sale.subtotal)}</span>
            </div>
            {parseFloat(String(sale.discount_amount)) > 0 && (
              <div className="flex justify-between text-[var(--color-danger)] font-medium">
                <span>Diskon</span>
                <span className="font-mono">- {formatRupiah(sale.discount_amount)}</span>
              </div>
            )}
            {parseFloat(String(sale.tax_amount)) > 0 && (
              <div className="flex justify-between text-[var(--color-text-secondary)]">
                <span>Pajak</span>
                <span className="font-mono">{formatRupiah(sale.tax_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-[var(--color-text-primary)] pt-2 border-t border-[var(--color-border-muted)]">
              <span>Total Tagihan</span>
              <span className="text-[var(--color-primary)] font-mono text-base">{formatRupiah(sale.total_amount)}</span>
            </div>
            <div className="flex justify-between text-[var(--color-text-secondary)]">
              <span>Uang Diterima ({formatPaymentMethod(sale.payment_method)})</span>
              <span className="font-mono">{formatRupiah(sale.paid_amount)}</span>
            </div>
            <div className="flex justify-between font-semibold text-[var(--color-text-primary)]">
              <span>Kembalian</span>
              <span className="font-mono">{formatRupiah(sale.change_amount)}</span>
            </div>
          </div>

          {/* Cancellation Dialog for Owner */}
          {showCancelConfirm && (
            <form
              onSubmit={handleCancelSubmit}
              className="p-4 rounded-xl bg-[var(--color-warning-light)] border border-[var(--color-warning)]/30 space-y-3"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-warning)]">
                <AlertTriangle className="w-4 h-4" />
                <span>Konfirmasi Pembatalan Transaksi</span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Membatalkan transaksi akan mengembalikan stok seluruh barang ke inventaris toko secara otomatis.
              </p>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--color-text-primary)] mb-1">
                  Alasan Pembatalan (Wajib diisi):
                </label>
                <input
                  type="text"
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Contoh: Pelanggan salah pesan / barang cacat"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-primary)]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={cancelLoading}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger)]/90 disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
                >
                  {cancelLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Ya, Batalkan Transaksi</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-3 border-t border-[var(--color-border-muted)] bg-[var(--color-surface-raised)] flex items-center justify-between gap-3 print:hidden">
          <div>
            {isOwner && sale.status === 'completed' && !showCancelConfirm && (
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] transition-colors cursor-pointer"
              >
                Batalkan Transaksi
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="py-2 px-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[var(--color-primary)]" />
              <span>Cetak Ulang Struk</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-lg bg-[var(--color-border-muted)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
