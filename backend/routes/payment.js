const express = require('express');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/auth');
const Order = require('../models/Order');

const router = express.Router();

const getRazorpay = () => {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret || !id.startsWith('rzp_')) return null;
  const Razorpay = require('razorpay');
  return new Razorpay({ key_id: id, key_secret: secret });
};

// ==================================================================
// RAZORPAY
// ==================================================================
//
// Flow:
// 1) Frontend places the order via /api/orders (paymentMethod = 'Razorpay')
// 2) Frontend calls /payment/razorpay/create-order with the orderId
//    -> backend creates a Razorpay order, returns { keyId, razorpayOrderId, amount }
// 3) Frontend opens the Razorpay Checkout modal with those values
// 4) On success, Razorpay's modal returns a payment_id + signature, which
//    the frontend posts to /payment/razorpay/verify
// 5) Backend HMAC-verifies the signature, then flips isPaid=true
//
// Webhook is a backup confirmation path for the rare case the customer
// closes the modal between payment success and signature verification.
// ==================================================================

router.post(
  '/razorpay/create-order',
  protect,
  asyncHandler(async (req, res) => {
    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(400).json({ message: 'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the server.' });
    }

    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'orderId is required' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only pay for your own orders' });
    }
    if (order.isPaid) {
      return res.status(400).json({ message: 'Order is already paid' });
    }

    // Razorpay receipt: any merchant-facing identifier under 40 chars.
    const receipt = `tm_${String(order._id).slice(-10)}_${Date.now().toString(36).slice(-4)}`;

    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(order.totalPrice * 100), // amount in paise
      currency: 'INR',
      receipt,
      notes: { orderId: String(order._id), orderNumber: order.orderNumber || '' },
    });

    // Stash the razorpay order id on our order so /verify can sanity-check.
    order.paymentResult = {
      ...(order.paymentResult || {}),
      id: rzpOrder.id,
      status: 'CREATED',
    };
    await order.save();

    res.json({
      keyId: process.env.RAZORPAY_KEY_ID,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      orderId: String(order._id),
      // Prefill data for the Razorpay modal
      prefill: {
        name: order.shippingAddress?.fullName || req.user.name,
        email: req.user.email,
        contact: order.shippingAddress?.phone || '',
      },
    });
  })
);

router.post(
  '/razorpay/verify',
  protect,
  asyncHandler(async (req, res) => {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return res.status(400).json({ message: 'Razorpay is not configured' });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ message: 'Missing payment details' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (order.isPaid) {
      return res.json({ ...order.toObject(), alreadyPaid: true });
    }

    // HMAC-SHA256 of "razorpay_order_id|razorpay_payment_id" with the secret.
    // If our computed signature doesn't match what Razorpay sent, the request
    // is forged or tampered — reject it.
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature — payment cannot be confirmed' });
    }

    // Fetch the full payment object from Razorpay so we can store rich
    // metadata (UPI handle, card last 4, RRN, etc.) for the receipt.
    let p = {};
    try {
      const razorpay = getRazorpay();
      if (razorpay) p = await razorpay.payments.fetch(razorpay_payment_id);
    } catch (err) {
      console.warn('Could not fetch Razorpay payment details:', err.message);
    }

    order.isPaid = true;
    order.paidAt = p.captured_at ? new Date(p.captured_at * 1000) : new Date();
    order.paymentMethod = 'Razorpay';
    order.paymentResult = {
      id: razorpay_payment_id,
      status: 'COMPLETED',
      updateTime: new Date().toISOString(),
      email: p.email || req.user.email,
      provider: 'Razorpay',
      method: p.method,                    // upi / card / netbanking / wallet
      vpa: p.vpa,
      bank: p.bank,
      wallet: p.wallet,
      cardLast4: p.card?.last4,
      cardBrand: p.card?.network,
      cardNetwork: p.card?.network,
      cardType: p.card?.type,
      rrn: p.acquirer_data?.rrn,
      acquirerData: p.acquirer_data,
      amount: p.amount,
      fee: p.fee,
      tax: p.tax,
      orderId: razorpay_order_id,
      capturedAt: p.captured_at ? new Date(p.captured_at * 1000) : new Date(),
    };
    if (order.status === 'pending') {
      order.status = 'confirmed';
      order.statusHistory.push({ status: 'confirmed', note: 'Razorpay payment received', at: new Date() });
    }
    await order.save();

    res.json(order);
  })
);

// Razorpay webhook — backup confirmation in case the customer closes the
// modal before our /verify call lands. Configure in Razorpay dashboard:
//   URL: https://YOUR-API/api/payment/razorpay/webhook
//   Events: payment.captured
// Then add RAZORPAY_WEBHOOK_SECRET as a Render env var.
router.post(
  '/razorpay/webhook',
  // Raw body parser is mounted in server.js for this exact route.
  asyncHandler(async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      return res.status(200).json({ received: true, ignored: true });
    }
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body; // raw Buffer
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (expected !== signature) {
      console.warn('Razorpay webhook signature mismatch');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = JSON.parse(body.toString('utf8'));
    if (event.event === 'payment.captured') {
      const p = event.payload?.payment?.entity || {};
      const orderId = p.notes?.orderId;
      if (orderId) {
        const order = await Order.findById(orderId);
        if (order && !order.isPaid) {
          order.isPaid = true;
          order.paidAt = p.captured_at ? new Date(p.captured_at * 1000) : new Date();
          order.paymentMethod = 'Razorpay';
          order.paymentResult = {
            id: p.id,
            status: 'COMPLETED',
            updateTime: new Date().toISOString(),
            email: p.email || '',
            provider: 'Razorpay',
            method: p.method,
            vpa: p.vpa,
            bank: p.bank,
            wallet: p.wallet,
            cardLast4: p.card?.last4,
            cardBrand: p.card?.network,
            cardNetwork: p.card?.network,
            cardType: p.card?.type,
            rrn: p.acquirer_data?.rrn,
            acquirerData: p.acquirer_data,
            amount: p.amount,
            fee: p.fee,
            tax: p.tax,
            orderId: p.order_id,
            capturedAt: p.captured_at ? new Date(p.captured_at * 1000) : new Date(),
          };
          if (order.status === 'pending') {
            order.status = 'confirmed';
            order.statusHistory.push({ status: 'confirmed', note: 'Razorpay webhook payment captured', at: new Date() });
          }
          await order.save();
          console.log(`💳 Razorpay webhook: marked order ${orderId} as paid`);
        }
      }
    }

    res.json({ received: true });
  })
);

module.exports = router;
