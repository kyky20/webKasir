import { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Search,
  Filter,
  Tag,
  Trash2,
  Calendar,
  CheckCircle2,
  XCircle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type {
  FinancialAccount,
  ExpenseCategory,
  CashTransaction,
  CashTransactionsSummary,
} from '../../types/finance';
import { financeService } from '../../services/financeService';
import { AccountFormModal } from '../../components/finance/AccountFormModal';
import { ExpenseCategoryModal } from '../../components/finance/ExpenseCategoryModal';
import { CashTransactionModal } from '../../components/finance/CashTransactionModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';

export const FinancePage = () => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'accounts' | 'categories'>('transactions');

  // Transactions State
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [summary, setSummary] = useState<CashTransactionsSummary | null>(null);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Accounts State
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [totalLiquidAssets, setTotalLiquidAssets] = useState<number>(0);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Categories State
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Modals
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<FinancialAccount | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);

  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionDefaultType, setTransactionDefaultType] = useState<'expense' | 'income' | 'transfer'>('expense');

  // Fetch Accounts
  const fetchAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const res = await financeService.getAccounts();
      setAccounts(res.data);
      setTotalLiquidAssets(res.summary.total_liquid_assets);
    } catch (err) {
      console.error('Failed to fetch accounts', err);
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const res = await financeService.getCategories();
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Fetch Transactions
  const fetchTransactions = useCallback(async () => {
    setLoadingTransactions(true);
    try {
      const res = await financeService.getTransactions({
        search: search.trim() || undefined,
        type: typeFilter || undefined,
        account_id: accountFilter ? Number(accountFilter) : undefined,
        category_id: categoryFilter ? Number(categoryFilter) : undefined,
      });
      setTransactions(res.data);
      setSummary(res.summary);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setLoadingTransactions(false);
    }
  }, [search, typeFilter, accountFilter, categoryFilter]);

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
  }, [fetchAccounts, fetchCategories]);

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions();
    } else if (activeTab === 'accounts') {
      fetchAccounts();
    } else if (activeTab === 'categories') {
      fetchCategories();
    }
  }, [activeTab, fetchTransactions, fetchAccounts, fetchCategories]);

  const handleDeleteTransaction = async (id: number) => {
    if (!window.confirm('Yakin ingin membatalkan transaksi ini? Saldo akun kas/bank akan dikembalikan otomatis.')) {
      return;
    }
    try {
      await financeService.deleteTransaction(id);
      fetchTransactions();
      fetchAccounts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus transaksi.');
    }
  };

  const handleDeleteAccount = async (id: number, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus akun "${name}"?`)) return;
    try {
      await financeService.deleteAccount(id);
      fetchAccounts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus akun.');
    }
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus kategori "${name}"?`)) return;
    try {
      await financeService.deleteCategory(id);
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus kategori.');
    }
  };

  const handleOpenTransaction = (type: 'expense' | 'income' | 'transfer') => {
    setTransactionDefaultType(type);
    setTransactionModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Pembukuan & Kas Toko"
        subtitle="Kelola buku kas, akun bank, beban operasional, dan mutasi dana toko."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Pembukuan & Kas' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenTransaction('expense')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[var(--color-danger)] bg-[var(--color-danger-light)] border border-[var(--color-danger)]/20 rounded-xl hover:bg-[var(--color-danger-light)]/80 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Pengeluaran Beban</span>
            </button>

            <button
              onClick={() => handleOpenTransaction('income')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[var(--color-success)] bg-[var(--color-success-light)] border border-[var(--color-success)]/20 rounded-xl hover:bg-[var(--color-success-light)]/80 transition-colors cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Pemasukan Lain</span>
            </button>

            <button
              onClick={() => handleOpenTransaction('transfer')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Transfer Antar Akun</span>
            </button>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Saldo Likuid Kas & Bank
            </span>
            <div className="p-2 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--color-primary)] mt-2 font-mono">
            Rp {totalLiquidAssets.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mt-1">
            Total gabungan {accounts.filter((a) => a.is_active).length} akun aktif
          </div>
        </div>

        <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Total Pengeluaran (Beban)
            </span>
            <div className="p-2 bg-[var(--color-danger-light)] text-[var(--color-danger)] rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--color-danger)] mt-2 font-mono">
            Rp {(summary?.total_expense || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mt-1">Pengeluaran kas tercatat</div>
        </div>

        <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Total Pemasukan Kas Lain
            </span>
            <div className="p-2 bg-[var(--color-success-light)] text-[var(--color-success)] rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--color-success)] mt-2 font-mono">
            Rp {(summary?.total_income || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mt-1">Di luar transaksi kasir POS</div>
        </div>

        <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Net Arus Kas Lainnya
            </span>
            <div className="p-2 bg-[var(--color-border-muted)] text-[var(--color-text-secondary)] rounded-xl">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold mt-2 font-mono ${
              (summary?.net_cash || 0) >= 0 ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-danger)]'
            }`}
          >
            Rp {(summary?.net_cash || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mt-1">Pemasukan dikurangi beban</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[var(--color-border)]">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'transactions'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Buku Arus Kas & Pengeluaran</span>
        </button>

        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'accounts'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Rekening Kas & Bank</span>
          <span className="ml-1.5 px-2 py-0.5 text-[11px] rounded-full bg-[var(--color-border-muted)] text-[var(--color-text-secondary)] font-mono">
            {accounts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'categories'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Kategori Beban Usaha</span>
          <span className="ml-1.5 px-2 py-0.5 text-[11px] rounded-full bg-[var(--color-border-muted)] text-[var(--color-text-secondary)] font-mono">
            {categories.length}
          </span>
        </button>
      </div>

      {/* TAB 1: TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari No. Bukti, Penerima, Catatan..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)] transition-colors"
              />
              <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-2.5" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] font-medium">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter:</span>
              </div>

              <div className="w-44">
                <Select
                  value={typeFilter}
                  onChange={(val) => setTypeFilter(String(val))}
                  options={[
                    { value: '', label: 'Jenis: Semua' },
                    { value: 'expense', label: 'Pengeluaran (Beban)' },
                    { value: 'income', label: 'Pemasukan' },
                    { value: 'transfer', label: 'Transfer Antar Akun' },
                  ]}
                />
              </div>

              <div className="w-44">
                <Select
                  value={accountFilter}
                  onChange={(val) => setAccountFilter(String(val))}
                  options={[
                    { value: '', label: 'Akun: Semua' },
                    ...accounts.map((a) => ({
                      value: a.id,
                      label: a.name,
                    })),
                  ]}
                />
              </div>

              <div className="w-44">
                <Select
                  value={categoryFilter}
                  onChange={(val) => setCategoryFilter(String(val))}
                  options={[
                    { value: '', label: 'Kategori: Semua' },
                    ...categories.map((c) => ({
                      value: c.id,
                      label: c.name,
                    })),
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    <th className="px-6 py-3.5">No. Transaksi & Tanggal</th>
                    <th className="px-6 py-3.5">Jenis & Kategori</th>
                    <th className="px-6 py-3.5">Akun Kas/Bank</th>
                    <th className="px-6 py-3.5">Keterangan / Penerima</th>
                    <th className="px-6 py-3.5 text-right">Nominal</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-muted)] text-xs">
                  {loadingTransactions ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-[var(--color-text-muted)]">
                        Memuat data arus kas...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-[var(--color-text-muted)]">
                        <Wallet className="w-10 h-10 mx-auto text-[var(--color-text-muted)] opacity-40 mb-2" />
                        Belum ada transaksi arus kas yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((trx) => (
                      <tr key={trx.id} className="hover:bg-[var(--color-border-muted)]/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-[var(--color-text-primary)] font-mono">{trx.transaction_number}</div>
                          <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] mt-0.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{trx.transaction_date}</span>
                            {trx.reference_no && (
                              <span className="text-[var(--color-text-muted)]">| Ref: {trx.reference_no}</span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {trx.type === 'expense' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--color-danger-light)] text-[var(--color-danger)]">
                              <ArrowUpRight className="w-3 h-3" /> Pengeluaran
                            </span>
                          )}
                          {trx.type === 'income' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--color-success-light)] text-[var(--color-success)]">
                              <ArrowDownLeft className="w-3 h-3" /> Pemasukan
                            </span>
                          )}
                          {trx.type === 'transfer' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--color-info-light)] text-[var(--color-info)]">
                              <ArrowLeftRight className="w-3 h-3" /> Transfer
                            </span>
                          )}
                          {trx.category && (
                            <div className="text-[11px] text-[var(--color-text-secondary)] font-medium mt-1">
                              {trx.category.name}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {trx.type === 'transfer' ? (
                            <div className="text-xs space-y-0.5">
                              <div className="text-[var(--color-text-muted)]">
                                Dari: <span className="font-medium text-[var(--color-text-primary)]">{trx.account?.name}</span>
                              </div>
                              <div className="text-[var(--color-text-muted)]">
                                Ke: <span className="font-medium text-[var(--color-text-primary)]">{trx.to_account?.name}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="font-medium text-[var(--color-text-primary)] text-xs">
                              {trx.account?.name}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {trx.recipient_payer && (
                            <div className="font-medium text-[var(--color-text-primary)] text-xs">
                              {trx.recipient_payer}
                            </div>
                          )}
                          {trx.notes ? (
                            <div className="text-[11px] text-[var(--color-text-muted)] italic mt-0.5 max-w-xs truncate">
                              {trx.notes}
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--color-text-muted)]">-</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right font-mono">
                          <span
                            className={`font-bold ${
                              trx.type === 'expense'
                                ? 'text-[var(--color-danger)]'
                                : trx.type === 'income'
                                ? 'text-[var(--color-success)]'
                                : 'text-[var(--color-info)]'
                            }`}
                          >
                            {trx.type === 'expense' ? '- ' : trx.type === 'income' ? '+ ' : ''}
                            Rp {Number(trx.amount).toLocaleString('id-ID')}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteTransaction(trx.id)}
                            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] rounded-lg transition-colors cursor-pointer"
                            title="Batalkan / Hapus Transaksi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACCOUNTS */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Daftar Akun Kas & Bank</h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Tempat penampungan uang kas tunai, rekening bank toko, dan e-wallet QRIS
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedAccount(null);
                setAccountModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Akun Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingAccounts ? (
              <div className="col-span-full py-12 text-center text-[var(--color-text-muted)]">
                Memuat data akun...
              </div>
            ) : (
              accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--color-border-muted)] text-[var(--color-text-secondary)] uppercase">
                        {acc.account_type === 'cash'
                          ? 'Kas Tunai'
                          : acc.account_type === 'bank'
                          ? 'Bank'
                          : acc.account_type === 'ewallet'
                          ? 'E-Wallet / QRIS'
                          : 'Lainnya'}
                      </span>
                      {acc.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-success)] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] font-medium">
                          <XCircle className="w-3.5 h-3.5" /> Nonaktif
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-[var(--color-text-primary)] text-base">{acc.name}</h4>
                    {acc.account_number && (
                      <p className="text-xs text-[var(--color-text-muted)] font-mono mt-0.5">No. Rek: {acc.account_number}</p>
                    )}
                    {acc.notes && (
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-2 italic">{acc.notes}</p>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-[var(--color-border)] flex items-end justify-between">
                    <div>
                      <span className="text-[11px] text-[var(--color-text-muted)]">Saldo Saat Ini</span>
                      <div className="text-xl font-bold text-[var(--color-primary)] font-mono">
                        Rp {Number(acc.current_balance).toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedAccount(acc);
                          setAccountModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border-muted)] rounded-lg transition-colors border border-[var(--color-border)] cursor-pointer"
                      >
                        Edit
                      </button>
                      {acc.transactions_count === 0 && (
                        <button
                          onClick={() => handleDeleteAccount(acc.id, acc.name)}
                          className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] rounded-lg transition-colors cursor-pointer"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: EXPENSE CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Kategori Beban Usaha</h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Pengelompokan pengeluaran operasional untuk analisis laporan laba rugi
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setCategoryModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kategori Beban</span>
            </button>
          </div>

          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  <th className="px-6 py-3.5">Nama Kategori Beban</th>
                  <th className="px-6 py-3.5">Deskripsi</th>
                  <th className="px-6 py-3.5 text-center">Jml Transaksi</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-muted)] text-xs">
                {loadingCategories ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-[var(--color-text-muted)]">
                      Memuat data kategori...
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-[var(--color-text-muted)]">
                      <Tag className="w-10 h-10 mx-auto text-[var(--color-text-muted)] opacity-40 mb-2" />
                      Belum ada kategori beban usaha.
                    </td>
                  </tr>
                ) : (
                  categories.map((c) => (
                    <tr key={c.id} className="hover:bg-[var(--color-border-muted)]/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-[var(--color-text-primary)]">{c.name}</td>
                      <td className="px-6 py-4 text-[var(--color-text-secondary)] text-xs">
                        {c.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-center text-[var(--color-text-secondary)] font-medium font-mono">
                        {c.transactions_count || 0}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedCategory(c);
                              setCategoryModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border-muted)] rounded-lg transition-colors border border-[var(--color-border)] cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(c.id, c.name)}
                            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] rounded-lg transition-colors cursor-pointer"
                            title="Hapus Kategori"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <AccountFormModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        onSuccess={fetchAccounts}
        account={selectedAccount}
      />

      <ExpenseCategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSuccess={fetchCategories}
        category={selectedCategory}
      />

      <CashTransactionModal
        isOpen={transactionModalOpen}
        onClose={() => {
          setTransactionModalOpen(false);
          fetchTransactions();
          fetchAccounts();
        }}
        onSuccess={() => {
          fetchTransactions();
          fetchAccounts();
        }}
        defaultType={transactionDefaultType}
      />
    </div>
  );
};
