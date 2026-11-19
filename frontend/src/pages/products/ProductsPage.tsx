import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Package,
  Edit2,
  Trash2,
  FolderTree,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import type { Product, Category } from '@/types/pos';
import { productService } from '@/services/productService';
import { formatRupiah } from '@/utils/formatters';
import { ProductFormModal } from '@/components/products/ProductFormModal';
import { CategoryModal } from '@/components/products/CategoryModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Select } from '@/components/ui/Select';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<(Category & { products_count?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const fetchCategories = async () => {
    try {
      const data = await productService.getCategories();
      setCategories(data);
    } catch {
      // ignore
    }
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await productService.getProducts({
        page,
        search: search.trim() || undefined,
        category_id: categoryId ? parseInt(categoryId) : undefined,
        status: status || undefined,
        stock_status: stockStatus || undefined,
      });
      setProducts(result.data);
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
  }, [page, search, categoryId, status, stockStatus]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpenCreateProduct = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setProductToEdit(product);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus produk "${name}"?`)) {
      return;
    }

    try {
      await productService.deleteProduct(id);
      fetchProducts();
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus produk.');
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategoryId('');
    setStatus('');
    setStockStatus('');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-colors">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Katalog Produk & Kategori</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Kelola master data barang, harga modal (HPP), harga jual, barcode, dan pengelompokan kategori.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)] transition-colors cursor-pointer"
          >
            <FolderTree className="w-4 h-4 text-[var(--color-primary)]" />
            <span>Kelola Kategori ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateProduct}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-xs font-bold text-white transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[var(--color-surface)] p-3.5 rounded-xl border border-[var(--color-border)] shadow-xs space-y-3 transition-colors">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Cari nama, SKU, barcode..."
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

          {/* Status Filter */}
          <div>
            <Select
              value={status}
              onChange={(val) => {
                setStatus(String(val));
                setPage(1);
              }}
              options={[
                { value: '', label: 'Semua Status Aktif' },
                { value: 'active', label: 'Aktif' },
                { value: 'inactive', label: 'Nonaktif' },
              ]}
            />
          </div>

          {/* Stock Status Filter */}
          <div>
            <Select
              value={stockStatus}
              onChange={(val) => {
                setStockStatus(String(val));
                setPage(1);
              }}
              options={[
                { value: '', label: 'Semua Kondisi Stok' },
                { value: 'in_stock', label: 'Stok Aman' },
                { value: 'low_stock', label: 'Stok Menipis' },
                { value: 'out_of_stock', label: 'Stok Habis' },
              ]}
            />
          </div>

          {/* Reset button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)] rounded-lg whitespace-nowrap cursor-pointer"
            >
              Reset Filter
            </button>
            <button
              type="button"
              onClick={fetchProducts}
              disabled={loading}
              className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-border-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
              title="Muat ulang"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-xs overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center">
            <LoadingSpinner size="md" label="Memuat katalog produk..." />
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-2" />
            <h4 className="text-sm font-bold text-[var(--color-text-primary)]">Belum Ada Produk yang Sesuai</h4>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 max-w-sm mx-auto">
              {search || categoryId || status || stockStatus
                ? 'Tidak ada produk yang cocok dengan kriteria filter.'
                : 'Mulai daftarkan barang dagangan pertama Anda dengan mengklik "Tambah Produk".'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--color-border-muted)] border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Produk</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Kategori</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px]">SKU / Barcode</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Harga Modal</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Harga Jual</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Margin</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">Stok</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">Status</th>
                  <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-muted)]">
                {products.map((prod) => {
                  const cost = parseFloat(String(prod.cost_price));
                  const sell = parseFloat(String(prod.selling_price));
                  const margin = sell - cost;
                  const marginPct = cost > 0 ? ((margin / cost) * 100).toFixed(0) : '0';

                  const isOut = prod.stock <= 0;
                  const isLow = !isOut && prod.stock <= prod.min_stock;

                  return (
                    <tr key={prod.id} className="hover:bg-[var(--color-border-muted)]/50 transition-colors">
                      <td className="py-2.5 px-4">
                        <span className="font-bold text-[var(--color-text-primary)] block text-xs">{prod.name}</span>
                        {prod.description && (
                          <span className="text-[11px] text-[var(--color-text-muted)] truncate max-w-[200px] block mt-0.5">
                            {prod.description}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--color-border-muted)] text-[var(--color-text-primary)]">
                          {prod.category?.name || '-'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono">
                        <span className="font-semibold text-[var(--color-text-primary)]">{prod.sku}</span>
                        {prod.barcode && (
                          <span className="text-[10px] text-[var(--color-text-muted)] block">{prod.barcode}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-medium text-[var(--color-text-muted)] tabular-nums">
                        {formatRupiah(prod.cost_price)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-[var(--color-primary)] tabular-nums">
                        {formatRupiah(prod.selling_price)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className={`text-[11px] font-semibold tabular-nums ${margin >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                          {formatRupiah(margin)}
                          <span className="text-[10px] text-[var(--color-text-muted)] block">({marginPct}%)</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${
                            isOut
                              ? 'bg-[var(--color-danger-light)] text-[var(--color-danger)]'
                              : isLow
                              ? 'bg-[var(--color-warning-light)] text-[var(--color-warning)]'
                              : 'bg-[var(--color-success-light)] text-[var(--color-success)]'
                          }`}
                        >
                          {prod.stock} {prod.unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            prod.is_active ? 'bg-[var(--color-success)]' : 'bg-gray-300'
                          }`}
                          title={prod.is_active ? 'Aktif' : 'Nonaktif'}
                        />
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(prod)}
                            className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-border-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] cursor-pointer"
                            title="Edit produk"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-danger-light)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] cursor-pointer"
                            title="Hapus produk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={productToEdit}
        categories={categories}
        onSuccess={() => {
          fetchProducts();
          fetchCategories();
        }}
      />

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onCategoriesUpdated={() => {
          fetchCategories();
          fetchProducts();
        }}
      />
    </div>
  );
};
