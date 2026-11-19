import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  Boxes,
  DollarSign,
  ShoppingCart,
  RefreshCw,
  AlertCircle,
  Trophy,
  Pencil,
  Check,
  X,
  Target,
  CreditCard,
  QrCode,
  Banknote,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Clock,
  Activity,
  CheckCircle2,
  Wallet,
  ChevronRight,
  ShoppingBag,
  Layers,
  ArrowRight,
  Store as StoreIcon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import type { ApiResponse } from '@/types/auth';
import type { Sale } from '@/types/pos';
import { formatRupiah, formatDateTime, formatPaymentMethod } from '@/utils/formatters';
import { TransactionDetailModal } from '@/components/pos/TransactionDetailModal';

// ── Types ──

interface TopProduct {
  product_name: string;
  total_qty: number;
  total_revenue: number;
}

interface EmployeePerformance {
  cashier_name: string;
  sales_count: number;
  total_amount: number;
}

interface WeeklyRevenue {
  date: string;
  revenue: number;
  profit: number;
}

interface MonthlySummary {
  this_month_revenue: number;
  last_month_revenue: number;
  growth_percent: number;
}

interface PaymentMethodStat {
  method: string;
  label: string;
  count: number;
  amount: number;
  percentage: number;
}

interface CategorySalesStat {
  category_name: string;
  total_qty: number;
  total_revenue: number;
}

interface BusinessActivity {
  id: string;
  type: string;
  user_name?: string;
  title: string;
  description: string;
  created_at?: string;
}

interface InventorySummary {
  total_products: number;
  healthy_stock_count: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

interface DashboardStats {
  // Legacy & preserved keys
  today_sales_amount: number;
  today_sales_count: number;
  estimated_gross_profit: number;
  low_stock_count: number;
  recent_transactions: Sale[];
  top_products?: TopProduct[];
  employee_performance?: EmployeePerformance[];
  weekly_revenue?: WeeklyRevenue[];
  monthly_summary?: MonthlySummary;

  // Enhanced CRM Dashboard v2 metrics
  period?: string;
  period_label?: string;
  period_sales_amount?: number;
  period_sales_count?: number;
  average_order_value?: number;
  period_expense_amount?: number;
  profit_margin_percent?: number;
  revenue_growth_percent?: number;
  transactions_growth_percent?: number;
  inventory_summary?: InventorySummary;
  payment_methods?: PaymentMethodStat[];
  category_sales?: CategorySalesStat[];
  recent_activities?: BusinessActivity[];
}

interface EmployeeDashboardStats {
  today_sales_amount: number;
  today_sales_count: number;
  average_order_value: number;
  cash_collected: number;
  non_cash_collected: number;
  recent_transactions: Sale[];
  low_stock_products: Array<{
    id: number;
    name: string;
    stock: number;
    min_stock: number;
    unit?: string;
    selling_price?: number;
  }>;
}

// ── Animation Variants ──

const containerVariants: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.05 },
  },
};

const cardVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
};

// ── Helpers ──

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

function formatDateDisplay(): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

