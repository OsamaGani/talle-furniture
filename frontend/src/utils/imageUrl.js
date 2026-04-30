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

const PLACEHOLDER = 'https://via.placeholder.com/400?text=Toy';

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
