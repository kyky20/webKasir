import React, { useState, useEffect } from 'react';
import { X, UserCheck, Shield, Mail, Phone, Lock, AlertCircle } from 'lucide-react';
import type { Employee } from '../../types/employee';
import { employeeService } from '../../services/employeeService';
import { Select } from '@/components/ui/Select';

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee?: Employee | null;
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employee,
}) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'owner' | 'employee'>('employee');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setUsername(employee.username);
      setEmail(employee.email);
      setPhone(employee.phone || '');
      setPassword('');
      setRole(employee.role);
      setStatus(employee.status);
    } else {
      setName('');
      setUsername('');
      setEmail('');
      setPhone('');
      setPassword('');
      setRole('employee');
      setStatus('active');
    }
    setError(null);
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      setError('Nama dan email wajib diisi.');
      return;
    }

    if (!employee && (!username.trim() || !password.trim())) {
      setError('Username dan password wajib diisi untuk pegawai baru.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (employee) {
        await employeeService.updateEmployee(employee.id, {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          role,
          status,
        });
      } else {
        await employeeService.createEmployee({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          password: password.trim(),
          role,
          status,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan data pegawai.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
              {employee ? 'Edit Data Pegawai' : 'Tambah Pegawai / Kasir Baru'}
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
              Nama Lengkap <span className="text-[var(--color-danger)]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Siti Rahmawati"
              className="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)] transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                Username <span className="text-[var(--color-danger)]">*</span>
              </label>
              <input
                type="text"
                required
                disabled={!!employee}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="siti_kasir"
                className="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)] disabled:opacity-50 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                Peran / Hak Akses <span className="text-[var(--color-danger)]">*</span>
              </label>
              <Select
                value={role}
                onChange={(val) => setRole(val as any)}
                icon={<Shield className="w-4 h-4" />}
                options={[
                  { value: 'employee', label: 'Kasir / Pegawai' },
                  { value: 'owner', label: 'Pemilik Toko (Owner)' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                Email <span className="text-[var(--color-danger)]">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="siti@kasirku.local"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)]"
                />
                <Mail className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                No. Telepon / WhatsApp
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)]"
                />
                <Phone className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {!employee && (
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                Password Awal <span className="text-[var(--color-danger)]">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)]"
                />
                <Lock className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-2.5" />
              </div>
            </div>
          )}

          {employee && (
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                Status Akun
              </label>
              <Select
                value={status}
                onChange={(val) => setStatus(val as any)}
                options={[
                  { value: 'active', label: 'Aktif (Dapat Login & Mengoperasikan POS)' },
                  { value: 'inactive', label: 'Nonaktif (Akses Diblokir)' },
                ]}
              />
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
              {submitting ? 'Menyimpan...' : employee ? 'Simpan Perubahan' : 'Tambah Pegawai'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
