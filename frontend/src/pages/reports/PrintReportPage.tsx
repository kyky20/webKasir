import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { financeService } from '@/services/financeService';
import type {
  ProfitLossReport,
  CashFlowReport,
  SalesAnalyticsReport,
  InventoryValuationReport,
} from '@/types/finance';
import { formatRupiah, formatDateTime } from '@/utils/formatters';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const PrintReportPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { store, user } = useAuth();

  const initialTab = searchParams.get('tab') || 'all';
  const initialFrom = searchParams.get('from') || '';
  const initialTo = searchParams.get('to') || '';
  const autoprint = searchParams.get('autoprint') === '1';

  // Filters State
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultTo = now.toISOString().split('T')[0];

  const [reportType, setReportType] = useState<string>(initialTab);
  const [dateFrom, setDateFrom] = useState<string>(initialFrom || defaultFrom);
  const [dateTo, setDateTo] = useState<string>(initialTo || defaultTo);

  // Data States
  const [loading, setLoading] = useState(true);
  const [pnl, setPnl] = useState<ProfitLossReport['data'] | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowReport['data'] | null>(null);
  const [salesAnalytics, setSalesAnalytics] = useState<SalesAnalyticsReport['data'] | null>(null);
  const [inventoryVal, setInventoryVal] = useState<InventoryValuationReport['data'] | null>(null);

  const fetchAllReportData = useCallback(async () => {
    setLoading(true);
    try {
      const promises: Promise<any>[] = [];

      if (reportType === 'all' || reportType === 'pnl') {
        promises.push(
          financeService.getProfitLoss({ date_from: dateFrom, date_to: dateTo }).then((r) => setPnl(r.data))
        );
      }
      if (reportType === 'all' || reportType === 'cashflow') {
        promises.push(
          financeService.getCashFlow({ date_from: dateFrom, date_to: dateTo }).then((r) => setCashFlow(r.data))
        );
      }
      if (reportType === 'all' || reportType === 'sales') {
        promises.push(
          financeService.getSalesAnalytics({ date_from: dateFrom, date_to: dateTo }).then((r) => setSalesAnalytics(r.data))
        );
      }
      if (reportType === 'all' || reportType === 'inventory') {
        promises.push(
          financeService.getInventoryValuation().then((r) => setInventoryVal(r.data))
        );
      }

      await Promise.all(promises);

      if (autoprint) {
        setTimeout(() => {
          window.scrollTo(0, 0);
          window.print();
        }, 600);
      }
    } catch (err) {
      console.error('Failed to fetch print report data', err);
    } finally {
      setLoading(false);
    }
  }, [reportType, dateFrom, dateTo, autoprint]);

  useEffect(() => {
    fetchAllReportData();
  }, [fetchAllReportData]);

  const handlePrint = () => {
    window.scrollTo(0, 0);
    window.print();
  };

  const handleClose = () => {
    if (window.opener) {
      window.close();
    } else {
      navigate('/reports');
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  };

  const docNo = `RPT-${dateFrom.replace(/-/g, '')}-${dateTo.replace(/-/g, '')}`;

  return (
    <div className="min-h-screen bg-stone-200 dark:bg-stone-900 text-stone-900 print:bg-white print:text-black font-serif antialiased">
      {/* ── Document Margins & Print Geometry (A4 Portrait standard margins) ── */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 15mm 15mm 15mm 15mm;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: 100% !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print,
          header {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            width: 100% !important;
          }
          #printable-report {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            overflow: visible !important;
          }
          section {
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 1.5rem !important;
          }
          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>

      {/* ── Control Bar (Hidden when printed) ── */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#1C1917]/95 backdrop-blur-md border-b border-stone-300 dark:border-stone-800 shadow-sm px-4 sm:px-6 py-3 print:hidden font-sans">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-stone-800 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>
            <div className="border-l border-stone-200 dark:border-stone-700 pl-3">
              <h1 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                <span>Dokumen Cetak Laporan Keuangan (A4 / PDF)</span>
              </h1>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Format resmi berstandar akuntansi formal, rapi, dan siap cetak/unduh PDF
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:outline-hidden font-medium cursor-pointer"
            >
              <option value="all">Laporan Keuangan Lengkap</option>
              <option value="pnl">Laba Rugi (Income Statement)</option>
              <option value="cashflow">Arus Kas (Cash Flow)</option>
              <option value="sales">Penjualan & Produk Terlaris</option>
              <option value="inventory">Valuasi Persediaan Stok</option>
            </select>

            <div className="flex items-center gap-1 text-xs">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-2 py-1 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100"
              />
              <span className="text-stone-400">s/d</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2 py-1 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100"
              />
            </div>

            <button
              type="button"
              onClick={handlePrint}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Document Container (Standard A4 Paper Dimensions) ── */}
      <main className="py-6 sm:py-10 px-4 print:p-0 flex justify-center">
        {loading ? (
          <div className="bg-white p-12 rounded-lg border border-stone-300 shadow-md text-center w-full max-w-4xl font-sans">
            <LoadingSpinner size="lg" label="Menyusun dokumen laporan akuntansi..." />
          </div>
        ) : (
          <article
            id="printable-report"
            className="w-full max-w-4xl bg-white text-black p-8 sm:p-12 shadow-2xl border border-stone-300 print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full leading-normal"
          >
            {/* 1. KOP SURAT FORMAL RESMI (Formal Business Header) */}
            <div className="text-center pb-4 border-b-4 border-double border-black mb-6">
              <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-black font-sans">
                {store?.name || 'KASIRKU RETAIL STORE'}
              </h2>
              <p className="text-xs text-stone-700 mt-0.5 font-sans">
                {store?.address || 'Alamat operasional toko terdaftar'}
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-stone-700 mt-0.5 font-sans">
                {store?.phone && <span>Telp: {store.phone}</span>}
                {store?.email && <span>Email: {store.email}</span>}
              </div>
            </div>

            {/* 2. JUDUL DOKUMEN & IDENTITAS LAPORAN */}
            <div className="text-center mb-6">
              <h3 className="text-base sm:text-lg font-bold uppercase tracking-wide underline underline-offset-4 font-sans">
                {reportType === 'all'
                  ? 'LAPORAN KEUANGAN & KINERJA BISNIS'
                  : reportType === 'pnl'
                  ? 'LAPORAN LABA RUGI (INCOME STATEMENT)'
                  : reportType === 'cashflow'
                  ? 'LAPORAN ARUS KAS & POSISI LIKUIDITAS'
                  : reportType === 'sales'
                  ? 'LAPORAN PENJUALAN PRODUK & ANALISIS OMZET'
                  : 'LAPORAN VALUASI & NILAI ASET PERSEDIAAN'}
              </h3>
              <p className="text-xs font-sans mt-1 text-stone-800">
                Periode: <span className="font-semibold">{formatDateDisplay(dateFrom)}</span> s/d{' '}
                <span className="font-semibold">{formatDateDisplay(dateTo)}</span>
              </p>
              <p className="text-[11px] font-sans italic text-stone-600">
                (Dinyatakan dalam mata uang Rupiah - IDR)
              </p>
            </div>

            {/* Metadata Dokumen Baris Atas */}
            <div className="flex justify-between items-center text-[11px] font-sans text-stone-700 border-b border-stone-300 pb-1.5 mb-6">
              <span>Nomor Dokumen: <strong className="font-mono text-black">{docNo}</strong></span>
              <span>Tanggal Cetak: {formatDateTime(new Date().toISOString())}</span>
              <span>Otorisator: <strong>{user?.name}</strong> ({user?.role?.toUpperCase()})</span>
            </div>

            {/* 3. TABEL IKHTISAR KEUANGAN (Formal Summary Table - NO CARDS) */}
            {pnl && (reportType === 'all' || reportType === 'pnl') && (
              <section className="mb-8 break-inside-avoid">
                <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-2 font-sans">
                  I. IKHTISAR KINERJA KEUANGAN EKSEKUTIF
                </h4>
                <table className="w-full text-xs border border-black border-collapse">
                  <thead>
                    <tr className="bg-stone-100 font-sans border-b border-black">
                      <th className="py-1.5 px-3 text-left font-bold border-r border-black w-1/2">
                        Komponen Indikator Keuangan
                      </th>
                      <th className="py-1.5 px-3 text-right font-bold border-r border-black w-1/4">
                        Nilai Finansial (IDR)
                      </th>
                      <th className="py-1.5 px-3 text-left font-bold font-sans w-1/4">
                        Keterangan Rasio / Catatan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-300 font-sans">
                    <tr>
                      <td className="py-1.5 px-3 border-r border-black">Penjualan Bersih (Net Revenue)</td>
                      <td className="py-1.5 px-3 text-right font-mono font-semibold border-r border-black">
                        {formatRupiah(pnl.revenue.net_sales)}
                      </td>
                      <td className="py-1.5 px-3 text-stone-600">{pnl.revenue.transactions_count} transaksi selesai</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 border-r border-black">Beban Pokok Penjualan (HPP)</td>
                      <td className="py-1.5 px-3 text-right font-mono text-stone-800 border-r border-black">
                        ({formatRupiah(pnl.cogs.total_cogs)})
                      </td>
                      <td className="py-1.5 px-3 text-stone-600">Total modal barang keluar</td>
                    </tr>
                    <tr className="bg-stone-50">
                      <td className="py-1.5 px-3 font-semibold border-r border-black">Laba Kotor (Gross Profit)</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold border-r border-black">
                        {formatRupiah(pnl.gross_profit.amount)}
                      </td>
                      <td className="py-1.5 px-3 font-mono font-semibold text-stone-800">
                        Gross Margin: {pnl.gross_profit.margin_percentage}%
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 border-r border-black">Total Beban Operasional Usaha</td>
                      <td className="py-1.5 px-3 text-right font-mono text-stone-800 border-r border-black">
                        ({formatRupiah(pnl.operating_expenses.total)})
                      </td>
                      <td className="py-1.5 px-3 text-stone-600">
                        {pnl.operating_expenses.categories.length} pos kategori beban
                      </td>
                    </tr>
                    <tr className="bg-stone-100 font-bold border-t-2 border-b-2 border-black">
                      <td className="py-2 px-3 uppercase border-r border-black">
                        Laba Bersih Usaha (Net Profit)
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-sm border-r border-black">
                        {formatRupiah(pnl.net_profit.amount)}
                      </td>
                      <td className="py-2 px-3 font-mono">
                        Net Margin: {pnl.net_profit.margin_percentage}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>
            )}

            {/* 4. TABEL RINCIAN LABA RUGI (Multi-Step Statement Table) */}
            {pnl && (reportType === 'all' || reportType === 'pnl') && (
              <section className="mb-8 break-inside-avoid">
                <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-2 font-sans">
                  II. RINCIAN LAPORAN LABA RUGI (STATEMENT OF PROFIT OR LOSS)
                </h4>
                <table className="w-full text-xs border border-black border-collapse">
                  <thead>
                    <tr className="bg-stone-100 font-sans border-b border-black">
                      <th className="py-1.5 px-3 text-left font-bold border-r border-black">Akun Akuntansi</th>
                      <th className="py-1.5 px-3 text-right font-bold border-r border-black w-36">Subtotal (Rp)</th>
                      <th className="py-1.5 px-3 text-right font-bold w-40">Jumlah (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="font-sans">
                    {/* Revenue Section */}
                    <tr className="font-bold bg-stone-50 border-t border-stone-300">
                      <td colSpan={3} className="py-1.5 px-3 border-b border-stone-200">
                        A. PENDAPATAN OPERASIONAL USAHA
                      </td>
                    </tr>
                    <tr className="border-b border-stone-200">
                      <td className="py-1.5 px-6 border-r border-black">Penjualan Kotor (Gross Sales)</td>
                      <td className="py-1.5 px-3 text-right font-mono border-r border-black">
                        {formatRupiah(pnl.revenue.gross_sales)}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono text-stone-400">-</td>
                    </tr>
                    <tr className="border-b border-stone-200">
                      <td className="py-1.5 px-6 border-r border-black text-stone-700">
                        Dikurangi: Potongan Diskon Penjualan
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono border-r border-black">
                        ({formatRupiah(pnl.revenue.sales_discount)})
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono text-stone-400">-</td>
                    </tr>
                    <tr className="border-b border-stone-300 bg-stone-50/70 font-semibold">
                      <td className="py-1.5 px-6 border-r border-black">Total Pendapatan Bersih (Net Sales)</td>
                      <td className="py-1.5 px-3 text-right font-mono border-r border-black text-stone-400">-</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold">{formatRupiah(pnl.revenue.net_sales)}</td>
                    </tr>

                    {/* COGS Section */}
                    <tr className="font-bold bg-stone-50 border-t border-stone-300">
                      <td colSpan={3} className="py-1.5 px-3 border-b border-stone-200">
                        B. BEBAN POKOK PENJUALAN (HPP / COGS)
                      </td>
                    </tr>
                    <tr className="border-b border-stone-200">
                      <td className="py-1.5 px-6 border-r border-black">Beban Pokok Barang Terjual</td>
                      <td className="py-1.5 px-3 text-right font-mono border-r border-black">
                        ({formatRupiah(pnl.cogs.total_cogs)})
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono text-stone-400">-</td>
                    </tr>
                    <tr className="border-b border-stone-300 bg-stone-50/70 font-semibold">
                      <td className="py-1.5 px-6 border-r border-black">Total Beban Pokok Penjualan</td>
                      <td className="py-1.5 px-3 text-right font-mono border-r border-black text-stone-400">-</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold">({formatRupiah(pnl.cogs.total_cogs)})</td>
                    </tr>

                    {/* Gross Profit Line */}
                    <tr className="border-t-2 border-b-2 border-black font-bold bg-stone-100">
                      <td className="py-2 px-3 border-r border-black">
                        LABA KOTOR (GROSS PROFIT) <span className="font-mono font-normal text-xs ml-2">[Margin: {pnl.gross_profit.margin_percentage}%]</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono border-r border-black text-stone-400">-</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-sm">
                        {formatRupiah(pnl.gross_profit.amount)}
                      </td>
                    </tr>

                    {/* Operating Expenses Section */}
                    <tr className="font-bold bg-stone-50 border-t border-stone-300">
                      <td colSpan={3} className="py-1.5 px-3 border-b border-stone-200">
                        C. BEBAN OPERASIONAL (OPERATING EXPENSES)
                      </td>
                    </tr>
                    {pnl.operating_expenses.categories.length === 0 ? (
                      <tr className="border-b border-stone-200">
                        <td colSpan={3} className="py-1.5 px-6 italic text-stone-500">
                          Tidak ada beban operasional tercatat pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      pnl.operating_expenses.categories.map((exp, idx) => (
                        <tr key={idx} className="border-b border-stone-200">
                          <td className="py-1.5 px-6 border-r border-black">Beban: {exp.category_name}</td>
                          <td className="py-1.5 px-3 text-right font-mono border-r border-black">
                            ({formatRupiah(exp.total_amount)})
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono text-stone-400 text-[11px]">{exp.count} trx</td>
                        </tr>
                      ))
                    )}
                    <tr className="border-b border-stone-300 bg-stone-50/70 font-semibold">
                      <td className="py-1.5 px-6 border-r border-black">Total Beban Operasional</td>
                      <td className="py-1.5 px-3 text-right font-mono border-r border-black text-stone-400">-</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold">({formatRupiah(pnl.operating_expenses.total)})</td>
                    </tr>

                    {/* Final Net Profit Line with Double Bottom Border */}
                    <tr className="border-t-2 border-b-4 border-double border-black font-bold bg-stone-200 text-black">
                      <td className="py-2.5 px-3 border-r border-black">
                        LABA BERSIH TAHUN BERJALAN (NET INCOME) <span className="font-mono font-normal text-xs ml-2">[Net Margin: {pnl.net_profit.margin_percentage}%]</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono border-r border-black text-stone-400">-</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-sm">
                        {formatRupiah(pnl.net_profit.amount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>
            )}

            {/* 5. TABEL ARUS KAS & SALDO KAS (Statement of Cash Flows) */}
            {cashFlow && (reportType === 'all' || reportType === 'cashflow') && (
              <section className="mb-8 break-inside-avoid">
                <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-2 font-sans">
                  III. LAPORAN ARUS KAS & POSISI LIKUIDITAS AKHIR PERIODE
                </h4>
                <table className="w-full text-xs border border-black border-collapse mb-4">
                  <thead>
                    <tr className="bg-stone-100 font-sans border-b border-black">
                      <th className="py-1.5 px-3 text-left font-bold border-r border-black">Aktivitas Arus Kas (Cash Flow Activities)</th>
                      <th className="py-1.5 px-3 text-right font-bold w-44">Jumlah Kas (IDR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 font-sans">
                    <tr className="font-bold bg-stone-50">
                      <td colSpan={2} className="py-1 px-3">ARUS KAS MASUK (CASH INFLOW)</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-6 border-r border-black">Penerimaan Kas dari Penjualan POS</td>
                      <td className="py-1.5 px-3 text-right font-mono font-semibold">
                        +{formatRupiah(cashFlow.inflow.sales)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-6 border-r border-black">Penerimaan Kas dari Pendapatan Lain</td>
                      <td className="py-1.5 px-3 text-right font-mono text-stone-700">
                        +{formatRupiah(cashFlow.inflow.other_income)}
                      </td>
                    </tr>
                    <tr className="bg-stone-50/70 font-semibold border-t border-stone-300">
                      <td className="py-1.5 px-6 border-r border-black">Total Penerimaan Kas</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold">
                        +{formatRupiah(cashFlow.inflow.total)}
                      </td>
                    </tr>

                    <tr className="font-bold bg-stone-50">
                      <td colSpan={2} className="py-1 px-3">ARUS KAS KELUAR (CASH OUTFLOW)</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-6 border-r border-black">Pengeluaran Pembelian Stok dari Supplier</td>
                      <td className="py-1.5 px-3 text-right font-mono text-stone-700">
                        -{formatRupiah(cashFlow.outflow.purchases)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-6 border-r border-black">Pengeluaran Kas untuk Beban Operasional</td>
                      <td className="py-1.5 px-3 text-right font-mono text-stone-700">
                        -{formatRupiah(cashFlow.outflow.operating_expenses)}
                      </td>
                    </tr>
                    <tr className="bg-stone-50/70 font-semibold border-t border-stone-300">
                      <td className="py-1.5 px-6 border-r border-black">Total Pengeluaran Kas</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold">
                        -{formatRupiah(cashFlow.outflow.total)}
                      </td>
                    </tr>

                    <tr className="border-t-2 border-b-4 border-double border-black font-bold bg-stone-100">
                      <td className="py-2 px-3 border-r border-black">
                        ARUS KAS BERSIH PERIODE BERJALAN (NET CASH FLOW)
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-sm">
                        {formatRupiah(cashFlow.net_cash_flow)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Saldo Akun Finansial */}
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-stone-800 mb-1.5 font-sans">
                  Rekapitulasi Saldo Kas & Rekening Bank (Posisi Riil Akhir Periode):
                </h5>
                <table className="w-full text-xs border border-black border-collapse">
                  <thead>
                    <tr className="bg-stone-100 font-sans border-b border-black">
                      <th className="py-1.5 px-3 text-left w-10 border-r border-black">No</th>
                      <th className="py-1.5 px-3 text-left border-r border-black">Nama Akun / Buku Kas</th>
                      <th className="py-1.5 px-3 text-left border-r border-black w-36">Jenis Akun</th>
                      <th className="py-1.5 px-3 text-right w-44">Saldo Terakhir (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 font-sans">
                    {cashFlow.accounts.map((acc, idx) => (
                      <tr key={acc.id}>
                        <td className="py-1.5 px-3 text-stone-600 border-r border-black">{idx + 1}</td>
                        <td className="py-1.5 px-3 font-medium border-r border-black">{acc.name}</td>
                        <td className="py-1.5 px-3 capitalize text-stone-700 border-r border-black">{acc.account_type}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-semibold">{formatRupiah(acc.current_balance)}</td>
                      </tr>
                    ))}
                    <tr className="bg-stone-100 font-bold border-t-2 border-b-2 border-black">
                      <td colSpan={3} className="py-2 px-3 border-r border-black uppercase">
                        TOTAL SALDO KAS & SETARA KAS TERSEDIA (LIKUIDITAS AKTIF)
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-sm">
                        {formatRupiah(cashFlow.total_liquid_assets)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>
            )}

            {/* 6. TABEL ANALISIS PENJUALAN PRODUK */}
            {salesAnalytics && (reportType === 'all' || reportType === 'sales') && (
              <section className="mb-8 break-inside-avoid">
                <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-2 font-sans">
                  IV. KINERJA PENJUALAN PRODUK TERLARIS (TOP SELLING PRODUCTS)
                </h4>
                <table className="w-full text-xs border border-black border-collapse">
                  <thead>
                    <tr className="bg-stone-100 font-sans border-b border-black text-[11px]">
                      <th className="py-1.5 px-2 text-left w-10 border-r border-black">No</th>
                      <th className="py-1.5 px-3 text-left border-r border-black">Nama Barang / Produk</th>
                      <th className="py-1.5 px-3 text-left border-r border-black w-24">Kode SKU</th>
                      <th className="py-1.5 px-3 text-right border-r border-black w-24">Qty Terjual</th>
                      <th className="py-1.5 px-3 text-right border-r border-black w-36">Total Omzet (Rp)</th>
                      <th className="py-1.5 px-3 text-right w-36">Estimasi Laba (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 font-sans">
                    {salesAnalytics.top_products.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-3 px-3 text-center italic text-stone-500">
                          Belum ada transaksi penjualan produk yang tercatat pada rentang periode ini.
                        </td>
                      </tr>
                    ) : (
                      salesAnalytics.top_products.map((prod, idx) => (
                        <tr key={prod.id}>
                          <td className="py-1.5 px-2 text-stone-600 border-r border-black">{idx + 1}</td>
                          <td className="py-1.5 px-3 font-medium border-r border-black">{prod.name}</td>
                          <td className="py-1.5 px-3 font-mono text-stone-600 border-r border-black">{prod.sku || '-'}</td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold border-r border-black">
                            {prod.total_quantity} {prod.unit}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono border-r border-black">
                            {formatRupiah(prod.total_revenue)}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono font-semibold">
                            {formatRupiah(prod.estimated_profit)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </section>
            )}

            {/* 7. TABEL VALUASI INVENTARIS & STOK GUDANG */}
            {inventoryVal && (reportType === 'all' || reportType === 'inventory') && (
              <section className="mb-8 break-inside-avoid">
                <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-2 font-sans">
                  V. LAPORAN VALUASI ASET PERSEDIAAN STOK (INVENTORY VALUATION)
                </h4>
                <table className="w-full text-xs border border-black border-collapse">
                  <thead>
                    <tr className="bg-stone-100 font-sans border-b border-black text-[11px]">
                      <th className="py-1.5 px-3 text-left border-r border-black">Kategori Persediaan</th>
                      <th className="py-1.5 px-3 text-right border-r border-black w-24">Varian SKU</th>
                      <th className="py-1.5 px-3 text-right border-r border-black w-24">Stok Fisik</th>
                      <th className="py-1.5 px-3 text-right border-r border-black w-36">Nilai Modal / HPP (Rp)</th>
                      <th className="py-1.5 px-3 text-right border-r border-black w-36">Potensi Nilai Jual (Rp)</th>
                      <th className="py-1.5 px-3 text-right w-36">Potensi Laba (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 font-sans">
                    {inventoryVal.by_category.map((cat, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 px-3 font-medium border-r border-black">{cat.category_name}</td>
                        <td className="py-1.5 px-3 text-right font-mono border-r border-black">{cat.items_count}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold border-r border-black">{cat.stock_units}</td>
                        <td className="py-1.5 px-3 text-right font-mono border-r border-black">{formatRupiah(cat.cost_value)}</td>
                        <td className="py-1.5 px-3 text-right font-mono border-r border-black">{formatRupiah(cat.sales_value)}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-semibold">{formatRupiah(cat.potential_profit)}</td>
                      </tr>
                    ))}
                    <tr className="bg-stone-100 font-bold border-t-2 border-b-4 border-double border-black">
                      <td className="py-2 px-3 border-r border-black uppercase">TOTAL ASET PERSEDIAAN</td>
                      <td className="py-2 px-3 text-right font-mono border-r border-black">
                        {inventoryVal.summary.total_products_count} SKU
                      </td>
                      <td className="py-2 px-3 text-right font-mono border-r border-black">
                        {inventoryVal.summary.total_stock_units} Unit
                      </td>
                      <td className="py-2 px-3 text-right font-mono border-r border-black">
                        {formatRupiah(inventoryVal.summary.total_cost_value)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono border-r border-black">
                        {formatRupiah(inventoryVal.summary.total_sales_value)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        {formatRupiah(inventoryVal.summary.potential_profit)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>
            )}

            {/* 8. LEMBAR PENGESAHAN & TANDA TANGAN RESMI (Formal Sign-off Block) */}
            <div className="mt-10 pt-6 border-t border-black break-inside-avoid font-sans">
              <div className="flex justify-between items-start text-xs">
                <div className="text-center w-56">
                  <p className="text-stone-700">Disiapkan dan disusun oleh:</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">Bagian Keuangan / Administrasi</p>
                  <div className="h-20 flex items-end justify-center">
                    <div className="border-b border-black w-44" />
                  </div>
                  <p className="font-bold text-black mt-1.5">{user?.name}</p>
                  <p className="text-[11px] text-stone-600 font-mono">Staff POS Kasirku</p>
                </div>

                <div className="text-center w-56">
                  <p className="text-stone-700">
                    {store?.name || 'Kasirku'}, {formatDateDisplay(defaultTo)}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">Disetujui dan diverifikasi oleh:</p>
                  <div className="h-20 flex items-end justify-center">
                    <div className="border-b border-black w-44" />
                  </div>
                  <p className="font-bold text-black mt-1.5">Pemilik Toko / Pimpinan</p>
                  <p className="text-[11px] text-stone-600">Tanda Tangan & Cap Resmi</p>
                </div>
              </div>

              {/* Legal disclaimer footer */}
              <div className="mt-8 pt-3 border-t border-dashed border-stone-300 text-center text-[10px] text-stone-500 font-sans">
                Dokumen ini dicetak secara otomatis melalui Sistem Kasirku POS & Pembukuan dan merupakan rekaman data finansial resmi internal toko.
              </div>
            </div>
          </article>
        )}
      </main>
    </div>
  );
};
