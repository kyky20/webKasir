import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import type { Product, Category } from '@/types/pos';
import type { ProductFormData } from '@/services/productService';
import { productService } from '@/services/productService';
import { formatRupiah } from '@/utils/formatters';
import { Select } from '@/components/ui/Select';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: Product | null;
  categories: Category[];
  onSuccess: (product: Product) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  categories,
  onSuccess,
}) => {
  const isEditing = Boolean(productToEdit);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [minStock, setMinStock] = useState('5');
  const [unit, setUnit] = useState('pcs');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setName(productToEdit.name);
        setCategoryId(productToEdit.category_id ? String(productToEdit.category_id) : '');
        setSku(productToEdit.sku);
        setBarcode(productToEdit.barcode || '');
        setCostPrice(String(productToEdit.cost_price));
        setSellingPrice(String(productToEdit.selling_price));
        setStock(String(productToEdit.stock));
        setMinStock(String(productToEdit.min_stock));
        setUnit(productToEdit.unit || 'pcs');
        setDescription(productToEdit.description || '');
        setIsActive(productToEdit.is_active ?? true);
      } else {
        setName('');
        setCategoryId('');
        setSku('');
        setBarcode('');
        setCostPrice('');
        setSellingPrice('');
        setStock('0');
        setMinStock('5');
        setUnit('pcs');
        setDescription('');
        setIsActive(true);
      }
      setErrorMessage(null);
    }
  }, [isOpen, productToEdit]);

  if (!isOpen) return null;

  const cost = parseFloat(costPrice) || 0;
  const sell = parseFloat(sellingPrice) || 0;
  const profitMarginRp = sell - cost;
  const profitMarginPercent = cost > 0 ? ((profitMarginRp / cost) * 100).toFixed(1) : '0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const payload: ProductFormData = {
      name: name.trim(),
      category_id: categoryId ? Number(categoryId) : null,
      sku: sku.trim(),
      barcode: barcode.trim() || undefined,
      cost_price: Number(costPrice),
      selling_price: Number(sellingPrice),
      stock: Number(stock),
      min_stock: Number(minStock),
      unit: unit.trim() || 'pcs',
      description: description.trim() || undefined,
      is_active: isActive,
    };

    try {
      let savedProduct: Product;
      if (isEditing && productToEdit) {
        savedProduct = await productService.updateProduct(productToEdit.id, payload);
      } else {
        savedProduct = await productService.createProduct(payload);
      }
      onSuccess(savedProduct);
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setErrorMessage(axiosErr.response?.data?.message || 'Gagal menyimpan data produk.');
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
      <div className="bg-[var(--color-surface)] w-full max-w-xl rounded-2xl border border-[var(--color-border)] shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface-raised)]">
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
              {isEditing ? 'Ubah Data Produk' : 'Tambah Produk Baru'}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              {isEditing ? 'Perbarui informasi dan harga master produk' : 'Daftarkan barang dagangan baru ke katalog kasir'}
            </p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Nama Produk */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Nama Produk *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Kopi Susu Aren 250ml"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)] transition-colors"
              />
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Kategori
              </label>
              <Select
                value={categoryId}
                onChange={(val) => setCategoryId(String(val))}
                placeholder="Pilih Kategori..."
                options={[
                  { value: '', label: 'Pilih Kategori...' },
                  ...categories.map((cat) => ({
                    value: cat.id,
                    label: cat.name,
                  })),
                ]}
              />
            </div>

            {/* Satuan */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Satuan Barang
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pcs, botol, sak, kg, box"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)]"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Kode SKU (Unik) *
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="KOP-001"
                className="w-full px-3 py-2 text-xs font-mono uppercase rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)]"
              />
            </div>

            {/* Barcode */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Barcode Scanner (Opsional)
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="89912345678"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)]"
              />
            </div>

            {/* Harga Modal (HPP) */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Harga Modal (HPP) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="100"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="Rp 0"
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)] font-mono"
              />
            </div>

            {/* Harga Jual */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Harga Jual Kasir *
              </label>
              <input
                type="number"
                required
                min="0"
                step="100"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="Rp 0"
                className="w-full px-3 py-2 text-xs font-bold text-[var(--color-primary)] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)] font-mono"
              />
            </div>

            {/* Profit Margin Indicator */}
            <div className="sm:col-span-2 p-3 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-muted)]">Estimasi Margin Keuntungan:</span>
              <div className="text-right">
                <span
                  className={`font-bold font-mono ${
                    profitMarginRp >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                  }`}
                >
                  {formatRupiah(profitMarginRp)} ({profitMarginPercent}%)
                </span>
              </div>
            </div>

            {/* Stok Awal (Hanya saat tambah baru) */}
            {!isEditing && (
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                  Stok Awal Fisik
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)] font-mono"
                />
              </div>
            )}

            {/* Batas Stok Minimum */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Peringatan Stok Minimum
              </label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)] font-mono"
              />
            </div>

            {/* Status Aktif */}
            <div className="sm:col-span-2 flex items-center gap-2 pt-1">
              <input
                id="is_active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
              />
              <label htmlFor="is_active" className="text-xs font-medium text-[var(--color-text-secondary)] cursor-pointer">
                Produk Aktif (Dapat dicari dan dijual di halaman kasir POS)
              </label>
            </div>

            {/* Deskripsi */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Keterangan / Deskripsi Produk
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Catatan komposisi, varian, atau spesifikasi barang..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:bg-[var(--color-surface)] focus:outline-hidden focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[var(--color-border)]">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-border-muted)] transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-5 rounded-xl text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>{isEditing ? 'Simpan Perubahan' : 'Tambah Produk'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
