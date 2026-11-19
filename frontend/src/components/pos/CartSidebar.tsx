import React, { useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, Tag, AlertCircle } from 'lucide-react';
import type { CartItem } from '@/types/pos';
import { formatRupiah } from '@/utils/formatters';

interface CartSidebarProps {
  items: CartItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
  discount: number;
  onUpdateDiscount: (amount: number) => void;
  taxRate: number;
  onOpenPaymentModal: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  discount,
  onUpdateDiscount,
  taxRate,
  onOpenPaymentModal,
}) => {
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [discountInputText, setDiscountInputText] = useState(discount > 0 ? String(discount) : '');

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const effectiveDiscount = Math.min(discount, subtotal);
  const taxAmount = taxRate > 0 ? Math.round((subtotal - effectiveDiscount) * (taxRate / 100)) : 0;
  const grandTotal = Math.max(0, subtotal - effectiveDiscount + taxAmount);

  const handleApplyDiscount = () => {
    const parsed = parseFloat(discountInputText.replace(/\D/g, '')) || 0;
    onUpdateDiscount(parsed);
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] flex flex-col shadow-sm h-full min-h-[580px] overflow-hidden transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border-muted)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Keranjang Belanja</h3>
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium">
              {totalItemsCount} item terpilih
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-xs text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Kosongkan keranjang"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--color-text-muted)]">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-border-muted)] border border-[var(--color-border)] flex items-center justify-center mb-2 text-[var(--color-text-muted)]">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-[var(--color-text-primary)]">Keranjang Masih Kosong</p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 max-w-[200px]">
              Klik produk di katalog untuk menambahkan pesanan pelanggan.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const isMaxStock = item.quantity >= item.product.stock;

            return (
              <div
                key={item.product.id}
                className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-primary)] transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                      {item.product.name}
                    </h5>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      {formatRupiah(item.unitPrice)} / {item.product.unit}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.product.id)}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] p-1 rounded-md transition-colors cursor-pointer"
                    title="Hapus item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-2 pt-2 border-t border-[var(--color-border-muted)] flex items-center justify-between">
                  {/* Quantity controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)] cursor-pointer"
                      title="Kurangi kuantitas"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-semibold text-[var(--color-text-primary)] tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={isMaxStock}
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                      className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                        isMaxStock
                          ? 'border-[var(--color-border)] opacity-40 cursor-not-allowed'
                          : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)] cursor-pointer'
                      }`}
                      title={isMaxStock ? 'Stok produk sudah mencapai batas' : 'Tambah kuantitas'}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right">
                    <span className="text-xs font-bold text-[var(--color-primary)] tabular-nums">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>
                </div>

                {isMaxStock && (
                  <p className="text-[10px] text-[var(--color-warning)] mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>Maksimum stok ({item.product.stock} {item.product.unit})</span>
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary & Actions Footer */}
      <div className="p-4 border-t border-[var(--color-border-muted)] bg-[var(--color-surface-raised)] space-y-3">
        {/* Discount section */}
        {items.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowDiscountInput(!showDiscountInput)}
                className="text-[11px] font-semibold text-[var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Tag className="w-3 h-3" />
                {discount > 0 ? `Diskon: ${formatRupiah(discount)}` : '+ Tambah Diskon'}
              </button>
              {discount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateDiscount(0);
                    setDiscountInputText('');
                  }}
                  className="text-[10px] text-[var(--color-danger)] hover:underline cursor-pointer"
                >
                  Hapus diskon
                </button>
              )}
            </div>

            {showDiscountInput && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  min="0"
                  step="500"
                  placeholder="Nominal diskon (Rp)"
                  value={discountInputText}
                  onChange={(e) => setDiscountInputText(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-primary)]"
                />
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  className="px-2.5 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-xs font-semibold hover:bg-[var(--color-primary-hover)] cursor-pointer"
                >
                  Terapkan
                </button>
              </div>
            )}
          </div>
        )}

        {/* Calculation rows */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-[var(--color-text-secondary)]">
            <span>Subtotal</span>
            <span className="font-medium text-[var(--color-text-primary)] tabular-nums">{formatRupiah(subtotal)}</span>
          </div>

          {effectiveDiscount > 0 && (
            <div className="flex justify-between text-[var(--color-danger)]">
              <span>Diskon</span>
              <span className="font-medium tabular-nums">- {formatRupiah(effectiveDiscount)}</span>
            </div>
          )}

          {taxRate > 0 && (
            <div className="flex justify-between text-[var(--color-text-secondary)]">
              <span>Pajak ({taxRate}%)</span>
              <span className="font-medium text-[var(--color-text-primary)] tabular-nums">{formatRupiah(taxAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-base font-bold text-[var(--color-text-primary)] pt-2 border-t border-[var(--color-border-muted)]">
            <span>Total Tagihan</span>
            <span className="text-[var(--color-primary)] tabular-nums">{formatRupiah(grandTotal)}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          type="button"
          disabled={items.length === 0}
          onClick={onOpenPaymentModal}
          className="w-full py-3 px-4 rounded-lg text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Lanjut ke Pembayaran</span>
        </button>
      </div>
    </div>
  );
};
