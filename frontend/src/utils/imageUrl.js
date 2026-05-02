// Resolves a stored product image to an absolute URL the browser can load.
//
// Why this exists: the backend used to return relative paths like
// "/uploads/abc.png". Frontend on Netlify, backend on Render — relative
// paths resolve to Netlify (which has no /uploads folder) and 404. This
// helper rewrites them to point at the API host.

const API_URL = import.meta.env.VITE_API_URL || '/api';
// API_URL looks like "https://toy-mall.onrender.com/api" — strip the trailing
// /api to get the bare server origin used for static /uploads files.
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

// Inline SVG data URI — never makes a network request, can't 404, fast to
// render. Replaces the dead via.placeholder.com service.
export const PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='%23f3f4f6'/><text x='50%25' y='50%25' font-family='system-ui,sans-serif' font-size='32' font-weight='700' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'>🧸 Toy</text></svg>";

export function resolveImage(src) {
  if (!src) return PLACEHOLDER;
  // Already absolute (Unsplash URL, Cloudinary, etc.) — use as-is.
  if (/^https?:\/\//i.test(src)) return src;
  // Inline data URLs from a paste, base64, etc.
  if (src.startsWith('data:')) return src;
  // Relative path — prefix with the API origin so Netlify-hosted clients
  // hit the Render-hosted backend for /uploads/* images.
  if (src.startsWith('/')) return `${API_ORIGIN}${src}`;
  return `${API_ORIGIN}/${src}`;
}
