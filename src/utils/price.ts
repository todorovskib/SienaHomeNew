const DEFAULT_CURRENCY = import.meta.env.VITE_STORE_CURRENCY || 'MKD';

export const formatPrice = (price: number, language?: string): string => {
  const locale = (language ?? 'mk') === 'mk' ? 'mk-MK' : 'en-US';
  const value = Number.isFinite(price) ? price : 0;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: DEFAULT_CURRENCY,
    maximumFractionDigits: 0,
  }).format(value);
};
