const express = require('express');
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/auth');
const Order = require('../models/Order');

const router = express.Router();

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes('replace') || !key.startsWith('sk_')) return null;
  return require('stripe')(key);
};

// ------------------------------------------------------------------
// POST /api/payment/create-checkout-session
// Creates a Stripe Checkout session for an existing pending order.
// Includes shipping + tax as separate line items so Stripe charges the
// exact total the customer saw at checkout.
// ------------------------------------------------------------------
router.post(
  '/create-checkout-session',
  protect,
  asyncHandler(async (req, res) => {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(400).json({ message: 'Stripe is not configured. Set STRIPE_SECRET_KEY in environment variables.' });
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

    // Build line items from the order itself (trustworthy server-side data)
    const lineItems = order.items.map((it) => ({
      price_data: {
        currency: 'inr',
        product_data: {
          name: it.name,
          // Stripe rejects relative URLs — only push absolute http(s) image URLs.
          ...(it.image && /^https?:\/\//i.test(it.image) ? { images: [it.image] } : {}),
        },
        unit_amount: Math.round((it.price || 0) * 100),
      },
      quantity: it.qty,
    }));

    if (order.shippingPrice > 0) {
      lineItems.push({
        price_data: {
          currency: 'inr',
          product_data: { name: 'Shipping' },
          unit_amount: Math.round(order.shippingPrice * 100),
        },
        quantity: 1,
      });
    }
    if (order.taxPrice > 0) {
      lineItems.push({
        price_data: {
          currency: 'inr',
          product_data: { name: 'Tax' },
          unit_amount: Math.round(order.taxPrice * 100),
        },
        quantity: 1,
      });
    }

    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: req.user.email,
      line_items: lineItems,
      // Pass the session id back so the frontend can verify the payment
      // before flipping the order to paid. {CHECKOUT_SESSION_ID} is replaced
      // by Stripe at redirect time.
      success_url: `${clientUrl}/order/${order._id}?stripe_session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/order/${order._id}?stripe_cancelled=1`,
      metadata: { orderId: String(order._id) },
    });

    res.json({ url: session.url, id: session.id });
  })
);

// ------------------------------------------------------------------
// POST /api/payment/confirm
// Called by the frontend after Stripe redirects back. Verifies the
// session was actually paid, then marks the order paid. Idempotent —
// safe to call multiple times.
// ------------------------------------------------------------------
router.post(
  '/confirm',
  protect,
  asyncHandler(async (req, res) => {
    const stripe = getStripe();
    if (!stripe) return res.status(400).json({ message: 'Stripe is not configured' });

    const { sessionId, orderId } = req.body;
    if (!sessionId || !orderId) {
      return res.status(400).json({ message: 'sessionId and orderId are required' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (order.isPaid) {
      return res.json({ ...order.toObject(), alreadyPaid: true });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) return res.status(404).json({ message: 'Stripe session not found' });

    // Belt-and-braces: ensure the session is for THIS order
    if (session.metadata?.orderId && session.metadata.orderId !== String(orderId)) {
      return res.status(400).json({ message: 'Session does not match order' });
    }
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: `Payment status is ${session.payment_status}` });
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentMethod = 'Stripe';
    order.paymentResult = {
      id: session.payment_intent || session.id,
      status: 'COMPLETED',
      updateTime: new Date().toISOString(),
      email: session.customer_email || session.customer_details?.email || '',
    };
    // If still 'pending', auto-advance to 'confirmed' since payment succeeded
    if (order.status === 'pending') {
      order.status = 'confirmed';
      order.statusHistory.push({ status: 'confirmed', note: 'Stripe payment received', at: new Date() });
    }
    await order.save();

    res.json(order);
  })
);

// ------------------------------------------------------------------
// POST /api/payment/webhook  (raw body required — see server.js mount)
// Backup confirmation path: Stripe pings this when payment succeeds even
// if the customer closed the tab before redirect. Optional but
// recommended for production reliability.
// ------------------------------------------------------------------
router.post(
  '/webhook',
  // Note: this route uses a raw body parser mounted in server.js so
  // the signature verification works.
  asyncHandler(async (req, res) => {
    const stripe = getStripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !secret) {
      // Webhooks are optional — silently 200 so Stripe doesn't keep retrying
      return res.status(200).json({ received: true, ignored: true });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], secret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        const order = await Order.findById(orderId);
        if (order && !order.isPaid) {
          order.isPaid = true;
          order.paidAt = new Date();
          order.paymentMethod = 'Stripe';
          order.paymentResult = {
            id: session.payment_intent || session.id,
            status: 'COMPLETED',
            updateTime: new Date().toISOString(),
            email: session.customer_email || session.customer_details?.email || '',
          };
          if (order.status === 'pending') {
            order.status = 'confirmed';
            order.statusHistory.push({ status: 'confirmed', note: 'Stripe webhook payment received', at: new Date() });
          }
          await order.save();
          console.log(`💳 Stripe webhook: marked order ${orderId} as paid`);
        }
      }
    }

    res.json({ received: true });
  })
);

module.exports = router;
