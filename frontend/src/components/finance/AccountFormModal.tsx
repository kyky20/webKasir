import React, { useState, useEffect } from 'react';
import { X, Wallet, AlertCircle } from 'lucide-react';
import type { FinancialAccount } from '../../types/finance';
import { financeService } from '../../services/financeService';
import { Select } from '@/components/ui/Select';

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  account?: FinancialAccount | null;
}

export const AccountFormModal: React.FC<AccountFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  account,
}) => {
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<'cash' | 'bank' | 'ewallet' | 'other'>('cash');
  const [accountNumber, setAccountNumber] = useState('');
  const [initialBalance, setInitialBalance] = useState<number | ''>(0);
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setAccountType(account.account_type);
      setAccountNumber(account.account_number || '');
      setInitialBalance(Number(account.initial_balance) || 0);
      setNotes(account.notes || '');
      setIsActive(account.is_active);
    } else {
      setName('');
      setAccountType('cash');
      setAccountNumber('');
      setInitialBalance(0);
      setNotes('');
      setIsActive(true);
    }
    setError(null);
  }, [account, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama akun kas/bank wajib diisi.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (account) {
        await financeService.updateAccount(account.id, {
          name: name.trim(),
          account_type: accountType,
          account_number: accountNumber.trim() || undefined,
          is_active: isActive,
          notes: notes.trim() || undefined,
        });
      } else {
        await financeService.createAccount({
          name: name.trim(),
          account_type: accountType,
          account_number: accountNumber.trim() || undefined,
          initial_balance: Number(initialBalance) || 0,
          notes: notes.trim() || undefined,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan akun kas/bank.');
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
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
              {account ? 'Edit Akun Kas / Bank' : 'Tambah Akun Kas / Bank Baru'}
            </h3>
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

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
              Nama Akun <span className="text-[var(--color-danger)]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kas Utama, BCA Bisnis, QRIS Toko"
              className="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                Tipe Akun
              </label>
              <Select
                value={accountType}
                onChange={(val) => setAccountType(val as any)}
                options={[
                  { value: 'cash', label: 'Kas Tunai' },
                  { value: 'bank', label: 'Rekening Bank' },
                  { value: 'ewallet', label: 'QRIS / E-Wallet' },
                  { value: 'other', label: 'Lainnya' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                No. Rekening / ID
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="No. rek atau ID"
                className="w-full px-3 py-2 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)] font-mono"
              />
            </div>
          </div>

          {!account && (
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                Saldo Awal (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value ? Number(e.target.value) : '')}
                placeholder="0"
                className="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)] font-mono"
              />
              <span className="text-[11px] text-[var(--color-text-muted)] mt-0.5 block">
                Saldo saat awal membuka buku kasir
              </span>
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
              placeholder="Catatan rekening, atas nama, dll..."
              className="w-full px-3 py-2 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)]"
            />
          </div>

          {account && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isActiveAcc"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-[var(--color-primary)] rounded border-[var(--color-border)] focus:ring-[var(--color-primary)] cursor-pointer"
              />
              <label htmlFor="isActiveAcc" className="text-xs font-medium text-[var(--color-text-secondary)] cursor-pointer">
                Akun Aktif (Dapat digunakan untuk pencatatan transaksi)
              </label>
            </div>
          )}

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
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Menyimpan...' : account ? 'Simpan Perubahan' : 'Tambah Akun'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
