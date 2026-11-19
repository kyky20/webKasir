import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  Building2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import type { Supplier } from '../../types/purchase';
import type { Product } from '../../types/pos';
import { contactService } from '../../services/contactService';
import { productService } from '../../services/productService';
import { purchaseService, type CreatePurchasePayload } from '../../services/purchaseService';
import { Select } from '@/components/ui/Select';

interface PurchaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormItem {
  product_id: number;
  product_name: string;
  product_sku: string;
  unit: string;
  unit_cost: number;
  quantity: number;
  subtotal: number;
}

export const PurchaseFormModal: React.FC<PurchaseFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);

  // Form State
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [referenceNo, setReferenceNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'draft' | 'received'>('received');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'credit'>('cash');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [additionalCost, setAdditionalCost] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<FormItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [itemCost, setItemCost] = useState<number>(0);
  const [itemQty, setItemQty] = useState<number>(1);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load suppliers and active products
  useEffect(() => {
    if (isOpen) {
      setLoadingInitial(true);
      Promise.all([
        contactService.getSuppliers({ all: true }),
        productService.getProducts({ all: true }),
      ])
        .then(([supRes, prodRes]) => {
          setSuppliers(supRes.data.filter((s) => s.is_active));
          setProducts(prodRes.data.filter((p) => p.is_active));
        })
        .catch((err) => console.error('Failed to load form dependencies', err))
        .finally(() => setLoadingInitial(false));

      // Reset form
      setSupplierId('');
      setReferenceNo('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setStatus('received');
      setPaymentMethod('cash');
      setDiscountAmount(0);
      setAdditionalCost(0);
      setPaidAmount(0);
      setDueDate('');
      setNotes('');
      setItems([]);
      setSelectedProductId('');
      setItemCost(0);
      setItemQty(1);
      setError(null);
    }
  }, [isOpen]);

  // When selected product changes in add-item row
  const handleProductSelect = (id: number) => {
    setSelectedProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setItemCost(Number(prod.cost_price) || 0);
    }
  };

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === Number(selectedProductId));
    if (!prod) return;

    const qty = Number(itemQty) > 0 ? Number(itemQty) : 1;
    const cost = Number(itemCost) >= 0 ? Number(itemCost) : 0;

    // Check if already in items
    const existingIndex = items.findIndex((i) => i.product_id === prod.id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += qty;
      updated[existingIndex].unit_cost = cost;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * cost;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          product_id: prod.id,
          product_name: prod.name,
          product_sku: prod.sku,
          unit: prod.unit || 'pcs',
          unit_cost: cost,
          quantity: qty,
          subtotal: cost * qty,
        },
      ]);
    }

    // Reset item input
    setSelectedProductId('');
    setItemCost(0);
    setItemQty(1);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemCostChange = (index: number, newCost: number) => {
    const updated = [...items];
    updated[index].unit_cost = newCost;
    updated[index].subtotal = newCost * updated[index].quantity;
    setItems(updated);
  };

  const handleItemQtyChange = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const updated = [...items];
    updated[index].quantity = newQty;
    updated[index].subtotal = updated[index].unit_cost * newQty;
    setItems(updated);
  };

  // Calculations
  const itemsSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalAmount = Math.max(0, itemsSubtotal - (discountAmount || 0) + (additionalCost || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError('Daftar barang pembelian masih kosong.');
      return;
    }

    if (paymentMethod === 'credit' && !dueDate) {
      setError('Tanggal jatuh tempo wajib diisi untuk metode pembayaran Tempo / Kredit.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: CreatePurchasePayload = {
        supplier_id: supplierId ? Number(supplierId) : null,
        reference_no: referenceNo.trim() || undefined,
        purchase_date: purchaseDate,
        status,
        payment_method: paymentMethod,
        discount_amount: Number(discountAmount) || 0,
        additional_cost: Number(additionalCost) || 0,
        paid_amount: Number(paidAmount) || 0,
        due_date: paymentMethod === 'credit' && dueDate ? dueDate : null,
        notes: notes.trim() || undefined,
        items: items.map((i) => ({
          product_id: i.product_id,
          unit_cost: i.unit_cost,
          quantity: i.quantity,
        })),
      };

      await purchaseService.createPurchase(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan transaksi pembelian.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">Catat Pembelian Stok Baru</h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Penerimaan stok dari supplier dan pencatatan utang usaha
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form pembelian"
            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-border-muted)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-[var(--color-danger)] bg-[var(--color-danger-light)] border border-[var(--color-danger)]/20 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Meta: Supplier, Date, Ref No, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)]">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                Supplier
              </label>
              <Select
                value={supplierId}
                onChange={(val) => setSupplierId(val ? Number(val) : '')}
                icon={<Building2 className="w-4 h-4" />}
                options={[
                  { value: '', label: '-- Tanpa Supplier / Pembelian Tunai --' },
                  ...suppliers.map((s) => ({
                    value: s.id,
                    label: s.name,
                  })),
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                Tanggal Pembelian <span className="text-[var(--color-danger)]">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer"
                />
                <Calendar className="w-4 h-4 text-[var(--color-text-muted)] absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                No. Referensi / Surat Jalan
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="SJ-9821 / Nota 01"
                  className="w-full pl-8 pr-3 py-2 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded-xl focus:outline-hidden focus:border-[var(--color-primary)]"
                />
                <FileText className="w-4 h-4 text-[var(--color-text-muted)] absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-1">
                Status Penerimaan
              </label>
              <Select
                value={status}
                onChange={(val) => setStatus(val as any)}
                options={[
                  { value: 'received', label: 'Diterima (Stok Langsung Masuk)' },
                  { value: 'draft', label: 'Draft PO (Penerimaan Nanti)' },
                ]}
              />
            </div>
          </div>

          {/* Add Item Row */}
          <div className="p-4 border border-dashed border-[var(--color-primary)]/30 rounded-xl bg-[var(--color-surface-raised)] space-y-3">
            <h4 className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
              Pilih Produk & Tambah ke Daftar Pembelian
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5">
                <label className="block text-[11px] text-[var(--color-text-muted)] mb-1">Produk</label>
                <Select
                  value={selectedProductId}
                  onChange={(val) => handleProductSelect(Number(val))}
                  disabled={loadingInitial}
                  placeholder="-- Pilih Produk --"
                  options={[
                    { value: '', label: '-- Pilih Produk --' },
                    ...products.map((p) => ({
                      value: p.id,
                      label: `${p.name} (Stok: ${p.stock} ${p.unit})`,
                    })),
                  ]}
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] text-[var(--color-text-muted)] mb-1">Harga Beli Satuan (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={itemCost}
                  onChange={(e) => setItemCost(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl focus:outline-hidden focus:border-[var(--color-primary)] font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-[var(--color-text-muted)] mb-1">Jumlah</label>
                <input
                  type="number"
                  min="1"
                  value={itemQty}
                  onChange={(e) => setItemQty(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl focus:outline-hidden focus:border-[var(--color-primary)] font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedProductId}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah</span>
                </button>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Barang / SKU</th>
                  <th className="px-4 py-3 text-right">Harga Satuan</th>
                  <th className="px-4 py-3 text-center w-28">Jumlah</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                  <th className="px-4 py-3 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-muted)]">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-[var(--color-text-muted)] italic">
                      Belum ada barang dalam daftar pembelian.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={index} className="hover:bg-[var(--color-border-muted)]/30">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[var(--color-text-primary)]">{item.product_name}</div>
                        <div className="text-[11px] text-[var(--color-text-muted)] font-mono">SKU: {item.product_sku}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={item.unit_cost}
                          onChange={(e) => handleItemCostChange(index, Number(e.target.value))}
                          className="w-28 px-2 py-1 text-right text-xs bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg focus:outline-hidden focus:border-[var(--color-primary)] font-mono"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 font-mono">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemQtyChange(index, Number(e.target.value))}
                            className="w-16 px-2 py-1 text-center text-xs bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg focus:outline-hidden focus:border-[var(--color-primary)]"
                          />
                          <span className="text-xs text-[var(--color-text-muted)]">{item.unit}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-[var(--color-text-primary)] font-mono">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] rounded-md hover:bg-[var(--color-danger-light)] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Payment & Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Payment Options */}
            <div className="space-y-3 p-4 bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)]">
              <h4 className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
                Metode Pembayaran
              </h4>

              <div className="grid grid-cols-3 gap-2">
                {(['cash', 'bank_transfer', 'credit'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                      paymentMethod === method
                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                        : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-border-muted)]'
                    }`}
                  >
                    {method === 'cash' ? 'Tunai' : method === 'bank_transfer' ? 'Transfer' : 'Tempo / Kredit'}
                  </button>
                ))}
              </div>

              {paymentMethod === 'credit' && (
                <div className="space-y-3 pt-2 border-t border-[var(--color-border)]">
                  <div>
                    <label className="block text-xs text-[var(--color-text-secondary)] mb-1">
                      Uang Muka / Bayar Sekarang (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={totalAmount}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(Number(e.target.value))}
                      placeholder="0 jika belum bayar sama sekali"
                      className="w-full px-3 py-2 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl focus:outline-hidden focus:border-[var(--color-primary)] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[var(--color-text-secondary)] mb-1">
                      Tanggal Jatuh Tempo Pembayaran
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer"
                    />
                  </div>

                  <div className="p-2.5 bg-[var(--color-primary-light)] rounded-xl border border-[var(--color-primary)]/20 text-xs text-[var(--color-primary)] flex justify-between items-center font-mono">
                    <span>Sisa Utang Usaha:</span>
                    <span className="font-bold">
                      Rp {Math.max(0, totalAmount - paidAmount).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan pengiriman, kondisi barang, dll..."
                  className="w-full px-3 py-2 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded-xl focus:outline-hidden focus:border-[var(--color-primary)]"
                />
              </div>
            </div>

            {/* Calculations */}
            <div className="space-y-3 p-4 bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)] flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
                  <span>Subtotal Barang:</span>
                  <span className="font-medium font-mono">Rp {itemsSubtotal.toLocaleString('id-ID')}</span>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]">
                  <span>Potongan Diskon (Rp):</span>
                  <input
                    type="number"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="w-32 px-2.5 py-1 text-right text-xs bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg focus:outline-hidden focus:border-[var(--color-primary)] font-mono"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]">
                  <span>Biaya Tambahan / Ongkir (Rp):</span>
                  <input
                    type="number"
                    min="0"
                    value={additionalCost}
                    onChange={(e) => setAdditionalCost(Number(e.target.value))}
                    className="w-32 px-2.5 py-1 text-right text-xs bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg focus:outline-hidden focus:border-[var(--color-primary)] font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--color-border)]">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">Total Pembelian:</span>
                  <span className="text-lg font-bold text-[var(--color-primary)] font-mono">
                    Rp {totalAmount.toLocaleString('id-ID')}
                  </span>
                </div>
                {paymentMethod !== 'credit' && (
                  <div className="flex items-center justify-end gap-1.5 text-xs text-[var(--color-success)]">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Lunas via {paymentMethod === 'cash' ? 'Tunai' : 'Transfer'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-border-muted)] transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Pembelian'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
