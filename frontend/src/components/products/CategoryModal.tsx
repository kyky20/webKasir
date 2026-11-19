import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Loader2, AlertCircle, Check } from 'lucide-react';
import type { Category } from '@/types/pos';
import { productService } from '@/services/productService';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: (Category & { products_count?: number })[];
  onCategoriesUpdated: () => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCategoriesUpdated,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setLoading(true);
    setErrorMessage(null);
    try {
      await productService.createCategory({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
      });
      setNewName('');
      setNewDesc('');
      onCategoriesUpdated();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Gagal menambahkan kategori.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDesc('');
  };

  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) return;

    setLoading(true);
    setErrorMessage(null);
    try {
      await productService.updateCategory(id, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
      });
      setEditingId(null);
      onCategoriesUpdated();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Gagal memperbarui kategori.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus kategori "${name}"? Produk dalam kategori ini akan menjadi tanpa kategori.`)) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      await productService.deleteCategory(id);
      onCategoriesUpdated();
    } catch {
      setErrorMessage('Gagal menghapus kategori.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-[var(--color-surface)] w-full max-w-lg rounded-2xl border border-[var(--color-border)] shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface-raised)]">
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Kelola Kategori Produk</h3>
            <p className="text-xs text-[var(--color-text-muted)]">Atur pengelompokan produk untuk mempermudah kasir</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-[var(--color-danger-light)] border border-[var(--color-danger)]/20 text-[var(--color-danger)] flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Add New Category Form */}
          <form onSubmit={handleCreate} className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] space-y-2.5">
            <span className="text-xs font-bold text-[var(--color-text-primary)] block">Tambah Kategori Baru</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nama kategori..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-hidden focus:border-[var(--color-primary)]"
              />
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Deskripsi singkat..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-hidden focus:border-[var(--color-primary)]"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={loading || !newName.trim()}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Tambah</span>
              </button>
            </div>
          </form>

          {/* Categories List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-muted)] px-1">
              <span>Daftar Kategori Aktif</span>
              <span>{categories.length} Kategori</span>
            </div>

            {categories.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-xl">
                Belum ada kategori terdaftar. Silakan tambahkan melalui form di atas.
              </div>
            ) : (
              <div className="space-y-1.5">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between gap-3 hover:border-[var(--color-primary)]/40 transition-colors"
                  >
                    {editingId === cat.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-2.5 py-1 text-xs rounded-lg border border-[var(--color-primary)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] flex-1 focus:outline-hidden"
                          placeholder="Nama kategori"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="px-2.5 py-1 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] flex-1 focus:outline-hidden"
                          placeholder="Deskripsi"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cat.id)}
                          className="p-1.5 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="p-1.5 rounded-lg bg-[var(--color-border-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[var(--color-text-primary)]">{cat.name}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--color-border-muted)] text-[var(--color-text-secondary)] font-mono">
                              {cat.products_count ?? 0} produk
                            </span>
                          </div>
                          {cat.description && (
                            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{cat.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(cat)}
                            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border-muted)] rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat.id, cat.name)}
                            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] rounded-lg transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl text-xs font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-border-muted)] transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
