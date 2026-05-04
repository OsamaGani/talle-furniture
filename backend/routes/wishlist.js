const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  res.json(user.wishlist);
}));

router.get('/ids', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('wishlist');
  res.json(user.wishlist.map(String));
}));

// IMPORTANT: /sync must be declared BEFORE /:productId. Express matches
// routes in order, and a dynamic /:productId path would otherwise swallow
// "sync" as a productId param and crash trying to cast it to ObjectId.
router.post('/sync', protect, asyncHandler(async (req, res) => {
  const { ids = [] } = req.body;
  const user = await User.findById(req.user._id);
  const set = new Set([...user.wishlist.map(String), ...ids]);
  user.wishlist = [...set];
  await user.save();
  res.json({ wishlist: user.wishlist.map(String) });
}));

router.post('/:productId', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user.wishlist.find((id) => id.toString() === req.params.productId)) {
    user.wishlist.push(req.params.productId);
    await user.save();
  }
  res.json({ wishlist: user.wishlist.map(String) });
}));

router.delete('/:productId', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.wishlist = user.wishlist.filter((id) => id.toString() !== req.params.productId);
  await user.save();
  res.json({ wishlist: user.wishlist.map(String) });
}));

module.exports = router;
