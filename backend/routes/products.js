const express = require('express');
const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { keyword, category, brand, ageGroup, minPrice, maxPrice, sort, featured, bestSeller, newArrival, page = 1, limit = 24 } = req.query;
    const filter = {};
    if (keyword) {
      // Escape regex metacharacters so a search for "a.*" doesn't become a
      // CPU-burning regex. Cap length to keep the query bounded.
      const safe = String(keyword).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: safe, $options: 'i' };
    }
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (ageGroup) filter.ageGroup = ageGroup;
    if (featured === 'true') filter.featured = true;
    if (bestSeller === 'true') filter.bestSeller = true;
    if (newArrival === 'true') filter.newArrival = true;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = +minPrice;
      if (maxPrice) filter.price.$lte = +maxPrice;
    }

    let sortBy = { createdAt: -1 };
    if (sort === 'price-asc') sortBy = { price: 1 };
    if (sort === 'price-desc') sortBy = { price: -1 };
    if (sort === 'name') sortBy = { name: 1 };
    if (sort === 'rating') sortBy = { rating: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortBy).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);
    res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate('reviews.user', 'name');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  })
);

// Related products: items in the same category and items from the same brand,
// excluding the product the customer is currently viewing.
router.get(
  '/:id/related',
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const limit = Math.min(Number(req.query.limit) || 12, 24);

    // 1) Same category, prefer same age group, exclude current product
    const similarFilter = {
      _id: { $ne: product._id },
      category: product.category,
    };
    let similar = await Product.find({ ...similarFilter, ageGroup: product.ageGroup })
      .sort({ rating: -1, numReviews: -1, createdAt: -1 })
      .limit(limit);
    // backfill if not enough age-matched siblings
    if (similar.length < limit) {
      const ids = similar.map((p) => p._id);
      const fill = await Product.find({ ...similarFilter, _id: { $nin: [product._id, ...ids] } })
        .sort({ rating: -1, numReviews: -1, createdAt: -1 })
        .limit(limit - similar.length);
      similar = [...similar, ...fill];
    }

    // 2) More from the same brand (skip ones already shown in similar)
    const similarIds = similar.map((p) => p._id);
    const moreFromBrand = product.brand
      ? await Product.find({
          _id: { $nin: [product._id, ...similarIds] },
          brand: product.brand,
        })
          .sort({ rating: -1, numReviews: -1, createdAt: -1 })
          .limit(limit)
      : [];

    // 3) Recently viewed-style fallback if both lists are empty: top-rated
    let trending = [];
    if (similar.length === 0 && moreFromBrand.length === 0) {
      trending = await Product.find({ _id: { $ne: product._id } })
        .sort({ rating: -1, numReviews: -1 })
        .limit(limit);
    }

    res.json({ similar, moreFromBrand, trending });
  })
);

router.post(
  '/',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  })
);

router.put(
  '/:id',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    Object.assign(product, req.body);
    const updated = await product.save();
    res.json(updated);
  })
);

router.delete(
  '/:id',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  })
);

router.post(
  '/:id/reviews',
  protect,
  asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const already = product.reviews.find((r) => r.user.toString() === req.user._id.toString());
    if (already) return res.status(400).json({ message: 'Already reviewed' });
    product.reviews.push({ user: req.user._id, name: req.user.name, rating: Number(rating), comment });
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length;
    await product.save();
    res.status(201).json({ message: 'Review added' });
  })
);

module.exports = router;
