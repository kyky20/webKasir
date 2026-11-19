import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ShoppingCart,
  Package,
  Wallet,
  Users,
  Shield,
  Settings,
  AlertTriangle,
  Info,
  CheckCircle,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { notificationService } from '@/services/notificationService';
import type { SystemNotification } from '@/types/activityLog';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await notificationService.getNotifications({ limit: 12 });
      setNotifications(res.data || []);
      setUnreadCount(res.unread_count || 0);
    } catch (err) {
      console.warn('Failed to fetch notifications', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Polling every 25 seconds for background real-time updates
    const interval = setInterval(() => {
      fetchNotifications();
    }, 25000);

    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications(true);
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleItemClick = async (notif: SystemNotification) => {
    if (!notif.read_at) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.warn('Failed to mark notification as read', err);
      }
    }

    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return 'Baru saja';
      if (diffMin < 60) return `${diffMin} mnt lalu`;
      if (diffHour < 24) return `${diffHour} jam lalu`;
      if (diffDay === 1) return 'Kemarin';
      return `${diffDay} hr lalu`;
    } catch {
      return dateStr;
    }
  };

  const getCategoryIcon = (category: string, type: string) => {
    switch (category) {
      case 'pos':
        return <ShoppingCart className="w-3.5 h-3.5 text-emerald-500" />;
      case 'inventory':
        return type === 'danger' ? (
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
        ) : (
          <Package className="w-3.5 h-3.5 text-amber-500" />
        );
      case 'finance':
        return <Wallet className="w-3.5 h-3.5 text-blue-500" />;
      case 'purchases':
        return <ShoppingCart className="w-3.5 h-3.5 text-indigo-500" />;
      case 'employees':
        return <Users className="w-3.5 h-3.5 text-violet-500" />;
      case 'auth':
        return type === 'warning' ? (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        ) : (
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
        );
      case 'settings':
        return <Settings className="w-3.5 h-3.5 text-stone-500" />;
      default:
        return type === 'success' ? (
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <Info className="w-3.5 h-3.5 text-[var(--color-primary)]" />
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifikasi sistem"
        className="relative p-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)] transition-colors cursor-pointer"
        title="Notifikasi Sistem"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[var(--color-surface)] shadow-xs animate-in zoom-in-50 duration-200">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl z-50 overflow-hidden flex flex-col max-h-[82vh]"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--color-border-muted)] bg-[var(--color-surface-raised)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--color-text-primary)]">Notifikasi Sistem</span>
                {unreadCount > 0 ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold">
                    {unreadCount} belum dibaca
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--color-border-muted)] text-[var(--color-text-muted)] font-medium">
                    Semua terbaca
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Tandai Semua Dibaca</span>
                </button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 divide-y divide-[var(--color-border-muted)]">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--color-text-muted)]">
                  Memuat notifikasi...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-border-muted)] text-[var(--color-text-muted)] flex items-center justify-center mx-auto">
                    <Bell className="w-5 h-5 opacity-50" />
                  </div>
                  <p className="text-xs font-semibold text-[var(--color-text-primary)]">Tidak ada notifikasi</p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    Aktivitas sistem terbaru akan muncul di sini secara otomatis.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const isUnread = !notif.read_at;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleItemClick(notif)}
                      className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-[var(--color-border-muted)]/50 ${
                        isUnread ? 'bg-[var(--color-primary-light)]/20' : ''
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center shrink-0 mt-0.5">
                        {getCategoryIcon(notif.category, notif.type)}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <p
                            className={`text-xs truncate ${
                              isUnread
                                ? 'font-bold text-[var(--color-text-primary)]'
                                : 'font-semibold text-[var(--color-text-secondary)]'
                            }`}
                          >
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-[var(--color-text-muted)] shrink-0 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5 inline" />
                            {formatRelativeTime(notif.created_at)}
                          </span>
                        </div>

                        <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>

                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0 mt-1.5" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 border-t border-[var(--color-border-muted)] bg-[var(--color-surface-raised)] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/activity-logs');
                }}
                className="w-full py-2 px-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Lihat Semua Log & Aktivitas</span>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
