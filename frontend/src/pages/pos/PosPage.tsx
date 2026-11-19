import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ShoppingCart,
  User as UserIcon,
  RefreshCw,
  X,
  Package,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import type { Category, Product, CartItem, Sale } from '@/types/pos';
import { posService } from '@/services/posService';
import { ProductCard } from '@/components/pos/ProductCard';
import { CartSidebar } from '@/components/pos/CartSidebar';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const PosPage: React.FC = () => {
  const { user, store } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Fetch products and categories
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catData, prodData] = await Promise.all([
        posService.getCategories(),
        posService.getProducts(),
      ]);
      setCategories(catData);
      setProducts(prodData);
    } catch {
      setError('Gagal memuat katalog produk. Periksa koneksi backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchCategory = selectedCategoryId ? prod.category_id === selectedCategoryId : true;
      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = prod.name.toLowerCase().includes(q);
      const matchSku = prod.sku.toLowerCase().includes(q);
      const matchBarcode = prod.barcode ? prod.barcode.toLowerCase().includes(q) : false;

      return matchName || matchSku || matchBarcode;
    });
  }, [products, selectedCategoryId, searchQuery]);

  // Cart helper map for fast quantity lookup
  const cartQuantityMap = useMemo(() => {
    const map = new Map<number, number>();
    cartItems.forEach((item) => {
      map.set(item.product.id, item.quantity);
    });
    return map;
  }, [cartItems]);

  // Cart actions
  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((i) =>
          i.product.id === product.id
            ? {
              ...i,
              quantity: i.quantity + 1,
              subtotal: (i.quantity + 1) * i.unitPrice,
            }
            : i
        );
      } else {
        const unitPrice = parseFloat(String(product.selling_price));
        return [
          ...prev,
          {
            product,
            quantity: 1,
            unitPrice,
            subtotal: unitPrice,
          },
        ];
      }
    });
  };

  const handleUpdateQuantity = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const clampedQty = Math.min(newQty, item.product.stock);
          return {
            ...item,
            quantity: clampedQty,
            subtotal: clampedQty * item.unitPrice,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (productId: number) => {
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleClearCart = () => {
    if (window.confirm('Kosongkan semua item dalam keranjang?')) {
      setCartItems([]);
      setDiscount(0);
    }
  };

  // Checkout success handler
  const handleCheckoutSuccess = (sale: Sale) => {
    setCompletedSale(sale);
    setIsPaymentModalOpen(false);
    setIsReceiptModalOpen(true);

    // Refresh product stock in catalog from server
    fetchData();
  };

  const handleNewTransaction = () => {
    setCartItems([]);
    setDiscount(0);
    setCompletedSale(null);
    setIsReceiptModalOpen(false);
    setSearchQuery('');
  };

  // Calculations
  const taxRate = parseFloat(String(store?.tax_percentage || 0));
  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const effectiveDiscount = Math.min(discount, subtotal);
  const taxAmount = taxRate > 0 ? Math.round((subtotal - effectiveDiscount) * (taxRate / 100)) : 0;
  const grandTotal = Math.max(0, subtotal - effectiveDiscount + taxAmount);
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-4">
      {/* Top Status Bar */}
      <div className="bg-[var(--color-surface)] p-3.5 rounded-xl border border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3 shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Kasir</h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Toko: <span className="font-semibold text-[var(--color-text-primary)]">{store?.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 text-xs bg-[var(--color-border-muted)] border border-[var(--color-border)] px-3 py-1.5 rounded-lg">
            <UserIcon className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span className="text-[var(--color-text-muted)]">Kasir:</span>
            <span className="font-semibold text-[var(--color-text-primary)]">{user?.name}</span>
            <span className="text-[var(--color-border)]">|</span>
            <span className="px-1.5 py-0.2 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold capitalize text-[11px]">
              {user?.role === 'owner' ? 'Owner' : 'Pegawai'}
            </span>
          </div>

          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-border-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            title="Muat ulang katalog"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Mobile Cart Trigger Button */}
          <button
            type="button"
            onClick={() => setMobileCartOpen(true)}
            className="lg:hidden flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-semibold shadow-xs"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Keranjang ({totalCartCount})</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Catalog (Left) + Cart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Side: Search, Category Filter, and Product Cards */}
        <div className="lg:col-span-8 space-y-4">
          {/* Search bar & Category filter pills */}
          <div className="bg-[var(--color-surface)] p-3.5 rounded-xl border border-[var(--color-border)] shadow-xs space-y-3 transition-colors">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Cari nama produk, SKU, atau scan barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] focus:bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all placeholder:text-[var(--color-text-muted)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategoryId(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${selectedCategoryId === null
                    ? 'bg-[var(--color-primary)] text-white shadow-xs'
                    : 'bg-[var(--color-border-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
              >
                Semua Kategori ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${selectedCategoryId === cat.id
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'bg-[var(--color-border-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Catalog Grid */}
          {loading ? (
            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-12 text-center shadow-xs">
              <LoadingSpinner size="lg" label="Memuat produk kasir..." />
            </div>
          ) : error ? (
            <div className="bg-[var(--color-danger-light)] rounded-xl border border-[var(--color-danger)]/30 p-8 text-center text-[var(--color-danger)] shadow-xs">
              <p className="text-sm font-semibold">{error}</p>
              <button
                type="button"
                onClick={fetchData}
                className="mt-3 px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-xs font-medium cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-12 text-center shadow-xs">
              <Package className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-2" />
              <h4 className="text-sm font-bold text-[var(--color-text-primary)]">Produk Tidak Ditemukan</h4>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 max-w-sm mx-auto">
                {searchQuery
                  ? `Tidak ada produk yang cocok dengan "${searchQuery}". Coba kata kunci lain.`
                  : 'Belum ada produk aktif dalam kategori ini.'}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-xs font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
                >
                  Reset Pencarian
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantityInCart={cartQuantityMap.get(product.id) || 0}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Desktop Cart Sidebar */}
        <div className="hidden lg:block lg:col-span-4 sticky top-18">
          <CartSidebar
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            discount={discount}
            onUpdateDiscount={setDiscount}
            taxRate={taxRate}
            onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
          />
        </div>
      </div>

      {/* Mobile Cart Drawer */}
      <AnimatePresence>
        {mobileCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setMobileCartOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="relative w-full max-w-md bg-[var(--color-surface)] h-full z-10 flex flex-col shadow-2xl"
            >
              <div className="p-3 border-b border-[var(--color-border)] flex items-center justify-between">
                <span className="text-sm font-bold text-[var(--color-text-primary)]">Keranjang Belanja</span>
                <button
                  type="button"
                  onClick={() => setMobileCartOpen(false)}
                  className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-border-muted)] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <CartSidebar
                  items={cartItems}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onClearCart={handleClearCart}
                  discount={discount}
                  onUpdateDiscount={setDiscount}
                  taxRate={taxRate}
                  onOpenPaymentModal={() => {
                    setMobileCartOpen(false);
                    setIsPaymentModalOpen(true);
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        items={cartItems}
        subtotal={subtotal}
        discount={effectiveDiscount}
        taxAmount={taxAmount}
        totalAmount={grandTotal}
        onSuccess={handleCheckoutSuccess}
      />

      {/* Thermal Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        sale={completedSale}
        onNewTransaction={handleNewTransaction}
      />
    </div>
  );
};
