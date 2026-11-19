import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Wallet,
  Boxes,
  Calendar,
  Printer,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type {
  ProfitLossReport,
  CashFlowReport,
  SalesAnalyticsReport,
  InventoryValuationReport,
} from '../../types/finance';
import { financeService } from '../../services/financeService';
import { PageHeader } from '@/components/ui/PageHeader';

export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState<'pnl' | 'cashflow' | 'sales' | 'inventory'>('pnl');

  // Date filters
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  const [dateFrom, setDateFrom] = useState(firstDayOfMonth);
  const [dateTo, setDateTo] = useState(todayStr);

  // Reports data states
  const [pnl, setPnl] = useState<ProfitLossReport['data'] | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowReport['data'] | null>(null);
  const [salesAnalytics, setSalesAnalytics] = useState<SalesAnalyticsReport['data'] | null>(null);
  const [inventoryVal, setInventoryVal] = useState<InventoryValuationReport['data'] | null>(null);

  const [loading, setLoading] = useState(false);

  const setPreset = (preset: 'today' | 'last7' | 'thisMonth' | 'last30') => {
    const cur = new Date();
    const today = cur.toISOString().split('T')[0];

    if (preset === 'today') {
      setDateFrom(today);
      setDateTo(today);
    } else if (preset === 'last7') {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 6);
      setDateFrom(d7.toISOString().split('T')[0]);
      setDateTo(today);
    } else if (preset === 'thisMonth') {
      const m1 = new Date(cur.getFullYear(), cur.getMonth(), 1).toISOString().split('T')[0];
      setDateFrom(m1);
      setDateTo(today);
    } else if (preset === 'last30') {
      const d30 = new Date();
      d30.setDate(d30.getDate() - 29);
      setDateFrom(d30.toISOString().split('T')[0]);
      setDateTo(today);
    }
  };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'pnl') {
        const res = await financeService.getProfitLoss({ date_from: dateFrom, date_to: dateTo });
        setPnl(res.data);
      } else if (activeTab === 'cashflow') {
        const res = await financeService.getCashFlow({ date_from: dateFrom, date_to: dateTo });
        setCashFlow(res.data);
      } else if (activeTab === 'sales') {
        const res = await financeService.getSalesAnalytics({ date_from: dateFrom, date_to: dateTo });
        setSalesAnalytics(res.data);
      } else if (activeTab === 'inventory') {
        const res = await financeService.getInventoryValuation();
        setInventoryVal(res.data);
      }
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateFrom, dateTo]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handlePrint = (tabScope?: string) => {
    const params = new URLSearchParams({
      tab: tabScope || activeTab,
      from: dateFrom,
      to: dateTo,
      autoprint: '1',
    });
    const popup = window.open(
      `/reports/print?${params.toString()}`,
      'KasirkuReportPrint',
      'width=1024,height=800,left=150,top=50,toolbar=0,menubar=0,location=0,status=0,scrollbars=1'
    );
    if (!popup) {
      window.open(`/reports/print?${params.toString()}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="print:hidden">
        <PageHeader
          title="Laporan & Analisis Bisnis"
          subtitle="Laporan laba rugi, arus kas, performa penjualan, dan valuasi aset persediaan toko."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Laporan Keuangan' },
          ]}
          actions={
            <div className="flex items-center gap-3">
              {loading && (
                <span className="text-xs text-[var(--color-text-muted)] animate-pulse font-medium">Memuat data...</span>
              )}
              <button
                onClick={() => handlePrint()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[var(--color-text-primary)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-border-muted)] shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[var(--color-text-muted)]" />
                <span>Cetak Laporan</span>
              </button>
            </div>
          }
        />
      </div>

      {/* Date Filter & Preset Controls */}
      <div className="p-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Periode:</span>
          <button
            onClick={() => setPreset('today')}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-border-muted)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] transition-colors cursor-pointer"
          >
            Hari Ini
          </button>
          <button
            onClick={() => setPreset('last7')}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-border-muted)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] transition-colors cursor-pointer"
          >
            7 Hari Terakhir
          </button>
          <button
            onClick={() => setPreset('thisMonth')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] transition-colors cursor-pointer"
          >
            Bulan Ini
          </button>
          <button
            onClick={() => setPreset('last30')}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-border-muted)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] transition-colors cursor-pointer"
          >
            30 Hari
          </button>
        </div>

        {activeTab !== 'inventory' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="pl-8 pr-2.5 py-1.5 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer"
              />
              <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute left-2.5 top-2" />
            </div>
            <span className="text-xs text-[var(--color-text-muted)]">s/d</span>
            <div className="relative">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="pl-8 pr-2.5 py-1.5 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer"
              />
              <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute left-2.5 top-2" />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)] print:hidden">
        <button
          onClick={() => setActiveTab('pnl')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'pnl'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Laba Rugi (P&L)</span>
        </button>

        <button
          onClick={() => setActiveTab('cashflow')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'cashflow'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Arus Kas (Cash Flow)</span>
        </button>

        <button
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'sales'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Penjualan & Best Sellers</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'inventory'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Valuasi Persediaan</span>
        </button>
      </div>

      {/* TAB 1: PROFIT & LOSS */}
      {activeTab === 'pnl' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Penjualan Bersih (Net Sales)
              </span>
              <div className="text-2xl font-bold text-[var(--color-text-primary)] mt-2 font-mono">
                Rp {(pnl?.revenue.net_sales || 0).toLocaleString('id-ID')}
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1 font-mono">
                {pnl?.revenue.transactions_count || 0} transaksi kasir
              </div>
            </div>

            <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Laba Kotor (Gross Profit)
              </span>
              <div className="text-2xl font-bold text-[var(--color-primary)] mt-2 font-mono">
                Rp {(pnl?.gross_profit.amount || 0).toLocaleString('id-ID')}
              </div>
              <div className="text-xs text-[var(--color-success)] font-semibold mt-1">
                Margin Kotor: {pnl?.gross_profit.margin_percentage || 0}%
              </div>
            </div>

            <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Laba Bersih Usaha (Net Profit)
              </span>
              <div
                className={`text-2xl font-bold mt-2 font-mono ${
                  (pnl?.net_profit.amount || 0) >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                }`}
              >
                Rp {(pnl?.net_profit.amount || 0).toLocaleString('id-ID')}
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">
                Margin Bersih: {pnl?.net_profit.margin_percentage || 0}%
              </div>
            </div>
          </div>

          {/* Income Statement Table */}
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-[var(--color-surface-raised)] border-b border-[var(--color-border)]">
              <h3 className="font-bold text-[var(--color-text-primary)] text-sm">Laporan Laba Rugi Komprehensif</h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Format standar akuntansi laba rugi operasional toko
              </p>
            </div>

            <div className="divide-y divide-[var(--color-border-muted)] text-xs">
              {/* Revenue Section */}
              <div className="p-6 space-y-2">
                <div className="font-bold text-[var(--color-text-primary)] uppercase text-[11px] tracking-wider">
                  1. Pendapatan Penjualan
                </div>
                <div className="flex justify-between pl-4 text-[var(--color-text-secondary)]">
                  <span>Penjualan Kotor (Gross Sales)</span>
                  <span className="font-mono">Rp {(pnl?.revenue.gross_sales || 0).toLocaleString('id-ID')}</span>
                </div>
                {Number(pnl?.revenue.sales_discount) > 0 && (
                  <div className="flex justify-between pl-4 text-[var(--color-danger)]">
                    <span>Potongan Diskon Penjualan</span>
                    <span className="font-mono">- Rp {(pnl?.revenue.sales_discount || 0).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between pl-4 font-semibold text-[var(--color-text-primary)] pt-1 border-t border-[var(--color-border-muted)]">
                  <span>Total Penjualan Bersih (A)</span>
                  <span className="font-mono">Rp {(pnl?.revenue.net_sales || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* COGS Section */}
              <div className="p-6 space-y-2 bg-[var(--color-surface-raised)]/40">
                <div className="font-bold text-[var(--color-text-primary)] uppercase text-[11px] tracking-wider">
                  2. Harga Pokok Penjualan (HPP / COGS)
                </div>
                <div className="flex justify-between pl-4 text-[var(--color-text-secondary)]">
                  <span>Beban Pokok Barang Terjual</span>
                  <span className="text-[var(--color-danger)] font-mono">
                    - Rp {(pnl?.cogs.total_cogs || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between pl-4 font-semibold text-[var(--color-text-primary)] pt-1 border-t border-[var(--color-border-muted)]">
                  <span>Total Beban Pokok (B)</span>
                  <span className="text-[var(--color-danger)] font-mono">
                    - Rp {(pnl?.cogs.total_cogs || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Gross Profit Row */}
              <div className="px-6 py-4 bg-[var(--color-primary-light)] border-y border-[var(--color-primary)]/20 flex justify-between items-center font-bold text-sm">
                <span className="text-[var(--color-text-primary)] tracking-wide">LABA KOTOR (C = A - B)</span>
                <span className="text-[var(--color-primary)] font-mono text-base font-bold">
                  Rp {(pnl?.gross_profit.amount || 0).toLocaleString('id-ID')}
                </span>
              </div>

              {/* Operating Expenses Section */}
              <div className="p-6 space-y-2">
                <div className="font-bold text-[var(--color-text-primary)] uppercase text-[11px] tracking-wider">
                  3. Beban Operasional Usaha
                </div>
                {pnl?.operating_expenses.categories && pnl.operating_expenses.categories.length > 0 ? (
                  pnl.operating_expenses.categories.map((cat, idx) => (
                    <div key={idx} className="flex justify-between pl-4 text-[var(--color-text-secondary)]">
                      <span>
                        {cat.category_name} ({cat.count} trx)
                      </span>
                      <span className="font-mono">Rp {cat.total_amount.toLocaleString('id-ID')}</span>
                    </div>
                  ))
                ) : (
                  <div className="pl-4 text-xs text-[var(--color-text-muted)] italic">
                    Tidak ada pengeluaran operasional pada periode ini.
                  </div>
                )}
                <div className="flex justify-between pl-4 font-semibold text-[var(--color-text-primary)] pt-1 border-t border-[var(--color-border-muted)]">
                  <span>Total Beban Operasional (D)</span>
                  <span className="text-[var(--color-danger)] font-mono">
                    - Rp {(pnl?.operating_expenses.total || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Other Income */}
              {Number(pnl?.other_income.total) > 0 && (
                <div className="p-6 space-y-2 bg-[var(--color-surface-raised)]/40">
                  <div className="font-bold text-[var(--color-text-primary)] uppercase text-[11px] tracking-wider">
                    4. Pendapatan Lain-lain
                  </div>
                  <div className="flex justify-between pl-4 text-[var(--color-text-secondary)]">
                    <span>Pemasukan Non-Operasional</span>
                    <span className="text-[var(--color-success)] font-mono">
                      + Rp {(pnl?.other_income.total || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}

              {/* Net Profit Row */}
              <div className="px-6 py-5 bg-[var(--color-sidebar-bg)] text-white flex justify-between items-center font-bold text-base rounded-b-2xl">
                <div>
                  <span>LABA BERSIH OPERASIONAL (NET PROFIT)</span>
                  <span className="block text-[11px] font-normal text-stone-300 mt-0.5">
                    Margin Laba Bersih: {pnl?.net_profit.margin_percentage || 0}%
                  </span>
                </div>
                <span
                  className={`font-mono text-lg ${
                    (pnl?.net_profit.amount || 0) >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                  }`}
                >
                  Rp {(pnl?.net_profit.amount || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CASH FLOW */}
      {activeTab === 'cashflow' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Total Arus Kas Masuk
              </span>
              <div className="text-2xl font-bold text-[var(--color-success)] mt-2 font-mono">
                + Rp {(cashFlow?.inflow.total || 0).toLocaleString('id-ID')}
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">Penjualan & pendapatan kas</div>
            </div>

            <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Total Arus Kas Keluar
              </span>
              <div className="text-2xl font-bold text-[var(--color-danger)] mt-2 font-mono">
                - Rp {(cashFlow?.outflow.total || 0).toLocaleString('id-ID')}
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">Pembelian barang & operasional</div>
            </div>

            <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Arus Kas Bersih (Net Cash Flow)
              </span>
              <div
                className={`text-2xl font-bold mt-2 font-mono ${
                  (cashFlow?.net_cash_flow || 0) >= 0 ? 'text-[var(--color-primary)]' : 'text-[var(--color-danger)]'
                }`}
              >
                Rp {(cashFlow?.net_cash_flow || 0).toLocaleString('id-ID')}
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">Selisih kas masuk vs kas keluar</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inflow Breakdown */}
            <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-[var(--color-border-muted)] text-[var(--color-success)]">
                <ArrowDownLeft className="w-5 h-5" />
                <h4 className="font-bold text-sm text-[var(--color-text-primary)]">Rincian Arus Kas Masuk</h4>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[var(--color-text-secondary)]">
                  <span>Penerimaan Kasir POS (Penjualan)</span>
                  <span className="font-semibold text-[var(--color-text-primary)] font-mono">
                    Rp {(cashFlow?.inflow.sales || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-[var(--color-text-secondary)]">
                  <span>Pemasukan Kas Lainnya</span>
                  <span className="font-semibold text-[var(--color-text-primary)] font-mono">
                    Rp {(cashFlow?.inflow.other_income || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-[var(--color-border-muted)] font-bold text-[var(--color-success)]">
                  <span>Total Kas Masuk:</span>
                  <span className="font-mono">Rp {(cashFlow?.inflow.total || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Outflow Breakdown */}
            <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-[var(--color-border-muted)] text-[var(--color-danger)]">
                <ArrowUpRight className="w-5 h-5" />
                <h4 className="font-bold text-sm text-[var(--color-text-primary)]">Rincian Arus Kas Keluar</h4>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[var(--color-text-secondary)]">
                  <span>Pembayaran Pembelian Barang & Stok</span>
                  <span className="font-semibold text-[var(--color-text-primary)] font-mono">
                    Rp {(cashFlow?.outflow.purchases || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-[var(--color-text-secondary)]">
                  <span>Beban Pengeluaran Operasional</span>
                  <span className="font-semibold text-[var(--color-text-primary)] font-mono">
                    Rp {(cashFlow?.outflow.operating_expenses || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-[var(--color-border-muted)] font-bold text-[var(--color-danger)]">
                  <span>Total Kas Keluar:</span>
                  <span className="font-mono">Rp {(cashFlow?.outflow.total || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Liquid Balances Card */}
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] shadow-xs space-y-4">
            <h4 className="font-bold text-sm text-[var(--color-text-primary)]">Posisi Saldo Kas & Bank Berjalan</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {cashFlow?.accounts.map((acc) => (
                <div key={acc.id} className="p-4 bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)]">
                  <span className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider">{acc.name}</span>
                  <div className="text-base font-bold text-[var(--color-text-primary)] mt-1 font-mono">
                    Rp {Number(acc.current_balance).toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SALES & BEST SELLERS */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Daily Trend Chart */}
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm text-[var(--color-text-primary)]">Tren Penjualan Harian</h4>
                <p className="text-xs text-[var(--color-text-muted)]">Pergerakan omzet toko per tanggal</p>
              </div>
            </div>

            <div className="h-64 w-full">
              {salesAnalytics?.daily_trend && salesAnalytics.daily_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesAnalytics.daily_trend}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E8740C" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#E8740C" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-muted)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={{ stroke: 'var(--color-border)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={{ stroke: 'var(--color-border)' }} />
                    <Tooltip
                      formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`, 'Omzet']}
                      contentStyle={{
                        backgroundColor: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total_sales"
                      stroke="#E8740C"
                      fill="url(#salesGrad)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[var(--color-text-muted)] text-xs">
                  Belum ada data penjualan pada rentang tanggal ini.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Methods */}
            <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-[var(--color-primary)]" />
                <h4 className="font-bold text-sm text-[var(--color-text-primary)]">Metode Pembayaran</h4>
              </div>

              <div className="space-y-3">
                {salesAnalytics?.payment_methods && salesAnalytics.payment_methods.length > 0 ? (
                  salesAnalytics.payment_methods.map((pm, idx) => (
                    <div key={idx} className="p-3 bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)]">
                      <div className="flex justify-between items-center text-xs font-semibold text-[var(--color-text-primary)] capitalize">
                        <span>{pm.method === 'cash' ? 'Tunai (Cash)' : pm.method}</span>
                        <span className="font-mono">Rp {pm.total_amount.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{pm.count} transaksi</div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-[var(--color-text-muted)] italic">Belum ada transaksi.</div>
                )}
              </div>
            </div>

            {/* Top 10 Best Sellers Table */}
            <div className="lg:col-span-2 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-xs overflow-hidden">
              <div className="px-6 py-4 bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[var(--color-primary)]" />
                <h4 className="font-bold text-sm text-[var(--color-text-primary)]">Top 10 Produk Terlaris</h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Peringkat & Produk</th>
                      <th className="px-5 py-3 text-center">Terjual</th>
                      <th className="px-5 py-3 text-right">Total Omzet</th>
                      <th className="px-5 py-3 text-right">Estimasi Laba</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-muted)]">
                    {salesAnalytics?.top_products && salesAnalytics.top_products.length > 0 ? (
                      salesAnalytics.top_products.map((prod, idx) => (
                        <tr key={prod.id} className="hover:bg-[var(--color-border-muted)]/30 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold text-[11px] flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <div>
                                <div className="font-semibold text-[var(--color-text-primary)]">{prod.name}</div>
                                <div className="text-[11px] text-[var(--color-text-muted)] font-mono">SKU: {prod.sku}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-center font-bold text-[var(--color-text-primary)] font-mono">
                            {prod.total_quantity} {prod.unit}
                          </td>
                          <td className="px-5 py-3 text-right font-semibold text-[var(--color-text-primary)] font-mono">
                            Rp {prod.total_revenue.toLocaleString('id-ID')}
                          </td>
                          <td className="px-5 py-3 text-right font-semibold text-[var(--color-success)] font-mono">
                            Rp {prod.estimated_profit.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-[var(--color-text-muted)]">
                          Belum ada data produk terjual pada periode ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INVENTORY VALUATION */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Nilai Modal Stok (HPP)
              </span>
              <div className="text-2xl font-bold text-[var(--color-text-primary)] mt-2 font-mono">
                Rp {(inventoryVal?.summary.total_cost_value || 0).toLocaleString('id-ID')}
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">Uang modal tertanam di produk</div>
            </div>

            <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Estimasi Nilai Jual Pasar
              </span>
              <div className="text-2xl font-bold text-[var(--color-primary)] mt-2 font-mono">
                Rp {(inventoryVal?.summary.total_sales_value || 0).toLocaleString('id-ID')}
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">Potensi omzet jika semua laku</div>
            </div>

            <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Potensi Keuntungan Stok
              </span>
              <div className="text-2xl font-bold text-[var(--color-success)] mt-2 font-mono">
                Rp {(inventoryVal?.summary.potential_profit || 0).toLocaleString('id-ID')}
              </div>
              <div className="text-xs text-[var(--color-success)] font-semibold mt-1">
                Margin potensi laba kotor
              </div>
            </div>

            <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Total Persediaan Barang
              </span>
              <div className="text-2xl font-bold text-[var(--color-text-primary)] mt-2 font-mono">
                {inventoryVal?.summary.total_stock_units || 0} Unit
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1 font-mono">
                Dari {inventoryVal?.summary.total_products_count || 0} item produk aktif
              </div>
            </div>
          </div>

          {/* Breakdown per Category */}
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-[var(--color-surface-raised)] border-b border-[var(--color-border)]">
              <h4 className="font-bold text-sm text-[var(--color-text-primary)]">Valuasi Persediaan Per Kategori Produk</h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Kategori</th>
                    <th className="px-6 py-3.5 text-center">Variasi Produk</th>
                    <th className="px-6 py-3.5 text-center">Total Unit</th>
                    <th className="px-6 py-3.5 text-right">Nilai Modal (HPP)</th>
                    <th className="px-6 py-3.5 text-right">Nilai Jual</th>
                    <th className="px-6 py-3.5 text-right">Potensi Laba</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-muted)]">
                  {inventoryVal?.by_category && inventoryVal.by_category.length > 0 ? (
                    inventoryVal.by_category.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[var(--color-border-muted)]/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-[var(--color-text-primary)]">{row.category_name}</td>
                        <td className="px-6 py-4 text-center text-[var(--color-text-secondary)] font-mono">{row.items_count} item</td>
                        <td className="px-6 py-4 text-center font-bold text-[var(--color-text-primary)] font-mono">
                          {row.stock_units} unit
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-[var(--color-text-secondary)] font-mono">
                          Rp {row.cost_value.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-[var(--color-text-primary)] font-mono">
                          Rp {row.sales_value.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-[var(--color-success)] font-mono">
                          Rp {row.potential_profit.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-[var(--color-text-muted)]">
                        Tidak ada data persediaan barang.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
