import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Building2,
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { Customer, Supplier } from '../../types/purchase';
import { contactService } from '../../services/contactService';
import { SupplierFormModal } from '../../components/contacts/SupplierFormModal';
import { CustomerFormModal } from '../../components/contacts/CustomerFormModal';
import { PageHeader } from '@/components/ui/PageHeader';

export const ContactsPage = () => {
  const [activeTab, setActiveTab] = useState<'suppliers' | 'customers'>('suppliers');
  const [search, setSearch] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await contactService.getSuppliers({ search });
      setSuppliers(res.data);
    } catch (err) {
      console.error('Failed to fetch suppliers', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await contactService.getCustomers({ search });
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (activeTab === 'suppliers') {
      fetchSuppliers();
    } else {
      fetchCustomers();
    }
  }, [activeTab, fetchSuppliers, fetchCustomers]);

  const handleDeleteSupplier = async (id: number, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus supplier "${name}"?`)) return;
    try {
      await contactService.deleteSupplier(id);
      fetchSuppliers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus supplier.');
    }
  };

  const handleDeleteCustomer = async (id: number, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus pelanggan "${name}"?`)) return;
    try {
      await contactService.deleteCustomer(id);
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus pelanggan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Kontak & Rekanan"
        subtitle="Kelola data supplier pemasok barang dan pelanggan setia toko Anda."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Kontak & Rekanan' },
        ]}
        actions={
          activeTab === 'suppliers' ? (
            <button
              onClick={() => {
                setSelectedSupplier(null);
                setSupplierModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Tambah Supplier</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setSelectedCustomer(null);
                setCustomerModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Pelanggan</span>
            </button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)]">
        <button
          onClick={() => {
            setActiveTab('suppliers');
            setSearch('');
          }}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'suppliers'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Supplier / Pemasok</span>
          <span className="ml-1.5 px-2 py-0.5 text-[11px] rounded-full bg-[var(--color-border-muted)] text-[var(--color-text-secondary)] font-mono">
            {suppliers.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('customers');
            setSearch('');
          }}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'customers'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Pelanggan</span>
          <span className="ml-1.5 px-2 py-0.5 text-[11px] rounded-full bg-[var(--color-border-muted)] text-[var(--color-text-secondary)] font-mono">
            {customers.length}
          </span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === 'suppliers'
                ? 'Cari nama supplier, PIC, telepon, email...'
                : 'Cari nama pelanggan, telepon, email...'
            }
            className="w-full pl-9 pr-4 py-2 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded-xl focus:outline-hidden focus:border-[var(--color-primary)] transition-colors"
          />
          <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Content Tables */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-xs">
        {activeTab === 'suppliers' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  <th className="px-6 py-3.5">Supplier & PIC</th>
                  <th className="px-6 py-3.5">Kontak</th>
                  <th className="px-6 py-3.5">Alamat</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-center">Jml Transaksi</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-muted)] text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-[var(--color-text-muted)]">
                      Memuat data supplier...
                    </td>
                  </tr>
                ) : suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[var(--color-text-muted)]">
                      <Building2 className="w-10 h-10 mx-auto text-[var(--color-text-muted)] opacity-40 mb-2" />
                      Belum ada data supplier yang sesuai.
                    </td>
                  </tr>
                ) : (
                  suppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-[var(--color-border-muted)]/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[var(--color-text-primary)]">{s.name}</div>
                        {s.contact_person && (
                          <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">PIC: {s.contact_person}</div>
                        )}
                        {s.notes && (
                          <div className="text-[11px] text-[var(--color-text-muted)] italic mt-0.5 max-w-xs truncate">
                            {s.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        {s.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                            <Phone className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                            <a href={`tel:${s.phone}`} className="hover:text-[var(--color-primary)] hover:underline">
                              {s.phone}
                            </a>
                          </div>
                        )}
                        {s.email && (
                          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                            <Mail className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                            <a href={`mailto:${s.email}`} className="hover:text-[var(--color-primary)] hover:underline">
                              {s.email}
                            </a>
                          </div>
                        )}
                        {!s.phone && !s.email && <span className="text-xs text-[var(--color-text-muted)]">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        {s.address ? (
                          <div className="flex items-start gap-1.5 text-xs text-[var(--color-text-secondary)] max-w-xs">
                            <MapPin className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{s.address}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)]">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {s.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-[var(--color-success-light)] text-[var(--color-success)]">
                            <CheckCircle2 className="w-3 h-3" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-[var(--color-border-muted)] text-[var(--color-text-muted)]">
                            <XCircle className="w-3 h-3" />
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-[var(--color-text-secondary)] font-mono">
                        {s.purchases_count || 0}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedSupplier(s);
                              setSupplierModalOpen(true);
                            }}
                            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border-muted)] rounded-lg transition-colors cursor-pointer"
                            title="Edit Supplier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(s.id, s.name)}
                            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] rounded-lg transition-colors cursor-pointer"
                            title="Hapus Supplier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-raised)] border-b border-[var(--color-border)] text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  <th className="px-6 py-3.5">Nama Pelanggan</th>
                  <th className="px-6 py-3.5">Kontak</th>
                  <th className="px-6 py-3.5">Alamat</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-muted)] text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[var(--color-text-muted)]">
                      Memuat data pelanggan...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[var(--color-text-muted)]">
                      <Users className="w-10 h-10 mx-auto text-[var(--color-text-muted)] opacity-40 mb-2" />
                      Belum ada data pelanggan yang sesuai.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id} className="hover:bg-[var(--color-border-muted)]/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[var(--color-text-primary)]">{c.name}</div>
                        {c.notes && (
                          <div className="text-[11px] text-[var(--color-text-muted)] italic mt-0.5 max-w-xs truncate">
                            {c.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                            <Phone className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                            <a href={`tel:${c.phone}`} className="hover:text-[var(--color-primary)] hover:underline">
                              {c.phone}
                            </a>
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                            <Mail className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                            <a href={`mailto:${c.email}`} className="hover:text-[var(--color-primary)] hover:underline">
                              {c.email}
                            </a>
                          </div>
                        )}
                        {!c.phone && !c.email && <span className="text-xs text-[var(--color-text-muted)]">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        {c.address ? (
                          <div className="flex items-start gap-1.5 text-xs text-[var(--color-text-secondary)] max-w-xs">
                            <MapPin className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{c.address}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)]">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {c.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-[var(--color-success-light)] text-[var(--color-success)]">
                            <CheckCircle2 className="w-3 h-3" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-[var(--color-border-muted)] text-[var(--color-text-muted)]">
                            <XCircle className="w-3 h-3" />
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedCustomer(c);
                              setCustomerModalOpen(true);
                            }}
                            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border-muted)] rounded-lg transition-colors cursor-pointer"
                            title="Edit Pelanggan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(c.id, c.name)}
                            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] rounded-lg transition-colors cursor-pointer"
                            title="Hapus Pelanggan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Supplier Modal */}
      <SupplierFormModal
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        onSuccess={fetchSuppliers}
        supplier={selectedSupplier}
      />

      {/* Customer Modal */}
      <CustomerFormModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSuccess={fetchCustomers}
        customer={selectedCustomer}
      />
    </div>
  );
};
