// Admin-only operational routes.
// These are nuclear-grade tools (wipe the catalog, re-seed defaults) that
// the dashboard surfaces behind a Danger Zone with a confirm prompt.
// Routes are guarded by protect + admin middleware so only logged-in admin
// users can hit them — no public access.

const express = require('express');
const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const WholesaleCategory = require('../models/WholesaleCategory');
const { protect, admin } = require('../middleware/auth');
const { seedIfEmpty } = require('../utils/seedData');

const router = express.Router();

// POST /api/admin/catalog/wipe
// Deletes EVERY product, category, brand and wholesale-category tile.
// Preserves users + orders so customer accounts and order history survive.
// Requires JSON body { confirm: "WIPE" } as a typo-guard against accidental
// hits from somebody who clicked through the confirm dialog without reading.
router.post(
  '/catalog/wipe',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    if (req.body?.confirm !== 'WIPE') {
      return res.status(400).json({ message: 'Missing or incorrect confirm token. Type WIPE to confirm.' });
    }
    const [p, c, b, w] = await Promise.all([
      Product.deleteMany({}),
      Category.deleteMany({}),
      Brand.deleteMany({}),
      WholesaleCategory.deleteMany({}),
    ]);
    res.json({
      message: 'Catalog wiped',
      deleted: {
        products: p.deletedCount,
        categories: c.deletedCount,
        brands: b.deletedCount,
        wholesaleTiles: w.deletedCount,
      },
    });
  })
);

// POST /api/admin/catalog/reseed
// Runs the idempotent seedIfEmpty() helper from utils/seedData.js. This
// upserts the default categories, brands, the Talle admin user, and (only
// if the products collection is currently empty) the demo product set.
// Safe to run on a partially-seeded DB — it never overwrites existing items.
router.post(
  '/catalog/reseed',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    await seedIfEmpty();
    const [pc, cc, bc] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Brand.countDocuments(),
    ]);
    res.json({
      message: 'Reseed complete',
      totals: { products: pc, categories: cc, brands: bc },
    });
  })
);

// POST /api/admin/catalog/wipe-and-reseed
// Convenience: combines the two above so the dashboard "Reset to clean
// Talle catalog" button is a single click. Same confirm-token guard.
router.post(
  '/catalog/wipe-and-reseed',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    if (req.body?.confirm !== 'WIPE') {
      return res.status(400).json({ message: 'Missing or incorrect confirm token. Type WIPE to confirm.' });
    }
    await Promise.all([
      Product.deleteMany({}),
      Category.deleteMany({}),
      Brand.deleteMany({}),
      WholesaleCategory.deleteMany({}),
    ]);
    await seedIfEmpty();
    const [pc, cc, bc] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Brand.countDocuments(),
    ]);
    res.json({
      message: 'Catalog wiped and reseeded',
      totals: { products: pc, categories: cc, brands: bc },
    });
  })
);

module.exports = router;
