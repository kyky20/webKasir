import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  RefreshCw,
  Eye,
  Clock,
  ChevronLeft,
  ChevronRight,
  List,
  GitCommit,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/context/AuthContext';
import { activityLogService } from '@/services/activityLogService';
import { ActivityDetailModal } from '@/components/activityLogs/ActivityDetailModal';
import type {
  ActivityLog,
  ActivityLogFilterParams,
  ActivityLogPaginationMeta,
  ActivityLogUser,
} from '@/types/activityLog';
import { formatDateTime } from '@/utils/formatters';

export const ActivityLogsPage: React.FC = () => {
  const { isOwner } = useAuth();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [meta, setMeta] = useState<ActivityLogPaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [dateRange, setDateRange] = useState<'today' | '7_days' | '30_days' | 'custom' | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');

  // Filter options
  const [usersList, setUsersList] = useState<ActivityLogUser[]>([]);

  // Selected Log for Modal
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchFilters = async () => {
    try {
      if (isOwner) {
        const usrs = await activityLogService.getUsers();
        setUsersList(usrs);
      }
    } catch (err) {
      console.warn('Failed to load filter options', err);
    }
  };

  const fetchLogs = async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const params: ActivityLogFilterParams = {
        page: targetPage,
        per_page: 20,
        module: selectedModule || undefined,
        role: selectedRole || undefined,
        user_id: selectedUserId || undefined,
        search: searchQuery.trim() || undefined,
      };

      if (dateRange && dateRange !== 'custom') {
        params.date_range = dateRange;
      } else if (dateRange === 'custom') {
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
      }

      const res = await activityLogService.getLogs(params);
      setLogs(res.data);
      setMeta(res.meta);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal memuat riwayat log aktivitas.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, [isOwner]);

  useEffect(() => {
    setPage(1);
    fetchLogs(1);
  }, [dateRange, dateFrom, dateTo, selectedModule, selectedRole, selectedUserId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= meta.last_page) {
      setPage(newPage);
      fetchLogs(newPage);
    }
  };

  const handleViewDetail = (log: ActivityLog) => {
    setSelectedLog(log);
    setModalOpen(true);
  };

  const getModuleBadgeColor = (module: string) => {
    switch (module) {
      case 'pos':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'products':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'inventory':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      case 'purchases':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'finance':
        return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
      case 'employees':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'auth':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'settings':
        return 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Log Aktivitas & Notifikasi"
        subtitle="Audit trail lengkap dan pencatatan riwayat transaksi serta perubahan data sistem secara real-time."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchLogs(page)}
              disabled={loading}
              className="py-2 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Segarkan</span>
            </button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-4">
        {/* Preset Date Range Buttons & View Mode Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-muted)] pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] mr-1">
              Periode:
            </span>
            <button
              type="button"
              onClick={() => setDateRange('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${dateRange === ''
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-muted)]'
                }`}
            >
              Semua Waktu
            </button>
            <button
              type="button"
              onClick={() => setDateRange('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${dateRange === 'today'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-muted)]'
                }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setDateRange('7_days')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${dateRange === '7_days'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-muted)]'
                }`}
            >
              7 Hari Terakhir
            </button>
            <button
              type="button"
              onClick={() => setDateRange('30_days')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${dateRange === '30_days'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-muted)]'
                }`}
            >
              30 Hari Terakhir
            </button>
            <button
              type="button"
              onClick={() => setDateRange('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${dateRange === 'custom'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-muted)]'
                }`}
            >
              Rentang Kustom
            </button>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${viewMode === 'table'
                  ? 'bg-[var(--color-surface)] shadow-xs text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              title="Tampilan Tabel"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabel</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${viewMode === 'timeline'
                  ? 'bg-[var(--color-surface)] shadow-xs text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              title="Tampilan Garis Waktu (Timeline)"
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Timeline</span>
            </button>
          </div>
        </div>

        {/* Custom Date Pickers (if custom selected) */}
        {dateRange === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border-muted)] text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-text-muted)]">Dari:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] text-xs focus:outline-hidden focus:border-[var(--color-primary)]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-text-muted)]">Sampai:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] text-xs focus:outline-hidden focus:border-[var(--color-primary)]"
              />
            </div>
          </div>
        )}

        {/* Dropdown Filters & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Module Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-text-muted)] mb-1">
              Modul:
            </label>
            <Select
              value={selectedModule}
              onChange={(val) => setSelectedModule(val)}
              options={[
                { value: '', label: 'Semua Modul' },
                { value: 'pos', label: 'Kasir & POS' },
                { value: 'products', label: 'Produk & Kategori' },
                { value: 'inventory', label: 'Inventaris & Stok' },
                { value: 'purchases', label: 'Pembelian Supplier' },
                { value: 'contacts', label: 'Kontak (Pelanggan/Supplier)' },
                { value: 'finance', label: 'Pembukuan Keuangan' },
                { value: 'employees', label: 'Pegawai' },
                { value: 'auth', label: 'Autentikasi Sistem' },
                { value: 'settings', label: 'Pengaturan Toko' },
              ]}
            />
          </div>

          {/* Role Filter (Owner Only) */}
          {isOwner && (
            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-text-muted)] mb-1">
                Peran Pengguna:
              </label>
              <Select
                value={selectedRole}
                onChange={(val) => setSelectedRole(val)}
                options={[
                  { value: '', label: 'Semua Peran' },
                  { value: 'owner', label: 'Owner / Pemilik' },
                  { value: 'employee', label: 'Pegawai / Kasir' },
                ]}
              />
            </div>
          )}

          {/* User Filter (Owner Only) */}
          {isOwner && (
            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-text-muted)] mb-1">
                Pengguna:
              </label>
              <Select
                value={String(selectedUserId)}
                onChange={(val) => setSelectedUserId(val ? Number(val) : '')}
                options={[
                  { value: '', label: 'Semua Pengguna' },
                  ...usersList.map((u) => ({
                    value: String(u.id),
                    label: `${u.name} (${u.role === 'owner' ? 'Owner' : 'Kasir'})`,
                  })),
                ]}
              />
            </div>
          )}

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex items-end">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Cari deskripsi, aksi, IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-hidden focus:border-[var(--color-primary)] transition-colors"
              />
              <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-2.5" />
            </div>
          </form>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-[var(--color-danger-light)] border border-[var(--color-danger)]/30 text-xs text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      {loading && logs.length === 0 ? (
        <div className="p-12 text-center text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--color-primary)]" />
          Memuat rekam jejak aktivitas...
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] space-y-2">
          <History className="w-8 h-8 opacity-40 mx-auto text-[var(--color-text-muted)]" />
          <p className="font-semibold text-sm text-[var(--color-text-primary)]">Tidak ada log aktivitas</p>
          <p>Belum ada aktivitas yang tercatat sesuai kriteria filter saat ini.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="border border-[var(--color-border)] rounded-2xl overflow-hidden bg-[var(--color-surface)] shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--color-surface-raised)] border-b border-[var(--color-border-muted)] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Pengguna</th>
                  <th className="py-3 px-4">Modul</th>
                  <th className="py-3 px-4">Aktivitas</th>
                  <th className="py-3 px-4 text-center">IP Address</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-muted)]">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-[var(--color-border-muted)]/40 transition-colors"
                  >
                    {/* Waktu */}
                    <td className="py-3 px-4 text-[var(--color-text-secondary)] whitespace-nowrap font-mono text-[11px]">
                      {formatDateTime(log.created_at)}
                    </td>

                    {/* Pengguna & Role */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[var(--color-text-primary)]">
                          {log.user_name}
                        </span>
                        {log.user?.role && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${log.user.role === 'owner'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              }`}
                          >
                            {log.user.role === 'owner' ? 'Owner' : 'Kasir'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Modul */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getModuleBadgeColor(
                          log.module
                        )}`}
                      >
                        {log.module}
                      </span>
                    </td>

                    {/* Deskripsi Aktivitas */}
                    <td className="py-3 px-4 text-[var(--color-text-primary)] font-medium max-w-md">
                      <p className="line-clamp-2 leading-relaxed">{log.description}</p>
                    </td>

                    {/* IP Address */}
                    <td className="py-3 px-4 text-center text-[var(--color-text-muted)] font-mono text-[11px] whitespace-nowrap">
                      {log.ip_address || '-'}
                    </td>

                    {/* Tombol Detail */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleViewDetail(log)}
                        className="py-1 px-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-border-muted)] text-[var(--color-text-primary)] font-semibold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TIMELINE VIEW */
        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[var(--color-border)]">
            {logs.map((log) => (
              <div key={log.id} className="relative group">
                {/* Timeline Dot */}
                <span className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-[var(--color-primary)] ring-4 ring-[var(--color-surface)]" />

                <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 transition-colors space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--color-text-primary)]">
                        {log.user_name}
                      </span>
                      {log.user?.role && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--color-border-muted)] text-[var(--color-text-muted)] font-medium">
                          {log.user.role === 'owner' ? 'Owner' : 'Kasir'}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getModuleBadgeColor(
                          log.module
                        )}`}
                      >
                        {log.module}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(log.created_at)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleViewDetail(log)}
                        className="text-[var(--color-primary)] font-semibold hover:underline cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Rincian</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--color-text-primary)] font-medium leading-relaxed">
                    {log.description}
                  </p>

                  {log.ip_address && (
                    <span className="inline-block text-[10px] text-[var(--color-text-muted)] font-mono">
                      IP: {log.ip_address}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination Bar */}
      {meta.total > 0 && (
        <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-[var(--color-text-secondary)]">
            Menampilkan <strong className="text-[var(--color-text-primary)]">{logs.length}</strong> dari{' '}
            <strong className="text-[var(--color-text-primary)]">{meta.total}</strong> log aktivitas
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={meta.current_page <= 1}
              onClick={() => handlePageChange(meta.current_page - 1)}
              className="py-1.5 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-medium disabled:opacity-40 hover:bg-[var(--color-border-muted)] transition-colors cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            <span className="px-2 text-[var(--color-text-muted)] font-mono">
              {meta.current_page} / {meta.last_page}
            </span>

            <button
              type="button"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => handlePageChange(meta.current_page + 1)}
              className="py-1.5 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-medium disabled:opacity-40 hover:bg-[var(--color-border-muted)] transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Activity Detail Modal */}
      <ActivityDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        log={selectedLog}
      />
    </div>
  );
};
