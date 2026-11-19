import React from 'react';
import { X, Clock, User, Globe, Layers, FileText } from 'lucide-react';
import type { ActivityLog } from '@/types/activityLog';
import { formatDateTime } from '@/utils/formatters';

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: ActivityLog | null;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  isOpen,
  onClose,
  log,
}) => {
  if (!isOpen || !log) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-[var(--color-surface)] w-full max-w-xl rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border-muted)] bg-[var(--color-surface-raised)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center font-bold text-xs">
              LOG
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                Detail Log Aktivitas #{log.id}
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] font-mono">
                {formatDateTime(log.created_at)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Main Description */}
          <div className="p-3.5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] space-y-1">
            <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
              Deskripsi Aktivitas
            </span>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-relaxed">
              {log.description}
            </p>
          </div>

          {/* Meta Grid */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
            <div>
              <span className="text-[var(--color-text-muted)] block mb-0.5 flex items-center gap-1 font-medium">
                <User className="w-3.5 h-3.5" /> Pelaku Aktivitas:
              </span>
              <p className="font-semibold text-[var(--color-text-primary)]">
                {log.user_name}
                {log.user && (
                  <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--color-border-muted)] text-[var(--color-text-muted)]">
                    {log.user.role === 'owner' ? 'Owner' : 'Kasir/Pegawai'}
                  </span>
                )}
              </p>
            </div>

            <div>
              <span className="text-[var(--color-text-muted)] block mb-0.5 flex items-center gap-1 font-medium">
                <Layers className="w-3.5 h-3.5" /> Modul & Aksi:
              </span>
              <p className="font-semibold text-[var(--color-text-primary)] font-mono">
                {log.module} / {log.action}
              </p>
            </div>

            <div>
              <span className="text-[var(--color-text-muted)] block mb-0.5 flex items-center gap-1 font-medium">
                <Globe className="w-3.5 h-3.5" /> Alamat IP:
              </span>
              <p className="font-mono text-[var(--color-text-primary)]">{log.ip_address || '-'}</p>
            </div>

            <div>
              <span className="text-[var(--color-text-muted)] block mb-0.5 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5" /> Waktu Sistem:
              </span>
              <p className="font-mono text-[var(--color-text-primary)]">
                {new Date(log.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
              </p>
            </div>
          </div>

          {/* User Agent Info */}
          {log.user_agent && (
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
                User Agent / Peramban
              </span>
              <p className="p-2.5 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-muted)] font-mono text-[11px] text-[var(--color-text-muted)] break-all">
                {log.user_agent}
              </p>
            </div>
          )}

          {/* Data Change Diff: Old vs New Values */}
          {(log.old_values || log.new_values) && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Rincian Perubahan Data
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Old Values */}
                <div className="p-3 rounded-xl bg-[var(--color-danger-light)]/20 border border-[var(--color-danger)]/20 space-y-1.5">
                  <span className="text-[11px] font-bold text-[var(--color-danger)]">
                    Sebelum Perubahan
                  </span>
                  {log.old_values ? (
                    <pre className="font-mono text-[10px] text-[var(--color-text-secondary)] whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(log.old_values, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-[11px] text-[var(--color-text-muted)] italic">
                      Tidak ada data sebelum (Data baru dibuat)
                    </p>
                  )}
                </div>

                {/* New Values */}
                <div className="p-3 rounded-xl bg-[var(--color-success-light)]/20 border border-[var(--color-success)]/20 space-y-1.5">
                  <span className="text-[11px] font-bold text-[var(--color-success)]">
                    Setelah Perubahan
                  </span>
                  {log.new_values ? (
                    <pre className="font-mono text-[10px] text-[var(--color-text-secondary)] whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(log.new_values, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-[11px] text-[var(--color-text-muted)] italic">
                      Data dihapus dari sistem
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Properties metadata */}
          {log.properties && Object.keys(log.properties).length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
                Parameter Tambahan
              </span>
              <pre className="p-2.5 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-muted)] font-mono text-[11px] text-[var(--color-text-secondary)] whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(log.properties, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--color-border-muted)] bg-[var(--color-surface-raised)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-[var(--color-border-muted)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
