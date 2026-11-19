import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, RefreshCw, PlusCircle, MinusCircle } from 'lucide-react';
import type { Product } from '@/types/pos';
import type { StockAdjustmentPayload } from '@/services/inventoryService';
import { inventoryService } from '@/services/inventoryService';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: (updatedProduct: Product) => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  product,
  onSuccess,
}) => {
  const [adjustmentType, setAdjustmentType] = useState<'set_stock' | 'add_stock' | 'subtract_stock'>('set_stock');
  const [quantity, setQuantity] = useState('0');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && product) {
      setAdjustmentType('set_stock');
      setQuantity(String(product.stock));
      setReason('');
      setErrorMessage(null);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const currentStock = product.stock;
  const parsedQty = parseInt(quantity) || 0;

  let calculatedNewStock = currentStock;
  if (adjustmentType === 'set_stock') {
    calculatedNewStock = parsedQty;
  } else if (adjustmentType === 'add_stock') {
    calculatedNewStock = currentStock + parsedQty;
  } else if (adjustmentType === 'subtract_stock') {
    calculatedNewStock = Math.max(0, currentStock - parsedQty);
  }

  const isInvalidSubtract = adjustmentType === 'subtract_stock' && parsedQty > currentStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMessage('Alasan penyesuaian stok wajib diisi.');
      return;
    }

    if (isInvalidSubtract) {
      setErrorMessage(`Jumlah pengurangan (${parsedQty}) melebihi stok saat ini (${currentStock}).`);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const payload: StockAdjustmentPayload = {
      product_id: product.id,
      adjustment_type: adjustmentType,
      quantity: parsedQty,
      reason: reason.trim(),
    };

    try {
      const result = await inventoryService.adjustStock(payload);
      onSuccess(result.product);
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setErrorMessage(axiosErr.response?.data?.message || 'Gagal menyesuaikan stok.');
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Terjadi kesalahan sistem.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-[var(--color-surface)] w-full max-w-md rounded-2xl border border-[var(--color-border)] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface-raised)]">
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Penyesuaian Stok (Opname)</h3>
            <p className="text-xs text-[var(--color-text-muted)]">Koreksi fisik atau catat barang rusak/hilang</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-[var(--color-danger-light)] border border-[var(--color-danger)]/20 text-[var(--color-danger)] flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Product Meta */}
          <div className="p-3 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-[var(--color-text-primary)] block text-sm">{product.name}</span>
              <span className="text-[var(--color-text-muted)] font-mono">SKU: {product.sku}</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[var(--color-text-muted)] block">Stok Saat Ini:</span>
              <span className="font-bold text-sm text-[var(--color-primary)] font-mono">
                {product.stock} {product.unit}
              </span>
            </div>
          </div>

          {/* Adjustment Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1.5">
              Jenis Penyesuaian
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAdjustmentType('set_stock');
                  setQuantity(String(currentStock));
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-[11px] font-semibold transition-all cursor-pointer ${
                  adjustmentType === 'set_stock'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-muted)]'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Stok Opname</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdjustmentType('add_stock');
                  setQuantity('1');
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-[11px] font-semibold transition-all cursor-pointer ${
                  adjustmentType === 'add_stock'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-muted)]'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tambah Stok</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdjustmentType('subtract_stock');
                  setQuantity('1');
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-[11px] font-semibold transition-all cursor-pointer ${
                  adjustmentType === 'subtract_stock'
                    ? 'border-[var(--color-danger)] bg-[var(--color-danger-light)] text-[var(--color-danger)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-muted)]'
                }`}
              >
                <MinusCircle className="w-4 h-4" />
                <span>Barang Rusak</span>
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
              {adjustmentType === 'set_stock'
                ? `Jumlah Stok Fisik Sebenarnya (${product.unit})`
                : adjustmentType === 'add_stock'
                ? `Jumlah Unit Tambahan (${product.unit})`
                : `Jumlah Unit Rusak / Dikurangi (${product.unit})`}
            </label>
            <input
              type="number"
              required
              min={adjustmentType === 'set_stock' ? 0 : 1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3.5 py-2 text-sm font-bold rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)] font-mono"
            />
          </div>

          {/* Resulting Stock Preview */}
          <div className="p-3 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-between text-xs">
            <span className="text-[var(--color-text-muted)]">Hasil Perubahan Stok:</span>
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-text-muted)] line-through font-mono">{currentStock}</span>
              <span className="text-[var(--color-text-muted)]">➔</span>
              <span className="font-extrabold text-sm text-[var(--color-primary)] font-mono">
                {calculatedNewStock} {product.unit}
              </span>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
              Alasan Penyesuaian (Wajib diisi) *
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Stok opname fisik bulanan / kemasan pecah"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)]"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[var(--color-border)]">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="py-2 px-4 rounded-xl text-xs font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-border-muted)] transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || isInvalidSubtract}
              className="py-2 px-5 rounded-xl text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Penyesuaian</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
