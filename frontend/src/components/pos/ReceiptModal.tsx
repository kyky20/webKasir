import React from 'react';
import { Printer, CheckCircle, ArrowRight, X, ExternalLink } from 'lucide-react';
import type { Sale } from '@/types/pos';
import { formatRupiah, formatDateTime, formatPaymentMethod } from '@/utils/formatters';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onNewTransaction: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
  onNewTransaction,
}) => {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    // Open dedicated receipt print page in a dedicated thermal print popup window
    const receiptUrl = `/receipt/${sale.id}?autoprint=1`;
    const popup = window.open(
      receiptUrl,
      'KasirkuReceiptPrint',
      'width=420,height=680,left=200,top=100,toolbar=0,menubar=0,location=0,status=0,scrollbars=1'
    );
    if (!popup) {
      // Fallback if popup blocked: navigate or print directly
      window.open(receiptUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs print:p-0 print:bg-white print:static">
      <div className="bg-white w-full max-w-sm rounded-2xl border border-[#E5EAE6] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] print:border-none print:shadow-none print:max-w-none print:w-[320px] print:m-0">
        {/* Header Actions (hidden during print) */}
        <div className="p-3 border-b border-[#E5EAE6] flex items-center justify-between bg-[#FAFCFA] print:hidden">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)]">
            <CheckCircle className="w-4 h-4" />
            <span>Transaksi Berhasil</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Receipt Paper Container */}
        <div
          id="thermal-receipt"
          className="p-6 bg-white font-mono text-xs text-gray-800 space-y-3 overflow-y-auto print:p-2"
        >
          {/* Store Info */}
          <div className="text-center space-y-0.5 border-b border-dashed border-gray-300 pb-3">
            <h4 className="font-bold text-sm tracking-tight text-gray-900 uppercase">
              {sale.store?.name || 'Kasirku Toko'}
            </h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              {sale.store?.address || 'Jl. Jenderal Sudirman No. 45'}
            </p>
            <p className="text-[11px] text-gray-600">
              Telp: {sale.store?.phone || '081234567890'}
            </p>
          </div>

          {/* Transaction Meta */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-gray-300 pb-3">
            <div className="flex justify-between">
              <span>No. Nota:</span>
              <span className="font-bold">{sale.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal:</span>
              <span>{formatDateTime(sale.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir:</span>
              <span>{sale.cashier?.name || 'Kasir'}</span>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-2 border-b border-dashed border-gray-300 pb-3">
            {sale.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="font-semibold text-gray-900 leading-tight">
                  {item.product_name}
                </div>
                <div className="flex justify-between text-[11px] text-gray-600">
                  <span>
                    {item.quantity} x {formatRupiah(item.unit_price)}
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatRupiah(item.total_amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals & Payment */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-gray-300 pb-3">
            <div className="flex justify-between">
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
              <div className="flex justify-between">
                <span>Pajak:</span>
                <span>{formatRupiah(sale.tax_amount)}</span>
              </div>
            )}

            <div className="flex justify-between text-xs font-bold text-gray-900 pt-1">
              <span>TOTAL:</span>
              <span>{formatRupiah(sale.total_amount)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span>Metode:</span>
              <span>{formatPaymentMethod(sale.payment_method)}</span>
            </div>
            <div className="flex justify-between">
              <span>Bayar:</span>
              <span>{formatRupiah(sale.paid_amount)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Kembalian:</span>
              <span>{formatRupiah(sale.change_amount)}</span>
            </div>
          </div>

          {/* Receipt Footer Message */}
          <div className="text-center text-[11px] text-gray-500 pt-1 space-y-1">
            <p>{sale.store?.receipt_footer || 'Terima kasih atas kunjungan Anda!'}</p>
            <p className="text-[10px]">Barang yang sudah dibeli tidak dapat ditukar.</p>
          </div>
        </div>

        {/* Modal Footer Controls (Hidden during print) */}
        <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] flex flex-col gap-2 print:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 py-2.5 px-3 rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] text-xs font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Cetak Struk</span>
            </button>

            <button
              type="button"
              onClick={onNewTransaction}
              className="flex-1 py-2.5 px-3 rounded-lg bg-[var(--color-border-muted)] text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Transaksi Baru</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <a
            href={`/receipt/${sale.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center py-1.5 text-[11px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:underline flex items-center justify-center gap-1 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka Halaman Struk Khusus</span>
          </a>
        </div>
      </div>
    </div>
  );
};
