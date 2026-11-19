import React, { useState, useEffect } from 'react';
import {
  X,
  Banknote,
  CreditCard,
  QrCode,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { PaymentMethod, CheckoutPayload, CartItem, Sale } from '@/types/pos';
import { posService } from '@/services/posService';
import { formatRupiah } from '@/utils/formatters';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  totalAmount: number;
  onSuccess: (sale: Sale) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  items,
  discount,
  totalAmount,
  onSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidInput, setPaidInput] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set default paid amount to exact amount when opened
  useEffect(() => {
    if (isOpen) {
      setPaidInput(String(totalAmount));
      setErrorMessage(null);
      setLoading(false);
    }
  }, [isOpen, totalAmount]);

  if (!isOpen) return null;

  const currentPaid = parseFloat(paidInput.replace(/\D/g, '')) || 0;
  const changeAmount = paymentMethod === 'cash' ? Math.max(0, currentPaid - totalAmount) : 0;
  const isCashDeficit = paymentMethod === 'cash' && currentPaid < totalAmount;

  const handleQuickCash = (amount: number) => {
    setPaidInput(String(amount));
  };

  const handleAddCash = (increment: number) => {
    setPaidInput(String(currentPaid + increment));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCashDeficit) {
      setErrorMessage('Nominal uang diterima kurang dari total tagihan.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    // Generate unique idempotency key
    const idempotencyKey = `POS-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const payload: CheckoutPayload = {
      items: items.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
      })),
      payment_method: paymentMethod,
      paid_amount: paymentMethod === 'cash' ? currentPaid : totalAmount,
      discount_amount: discount > 0 ? discount : undefined,
      notes: notes.trim() || undefined,
      idempotency_key: idempotencyKey,
    };

    try {
      const sale = await posService.checkout(payload);
      onSuccess(sale);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setErrorMessage(axiosErr.response?.data?.message || 'Gagal memproses transaksi.');
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Terjadi kesalahan saat memproses pembayaran.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="bg-[var(--color-surface)] w-full max-w-lg rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="p-4 border-b border-[var(--color-border-muted)] flex items-center justify-between bg-[var(--color-surface-raised)]">
            <div>
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">Konfirmasi Pembayaran</h3>
              <p className="text-xs text-[var(--color-text-muted)]">Selesaikan transaksi kasir dan cetak struk</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-[var(--color-danger-light)] border border-[var(--color-danger)]/30 text-[var(--color-danger)] flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Grand Total Display */}
            <div className="p-4 rounded-xl bg-[var(--color-primary-light)] border border-[var(--color-primary-muted)]/40 text-center">
              <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block">
                Total Tagihan Pembayaran
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-[var(--color-primary)] mt-0.5 tabular-nums">
                {formatRupiah(totalAmount)}
              </p>
            </div>

            {/* Payment Method Selection */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-2">
                Pilih Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('cash');
                    setPaidInput(String(totalAmount));
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)] shadow-xs'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-muted)]'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span>Tunai</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)] shadow-xs'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-muted)]'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Transfer Bank</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('qris')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    paymentMethod === 'qris'
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)] shadow-xs'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-muted)]'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span>QRIS</span>
                </button>
              </div>
            </div>

            {/* Cash Details */}
            {paymentMethod === 'cash' ? (
              <div className="space-y-3 pt-1">
                <div>
                  <label htmlFor="paidAmount" className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                    Uang Diterima (Rp)
                  </label>
                  <input
                    id="paidAmount"
                    type="text"
                    required
                    value={paidInput}
                    onChange={(e) => setPaidInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 text-base font-bold rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 tabular-nums"
                  />
                </div>

                {/* Quick Cash Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(totalAmount)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[var(--color-border-muted)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] cursor-pointer"
                  >
                    Uang Pas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddCash(10000)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[var(--color-border-muted)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] cursor-pointer"
                  >
                    +10rb
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddCash(20000)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[var(--color-border-muted)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] cursor-pointer"
                  >
                    +20rb
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddCash(50000)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[var(--color-border-muted)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] cursor-pointer"
                  >
                    +50rb
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(50000)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[var(--color-border-muted)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] cursor-pointer"
                  >
                    Rp 50.000
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(100000)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[var(--color-border-muted)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] cursor-pointer"
                  >
                    Rp 100.000
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(200000)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[var(--color-border-muted)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] cursor-pointer"
                  >
                    Rp 200.000
                  </button>
                </div>

                {/* Kembalian / Kurang calculation */}
                <div
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    isCashDeficit
                      ? 'bg-[var(--color-warning-light)] border-[var(--color-warning)]/40 text-[var(--color-warning)]'
                      : 'bg-[var(--color-surface-raised)] border-[var(--color-border)] text-[var(--color-text-primary)]'
                  }`}
                >
                  <span className="text-xs font-semibold">
                    {isCashDeficit ? 'Kekurangan Pembayaran:' : 'Kembalian:'}
                  </span>
                  <span className={`text-lg font-bold tabular-nums ${isCashDeficit ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'}`}>
                    {isCashDeficit
                      ? formatRupiah(totalAmount - currentPaid)
                      : formatRupiah(changeAmount)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] shrink-0" />
                <span>
                  Pembayaran non-tunai ({paymentMethod === 'qris' ? 'QRIS' : 'Transfer Bank'}) dicatat sesuai nominal tagihan tanpa kembalian.
                </span>
              </div>
            )}

            {/* Notes field */}
            <div>
              <label htmlFor="notes" className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Catatan Transaksi (Opsional)
              </label>
              <input
                id="notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Meja 4, take away, pelanggan VIP"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-primary)]"
              />
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold text-[var(--color-text-secondary)] bg-[var(--color-border-muted)] hover:bg-[var(--color-border)] transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || isCashDeficit}
                className="flex-2 py-2.5 px-4 rounded-lg text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses Transaksi...</span>
                  </>
                ) : (
                  <span>Konfirmasi Pembayaran</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
