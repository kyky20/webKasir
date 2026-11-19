import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  ReceiptText,
  Package,
  Boxes,
  ShoppingBag,
  Users,
  Wallet,
  BarChart3,
  UserCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Store as StoreIcon,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  User,
  ChevronDown,
  History,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { NotificationDropdown } from '@/components/common/NotificationDropdown';

interface NavItem {
  name: string;
  to: string;
  icon: React.ElementType;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [
      { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'KASIR',
    items: [
      { name: 'Kasir', to: '/pos', icon: ShoppingCart },
      { name: 'Transaksi', to: '/transactions', icon: ReceiptText },
    ],
  },
  {
    label: 'PRODUK & STOK',
    items: [
      { name: 'Produk & Kategori', to: '/products', icon: Package },
      { name: 'Inventaris & Stok', to: '/inventory', icon: Boxes },
      { name: 'Pembelian', to: '/purchases', icon: ShoppingBag },
    ],
  },
  {
    label: 'BISNIS & KEUANGAN',
    items: [
      { name: 'Pelanggan & Supplier', to: '/contacts', icon: Users },
      { name: 'Pembukuan', to: '/finance', icon: Wallet },
      { name: 'Laporan', to: '/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'ADMINISTRASI',
    items: [
      { name: 'Pegawai', to: '/employees', icon: UserCheck },
      { name: 'Log & Notifikasi', to: '/activity-logs', icon: History },
      { name: 'Pengaturan Toko', to: '/settings', icon: Settings },
    ],
  },
];

export const OwnerLayout: React.FC = () => {
  const { user, store, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    for (const group of navGroups) {
      for (const item of group.items) {
        if (location.pathname.startsWith(item.to)) {
          return item.name;
        }
      }
    }
    return 'Dashboard';
  };

  const getInitials = (name?: string) => {
    if (!name) return 'OW';
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen flex bg-[var(--color-bg)] text-[var(--color-text-primary)] transition-colors">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop & Mobile Dark Sidebar (Ember Style) - Fixed position */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 h-screen h-dvh bg-[#1C1917] text-[#A8A29E] border-r border-[#292524] flex flex-col transition-all duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } ${collapsed ? 'lg:w-[72px]' : 'lg:w-64'} w-64`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#292524] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-white shrink-0 shadow-xs">
              <StoreIcon className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  Kasirku
                </h1>
                <p className="text-xs text-[#78716C] truncate max-w-[130px] font-medium">
                  {store?.name || 'Toko Retail'}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-[#78716C] hover:text-white lg:hidden rounded-lg hover:bg-[#292524]"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto sidebar-scroll">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {group.label && !collapsed && (
                <p className="px-3 text-[10px] font-bold text-[#78716C] tracking-wider uppercase mb-1">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    title={collapsed ? item.name : undefined}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group ${isActive
                        ? 'bg-[#292524] text-white font-semibold shadow-xs'
                        : 'text-[#A8A29E] hover:bg-[#292524]/60 hover:text-white'
                      } ${collapsed ? 'justify-center px-0' : ''}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Amber Active Bar Indicator */}
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[var(--color-primary)] rounded-r-md" />
                        )}
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${isActive
                            ? 'text-[var(--color-primary)]'
                            : 'text-[#A8A29E] group-hover:text-white'
                            }`}
                        />
                        {!collapsed && <span className="truncate">{item.name}</span>}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer with Collapse Button & User Card */}
        <div className="p-3 border-t border-[#292524] bg-[#171412] shrink-0 space-y-2">
          {/* User profile item */}
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#292524]/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold flex items-center justify-center shrink-0">
                {getInitials(user?.name)}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate leading-tight">
                    {user?.name}
                  </p>
                  <p className="text-[10px] text-[#A8A29E] capitalize leading-none mt-0.5">
                    Owner Toko
                  </p>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 text-[#A8A29E] hover:text-[#DC2626] hover:bg-[#292524] rounded-md transition-colors cursor-pointer"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center justify-center gap-2 py-1.5 text-xs text-[#78716C] hover:text-white hover:bg-[#292524] rounded-md transition-colors cursor-pointer"
            title={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Ciutkan Menu</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area (Offset for fixed sidebar) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-[padding] duration-200 ease-in-out ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
          }`}
      >
        {/* Topbar (Alinged 64px with Sidebar Header for seamless horizontal line) */}
        <header className="h-16 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)] rounded-lg lg:hidden cursor-pointer"
              aria-label="Buka navigasi menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[var(--color-text-muted)] hidden sm:inline">
                Kasirku
              </span>
              <span className="text-xs text-[var(--color-border)] hidden sm:inline">/</span>
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                {getPageTitle()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Real-time System Notifications Dropdown */}
            <NotificationDropdown />

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)] transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              aria-label="Toggle tema tampilan"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[var(--color-text-secondary)]" />
              )}
            </button>

            {/* Quick POS Action CTA */}
            <NavLink
              to="/pos"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Buka POS</span>
            </NavLink>

            {/* User Profile Dropdown Menu */}
            <DropdownMenu
              align="right"
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-border-muted)] transition-colors cursor-pointer select-none"
                  aria-label="Menu profil pengguna"
                >
                  <div className="w-6 h-6 rounded-lg bg-[var(--color-primary)] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'O'}
                  </div>
                  <span className="text-xs font-medium text-[var(--color-text-primary)] max-w-[90px] truncate hidden md:inline">
                    {user?.name || 'Owner'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                </button>
              }
              items={[
                {
                  label: user?.name || 'Pemilik Toko',
                  description: user?.role === 'owner' ? 'Owner / Admin' : 'Pegawai',
                  icon: <User className="w-4 h-4 text-[var(--color-primary)]" />,
                },
                { separator: true, label: '' },
                {
                  label: 'Pengaturan Toko',
                  icon: <Settings className="w-4 h-4" />,
                  onClick: () => navigate('/settings'),
                },
                {
                  label: 'Riwayat Transaksi',
                  icon: <ReceiptText className="w-4 h-4" />,
                  onClick: () => navigate('/transactions'),
                },
                {
                  label: 'Pegawai & Hak Akses',
                  icon: <UserCheck className="w-4 h-4" />,
                  onClick: () => navigate('/employees'),
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

        {/* Page Main View */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
