import React, { useState } from 'react';
import {
  X,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  PackageCheck,
  AlertTriangle,
} from 'lucide-react';
import type { Purchase } from '../../types/purchase';
import { purchaseService } from '../../services/purchaseService';
import { PayDebtModal } from './PayDebtModal';

interface PurchaseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  purchase: Purchase | null;
}

export const PurchaseDetailModal: React.FC<PurchaseDetailModalProps> = ({
  isOpen,
  onClose,
  onRefresh,
  purchase,
}) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payModalOpen, setPayModalOpen] = useState(false);

  if (!isOpen || !purchase) return null;

  const handleReceive = async () => {
    if (!window.confirm('Konfirmasi penerimaan barang untuk pembelian ini? Stok produk akan langsung bertambah.')) {
      return;
    }

    setProcessing(true);
    setError(null);
    try {
      await purchaseService.receivePurchase(purchase.id);
      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memproses penerimaan barang.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    const reason = window.prompt('Masukkan alasan pembatalan pembelian:');
    if (reason === null) return;

    setProcessing(true);
    setError(null);
    try {
      await purchaseService.cancelPurchase(purchase.id, reason.trim() || undefined);
      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal membatalkan pembelian.');
    } finally {
      setProcessing(false);
    }
  };

  const remainingPayable = purchase.payable ? Number(purchase.payable.remaining_amount) : 0;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-xl">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[var(--color-text-primary)] text-base font-mono">{purchase.invoice_number}</h3>
                  {purchase.status === 'received' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--color-success-light)] text-[var(--color-success)]">
                      <CheckCircle2 className="w-3 h-3" /> Diterima
                    </span>
                  )}
                  {purchase.status === 'draft' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                      <Clock className="w-3 h-3" /> Draft PO
                    </span>
                  )}
                  {purchase.status === 'cancelled' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--color-danger-light)] text-[var(--color-danger)]">
                      <XCircle className="w-3 h-3" /> Dibatalkan
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Dibuat oleh: <span className="font-medium text-[var(--color-text-secondary)]">{purchase.creator?.name || 'User'}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-border-muted)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs text-[var(--color-danger)] bg-[var(--color-danger-light)] border border-[var(--color-danger)]/20 rounded-xl">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Meta Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)] text-xs">
              <div>
                <span className="block text-[11px] font-semibold text-[var(--color-text-muted)] uppercase">Supplier</span>
                <div className="flex items-center gap-1.5 font-medium text-[var(--color-text-primary)] mt-1">
                  <Building2 className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                  <span>{purchase.supplier?.name || 'Tanpa Supplier (Umum)'}</span>
                </div>
                {purchase.supplier?.phone && (
                  <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">
                    Telp: {purchase.supplier.phone}
                  </span>
                )}
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-[var(--color-text-muted)] uppercase">
                  Waktu & Referensi
                </span>
                <div className="flex items-center gap-1.5 font-medium text-[var(--color-text-primary)] mt-1 font-mono">
                  <Calendar className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                  <span>{purchase.purchase_date}</span>
                </div>
                {purchase.reference_no && (
                  <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5 font-mono">
                    No. Ref: {purchase.reference_no}
                  </span>
                )}
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-[var(--color-text-muted)] uppercase">
                  Status Pembayaran
                </span>
                <div className="mt-1">
                  {purchase.payment_status === 'paid' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--color-success-light)] text-[var(--color-success)]">
                      Lunas ({purchase.payment_method === 'cash' ? 'Tunai' : purchase.payment_method === 'bank_transfer' ? 'Transfer' : 'Tempo'})
                    </span>
                  ) : purchase.payment_status === 'partially_paid' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                      Sebagian (Sisa Utang)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--color-danger-light)] text-[var(--color-danger)]">
                      Belum Bayar (Utang)
                    </span>
                  )}
                </div>
                {purchase.due_date && (
                  <span className="text-[11px] text-[var(--color-danger)] block mt-0.5 font-medium font-mono">
                    Jatuh Tempo: {purchase.due_date}
                  </span>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-2">
                Daftar Barang Pembelian
              </h4>
              <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] text-[11px] font-semibold text-[var(--color-text-muted)] uppercase">
                    <tr>
                      <th className="px-4 py-3">Barang</th>
                      <th className="px-4 py-3 text-right">Harga Satuan</th>
                      <th className="px-4 py-3 text-center">Jumlah</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-muted)]">
                    {purchase.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-[var(--color-border-muted)]/30">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[var(--color-text-primary)]">{item.product_name}</div>
                          <div className="text-[11px] text-[var(--color-text-muted)] font-mono">SKU: {item.product_sku}</div>
                        </td>
                        <td className="px-4 py-3 text-right text-[var(--color-text-secondary)] font-mono">
                          Rp {Number(item.unit_cost).toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-[var(--color-text-primary)] font-mono">
                          {item.quantity} {item.product?.unit || 'pcs'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)] font-mono">
                          Rp {Number(item.subtotal).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {purchase.notes && (
                  <div className="p-3.5 bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] whitespace-pre-line">
                    <span className="font-semibold text-[var(--color-text-primary)] block mb-1">Catatan:</span>
                    {purchase.notes}
                  </div>
                )}
              </div>

              <div className="space-y-1.5 p-4 bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)] text-xs">
                <div className="flex justify-between text-[var(--color-text-secondary)]">
                  <span>Subtotal Barang:</span>
                  <span className="font-mono">Rp {Number(purchase.subtotal).toLocaleString('id-ID')}</span>
                </div>
                {Number(purchase.discount_amount) > 0 && (
                  <div className="flex justify-between text-[var(--color-success)]">
                    <span>Diskon:</span>
                    <span className="font-mono">
                      - Rp {Number(purchase.discount_amount).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                {Number(purchase.additional_cost) > 0 && (
                  <div className="flex justify-between text-[var(--color-text-secondary)]">
                    <span>Biaya Tambahan:</span>
                    <span className="font-mono">+ Rp {Number(purchase.additional_cost).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-[var(--color-text-primary)] pt-2 border-t border-[var(--color-border)]">
                  <span>Total Pembelian:</span>
                  <span className="text-[var(--color-primary)] text-sm font-mono">
                    Rp {Number(purchase.total_amount).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                  <span>Jumlah Terbayar:</span>
                  <span className="text-[var(--color-success)] font-semibold font-mono">
                    Rp {Number(purchase.paid_amount).toLocaleString('id-ID')}
                  </span>
                </div>
                {remainingPayable > 0 && (
                  <div className="flex justify-between text-xs text-[var(--color-danger)] font-bold pt-1 border-t border-[var(--color-border)] font-mono">
                    <span>Sisa Utang:</span>
                    <span>Rp {remainingPayable.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)]">
            <div>
              {purchase.status !== 'cancelled' && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={processing}
                  className="px-3.5 py-2 text-xs font-semibold text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] rounded-xl transition-colors cursor-pointer"
                >
                  Batalkan Pembelian
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {purchase.status === 'draft' && (
                <button
                  type="button"
                  onClick={handleReceive}
                  disabled={processing}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Konfirmasi Penerimaan Barang</span>
                </button>
              )}

              {purchase.payable && remainingPayable > 0 && (
                <button
                  type="button"
                  onClick={() => setPayModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[var(--color-success)] hover:bg-[var(--color-success)]/90 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Bayar Utang (Rp {remainingPayable.toLocaleString('id-ID')})</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-border-muted)] transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>

      {purchase.payable && (
        <PayDebtModal
          isOpen={payModalOpen}
          onClose={() => setPayModalOpen(false)}
          onSuccess={() => {
            onRefresh();
            onClose();
          }}
          payable={purchase.payable}
        />
      )}
    </>
  );
};
