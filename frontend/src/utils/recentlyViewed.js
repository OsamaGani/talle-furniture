// Tracks products the user recently viewed, persisted in localStorage.
// Pure client-side — no backend round trip needed for "Recently viewed"
// rows, and the data stays even if the user isn't logged in.

const KEY = 'recentlyViewedProducts';
const MAX = 12;

// Stored shape: [{ _id, slug, name, brand, image, price, discount, rating, numReviews, stock, viewedAt }]

export function getRecentlyViewed() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(product) {
  if (!product || !product._id) return;
  try {
    const slim = {
      _id: product._id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      image: product.image || (product.images && product.images[0]) || '',
      price: product.price,
      discount: product.discount,
      rating: product.rating,
      numReviews: product.numReviews,
      stock: product.stock,
      viewedAt: Date.now(),
    };
    const existing = getRecentlyViewed().filter((p) => p._id !== product._id);
    existing.unshift(slim);
    localStorage.setItem(KEY, JSON.stringify(existing.slice(0, MAX)));
  } catch {
    // localStorage full or disabled — silent ignore.
  }
}

export function clearRecentlyViewed() {
  try { localStorage.removeItem(KEY); } catch {}
}