function formatTimeAgo(dateStr?: string): string {
  if (!dateStr) return 'Baru saja';
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return `${Math.floor(diff / 86400)} hari lalu`;
  } catch {
    return dateStr;
  }
}

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[var(--color-border-muted)] ${className}`}
      aria-hidden="true"
    />
  );
}

// ── Target Bulan Ini Component (With Toggle Edit Target) ──

const PRESET_TARGETS = [
  { label: '5 Jt', value: 5_000_000 },
  { label: '10 Jt', value: 10_000_000 },
  { label: '25 Jt', value: 25_000_000 },
  { label: '50 Jt', value: 50_000_000 },
  { label: '100 Jt', value: 100_000_000 },
];

interface SalesTargetCardProps {
  monthlySummary?: MonthlySummary;
  todaySales: number;
  loading: boolean;
  storeId?: number;
}

function SalesTargetCard({ monthlySummary, todaySales, loading, storeId }: SalesTargetCardProps) {
  const storageKey = `kasirku_monthly_target_${storeId ?? 'default'}`;

  const [target, setTarget] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = Number(saved);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return 10_000_000;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = Number(saved);
        if (!isNaN(parsed) && parsed > 0) {
          setTarget(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const achieved = monthlySummary ? monthlySummary.this_month_revenue : todaySales;
  const rawPct = target > 0 ? Math.round((achieved / target) * 100) : 0;
  const clampedPct = Math.min(100, rawPct);

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedPct / 100) * circumference;

  const handleOpenEdit = () => {
    setInputValue(new Intl.NumberFormat('id-ID').format(target));
    setErrorMsg('');
    setIsEditing(true);
  };

  const handleCloseEdit = () => {
    setIsEditing(false);
    setErrorMsg('');
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawNumber = parseInt(inputValue.replace(/\D/g, ''), 10);
    if (!rawNumber || rawNumber < 100_000) {
      setErrorMsg('Target minimal Rp 100.000');
      return;
    }
    setTarget(rawNumber);
    try {
      localStorage.setItem(storageKey, String(rawNumber));
    } catch {
      // ignore
    }
    setIsEditing(false);
  };

  const handleSelectPreset = (val: number) => {
    setInputValue(new Intl.NumberFormat('id-ID').format(val));
    setErrorMsg('');
  };

  if (loading) {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-xs flex flex-col items-center justify-center gap-4 h-full min-h-[310px]">
        <Skeleton className="w-32 h-32 rounded-full" />
        <Skeleton className="w-28 h-4" />
        <Skeleton className="w-20 h-3" />
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-xs flex flex-col justify-between h-full min-h-[310px] relative overflow-hidden transition-all">
      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div
            key="display"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col items-center justify-between h-full gap-3"
          >
            {/* Header: Title & Toggle Edit Button */}
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[var(--color-primary)]" />
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Target Bulan Ini
                </span>
              </div>
              <button
                type="button"
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 transition-all cursor-pointer hover:shadow-xs active:scale-95"
                title="Atur target omzet bulanan"
              >
                <Pencil className="w-3 h-3" />
                <span>Ubah Target</span>
              </button>
            </div>

            {/* SVG Ring */}
            <div className="relative flex items-center justify-center my-0.5">
              <svg
                width="150"
                height="150"
                viewBox="0 0 150 150"
                role="img"
                aria-label={`${rawPct}% dari target tercapai`}
              >
                {/* Track */}
                <circle
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="none"
                  stroke="var(--color-border)"
                  strokeWidth="11"
                />
                {/* Progress arc */}
                <circle
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  transform="rotate(-90 75 75)"
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl sm:text-3xl font-bold tabular-nums text-[var(--color-text-primary)]">
                  {rawPct}%
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">tercapai</span>
              </div>
            </div>

            {/* Nominal Summary */}
            <div className="text-center space-y-0.5">
              <p className="text-base font-bold text-[var(--color-primary)] tabular-nums">
                {formatRupiah(achieved)}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                dari target {formatRupiah(target)}
              </p>
            </div>

            {/* Growth badge vs last month */}
            {monthlySummary && (
              <div
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  monthlySummary.growth_percent >= 0
                    ? 'bg-[var(--color-success-light)] text-[var(--color-success)]'
                    : 'bg-[var(--color-danger-light)] text-[var(--color-danger)]'
                }`}
              >
                {monthlySummary.growth_percent >= 0 ? (
                  <TrendingUp className="w-3 h-3" aria-hidden="true" />
                ) : (
                  <TrendingDown className="w-3 h-3" aria-hidden="true" />
                )}
                {Math.abs(monthlySummary.growth_percent).toFixed(1)}% vs bulan lalu
              </div>
            )}
          </motion.div>
        ) : (
          <motion.form
            key="edit"
            onSubmit={handleSave}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col justify-between h-full gap-3"
          >
            {/* Header: Title & Close Button */}
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-muted)]">
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[var(--color-primary)]" />
                <span className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
                  Atur Target Omzet
                </span>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)] transition-colors cursor-pointer"
                title="Batal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input Form */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">
                  Nominal Target Bulan Ini
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-[var(--color-text-muted)]">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    value={inputValue}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      setInputValue(digits ? new Intl.NumberFormat('id-ID').format(parseInt(digits, 10)) : '');
                      setErrorMsg('');
                    }}
                    placeholder="Contoh: 25.000.000"
                    className="w-full pl-9 pr-3 py-2 text-sm font-semibold rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] tabular-nums transition-colors"
                  />
                </div>
                {errorMsg && (
                  <p className="text-[11px] text-[var(--color-danger)] mt-1">{errorMsg}</p>
                )}
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                    Pilihan Cepat
                  </span>
                  {monthlySummary?.last_month_revenue ? (
                    <button
                      type="button"
                      onClick={() => handleSelectPreset(monthlySummary.last_month_revenue)}
                      className="text-[10px] text-[var(--color-primary)] hover:underline cursor-pointer"
                    >
                      Bulan lalu ({formatRupiah(monthlySummary.last_month_revenue)})
                    </button>
                  ) : null}
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {PRESET_TARGETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => handleSelectPreset(p.value)}
                      className="py-1 px-1 text-[11px] font-medium text-center rounded-md border border-[var(--color-border)] hover:border-[var(--color-primary)] bg-[var(--color-surface-raised)] hover:bg-[var(--color-primary-light)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-all cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference */}
              <div className="p-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-muted)] text-[11px] text-[var(--color-text-muted)] flex justify-between items-center">
                <span>Omzet saat ini:</span>
                <span className="font-semibold text-[var(--color-text-primary)]">
                  {formatRupiah(achieved)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1 border-t border-[var(--color-border-muted)]">
              <button
                type="button"
                onClick={handleCloseEdit}
                className="flex-1 py-1.5 px-3 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)] rounded-lg transition-colors cursor-pointer text-center"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-1.5 px-3 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Target</span>
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Interactive Revenue & Profit Dual Curve Chart ──

interface RevenueChartProps {
  data?: WeeklyRevenue[];
  loading: boolean;
  period: string;
  onPeriodChange: (p: string) => void;
}

function CustomChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  const revenue = payload.find((p: any) => p.dataKey === 'revenue')?.value || 0;
  const profit = payload.find((p: any) => p.dataKey === 'profit')?.value || 0;
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3 shadow-lg text-xs space-y-1.5 backdrop-blur-md">
      <p className="font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border-muted)] pb-1">
        {label}
      </p>
      <div className="flex items-center justify-between gap-4 text-[var(--color-text-secondary)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
          <span>Omzet Penjualan:</span>
        </span>
        <span className="font-bold text-[var(--color-text-primary)] font-mono">
          {formatRupiah(revenue)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 text-[var(--color-text-secondary)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
          <span>Laba Kotor:</span>
        </span>
        <span className="font-bold text-[var(--color-success)] font-mono">
          {formatRupiah(profit)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 pt-1 border-t border-[var(--color-border-muted)] text-[11px] text-[var(--color-text-muted)]">
        <span>Estimasi Margin:</span>
        <span className="font-semibold text-[var(--color-text-primary)]">{margin}%</span>
      </div>
    </div>
  );
}

function RevenueChart({ data = [], loading, period, onPeriodChange }: RevenueChartProps) {
  const chartData = data.map((d) => {
    const parsed = new Date(d.date + 'T00:00:00');
    const label = !isNaN(parsed.getTime())
      ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(parsed)
      : d.date;
    return {
      ...d,
      formattedDate: label,
    };
  });

  const totalPeriodRevenue = data.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalPeriodProfit = data.reduce((acc, curr) => acc + curr.profit, 0);

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-xs flex flex-col justify-between h-full min-h-[310px]">
      {/* Header with Title and Period Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--color-border-muted)]">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[var(--color-primary)]" />
            <span>Tren Penjualan & Keuntungan</span>
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Grafik omzet harian vs estimasi laba kotor aktual
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 bg-[var(--color-border-muted)] p-1 rounded-xl text-xs font-medium">
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: '7days', label: '7 Hari' },
            { id: '30days', label: '30 Hari' },
            { id: 'this_month', label: 'Bulan Ini' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onPeriodChange(item.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                period === item.id
                  ? 'bg-[var(--color-surface)] text-[var(--color-primary)] font-semibold shadow-xs'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary indicators */}
      <div className="flex items-center gap-6 pt-3 pb-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]" />
          <span className="text-[var(--color-text-muted)]">Total Omzet:</span>
          <span className="font-bold text-[var(--color-text-primary)] font-mono">
            {formatRupiah(totalPeriodRevenue)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)]" />
          <span className="text-[var(--color-text-muted)]">Total Laba:</span>
          <span className="font-bold text-[var(--color-success)] font-mono">
            {formatRupiah(totalPeriodProfit)}
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-48 sm:h-52 mt-2">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Skeleton className="w-full h-full rounded-xl" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-[var(--color-text-muted)]">
            Belum ada data penjualan pada periode ini
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="formattedDate"
                stroke="var(--color-text-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--color-text-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => {
                  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}Jt`;
                  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
                  return String(val);
                }}
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Omzet"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#revenueGradient)"
              />
              <Area
                type="monotone"
                dataKey="profit"
                name="Laba Kotor"
                stroke="var(--color-success)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#profitGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ── KPI Card Component ──

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string } | null;
  accent?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'default';
  loading: boolean;
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  trend,
  variant = 'default',
  loading,
}: KpiCardProps) {
  const iconColors = {
    primary: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
    success: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
    warning: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]',
    default: 'bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)]',
  };

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconColors[variant]}`}>
          {icon}
        </div>
      </div>

      <div className="space-y-1 my-1">
        {loading ? (
          <Skeleton className="w-28 h-7 rounded-md" />
        ) : (
          <p className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)] tabular-nums">
            {value}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--color-border-muted)] mt-1">
        <span className="text-[var(--color-text-muted)] truncate max-w-[130px]">{sub}</span>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
              trend.value >= 0
                ? 'bg-[var(--color-success-light)] text-[var(--color-success)]'
                : 'bg-[var(--color-danger-light)] text-[var(--color-danger)]'
            }`}
          >
            {trend.value >= 0 ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            <span>{Math.abs(trend.value).toFixed(1)}%</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ── Top Products & Categories Component ──

interface TopProductsCardProps {
  products?: TopProduct[];
  loading: boolean;
}

function TopProductsCard({ products = [], loading }: TopProductsCardProps) {
  const maxRevenue = products.length > 0 ? Math.max(...products.map((p) => p.total_revenue)) : 1;

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xs overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-[var(--color-border-muted)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[var(--color-primary)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Produk Terlaris
          </h3>
        </div>
        <NavLink
          to="/products"
          className="text-xs text-[var(--color-primary)] hover:underline font-medium flex items-center gap-0.5"
        >
          <span>Katalog</span>
          <ChevronRight className="w-3 h-3" />
        </NavLink>
      </div>

      {loading ? (
        <div className="p-5 space-y-4 flex-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="w-3/4 h-3.5" />
              <Skeleton className="w-full h-2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="p-8 text-center text-xs text-[var(--color-text-muted)] flex-1 flex flex-col items-center justify-center">
          <ShoppingBag className="w-8 h-8 text-[var(--color-border)] mb-2" />
          <span>Belum ada data penjualan produk pada periode ini</span>
        </div>
      ) : (
        <div className="p-5 space-y-3.5 flex-1">
          {products.map((product, idx) => {
            const barPct = maxRevenue > 0 ? Math.round((product.total_revenue / maxRevenue) * 100) : 0;
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        idx === 0
                          ? 'bg-[var(--color-primary)] text-white'
                          : idx === 1
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : idx === 2
                          ? 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                          : 'bg-[var(--color-border-muted)] text-[var(--color-text-muted)]'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-medium text-[var(--color-text-primary)] truncate" title={product.product_name}>
                      {product.product_name}
                    </span>
                  </div>
                  <span className="font-semibold text-[var(--color-text-primary)] font-mono shrink-0">
                    {formatRupiah(product.total_revenue)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-[var(--color-border-muted)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--color-text-muted)] shrink-0 tabular-nums">
                    {product.total_qty} terjual
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Payment Methods & Category Breakdown Component ──

interface PaymentMethodCardProps {
  paymentMethods?: PaymentMethodStat[];
  categorySales?: CategorySalesStat[];
  loading: boolean;
}

function PaymentMethodCard({ paymentMethods = [], categorySales = [], loading }: PaymentMethodCardProps) {
  const [tab, setTab] = useState<'payment' | 'category'>('payment');

  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
        return <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'qris':
        return <QrCode className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />;
      default:
        return <CreditCard className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xs overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-[var(--color-border-muted)] flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[var(--color-primary)]" />
          <span>Komposisi Penjualan</span>
        </h3>
        <div className="flex items-center gap-1 bg-[var(--color-border-muted)] p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setTab('payment')}
            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              tab === 'payment'
                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] font-semibold shadow-xs'
                : 'text-[var(--color-text-secondary)]'
            }`}
          >
            Metode
          </button>
          <button
            type="button"
            onClick={() => setTab('category')}
            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              tab === 'category'
                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] font-semibold shadow-xs'
                : 'text-[var(--color-text-secondary)]'
            }`}
          >
            Kategori
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-5 space-y-4 flex-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="w-1/2 h-3.5" />
              <Skeleton className="w-full h-2" />
            </div>
          ))}
        </div>
      ) : tab === 'payment' ? (
        paymentMethods.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--color-text-muted)] flex-1 flex flex-col items-center justify-center">
            <CreditCard className="w-8 h-8 text-[var(--color-border)] mb-2" />
            <span>Belum ada transaksi pembayaran pada periode ini</span>
          </div>
        ) : (
          <div className="p-5 space-y-3.5 flex-1">
            {paymentMethods.map((pm, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-[var(--color-text-primary)]">
                    {getMethodIcon(pm.method)}
                    <span>{pm.label}</span>
                  </span>
                  <span className="font-semibold text-[var(--color-text-primary)] font-mono">
                    {formatRupiah(pm.amount)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-[var(--color-border-muted)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
                      style={{ width: `${pm.percentage}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--color-text-muted)] shrink-0 tabular-nums">
                    {pm.percentage}% ({pm.count}x)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : categorySales.length === 0 ? (
        <div className="p-8 text-center text-xs text-[var(--color-text-muted)] flex-1 flex flex-col items-center justify-center">
          <Package className="w-8 h-8 text-[var(--color-border)] mb-2" />
          <span>Belum ada data kategori terjual</span>
        </div>
      ) : (
        <div className="p-5 space-y-3.5 flex-1">
          {categorySales.map((cat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--color-text-primary)] truncate">
                  {cat.category_name}
                </span>
                <span className="font-semibold text-[var(--color-text-primary)] font-mono">
                  {formatRupiah(cat.total_revenue)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-[var(--color-border-muted)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((cat.total_qty / Math.max(1, categorySales[0]?.total_qty)) * 100))}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-[var(--color-text-muted)] shrink-0 tabular-nums">
                  {cat.total_qty} item
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Inventory Health Component ──

interface InventoryHealthCardProps {
  summary?: InventorySummary;
  loading: boolean;
}

function InventoryHealthCard({ summary, loading }: InventoryHealthCardProps) {
  const total = summary?.total_products || 0;
  const low = summary?.low_stock_count || 0;
  const out = summary?.out_of_stock_count || 0;
  const healthy = summary?.healthy_stock_count || Math.max(0, total - low - out);

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xs overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-[var(--color-border-muted)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Boxes className="w-4 h-4 text-[var(--color-primary)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Kesehatan Stok Gudang
          </h3>
        </div>
        <NavLink
          to="/inventory"
          className="text-xs text-[var(--color-primary)] hover:underline font-medium flex items-center gap-0.5"
        >
          <span>Kelola Stok</span>
          <ChevronRight className="w-3 h-3" />
        </NavLink>
      </div>

      {loading ? (
        <div className="p-5 space-y-3 flex-1">
          <Skeleton className="w-full h-8" />
          <Skeleton className="w-full h-12" />
        </div>
      ) : (
        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
          {/* Visual health bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-secondary)] font-medium">Status Ketersediaan</span>
              <span className="font-bold text-[var(--color-text-primary)]">{total} Produk Aktif</span>
            </div>
            <div className="h-3 w-full bg-[var(--color-border-muted)] rounded-full overflow-hidden flex">
              {total > 0 && (
                <>
                  <div
                    style={{ width: `${(healthy / total) * 100}%` }}
                    className="h-full bg-emerald-500 transition-all"
                    title={`Aman: ${healthy}`}
                  />
                  <div
                    style={{ width: `${(low / total) * 100}%` }}
                    className="h-full bg-amber-500 transition-all"
                    title={`Menipis: ${low}`}
                  />
                  <div
                    style={{ width: `${(out / total) * 100}%` }}
                    className="h-full bg-red-500 transition-all"
                    title={`Habis: ${out}`}
                  />
                </>
              )}
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
              <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold uppercase">Stok Aman</p>
              <p className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">{healthy}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
              <p className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold uppercase">Menipis</p>
              <p className="text-base font-bold text-amber-700 dark:text-amber-400 font-mono mt-0.5">{low}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
              <p className="text-[10px] text-red-800 dark:text-red-300 font-semibold uppercase">Habis</p>
              <p className="text-base font-bold text-red-700 dark:text-red-400 font-mono mt-0.5">{out}</p>
            </div>
          </div>

          {/* Direct CTA */}
          <NavLink
            to="/inventory"
            className="w-full py-2 px-3 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer"
          >
            <span>Buka Manajemen Inventaris & Opname</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>
      )}
    </div>
  );
}

// ── Live Business Activity Stream Component ──

interface BusinessActivityCardProps {
  activities?: BusinessActivity[];
  loading: boolean;
}

function BusinessActivityCard({ activities = [], loading }: BusinessActivityCardProps) {
  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'sale':
      case 'create_sale':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'purchase':
      case 'create_purchase':
        return <ShoppingBag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-[var(--color-primary)]" />;
    }
  };

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xs overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-[var(--color-border-muted)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[var(--color-primary)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Aktivitas Bisnis Terbaru
          </h3>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          Live Sync
        </span>
      </div>

      {loading ? (
        <div className="p-5 space-y-3 flex-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-7 h-7 rounded-full shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="w-3/4 h-3.5" />
                <Skeleton className="w-1/2 h-2.5" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="p-8 text-center text-xs text-[var(--color-text-muted)] flex-1 flex flex-col items-center justify-center">
          <Clock className="w-8 h-8 text-[var(--color-border)] mb-2" />
          <span>Belum ada rekaman aktivitas bisnis</span>
        </div>
      ) : (
        <div className="p-4 sm:p-5 space-y-3 flex-1 overflow-y-auto max-h-[360px]">
          {activities.map((act) => (
            <div key={act.id} className="flex items-start gap-3 text-xs group">
              <div className="w-7 h-7 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center shrink-0 mt-0.5">
                {getActivityIcon(act.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[var(--color-text-primary)] truncate">
                    {act.title}
                  </p>
                  <span className="text-[10px] text-[var(--color-text-muted)] shrink-0">
                    {formatTimeAgo(act.created_at)}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--color-text-secondary)] truncate">
                  {act.description}
                </p>
                {act.user_name && (
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                    Oleh: <span className="font-medium text-[var(--color-text-secondary)]">{act.user_name}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Recent Transactions Table Component ──

interface RecentTransactionsProps {
  transactions?: Sale[];
  loading: boolean;
  onSelectTransaction: (sale: Sale) => void;
}

function RecentTransactionsCard({ transactions = [], loading, onSelectTransaction }: RecentTransactionsProps) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xs overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-[var(--color-border-muted)] flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[var(--color-primary)]" />
            <span>Transaksi Penjualan Terbaru</span>
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Daftar pesanan kasir yang baru saja diselesaikan
          </p>
        </div>
        <NavLink
          to="/transactions"
          className="text-xs text-[var(--color-primary)] hover:underline font-semibold flex items-center gap-1"
        >
          <span>Semua Transaksi</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </NavLink>
      </div>

      {loading ? (
        <div className="p-5 space-y-3 flex-1">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="w-full h-10 rounded-lg" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-10 text-center text-xs text-[var(--color-text-muted)] flex-1 flex flex-col items-center justify-center">
          <Receipt className="w-8 h-8 text-[var(--color-border)] mb-2" />
          <span>Belum ada transaksi pada periode ini</span>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-xs text-left" aria-label="Tabel transaksi terbaru">
            <thead>
              <tr className="bg-[var(--color-border-muted)] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">
                <th className="px-4 py-2.5">Invoice</th>
                <th className="px-4 py-2.5">Kasir</th>
                <th className="px-4 py-2.5">Waktu</th>
                <th className="px-4 py-2.5">Metode</th>
                <th className="px-4 py-2.5 text-right">Total</th>
                <th className="px-4 py-2.5 text-center">Status</th>
                <th className="px-3 py-2.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-muted)] font-sans">
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="hover:bg-[var(--color-border-muted)]/60 transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-3 font-mono font-semibold text-[var(--color-text-primary)]">
                    {tx.invoice_number}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)] font-medium">
                    {tx.cashier?.name ?? 'Kasir'}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    {formatDateTime(tx.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                      {formatPaymentMethod(tx.payment_method)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[var(--color-text-primary)] font-mono">
                    {formatRupiah(tx.total_amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Selesai
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onSelectTransaction(tx)}
                      className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors cursor-pointer"
                      title="Lihat detail transaksi"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Owner Dashboard View ──

function OwnerDashboardView() {
  const { user, store } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const [period, setPeriod] = useState<string>('7days');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected sale for detail modal
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const fetchStats = useCallback(async (selectedPeriod = period) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse<DashboardStats>>(`/owner/dashboard-stats?period=${selectedPeriod}`);
      if (response.data.data) {
        setStats(response.data.data);
      }
    } catch {
      setError('Gagal memuat data dashboard. Periksa koneksi ke server.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchStats(period);
  }, [period, fetchStats]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  const motionProps = shouldReduceMotion
    ? {}
    : { variants: containerVariants, initial: 'initial', animate: 'animate' };

  const cardMotionProps = shouldReduceMotion ? {} : { variants: cardVariants };

  return (
    <div className="space-y-5 pb-6">
      {/* ── 1. Top Workspace Header (CodeXr CRM Style) ── */}
      <motion.div
        {...cardMotionProps}
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center text-white shrink-0 shadow-xs">
            <StoreIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
                {getGreeting()}, {user?.name ?? 'Owner'} 👋
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                Owner
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              <span className="font-semibold text-[var(--color-text-primary)]">{store?.name ?? 'Kasirku'}</span> • {formatDateDisplay()}
            </p>
          </div>
        </div>

        {/* Global Controls & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchStats(period)}
            disabled={loading}
            className="p-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)] transition-colors cursor-pointer disabled:opacity-50"
            title="Muat ulang data statistik"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[var(--color-primary)]' : ''}`} />
          </button>

          {/* Quick POS Action */}
          <NavLink
            to="/pos"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-xs transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Buka Kasir POS</span>
          </NavLink>
        </div>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 bg-[var(--color-danger-light)] border border-[var(--color-danger)] text-[var(--color-danger)] rounded-2xl px-5 py-4 text-sm"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="flex-1 font-medium">{error}</span>
          <button
            type="button"
            onClick={() => fetchStats(period)}
            className="font-bold underline hover:no-underline cursor-pointer"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* ── 2. Business Overview KPI Cards Grid ── */}
      <motion.div {...motionProps} className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Omzet */}
        <motion.div {...cardMotionProps} className="col-span-2 sm:col-span-1">
          <KpiCard
            label="Total Omzet"
            value={loading ? '...' : formatRupiah(stats?.period_sales_amount ?? stats?.today_sales_amount ?? 0)}
            sub={`${stats?.period_sales_count ?? stats?.today_sales_count ?? 0} transaksi`}
            icon={<DollarSign className="w-4 h-4" />}
            variant="primary"
            trend={
              stats?.revenue_growth_percent !== undefined
                ? { value: stats.revenue_growth_percent, label: 'vs periode lalu' }
                : null
            }
            loading={loading}
          />
        </motion.div>

        {/* Total Keuntungan */}
        <motion.div {...cardMotionProps}>
          <KpiCard
            label="Total Laba Kotor"
            value={loading ? '...' : formatRupiah(stats?.estimated_gross_profit ?? 0)}
            sub={`Margin: ${stats?.profit_margin_percent ?? 0}%`}
            icon={<TrendingUp className="w-4 h-4" />}
            variant="success"
            loading={loading}
          />
        </motion.div>

        {/* Total Transaksi */}
        <motion.div {...cardMotionProps}>
          <KpiCard
            label="Total Transaksi"
            value={loading ? '...' : String(stats?.period_sales_count ?? stats?.today_sales_count ?? 0)}
            sub="Pesanan selesai"
            icon={<Receipt className="w-4 h-4" />}
            trend={
              stats?.transactions_growth_percent !== undefined
                ? { value: stats.transactions_growth_percent, label: 'vs periode lalu' }
                : null
            }
            loading={loading}
          />
        </motion.div>

        {/* Nilai Rata-rata Transaksi */}
        <motion.div {...cardMotionProps}>
          <KpiCard
            label="Rata-rata Order"
            value={loading ? '...' : formatRupiah(stats?.average_order_value ?? 0)}
            sub="Per struk belanja"
            icon={<ShoppingCart className="w-4 h-4" />}
            loading={loading}
          />
        </motion.div>

        {/* Total Pengeluaran */}
        <motion.div {...cardMotionProps}>
          <KpiCard
            label="Beban Operasional"
            value={loading ? '...' : formatRupiah(stats?.period_expense_amount ?? 0)}
            sub="Pengeluaran kas"
            icon={<Wallet className="w-4 h-4" />}
            variant="warning"
            loading={loading}
          />
        </motion.div>
      </motion.div>

      {/* ── 3. Primary Analytics Row: Dual Curve Chart (8/12) + Monthly Target (4/12) ── */}
      <motion.div {...motionProps} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <motion.div {...cardMotionProps} className="lg:col-span-8">
          <RevenueChart
            data={stats?.weekly_revenue}
            loading={loading}
            period={period}
            onPeriodChange={handlePeriodChange}
          />
        </motion.div>

        <motion.div {...cardMotionProps} className="lg:col-span-4">
          <SalesTargetCard
            monthlySummary={stats?.monthly_summary}
            todaySales={stats?.today_sales_amount ?? 0}
            loading={loading}
            storeId={store?.id}
          />
        </motion.div>
      </motion.div>

      {/* ── 4. Performance & Composition Row (Top Products, Payment Methods, Inventory Health) ── */}
      <motion.div {...motionProps} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <motion.div {...cardMotionProps}>
          <TopProductsCard products={stats?.top_products} loading={loading} />
        </motion.div>

        <motion.div {...cardMotionProps}>
          <PaymentMethodCard
            paymentMethods={stats?.payment_methods}
            categorySales={stats?.category_sales}
            loading={loading}
          />
        </motion.div>

        <motion.div {...cardMotionProps}>
          <InventoryHealthCard summary={stats?.inventory_summary} loading={loading} />
        </motion.div>
      </motion.div>

      {/* ── 5. Bottom Row: Recent Transactions (8/12) + Live Business Activities (4/12) ── */}
      <motion.div {...motionProps} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <motion.div {...cardMotionProps} className="lg:col-span-8">
          <RecentTransactionsCard
            transactions={stats?.recent_transactions}
            loading={loading}
            onSelectTransaction={(sale) => setSelectedSale(sale)}
          />
        </motion.div>

        <motion.div {...cardMotionProps} className="lg:col-span-4">
          <BusinessActivityCard activities={stats?.recent_activities} loading={loading} />
        </motion.div>
      </motion.div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        sale={selectedSale}
        isOwner={true}
        onSaleCancelled={() => {
          setSelectedSale(null);
          fetchStats(period);
        }}
      />
    </div>
  );
}

// ── Main Employee Operational Dashboard View ──

function EmployeeDashboardView() {
  const { user, store } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const [stats, setStats] = useState<EmployeeDashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse<EmployeeDashboardStats>>('/employee/dashboard-stats');
      if (response.data.data) {
        setStats(response.data.data);
      }
    } catch {
      setError('Gagal memuat data statistik kasir.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const motionProps = shouldReduceMotion
    ? {}
    : { variants: containerVariants, initial: 'initial', animate: 'animate' };
  const cardMotionProps = shouldReduceMotion ? {} : { variants: cardVariants };

  return (
    <div className="space-y-5 pb-6">
      {/* Employee Greeting Header */}
      <motion.div
        {...cardMotionProps}
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center text-white shrink-0 shadow-xs">
            <StoreIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
                {getGreeting()}, {user?.name} 👋
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                Petugas Kasir
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              <span className="font-semibold text-[var(--color-text-primary)]">{store?.name ?? 'Kasirku'}</span> • {formatDateDisplay()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="p-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)] transition-colors cursor-pointer"
            title="Segarkan data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <NavLink
            to="/pos"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-xs transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Buka Kasir POS</span>
          </NavLink>
        </div>
      </motion.div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-[var(--color-danger-light)] text-[var(--color-danger)] rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Cashier Operational KPIs */}
      <motion.div {...motionProps} className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <motion.div {...cardMotionProps}>
          <KpiCard
            label="Penjualan Saya Hari Ini"
            value={loading ? '...' : formatRupiah(stats?.today_sales_amount ?? 0)}
            sub={`${stats?.today_sales_count ?? 0} transaksi diproses`}
            icon={<DollarSign className="w-4 h-4" />}
            variant="primary"
            loading={loading}
          />
        </motion.div>

        <motion.div {...cardMotionProps}>
          <KpiCard
            label="Jumlah Transaksi"
            value={loading ? '...' : `${stats?.today_sales_count ?? 0} nota`}
            sub="Shift hari ini"
            icon={<Receipt className="w-4 h-4" />}
            loading={loading}
          />
        </motion.div>

        <motion.div {...cardMotionProps}>
          <KpiCard
            label="Kas Fisik di Laci"
            value={loading ? '...' : formatRupiah(stats?.cash_collected ?? 0)}
            sub="Total uang tunai masuk"
            icon={<Banknote className="w-4 h-4" />}
            variant="success"
            loading={loading}
          />
        </motion.div>

        <motion.div {...cardMotionProps}>
          <KpiCard
            label="Non-Tunai / QRIS"
            value={loading ? '...' : formatRupiah(stats?.non_cash_collected ?? 0)}
            sub="Transfer & e-wallet"
            icon={<QrCode className="w-4 h-4" />}
            loading={loading}
          />
        </motion.div>
      </motion.div>

      {/* Cashier Main Row: Recent Transactions (8/12) + Low Stock Alert (4/12) */}
      <motion.div {...motionProps} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <motion.div {...cardMotionProps} className="lg:col-span-8">
          <RecentTransactionsCard
            transactions={stats?.recent_transactions}
            loading={loading}
            onSelectTransaction={(sale) => setSelectedSale(sale)}
          />
        </motion.div>

        <motion.div {...cardMotionProps} className="lg:col-span-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xs overflow-hidden flex flex-col h-full">
            <div className="px-5 py-4 border-b border-[var(--color-border-muted)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Peringatan Stok Menipis
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                Info Meja Kasir
              </span>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="w-full h-8 rounded-lg" />
                ))}
              </div>
            ) : !stats?.low_stock_products || stats.low_stock_products.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--color-text-muted)] flex-1 flex flex-col items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                <span className="font-medium text-[var(--color-text-primary)]">Semua Stok Barang Aman</span>
                <span className="text-[11px] mt-0.5">Tidak ada produk yang berada di batas minimum.</span>
              </div>
            ) : (
              <div className="p-4 space-y-2.5 flex-1">
                <p className="text-[11px] text-[var(--color-text-muted)] mb-1">
                  Harap perhatikan ketersediaan fisik sebelum menawarkan kepada pelanggan:
                </p>
                {stats.low_stock_products.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border-muted)] text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-[var(--color-text-primary)] truncate">{p.name}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">Min. stok: {p.min_stock} {p.unit || 'pcs'}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold font-mono ${
                        p.stock <= 0
                          ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}
                    >
                      Sisa: {p.stock}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        sale={selectedSale}
        isOwner={false}
      />
    </div>
  );
}

// ── Exported Component with Role-based Routing ──

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'employee') {
    return <EmployeeDashboardView />;
  }

  return <OwnerDashboardView />;
};
