const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');
const { audit } = require('../utils/audit');

const router = express.Router();

router.get('/', protect, admin, asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
}));

router.get('/:id', protect, admin, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
}));

router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const wasAdmin = user.isAdmin;
  user.name = req.body.name ?? user.name;
  user.email = req.body.email ?? user.email;
  user.isAdmin = req.body.isAdmin ?? user.isAdmin;
  const updated = await user.save();
  // Role changes are the highest-impact admin action — always audited.
  if (wasAdmin !== updated.isAdmin) {
    audit(req, 'user.role-change', updated._id, { email: updated.email, from: wasAdmin, to: updated.isAdmin });
  }
  res.json({ _id: updated._id, name: updated.name, email: updated.email, isAdmin: updated.isAdmin });
}));

router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user._id.toString() === req.user._id.toString())
    return res.status(400).json({ message: 'Cannot delete yourself' });
  await user.deleteOne();
  audit(req, 'user.delete', user._id, { email: user.email, wasAdmin: user.isAdmin });
  res.json({ message: 'User deleted' });
}));

module.exports = router;
