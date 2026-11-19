import { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  UserPlus,
  Shield,
  Key,
  Edit2,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  History,
  Calendar,
  Activity,
  Users,
} from 'lucide-react';
import type { Employee, AuditLog } from '../../types/employee';
import { employeeService } from '../../services/employeeService';
import { EmployeeFormModal } from '../../components/employees/EmployeeFormModal';
import { ChangePasswordModal } from '../../components/employees/ChangePasswordModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';

export const EmployeesPage = () => {
  const [activeTab, setActiveTab] = useState<'employees' | 'audit'>('employees');

  // Employees State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [empSearch, setEmpSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditActions, setAuditActions] = useState<string[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [auditDateFrom, setAuditDateFrom] = useState('');
  const [auditDateTo, setAuditDateTo] = useState('');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordEmployee, setPasswordEmployee] = useState<Employee | null>(null);

  // Fetch Employees
  const fetchEmployees = useCallback(async () => {
    setLoadingEmployees(true);
    try {
      const res = await employeeService.getEmployees({
        search: empSearch.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    } finally {
      setLoadingEmployees(false);
    }
  }, [empSearch, roleFilter, statusFilter]);

  // Fetch Audit Logs
  const fetchAuditLogs = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const [logsRes, actionsRes] = await Promise.all([
        employeeService.getAuditLogs({
          search: auditSearch.trim() || undefined,
          action: actionFilter || undefined,
          date_from: auditDateFrom || undefined,
          date_to: auditDateTo || undefined,
        }),
        employeeService.getAuditActions(),
      ]);
      setAuditLogs(logsRes.data);
      setAuditActions(actionsRes.data);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoadingAudit(false);
    }
  }, [auditSearch, actionFilter, auditDateFrom, auditDateTo]);

  useEffect(() => {
    if (activeTab === 'employees') {
      fetchEmployees();
    } else {
      fetchAuditLogs();
    }
  }, [activeTab, fetchEmployees, fetchAuditLogs]);

  const handleDeleteEmployee = async (emp: Employee) => {
    if (!window.confirm(`Yakin ingin menghapus pegawai "${emp.name}"?`)) return;
    try {
      await employeeService.deleteEmployee(emp.id);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus pegawai.');
    }
  };

  const activeCashiersCount = employees.filter((e) => e.role === 'employee' && e.status === 'active').length;
  const totalEmployeesCount = employees.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Manajemen Pegawai & Audit"
        subtitle="Kelola akun kasir, hak akses otorisasi, dan pantau log aktivitas keamanan toko."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Pegawai & Audit' },
        ]}
        actions={
          activeTab === 'employees' ? (
            <button
              onClick={() => {
                setSelectedEmployee(null);
                setFormModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Pegawai Baru</span>
            </button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)]">
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${activeTab === 'employees'
            ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
            : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
        >
          <Users className="w-4 h-4" />
          <span>Daftar Pegawai & Kasir</span>
          <span className="ml-1.5 px-2 py-0.5 text-[11px] rounded-full bg-[var(--color-border-muted)] text-[var(--color-text-secondary)] font-mono">
            {totalEmployeesCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${activeTab === 'audit'
            ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
            : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
        >
          <History className="w-4 h-4" />
          <span>Log Audit & Aktivitas</span>
        </button>
      </div>

      {/* TAB 1: EMPLOYEES */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Total Akun Pengguna
              </span>
              <div className="text-2xl font-bold text-[var(--color-text-primary)] mt-2 font-mono">
                {totalEmployeesCount} Pengguna
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">Pemilik toko dan staf kasir</div>
            </div>

            <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Kasir Aktif Beroperasi
              </span>
              <div className="text-2xl font-bold text-[var(--color-primary)] mt-2 font-mono">
                {activeCashiersCount} Kasir
              </div>
              <div className="text-xs text-[var(--color-success)] font-medium mt-1">
                Dapat mengakses mesin kasir POS
              </div>
            </div>

            <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Otorisasi Hak Akses
              </span>
              <div className="text-2xl font-bold text-[var(--color-text-primary)] mt-2">
                RBAC Aktif
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">Owner: Penuh | Kasir: Terbatas POS</div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <input
                type="text"
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                placeholder="Cari nama, username, email, telp..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)] transition-colors"
              />
              <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-2.5" />
            </div>

            <div className="flex items-center gap-2">
              <div className="w-44">
                <Select
                  value={roleFilter}
                  onChange={(val) => setRoleFilter(String(val))}
                  options={[
                    { value: '', label: 'Peran: Semua' },
                    { value: 'owner', label: 'Pemilik Toko (Owner)' },
                    { value: 'employee', label: 'Kasir / Pegawai' },
                  ]}
                />
              </div>

              <div className="w-36">
                <Select
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(String(val))}
                  options={[
                    { value: '', label: 'Status: Semua' },
                    { value: 'active', label: 'Aktif' },
                    { value: 'inactive', label: 'Nonaktif' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Employees Table */}
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    <th className="px-6 py-3.5">Pegawai</th>
                    <th className="px-6 py-3.5">Kontak</th>
                    <th className="px-6 py-3.5 text-center">Peran</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                    <th className="px-6 py-3.5 text-center">Performa Kasir</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-muted)]">
                  {loadingEmployees ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-[var(--color-text-muted)]">
                        Memuat data pegawai...
                      </td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-[var(--color-text-muted)]">
                        <Users className="w-10 h-10 mx-auto text-[var(--color-text-muted)] opacity-40 mb-2" />
                        Belum ada data pegawai yang sesuai.
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-[var(--color-border-muted)]/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center font-bold text-xs">
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-[var(--color-text-primary)]">{emp.name}</div>
                              <div className="text-[11px] text-[var(--color-text-muted)] font-mono">@{emp.username}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-xs text-[var(--color-text-secondary)] space-y-0.5">
                          <div>{emp.email}</div>
                          {emp.phone && <div className="text-[var(--color-text-muted)]">{emp.phone}</div>}
                        </td>

                        <td className="px-6 py-4 text-center">
                          {emp.role === 'owner' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                              <Shield className="w-3 h-3" /> Pemilik (Owner)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                              <UserCheck className="w-3 h-3" /> Kasir
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-center">
                          {emp.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--color-success-light)] text-[var(--color-success)]">
                              <CheckCircle2 className="w-3 h-3" /> Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[var(--color-border-muted)] text-[var(--color-text-muted)]">
                              <XCircle className="w-3 h-3" /> Nonaktif
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-center font-mono">
                          <div className="font-semibold text-[var(--color-text-primary)] text-xs">
                            {emp.completed_sales_count || 0} Transaksi
                          </div>
                          <div className="text-[11px] text-[var(--color-text-muted)]">
                            Rp {Number(emp.total_sales_amount || 0).toLocaleString('id-ID')}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setPasswordEmployee(emp);
                                setPasswordModalOpen(true);
                              }}
                              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border-muted)] rounded-lg transition-colors cursor-pointer"
                              title="Reset Password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setFormModalOpen(true);
                              }}
                              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border-muted)] rounded-lg transition-colors cursor-pointer"
                              title="Edit Pegawai"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(emp)}
                              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] rounded-lg transition-colors cursor-pointer"
                              title="Hapus Pegawai"
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
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Audit Filters Bar */}
          <div className="p-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Cari deskripsi, pelaku, aksi, IP..."
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
                  value={actionFilter}
                  onChange={(val) => setActionFilter(String(val))}
                  options={[
                    { value: '', label: 'Aksi: Semua' },
                    ...auditActions.map((act) => ({
                      value: act,
                      label: act,
                    })),
                  ]}
                />
              </div>

              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={auditDateFrom}
                  onChange={(e) => setAuditDateFrom(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer"
                />
                <span className="text-xs text-[var(--color-text-muted)]">-</span>
                <input
                  type="date"
                  value={auditDateTo}
                  onChange={(e) => setAuditDateTo(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    <th className="px-6 py-3.5">Waktu</th>
                    <th className="px-6 py-3.5">Pengguna (Pelaku)</th>
                    <th className="px-6 py-3.5">Jenis Aksi</th>
                    <th className="px-6 py-3.5">Deskripsi Aktivitas</th>
                    <th className="px-6 py-3.5 text-right">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-muted)]">
                  {loadingAudit ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-[var(--color-text-muted)]">
                        Memuat data riwayat aktivitas...
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[var(--color-text-muted)]">
                        <History className="w-10 h-10 mx-auto text-[var(--color-text-muted)] opacity-40 mb-2" />
                        Belum ada catatan aktivitas yang sesuai.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[var(--color-border-muted)]/30 transition-colors">
                        <td className="px-6 py-4 text-xs text-[var(--color-text-muted)] whitespace-nowrap font-mono">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                            <span>{new Date(log.created_at).toLocaleString('id-ID')}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-semibold text-[var(--color-text-primary)] text-xs">
                            {log.user_name || log.user?.name || 'Sistem'}
                          </div>
                          {log.user?.role && (
                            <span className="text-[10px] text-[var(--color-text-muted)] uppercase">
                              {log.user.role}
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-mono font-medium rounded-md bg-[var(--color-border-muted)] text-[var(--color-text-secondary)]">
                            <Activity className="w-3 h-3 text-[var(--color-primary)]" />
                            {log.action}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-xs text-[var(--color-text-secondary)] font-medium max-w-md">
                          {log.description}
                        </td>

                        <td className="px-6 py-4 text-right text-xs text-[var(--color-text-muted)] font-mono">
                          {log.ip_address || '-'}
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

      {/* Modals */}
      <EmployeeFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSuccess={fetchEmployees}
        employee={selectedEmployee}
      />

      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSuccess={fetchEmployees}
        employee={passwordEmployee}
      />
    </div>
  );
};
