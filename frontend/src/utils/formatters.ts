export const formatRupiah = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null || value === '') return 'Rp 0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatDateTime = (dateString?: string | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatPaymentMethod = (method: string): string => {
  switch (method) {
    case 'cash':
      return 'Tunai';
    case 'bank_transfer':
      return 'Transfer Bank';
    case 'qris':
      return 'QRIS';
    default:
      return 'Lainnya';
  }
};
