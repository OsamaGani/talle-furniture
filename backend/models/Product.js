const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, required: true },
    brand: { type: String, required: true },
    category: { type: String, required: true },
    material: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    stock: { type: Number, required: true, default: 0 },
    images: [{ type: String }],
    image: { type: String, default: '' },
    // Legacy: simple list of colour names (no per-colour images). Still
    // populated for backward compat and used by the Shop filter — kept in
    // sync with colorVariants below via the pre-save hook.
    colors: { type: [String], default: [] },
    // Colour variants — each variant carries the colour name and its
    // own gallery. When a customer taps a colour swatch on the product
    // page we show those images; if a variant has no images we fall back
    // to the product's main `images` array. Stock + price stay shared
    // across variants for now (see CLAUDE notes for the full SKU upgrade
    // path when you actually need it).
    colorVariants: [{
      color: { type: String, required: true },
      images: { type: [String], default: [] },
      // Optional per-colour price overrides. Use 0 / null to fall back
      // to the product-level price + discount. Lets you charge ₹40 for the
      // red variant and ₹50 for the gold one without splitting the
      // listing into two products.
      price: { type: Number, default: 0, min: 0 },
      discount: { type: Number, default: 0, min: 0, max: 100 },
      // Optional per-colour name + description overrides. Empty string
      // (default) falls back to the product-level name / description.
      // Useful when each colour is essentially its own edition — e.g.
      // "Talle Aero Executive Black" vs "Talle Aero Executive Tan" —
      // without splitting the listing into two products and losing the
      // shared SEO authority of one URL.
      name: { type: String, default: '' },
      description: { type: String, default: '' },
    }],
    featured: { type: Boolean, default: false },
    bestSeller: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },
    // Admin-curated flag for the homepage "Today's Deals" rail. Use this
    // for hand-picked promo items rather than relying on a discount-based
    // heuristic — gives the store owner full control over what shows.
    onDeal: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    reviews: [reviewSchema],
  },
  { timestamps: true }
);

productSchema.virtual('finalPrice').get(function () {
  return this.discount > 0 ? +(this.price - (this.price * this.discount) / 100).toFixed(2) : this.price;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

productSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
  }
  // Normalise colour variants — dedupe by colour name (case-insensitive),
  // trim whitespace, drop empties, cap at 12. Preserves price, discount,
  // name, and description overrides when the admin has set them.
  if (Array.isArray(this.colorVariants) && this.colorVariants.length > 0) {
    const seen = new Set();
    this.colorVariants = this.colorVariants
      .map((v) => ({
        color: String(v?.color || '').trim(),
        images: Array.isArray(v?.images) ? v.images.filter(Boolean) : [],
        // Cast price + discount through Number() so empty-string form inputs
        // become 0 instead of NaN, then clamp negatives to 0.
        price: Math.max(0, Number(v?.price) || 0),
        discount: Math.min(100, Math.max(0, Number(v?.discount) || 0)),
        name: String(v?.name || '').trim(),
        description: String(v?.description || '').trim(),
      }))
      .filter((v) => {
        if (!v.color) return false;
        const key = v.color.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 12);
    // Keep colors[] in sync so Shop filter (?color=Red) keeps working
    // without needing to query into the variants array.
    this.colors = this.colorVariants.map((v) => v.color);
  } else if (Array.isArray(this.colors)) {
    // Fallback: legacy product with just the colours array — dedupe in place.
    const seen = new Set();
    this.colors = this.colors
      .map((c) => String(c || '').trim())
      .filter((c) => {
        if (!c) return false;
        const key = c.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 12);
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
