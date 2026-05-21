// Indian-locale price formatter — single source of truth for every
// currency display on the site. Use Intl.NumberFormat with 'en-IN' so
// numbers get the Indian comma grouping (12,34,567 not 1,234,567) that
// every native customer expects. Premium retail sites (Pepperfry,
// Urban Ladder, Wakefit) all format this way; printing ₹12999 with no
// comma reads "cheap" / "amateur" to Indian eyes.

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const inrFormatterWithPaise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Default: no paise (cleaner for showcase prices like ₹12,999).
// For cart / invoice totals use formatPriceWithPaise to show ₹X,XXX.XX.
export function formatPrice(amount) {
  const n = Number(amount);
  if (!isFinite(n)) return '₹0';
  return inrFormatter.format(n);
}

export function formatPriceWithPaise(amount) {
  const n = Number(amount);
  if (!isFinite(n)) return '₹0.00';
  return inrFormatterWithPaise.format(n);
}

// Number-only version (no currency symbol) — for places that already
// render the ₹ symbol manually or use it inline with other content.
const numFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
export function formatNumber(amount) {
  const n = Number(amount);
  if (!isFinite(n)) return '0';
  return numFormatter.format(n);
}
