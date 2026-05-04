// Maps common colour names to a hex value so we can render visual swatches
// for admin-typed colour names ("Red", "Pastel Blue", "Multicolor").
// Lookup is case-insensitive and tolerant of "light/dark" prefixes.
//
// If a name doesn't match anything below, the swatch falls back to a
// neutral checkered pattern with the colour name shown next to it —
// admins can type anything; the UI never breaks.

const NAMED_COLORS = {
  // Reds & pinks
  red:        '#dc2626',
  pink:       '#ec4899',
  rose:       '#f43f5e',
  fuchsia:    '#d946ef',
  magenta:    '#c026d3',
  maroon:     '#7f1d1d',
  crimson:    '#be123c',
  // Oranges / yellows
  orange:     '#f97316',
  amber:      '#f59e0b',
  yellow:     '#facc15',
  gold:       '#eab308',
  // Greens
  green:      '#16a34a',
  lime:       '#84cc16',
  olive:      '#65a30d',
  teal:       '#14b8a6',
  emerald:    '#10b981',
  // Blues / cyans
  blue:       '#2563eb',
  navy:       '#1e3a8a',
  sky:        '#0ea5e9',
  cyan:       '#06b6d4',
  turquoise:  '#22d3ee',
  // Purples
  purple:     '#9333ea',
  violet:     '#8b5cf6',
  indigo:     '#6366f1',
  lavender:   '#c4b5fd',
  // Neutrals
  black:      '#111827',
  gray:       '#6b7280',
  grey:       '#6b7280',
  silver:     '#cbd5e1',
  white:      '#f9fafb',
  cream:      '#fef3c7',
  beige:      '#fef3c7',
  ivory:      '#fffbeb',
  // Earth
  brown:      '#92400e',
  tan:        '#d97706',
  copper:     '#c2410c',
  bronze:     '#a16207',
};

// Special swatches that need a gradient (no single hex captures them).
const SPECIAL_GRADIENTS = {
  multicolor:  'linear-gradient(45deg,#ef4444 0%,#f59e0b 25%,#10b981 50%,#3b82f6 75%,#a855f7 100%)',
  multicolour: 'linear-gradient(45deg,#ef4444 0%,#f59e0b 25%,#10b981 50%,#3b82f6 75%,#a855f7 100%)',
  rainbow:     'linear-gradient(45deg,#ef4444 0%,#f59e0b 25%,#10b981 50%,#3b82f6 75%,#a855f7 100%)',
  assorted:    'linear-gradient(45deg,#ef4444 0%,#f59e0b 25%,#10b981 50%,#3b82f6 75%,#a855f7 100%)',
};

// Common, broad palette presented as quick-pick chips in the admin form
// and as the master list of filterable colours on the customer Shop page.
// Order matters — most-used first so the eye lands on familiar names.
export const COMMON_COLORS = [
  'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange',
  'Black', 'White', 'Brown', 'Gray', 'Multicolor',
];

/**
 * Return a CSS background value (single hex or gradient) for a colour name.
 * Strips "light"/"dark"/"pastel" prefixes when looking up.
 * Returns null if no match — caller should render a fallback chip.
 */
export function colorToBackground(name) {
  if (!name) return null;
  const key = String(name).trim().toLowerCase()
    .replace(/^(light|dark|pastel|deep|bright|hot|neon)\s+/, '');
  if (SPECIAL_GRADIENTS[key]) return SPECIAL_GRADIENTS[key];
  if (NAMED_COLORS[key]) return NAMED_COLORS[key];
  // Not found — caller falls back to a checkered or text-only chip
  return null;
}

/**
 * Whether the colour is light enough that a white border / dark text
 * looks better than a transparent border / white text.
 */
export function isLightColor(name) {
  const key = String(name || '').trim().toLowerCase();
  return ['white', 'cream', 'beige', 'ivory', 'silver', 'yellow', 'gold', 'lavender'].includes(key);
}
