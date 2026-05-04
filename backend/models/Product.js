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
    ageGroup: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    wholesalePrice: { type: Number, default: 0, min: 0 },
    wholesaleMinQty: { type: Number, default: 0, min: 0 },
    stock: { type: Number, required: true, default: 0 },
    images: [{ type: String }],
    image: { type: String, default: '' },
    // Colours the product is available in. Stored as plain strings (e.g.
    // 'Red', 'Pastel Blue') so admins can enter any name. The frontend
    // maps known color names to swatch hex values for display, falls back
    // to a neutral chip otherwise. Lowercased + trimmed on save so the
    // shop filter can match case-insensitively without extra work.
    colors: { type: [String], default: [] },
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
  // Normalise colour list so duplicates and casing don't confuse filters.
  if (Array.isArray(this.colors)) {
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
