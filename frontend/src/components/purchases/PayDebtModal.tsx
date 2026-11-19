import React, { useState } from 'react';
import { X, CreditCard, AlertCircle, Calendar } from 'lucide-react';
import type { Payable } from '../../types/purchase';
import { purchaseService } from '../../services/purchaseService';

interface PayDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  payable: Payable | null;
}

export const PayDebtModal: React.FC<PayDebtModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  payable,
}) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !payable) return null;

  const remaining = Number(payable.remaining_amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payVal = Number(amount);
    if (!payVal || payVal <= 0) {
      setError('Jumlah pembayaran harus lebih dari 0.');
      return;
    }

    if (payVal > remaining) {
      setError(`Jumlah pembayaran melebihi sisa utang (Rp ${remaining.toLocaleString('id-ID')}).`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await purchaseService.payPayable(payable.id, {
        amount: payVal,
        payment_date: paymentDate,
        notes: notes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mencatat pembayaran utang.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">Pembayaran Utang Supplier</h3>
              <p className="text-xs text-[var(--color-text-muted)] font-mono">Invoice: {payable.invoice_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-border-muted)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-[var(--color-danger)] bg-[var(--color-danger-light)] border border-[var(--color-danger)]/20 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Debt Summary Box */}
          <div className="p-4 bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)] space-y-2 text-xs">
            <div className="flex justify-between text-[var(--color-text-secondary)]">
              <span>Total Utang Awal:</span>
              <span className="font-medium font-mono">
                Rp {Number(payable.total_amount).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between text-[var(--color-text-secondary)]">
              <span>Sudah Dibayar:</span>
              <span className="font-medium text-[var(--color-success)] font-mono">
                Rp {Number(payable.paid_amount).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-[var(--color-border)] font-bold text-[var(--color-text-primary)]">
              <span>Sisa Utang:</span>
              <span className="text-base text-[var(--color-danger)] font-mono">
                Rp {remaining.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
                Jumlah Bayar (Rp) <span className="text-[var(--color-danger)]">*</span>
              </label>
              <button
                type="button"
                onClick={() => setAmount(remaining)}
                className="text-xs text-[var(--color-primary)] hover:underline font-semibold cursor-pointer"
              >
                Bayar Lunas Semua
              </button>
            </div>
            <input
              type="number"
              required
              min="1"
              max={remaining}
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
              placeholder="Masukkan nominal bayar..."
              className="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)] font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
              Tanggal Bayar
            </label>
            <div className="relative">
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer"
              />
              <Calendar className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
              Catatan Pembayaran
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Transfer Mandiri, Bukti No. 123"
              className="w-full px-3 py-2 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-border-muted)] transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || !amount}
              className="px-5 py-2 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Menyimpan...' : 'Konfirmasi Bayar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
