import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, AlertCircle } from 'lucide-react';
import type { Sale } from '@/types/pos';
import { transactionService } from '@/services/transactionService';
import { formatRupiah, formatDateTime, formatPaymentMethod } from '@/utils/formatters';

export const ReceiptPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const autoprint = searchParams.get('autoprint') === '1';
  const initialSize = (searchParams.get('size') as '58mm' | '80mm') || '58mm';

  const [sale, setSale] = useState<Sale | null>(null);
  const [paperSize, setPaperSize] = useState<'58mm' | '80mm'>(initialSize);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    transactionService
      .getTransaction(id)
      .then((data) => {
        setSale(data);
        if (data.store?.receipt_paper_size) {
          setPaperSize(data.store.receipt_paper_size as '58mm' | '80mm');
        }

        if (autoprint) {
          setTimeout(() => {
            window.print();
          }, 350);
        }
      })
      .catch((err: any) => {
        setError(err.response?.data?.message || err.message || 'Gagal memuat struk transaksi.');
      })
      .finally(() => setLoading(false));
  }, [id, autoprint]);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    if (window.opener) {
      window.close();
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] font-sans">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[var(--color-text-muted)] font-medium">Memuat data struk transaksi...</p>
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4 font-sans">
        <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] max-w-sm w-full text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-[var(--color-danger-light)] text-[var(--color-danger)] rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--color-text-primary)]">Struk Tidak Ditemukan</h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">{error || 'Data transaksi tidak tersedia.'}</p>
          </div>
          <button
            onClick={handleBack}
            className="w-full py-2.5 px-4 bg-[var(--color-primary)] text-white text-xs font-semibold rounded-xl hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const is58mm = paperSize === '58mm';

  return (
    <div className="min-h-screen bg-[var(--color-bg)] print:bg-white flex flex-col items-center py-6 print:py-0 print:m-0 font-sans">
      {/* Control Toolbar (Hidden in Print) */}
      <div className="w-full max-w-md mb-6 px-4 flex items-center justify-between gap-3 print:hidden">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-border-muted)] shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Paper Size Toggle */}
          <div className="inline-flex bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-0.5 shadow-xs">
            <button
              onClick={() => setPaperSize('58mm')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                is58mm ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              58mm
            </button>
            <button
              onClick={() => setPaperSize('80mm')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                !is58mm ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              80mm
            </button>
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[var(--color-primary)] rounded-xl hover:bg-[var(--color-primary-hover)] shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>

      {/* Printable Thermal Receipt Paper Container */}
      <div
        id="thermal-receipt"
        className={`bg-white text-gray-900 font-mono text-xs shadow-md print:shadow-none print:m-0 print:border-none border border-gray-200 rounded-xl print:rounded-none p-5 print:p-2 transition-all ${
          is58mm ? 'w-[280px] print:w-[58mm]' : 'w-[360px] print:w-[80mm]'
        }`}
      >
        {/* Store Header Info */}
        <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-400">
          <h2 className="font-bold text-sm tracking-tight uppercase text-gray-900">
            {sale.store?.name || 'KASIRKU TOKO'}
          </h2>
          {sale.store?.address && (
            <p className="text-[11px] text-gray-700 leading-tight">{sale.store.address}</p>
          )}
          {sale.store?.phone && (
            <p className="text-[11px] text-gray-700">Telp: {sale.store.phone}</p>
          )}
          {sale.store?.receipt_header && (
            <p className="text-[10px] italic text-gray-600 pt-1 border-t border-dashed border-gray-300">
              {sale.store.receipt_header}
            </p>
          )}
        </div>

        {/* Transaction Meta */}
        <div className="py-2.5 space-y-1 text-[11px] border-b border-dashed border-gray-400">
          <div className="flex justify-between">
            <span className="text-gray-600">No. Nota:</span>
            <span className="font-bold text-gray-900">{sale.invoice_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tanggal:</span>
            <span>{formatDateTime(sale.created_at)}</span>
          </div>
          {sale.store?.show_cashier_name !== false && (
            <div className="flex justify-between">
              <span className="text-gray-600">Kasir:</span>
              <span className="font-medium text-gray-900">{sale.cashier?.name || 'Kasir'}</span>
            </div>
          )}
          {sale.status === 'cancelled' && (
            <div className="text-center py-1 bg-red-100 text-red-700 font-bold text-xs rounded mt-1">
              [TRANSAKSI DIBATALKAN]
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="py-2.5 space-y-2 border-b border-dashed border-gray-400 text-[11px]">
          {sale.items.map((item, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="font-semibold text-gray-900 leading-tight">
                {item.product_name}
              </div>
              <div className="flex justify-between text-gray-700">
                <span>
                  {item.quantity} x {formatRupiah(item.unit_price)}
                </span>
                <span className="font-semibold text-gray-900">
                  {formatRupiah(item.total_amount)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals & Payments */}
        <div className="py-2.5 space-y-1 text-[11px] border-b border-dashed border-gray-400">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal:</span>
            <span>{formatRupiah(sale.subtotal)}</span>
          </div>

          {parseFloat(String(sale.discount_amount)) > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Diskon:</span>
              <span>- {formatRupiah(sale.discount_amount)}</span>
            </div>
          )}

          {parseFloat(String(sale.tax_amount)) > 0 && (
            <div className="flex justify-between text-gray-700">
              <span>Pajak (PPN):</span>
              <span>{formatRupiah(sale.tax_amount)}</span>
            </div>
          )}

          <div className="flex justify-between text-xs font-bold text-gray-900 pt-1 border-t border-dashed border-gray-300">
            <span>TOTAL:</span>
            <span className="text-sm">{formatRupiah(sale.total_amount)}</span>
          </div>

          <div className="flex justify-between pt-1 text-gray-700">
            <span>Metode Bayar:</span>
            <span className="capitalize">{formatPaymentMethod(sale.payment_method)}</span>
          </div>

          <div className="flex justify-between text-gray-700">
            <span>Bayar:</span>
            <span>{formatRupiah(sale.paid_amount)}</span>
          </div>

          <div className="flex justify-between font-bold text-gray-900">
            <span>Kembalian:</span>
            <span>{formatRupiah(sale.change_amount)}</span>
          </div>
        </div>

        {/* Receipt Footer Message */}
        <div className="text-center pt-3 text-[10px] text-gray-600 space-y-1">
          {sale.store?.receipt_footer ? (
            <p className="whitespace-pre-line leading-relaxed">{sale.store.receipt_footer}</p>
          ) : (
            <>
              <p>Terima kasih atas kunjungan Anda!</p>
              <p>Barang yang sudah dibeli tidak dapat ditukar.</p>
            </>
          )}

          {/* Barcode representation */}
          <div className="pt-2 flex flex-col items-center opacity-80">
            <div className="font-mono text-[9px] tracking-widest text-gray-400">
              * {sale.invoice_number} *
            </div>
            <div className="text-[9px] text-gray-400 mt-0.5">Powered by Kasirku POS</div>
          </div>
        </div>
      </div>

      {/* Embedded CSS for Exact Thermal Printing */}
      <style>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          /* Hide everything except the thermal receipt container */
          body * {
            visibility: hidden;
          }
          #thermal-receipt, #thermal-receipt * {
            visibility: visible;
          }
          #thermal-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: ${is58mm ? '58mm' : '80mm'} !important;
            padding: 4mm !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};
