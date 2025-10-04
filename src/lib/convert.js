export const formatMonthYear = (value) => {
  // Validación más explícita
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const date = new Date(value);

  // Validación más robusta de fecha
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return String(value);
  }

  try {
    const month = new Intl.DateTimeFormat('es-ES', {
      month: 'long',
      timeZone: 'UTC',
    }).format(date);

    const year = date.getUTCFullYear();

    return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${year}`;
  } catch (error) {
    // Fallback seguro
    console.warn('Error formatting date:', error);
    return String(value);
  }
};

const toNum = (v) => (typeof v === 'string' ? Number(v) : v);

// -------- helpers de formato --------
export const formatCurrency = (v) =>
  typeof v === 'number'
    ? v.toLocaleString('es-BO', {
        style: 'currency',
        currency: 'BOB',
        maximumFractionDigits: 2,
      })
    : v;
// usa tu toNum(v) existente
export const formatPercent = (
  v,
  { unit = 'ratio', maxDecimals = 2, locale = 'es-BO' } = {}
) => {
  const n = toNum(v);
  if (!Number.isFinite(n)) return v ?? '-';

  // unit: 'ratio' => 0.9 -> 90 ; 'percent' => 90 -> 90
  const p = unit === 'percent' ? n : n * 100;

  return (
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0, // <- no obliga decimales
      maximumFractionDigits: maxDecimals, // <- hasta 2 si hacen falta
    }).format(p) + '%'
  );
};

export const formatNumber = (value) => {
  //const value = Math.abs(obj);
  if (value === undefined || value === null) return '';
  const s = String(value).replace(/\s/g, '');

  // solo dígitos y punto (una vez)
  if (!/^\d*\.?\d*$/.test(s)) return s;

  const hasTrailingDot = s.endsWith('.') && !s.includes('..'); // <- clave
  const [intRaw = '', decRaw = ''] = s.split('.');
  const intFormatted = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  if (hasTrailingDot) return `${intFormatted}.`; // conserva "123."
  if (s.includes('.')) return `${intFormatted}.${decRaw}`;
  return intFormatted;
};
