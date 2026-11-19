import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import type { FinancialAccount, ExpenseCategory } from '../../types/finance';
import { financeService } from '../../services/financeService';
import { Select } from '@/components/ui/Select';

interface CashTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultType?: 'expense' | 'income' | 'transfer';
}

export const CashTransactionModal: React.FC<CashTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultType = 'expense',
}) => {
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>(defaultType);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  const [accountId, setAccountId] = useState<number | ''>('');
  const [toAccountId, setToAccountId] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number | ''>('');
  const [recipientPayer, setRecipientPayer] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      Promise.all([financeService.getAccounts(), financeService.getCategories()])
        .then(([accRes, catRes]) => {
          const activeAccs = accRes.data.filter((a) => a.is_active);
          setAccounts(activeAccs);
          if (activeAccs.length > 0 && !accountId) {
            setAccountId(activeAccs[0].id);
            if (activeAccs.length > 1) {
              setToAccountId(activeAccs[1].id);
            }
          }
          setCategories(catRes.data.filter((c) => c.is_active));
        })
        .catch((err) => console.error('Failed to load transaction form data', err));

      setTransactionDate(new Date().toISOString().split('T')[0]);
      setAmount('');
      setRecipientPayer('');
      setReferenceNo('');
      setNotes('');
      setError(null);
    }
  }, [isOpen, defaultType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Nominal transaksi harus lebih dari 0.');
      return;
    }

    if (!accountId) {
      setError('Akun kas/bank wajib dipilih.');
      return;
    }

    if (type === 'transfer' && (!toAccountId || toAccountId === accountId)) {
      setError('Akun tujuan transfer harus berbeda dengan akun sumber.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await financeService.createTransaction({
        type,
        account_id: Number(accountId),
        to_account_id: type === 'transfer' && toAccountId ? Number(toAccountId) : null,
        category_id: type === 'expense' && categoryId ? Number(categoryId) : null,
        transaction_date: transactionDate,
        amount: numAmount,
        recipient_payer: recipientPayer.trim() || undefined,
        reference_no: referenceNo.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan transaksi keuangan.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSourceAccount = accounts.find((a) => a.id === Number(accountId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="flex items-center space-x-2.5">
            <div
              className={`p-2 rounded-xl ${type === 'expense'
                  ? 'bg-[var(--color-danger-light)] text-[var(--color-danger)]'
                  : type === 'income'
                    ? 'bg-[var(--color-success-light)] text-[var(--color-success)]'
                    : 'bg-[var(--color-info-light)] text-[var(--color-info)]'
                }`}
            >
              {type === 'expense' ? (
                <ArrowUpRight className="w-5 h-5" />
              ) : type === 'income' ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowLeftRight className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">Catat Transaksi Kas & Bank</h3>
              <p className="text-xs text-[var(--color-text-muted)]">Pencatatan pengeluaran beban, kas masuk, & mutasi</p>
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

          {/* Type Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${type === 'expense'
                  ? 'bg-[var(--color-danger)] text-white shadow-xs'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Pengeluaran</span>
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${type === 'income'
                  ? 'bg-[var(--color-success)] text-white shadow-xs'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Pemasukan</span>
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${type === 'transfer'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Transfer Kas</span>
            </button>
          </div>

          {/* Source Account & Target Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
                  {type === 'transfer' ? 'Dari Akun' : 'Akun Kas / Bank'} <span className="text-[var(--color-danger)]">*</span>
                </label>
                {selectedSourceAccount && (
                  <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
                    Saldo: Rp {Number(selectedSourceAccount.current_balance).toLocaleString('id-ID')}
                  </span>
                )}
              </div>
              <Select
                value={accountId}
                onChange={(val) => setAccountId(Number(val))}
                options={accounts.map((acc) => ({
                  value: acc.id,
                  label: `${acc.name} (${acc.account_type})`,
                }))}
              />
            </div>

            {type === 'transfer' ? (
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                  Ke Akun Tujuan <span className="text-[var(--color-danger)]">*</span>
                </label>
                <Select
                  value={toAccountId}
                  onChange={(val) => setToAccountId(Number(val))}
                  placeholder="-- Pilih Akun Tujuan --"
                  options={[
                    { value: '', label: '-- Pilih Akun Tujuan --' },
                    ...accounts
                      .filter((a) => a.id !== Number(accountId))
                      .map((acc) => ({
                        value: acc.id,
                        label: `${acc.name} (${acc.account_type})`,
                      })),
                  ]}
                />
              </div>
            ) : type === 'expense' ? (
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                  Kategori Beban
                </label>
                <Select
                  value={categoryId}
                  onChange={(val) => setCategoryId(val ? Number(val) : '')}
                  placeholder="-- Tanpa Kategori (Umum) --"
                  options={[
                    { value: '', label: '-- Tanpa Kategori (Umum) --' },
                    ...categories.map((cat) => ({
                      value: cat.id,
                      label: cat.name,
                    })),
                  ]}
                />
              </div>
            ) : null}
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                Nominal (Rp) <span className="text-[var(--color-danger)]">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder="0"
                className="w-full px-3.5 py-2 text-xs font-bold text-[var(--color-text-primary)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                Tanggal Transaksi
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer"
                />
                <Calendar className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-2" />
              </div>
            </div>
          </div>

          {/* Recipient/Payer & Ref No */}
          {type !== 'transfer' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                  {type === 'expense' ? 'Penerima / Vendor' : 'Pemberi Dana'}
                </label>
                <input
                  type="text"
                  value={recipientPayer}
                  onChange={(e) => setRecipientPayer(e.target.value)}
                  placeholder={type === 'expense' ? 'Contoh: PLN, PDAM, Nama Pegawai' : 'Contoh: Bonus Sponsor'}
                  className="w-full px-3 py-2 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                  No. Bukti / Referensi
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="Kuitansi / No. Struk"
                  className="w-full px-3 py-2 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)] font-mono"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
              Catatan
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Keterangan detail transaksi..."
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
              className="px-6 py-2.5 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
