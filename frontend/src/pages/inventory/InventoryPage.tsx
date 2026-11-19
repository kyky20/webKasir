import React, { useState, useEffect, useCallback } from 'react';
import {
  Boxes,
  Search,
  DollarSign,
  Package,
  AlertTriangle,
  XCircle,
  RefreshCw,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import type { Product, Category } from '@/types/pos';
import type { InventoryKPI } from '@/services/inventoryService';
import { inventoryService } from '@/services/inventoryService';
import { productService } from '@/services/productService';
import { formatRupiah } from '@/utils/formatters';
import { StockAdjustmentModal } from '@/components/inventory/StockAdjustmentModal';
import { StockCardModal } from '@/components/inventory/StockCardModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Select } from '@/components/ui/Select';

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [kpi, setKpi] = useState<InventoryKPI>({
    total_asset_value: 0,
    total_units: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    total_products_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<Product | null>(null);
  const [selectedProductIdForCard, setSelectedProductIdForCard] = useState<number | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  const fetchCategories = async () => {
    try {
      const data = await productService.getCategories();
      setCategories(data);
    } catch {
      // ignore
    }
  };

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const result = await inventoryService.getSummary({
        page,
        search: search.trim() || undefined,
        category_id: categoryId ? parseInt(categoryId) : undefined,
        stock_status: stockStatus || undefined,
      });
      setProducts(result.data);
      setKpi(result.kpi);
      setMeta({
        current_page: result.meta.current_page,
        last_page: result.meta.last_page,
        total: result.meta.total,
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryId, stockStatus]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleOpenAdjust = (product: Product) => {
    setSelectedProductForAdjust(product);
    setIsAdjustModalOpen(true);
  };

  const handleOpenCard = (productId: number) => {
    setSelectedProductIdForCard(productId);
    setIsCardModalOpen(true);
  };

  const handleAdjustSuccess = () => {
    fetchInventory();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-colors">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Inventaris, Stok & Opname</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Pantau pergerakan fisik barang, nilai total aset gudang, koreksi opname, dan kartu mutasi stok.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchInventory}
            disabled={loading}
            className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-border-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
            title="Muat ulang inventaris"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Nilai Aset Persediaan */}
        <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Nilai Aset Persediaan
            </span>
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">
              {formatRupiah(kpi.total_asset_value)}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Dihitung dari Stok x Harga Modal
            </p>
          </div>
        </div>

        {/* Total Unit Barang Fisik */}
        <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Total Unit Tersedia
            </span>
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">
              {kpi.total_units} Unit
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Dari {kpi.total_products_count} jenis barang aktif
            </p>
          </div>
        </div>

        {/* Peringatan Stok Menipis */}
        <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Stok Menipis
            </span>
            <div className="w-8 h-8 rounded-lg bg-[var(--color-warning-light)] flex items-center justify-center text-[var(--color-warning)]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-bold text-[var(--color-warning)] tabular-nums">
              {kpi.low_stock_count} Produk
            </p>
            <p className="text-xs text-[var(--color-warning)] mt-1 font-medium">
              Stok berada di bawah batas minimum
            </p>
          </div>
        </div>

        {/* Stok Habis */}
        <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Stok Kosong / Habis
            </span>
            <div className="w-8 h-8 rounded-lg bg-[var(--color-danger-light)] flex items-center justify-center text-[var(--color-danger)]">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-bold text-[var(--color-danger)] tabular-nums">
              {kpi.out_of_stock_count} Produk
            </p>
            <p className="text-xs text-[var(--color-danger)] mt-1 font-medium">
              Perlu segera dilakukan pengadaan
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[var(--color-surface)] p-3.5 rounded-xl border border-[var(--color-border)] shadow-xs space-y-3 transition-colors">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Cari nama barang, SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-primary)]"
            />
          </div>

          {/* Category Filter */}
          <div>
            <Select
              value={categoryId}
              onChange={(val) => {
                setCategoryId(String(val));
                setPage(1);
              }}
              options={[
                { value: '', label: 'Semua Kategori' },
                ...categories.map((cat) => ({
                  value: cat.id,
                  label: cat.name,
                })),
              ]}
            />
          </div>

          {/* Stock Condition */}
          <div>
            <Select
              value={stockStatus}
              onChange={(val) => {
                setStockStatus(String(val));
                setPage(1);
              }}
              options={[
                { value: '', label: 'Semua Kondisi Stok' },
                { value: 'low_stock', label: 'Stok Menipis (Di Bawah Batas)' },
                { value: 'out_of_stock', label: 'Stok Habis (0)' },
                { value: 'in_stock', label: 'Stok Aman' },
              ]}
            />
          </div>

          {/* Reset button */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategoryId('');
                setStockStatus('');
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)] rounded-lg cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-xs overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center">
            <LoadingSpinner size="md" label="Memuat ringkasan stok inventaris..." />
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-2" />
            <h4 className="text-sm font-bold text-[var(--color-text-primary)]">Tidak Ada Barang Sesuai Filter</h4>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 max-w-sm mx-auto">
              Coba sesuaikan kata kunci atau bersihkan filter di atas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--color-border-muted)] border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Produk & SKU</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Kategori</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Harga Modal</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Total Nilai Aset</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">Stok Fisik</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">Batas Min</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">Status</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-muted)]">
                {products.map((prod) => {
                  const cost = parseFloat(String(prod.cost_price));
                  const assetVal = cost * prod.stock;

                  const isOut = prod.stock <= 0;
                  const isLow = !isOut && prod.stock <= prod.min_stock;

                  return (
                    <tr key={prod.id} className="hover:bg-[var(--color-border-muted)]/50 transition-colors">
                      <td className="py-2.5 px-4">
                        <span className="font-bold text-[var(--color-text-primary)] block text-xs">{prod.name}</span>
                        <span className="text-[11px] text-[var(--color-text-muted)] font-mono block mt-0.5">
                          SKU: {prod.sku}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--color-border-muted)] text-[var(--color-text-primary)]">
                          {prod.category?.name || '-'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-medium text-[var(--color-text-muted)] tabular-nums">
                        {formatRupiah(prod.cost_price)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-[var(--color-text-primary)] tabular-nums">
                        {formatRupiah(assetVal)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`font-extrabold text-sm tabular-nums ${
                            isOut
                              ? 'text-[var(--color-danger)]'
                              : isLow
                              ? 'text-[var(--color-warning)]'
                              : 'text-[var(--color-success)]'
                          }`}
                        >
                          {prod.stock}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-muted)] ml-1">{prod.unit}</span>
                      </td>
                      <td className="py-2.5 px-4 text-center text-[var(--color-text-muted)] tabular-nums">
                        {prod.min_stock} {prod.unit}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            isOut
                              ? 'bg-[var(--color-danger-light)] text-[var(--color-danger)]'
                              : isLow
                              ? 'bg-[var(--color-warning-light)] text-[var(--color-warning)]'
                              : 'bg-[var(--color-success-light)] text-[var(--color-success)]'
                          }`}
                        >
                          {isOut ? 'Habis' : isLow ? 'Menipis' : 'Aman'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenAdjust(prod)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
                            title="Penyesuaian stok opname atau catat barang rusak"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>Koreksi / Opname</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenCard(prod.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)] transition-colors cursor-pointer"
                            title="Lihat kartu riwayat pergerakan stok"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                            <span>Kartu Stok</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="p-3 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>
              Halaman {meta.current_page} dari {meta.last_page} ({meta.total} produk)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={meta.current_page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-border-muted)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-border-muted)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        product={selectedProductForAdjust}
        onSuccess={handleAdjustSuccess}
      />

      {/* Stock Card Modal */}
      <StockCardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        productId={selectedProductIdForCard}
      />
    </div>
  );
};
