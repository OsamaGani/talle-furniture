const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All address endpoints are scoped to the authenticated user — there is no
// admin-side address management here on purpose.
router.use(protect);

// Validation rules mirror the frontend Checkout form so the data shapes
// match no matter which entry point is used.
const PHONE_RE = /^[6-9]\d{9}$/;
const PIN_RE = /^\d{6}$/;

function validateAddress(body) {
  const a = {
    label:    String(body.label    || '').trim().slice(0, 30),
    fullName: String(body.fullName || '').trim().slice(0, 80),
    phone:    String(body.phone    || '').replace(/\D/g, '').slice(0, 10),
    street:   String(body.street   || '').trim().slice(0, 200),
    city:     String(body.city     || '').trim().slice(0, 80),
    state:    String(body.state    || '').trim().slice(0, 80),
    zip:      String(body.zip      || '').replace(/\D/g, '').slice(0, 6),
    country:  String(body.country  || 'India').trim().slice(0, 80) || 'India',
    isDefault: !!body.isDefault,
  };
  if (!a.fullName) return { error: 'Full name is required' };
  if (!PHONE_RE.test(a.phone)) return { error: 'Enter a valid 10-digit Indian mobile' };
  if (!a.street) return { error: 'Street is required' };
  if (!a.city) return { error: 'City is required' };
  if (!a.state) return { error: 'State is required' };
  if (!PIN_RE.test(a.zip)) return { error: 'Enter a valid 6-digit PIN code' };
  return { value: a };
}

// List all saved addresses for the logged-in user.
router.get('/', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('addresses');
  res.json(user?.addresses || []);
}));

// Add a new address. If it's the user's first one (or marked default), it
// becomes the default and any previous default is unset.
router.post('/', asyncHandler(async (req, res) => {
  const v = validateAddress(req.body);
  if (v.error) return res.status(400).json({ message: v.error });

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // First address auto-becomes default. Otherwise honour the isDefault flag.
  const shouldBeDefault = user.addresses.length === 0 || v.value.isDefault;
  if (shouldBeDefault) {
    user.addresses.forEach((a) => { a.isDefault = false; });
    v.value.isDefault = true;
  }
  user.addresses.push(v.value);
  await user.save();
  res.status(201).json(user.addresses);
}));

// Update an existing address.
router.put('/:id', asyncHandler(async (req, res) => {
  const v = validateAddress(req.body);
  if (v.error) return res.status(400).json({ message: v.error });

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const target = user.addresses.id(req.params.id);
  if (!target) return res.status(404).json({ message: 'Address not found' });

  // Apply the update — overwrite all fields except _id / timestamps so a
  // user clearing a label, etc., actually persists.
  Object.assign(target, v.value);

  // If the caller asked to make this the default, clear flag on others.
  if (v.value.isDefault) {
    user.addresses.forEach((a) => {
      if (a._id.toString() !== target._id.toString()) a.isDefault = false;
    });
  }

  // Edge case: nothing is default (e.g. previous default got demoted) —
  // promote this one so the account always has exactly one default.
  if (!user.addresses.some((a) => a.isDefault)) target.isDefault = true;

  await user.save();
  res.json(user.addresses);
}));

// Delete an address. If it was the default, the first remaining one is
// promoted so there's always exactly one default while ≥1 address exists.
router.delete('/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const target = user.addresses.id(req.params.id);
  if (!target) return res.status(404).json({ message: 'Address not found' });

  const wasDefault = target.isDefault;
  target.deleteOne();

  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }
  await user.save();
  res.json(user.addresses);
}));

// Mark an address as the default for future orders.
router.put('/:id/default', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const target = user.addresses.id(req.params.id);
  if (!target) return res.status(404).json({ message: 'Address not found' });

  user.addresses.forEach((a) => { a.isDefault = false; });
  target.isDefault = true;
  await user.save();
  res.json(user.addresses);
}));

module.exports = router;
