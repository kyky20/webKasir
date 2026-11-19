import React from 'react';
import { Plus, ShoppingCart } from 'lucide-react';
import type { Product } from '@/types/pos';
import { formatRupiah } from '@/utils/formatters';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantityInCart,
  onAddToCart,
}) => {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= product.min_stock;
  const isMaxInCart = quantityInCart >= product.stock;

  return (
    <button
      type="button"
      onClick={() => onAddToCart(product)}
      disabled={isOutOfStock || isMaxInCart}
      className={`group relative text-left bg-[var(--color-surface)] p-3.5 rounded-xl border transition-all duration-150 flex flex-col justify-between shadow-xs ${
        isOutOfStock
          ? 'border-[var(--color-border)] opacity-60 cursor-not-allowed bg-[var(--color-border-muted)]'
          : isMaxInCart
          ? 'border-amber-300 bg-[var(--color-primary-light)]/40 cursor-not-allowed'
          : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-md cursor-pointer'
      }`}
    >
      {/* Top Header: Category & In-Cart Badge */}
      <div>
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <span className="text-[11px] font-medium text-[var(--color-text-muted)] truncate flex-1 min-w-0 whitespace-nowrap">
            {product.category?.name || 'Umum'}
          </span>

          {quantityInCart > 0 && (
            <div
              className="relative inline-flex items-center justify-center p-1 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] shrink-0 whitespace-nowrap"
              title={`${quantityInCart} di keranjang`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--color-primary)] text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                {quantityInCart}
              </span>
            </div>
          )}
        </div>

        {/* Product Name & SKU */}
        <h4 className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-2 leading-snug group-hover:text-[var(--color-primary)] transition-colors">
          {product.name}
        </h4>
        <p className="text-[11px] text-[var(--color-text-muted)] mt-1 font-mono">
          SKU: {product.sku}
        </p>
      </div>

      {/* Bottom Footer: Price & Stock Status */}
      <div className="mt-4 pt-2.5 border-t border-[var(--color-border-muted)] flex items-end justify-between">
        <div>
          <span className="text-[10px] text-[var(--color-text-muted)] block uppercase tracking-wider font-semibold">
            Harga
          </span>
          <p className="text-sm font-bold text-[var(--color-primary)] tabular-nums">
            {formatRupiah(product.selling_price)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          {/* Stock Badges */}
          {isOutOfStock ? (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--color-danger-light)] text-[var(--color-danger)]">
              Habis
            </span>
          ) : isLowStock ? (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--color-warning-light)] text-[var(--color-warning)]">
              Sisa {product.stock} {product.unit}
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-[var(--color-border-muted)] text-[var(--color-text-muted)]">
              Stok {product.stock}
            </span>
          )}

          {!isOutOfStock && !isMaxInCart && (
            <div className="w-6 h-6 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Plus className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>
    </button>
  );
};
