const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    image: { type: String, default: '' },
    description: { type: String, default: '' },
    // Featured on the public homepage "Shop By Category" rail. Admin toggles
    // this per-category from /admin/categories — no code change needed to add
    // / remove tiles. Up to 8 categories are surfaced (homeOrder ascending).
    featuredOnHome: { type: Boolean, default: false },
    homeOrder: { type: Number, default: 999 },
  },
  { timestamps: true }
);

categorySchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
