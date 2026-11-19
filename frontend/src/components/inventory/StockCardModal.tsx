import React, { useState, useEffect } from 'react';
import { X, Boxes, Loader2, ArrowDownRight, ArrowUpRight, RefreshCw, Calendar, User } from 'lucide-react';
import type { Product } from '@/types/pos';
import type { StockMovementRecord } from '@/services/inventoryService';
import { inventoryService } from '@/services/inventoryService';
import { formatDateTime, formatRupiah } from '@/utils/formatters';

interface StockCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number | null;
}

export const StockCardModal: React.FC<StockCardModalProps> = ({
  isOpen,
  onClose,
  productId,
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovementRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && productId) {
      setLoading(true);
      inventoryService
        .getMovements(productId)
        .then((res) => {
          setProduct(res.product);
          setMovements(res.movements);
        })
        .catch(() => {
          // ignore
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, productId]);

  if (!isOpen) return null;

  const getMovementBadge = (type: StockMovementRecord['type']) => {
    switch (type) {
      case 'sale':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--color-danger-light)] text-[var(--color-danger)]">
            <ArrowDownRight className="w-3 h-3" /> Penjualan Kasir
          </span>
        );
      case 'return':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--color-success-light)] text-[var(--color-success)]">
            <ArrowUpRight className="w-3 h-3" /> Retur / Batal Jual
          </span>
        );
      case 'adjustment':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--color-primary-light)] text-[var(--color-primary)]">
            <RefreshCw className="w-3 h-3" /> Penyesuaian / Opname
          </span>
        );
      case 'purchase':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--color-info-light)] text-[var(--color-info)]">
            <ArrowUpRight className="w-3 h-3" /> Pembelian Masuk
          </span>
        );
      default:
        return <span>{type}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-[var(--color-surface)] w-full max-w-2xl rounded-2xl border border-[var(--color-border)] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface-raised)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Kartu Stok Produk</h3>
              <p className="text-xs text-[var(--color-text-muted)]">Riwayat kronologis mutasi persediaan barang masuk & keluar</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Details Header Bar */}
        {product && (
          <div className="px-5 py-3.5 bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[var(--color-text-muted)] block">Nama Produk:</span>
              <span className="font-bold text-[var(--color-text-primary)] text-sm truncate block">{product.name}</span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] block">SKU / Satuan:</span>
              <span className="font-mono font-semibold text-[var(--color-text-primary)]">{product.sku} ({product.unit})</span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] block">Harga Modal / Jual:</span>
              <span className="font-mono text-[var(--color-text-primary)]">
                {formatRupiah(product.cost_price)} / {formatRupiah(product.selling_price)}
              </span>
            </div>
            <div className="text-right sm:text-left">
              <span className="text-[var(--color-text-muted)] block">Stok Fisik Saat Ini:</span>
              <span className="font-extrabold text-sm text-[var(--color-primary)] font-mono">
                {product.stock} {product.unit}
              </span>
            </div>
          </div>
        )}

        {/* Body Table */}
        <div className="p-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin mx-auto mb-2" />
              <p className="text-xs text-[var(--color-text-muted)]">Memuat riwayat kartu stok...</p>
            </div>
          ) : movements.length === 0 ? (
            <div className="p-10 text-center text-[var(--color-text-muted)]">
              <Boxes className="w-10 h-10 opacity-30 mx-auto mb-2" />
              <p className="text-xs font-semibold text-[var(--color-text-primary)]">Belum Ada Riwayat Pergerakan Stok</p>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                Pergerakan stok akan tercatat otomatis saat transaksi kasir, pembelian, atau penyesuaian opname dilakukan.
              </p>
            </div>
          ) : (
            <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-semibold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Waktu & Jenis</th>
                    <th className="py-2.5 px-3 text-center">Mutasi</th>
                    <th className="py-2.5 px-3 text-center">Sebelum ➔ Sesudah</th>
                    <th className="py-2.5 px-3">Alasan / Keterangan</th>
                    <th className="py-2.5 px-3">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-muted)]">
                  {movements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-[var(--color-border-muted)]/30 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3" />
                          {formatDateTime(mov.created_at)}
                        </span>
                        <div className="mt-0.5">{getMovementBadge(mov.type)}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        <span
                          className={`font-bold text-xs ${
                            mov.quantity > 0
                              ? 'text-[var(--color-success)]'
                              : mov.quantity < 0
                              ? 'text-[var(--color-danger)]'
                              : 'text-[var(--color-text-muted)]'
                          }`}
                        >
                          {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[var(--color-text-primary)]">
                        {mov.stock_before} ➔ <span className="font-bold text-[var(--color-primary)]">{mov.stock_after}</span>
                      </td>
                      <td className="py-2.5 px-3 text-[var(--color-text-secondary)] max-w-[180px]">
                        <p className="truncate" title={mov.notes || ''}>
                          {mov.notes || '-'}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 text-[var(--color-text-primary)] font-medium whitespace-nowrap">
                        <span className="flex items-center gap-1 text-[11px]">
                          <User className="w-3 h-3 text-[var(--color-text-muted)]" />
                          {mov.user?.name || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-border-muted)] cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
