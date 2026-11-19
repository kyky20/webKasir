import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  LogOut,
  Store as StoreIcon,
  Sun,
  Moon,
  ChevronDown,
  User,
  History,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { NotificationDropdown } from '@/components/common/NotificationDropdown';

export const EmployeeLayout: React.FC = () => {
  const { user, store, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'K';
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text-primary)] transition-colors">
      {/* Employee Topbar */}
      <header className="h-16 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 transition-colors">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white shrink-0 shadow-xs">
              <StoreIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-[var(--color-text-primary)]">
                Kasirku
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-[var(--color-text-muted)] font-medium">
                | {store?.name}
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${isActive
                  ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border-muted)] hover:text-[var(--color-text-primary)]'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink
              to="/pos"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${isActive
                  ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border-muted)] hover:text-[var(--color-text-primary)]'
                }`
              }
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Kasir POS</span>
            </NavLink>
            <NavLink
              to="/my-transactions"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${isActive
                  ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border-muted)] hover:text-[var(--color-text-primary)]'
                }`
              }
            >
              <Receipt className="w-4 h-4" />
              <span>Riwayat Transaksi Saya</span>
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Notifications Dropdown */}
          <NotificationDropdown />

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)] transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            aria-label="Toggle tema tampilan"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-[var(--color-text-secondary)]" />
            )}
          </button>

          {/* User Profile Dropdown */}
          <DropdownMenu
            align="right"
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 text-xs bg-[var(--color-surface)] hover:bg-[var(--color-border-muted)] px-2.5 py-1.5 rounded-xl border border-[var(--color-border)] transition-colors cursor-pointer select-none"
                aria-label="Menu profil kasir"
              >
                <div className="w-5 h-5 rounded-md bg-[var(--color-primary)] text-white text-[10px] font-bold flex items-center justify-center">
                  {getInitials(user?.name)}
                </div>
                <span className="font-medium text-[var(--color-text-primary)] hidden sm:inline">{user?.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold hidden md:inline">Kasir</span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              </button>
            }
            items={[
              {
                label: user?.name || 'Kasir Toko',
                description: `${store?.name || 'Kasirku'} - Petugas Kasir`,
                icon: <User className="w-4 h-4 text-[var(--color-primary)]" />,
              },
              { separator: true, label: '' },
              {
                label: 'Dashboard Kasir',
                icon: <LayoutDashboard className="w-4 h-4" />,
                onClick: () => navigate('/dashboard'),
              },
              {
                label: 'Riwayat Transaksi Saya',
                icon: <Receipt className="w-4 h-4" />,
                onClick: () => navigate('/my-transactions'),
              },
              {
                label: 'Log Aktivitas Saya',
                icon: <History className="w-4 h-4" />,
                onClick: () => navigate('/activity-logs'),
              },
              {
                label: 'Buka Terminal POS',
                icon: <ShoppingCart className="w-4 h-4" />,
                onClick: () => navigate('/pos'),
              },
              { separator: true, label: '' },
              {
                label: 'Logout',
                icon: <LogOut className="w-4 h-4" />,
                danger: true,
                onClick: handleLogout,
              },
            ]}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-3 sm:p-5 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
};
