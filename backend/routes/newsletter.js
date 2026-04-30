const express = require('express');
const asyncHandler = require('express-async-handler');
const Subscriber = require('../models/Subscriber');
const { sendEmail, validateEmailFormat } = require('../utils/email');

const router = express.Router();

// Welcome email — sent to every new subscriber with a 10% off promo code.
function buildWelcomeEmail(email, promoCode, clientUrl) {
  const html = `
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;">
    <div style="background:linear-gradient(135deg,#e53935,#ec4899);padding:30px 20px;text-align:center;color:#ffffff;">
      <h1 style="margin:0;font-size:28px;font-weight:800;">Welcome to the Toy Mall family! 🎉</h1>
    </div>
    <div style="padding:28px 24px;">
      <p style="margin:0 0 16px 0;font-size:16px;color:#111827;">Hi there,</p>
      <p style="margin:0 0 16px 0;color:#374151;line-height:1.6;">
        Thanks for joining our newsletter. As promised, here's <strong>10% off</strong> your first order:
      </p>
      <div style="background:#fff5f5;border:2px dashed #e53935;padding:20px;text-align:center;border-radius:12px;margin:20px 0;">
        <p style="margin:0;font-size:11px;color:#991b1b;font-weight:600;letter-spacing:1px;">YOUR PROMO CODE</p>
        <p style="margin:8px 0 0 0;font-size:30px;letter-spacing:6px;font-weight:800;color:#b71c1c;">${promoCode}</p>
        <p style="margin:8px 0 0 0;font-size:12px;color:#6b7280;">10% OFF · Single use · Expires in 30 days</p>
      </div>
      <p style="margin:0 0 16px 0;color:#374151;line-height:1.6;">
        Apply the code at checkout to save 10% on your first order. Plus, you'll be the first to hear about new arrivals, mega sales, and exclusive members-only deals.
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${clientUrl}/shop" style="display:inline-block;background:#e53935;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">Start Shopping →</a>
      </div>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:24px 0 0 0;">
        Questions? Reply to this email or write to <a href="mailto:Huraira735@gmail.com" style="color:#e53935;">Huraira735@gmail.com</a>.
      </p>
    </div>
    <div style="background:#f9fafb;padding:18px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#6b7280;">Toy Mall · Mumbra, Thane</p>
      <p style="margin:6px 0 0 0;font-size:11px;color:#9ca3af;">
        Don't want these emails?
        <a href="${clientUrl}/unsubscribe?email=${encodeURIComponent(email)}" style="color:#9ca3af;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body></html>`;

  const text = `Welcome to the Toy Mall family!

As promised, here's 10% off your first order:

Promo code: ${promoCode}
(10% OFF · single use · expires in 30 days)

Apply at checkout: ${clientUrl}/shop

Questions? Reply to this email or write to Huraira735@gmail.com.

— Team Toy Mall, Mumbra`;

  return { html, text };
}

router.post(
  '/subscribe',
  asyncHandler(async (req, res) => {
    const { email, source = 'home' } = req.body || {};

    const ok = validateEmailFormat(email);
    if (!ok.ok) return res.status(400).json({ message: ok.reason });

    const cleanEmail = ok.email;
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

    let subscriber = await Subscriber.findOne({ email: cleanEmail });

    if (subscriber && subscriber.unsubscribed) {
      // Re-enable a previously unsubscribed email
      subscriber.unsubscribed = false;
      subscriber.welcomeSent = false; // re-send the welcome
      await subscriber.save();
    } else if (!subscriber) {
      subscriber = await Subscriber.create({ email: cleanEmail, source });
    }
    // If we land here with welcomeSent === true, customer already got the
    // welcome email previously — don't send again (avoids spam-loop reports).

    let attemptedSend = false;
    let sendOk = false;
    if (!subscriber.welcomeSent) {
      attemptedSend = true;
      try {
        const promo = subscriber.promoCode || 'WELCOME10';
        const { html, text } = buildWelcomeEmail(cleanEmail, promo, clientUrl);
        const result = await sendEmail({
          to: cleanEmail,
          subject: '🎉 Welcome to Toy Mall — 10% off your first order',
          html,
          text,
        });
        if (result.sent) {
          sendOk = true;
          subscriber.welcomeSent = true;
          await subscriber.save();
          console.log(`📧 Newsletter welcome email -> ${cleanEmail}`);
        } else if (result.dev) {
          console.log(`📧 Newsletter welcome email (dev mode log only) -> ${cleanEmail}`);
        } else {
          console.error(`Newsletter welcome to ${cleanEmail} failed:`, result.error || 'unknown');
        }
      } catch (err) {
        console.error('Newsletter welcome email failed:', err.message);
      }
    }

    const newlyCreated = !subscriber.createdAt || (Date.now() - new Date(subscriber.createdAt).getTime() < 5000);
    let message;
    if (newlyCreated && sendOk) {
      message = 'Subscribed! Check your inbox for a 10% off code.';
    } else if (newlyCreated && attemptedSend && !sendOk) {
      message = 'Subscribed! We couldn\'t deliver the welcome email — check spam, or contact us.';
    } else if (sendOk) {
      message = 'Welcome back! We\'ve resent your 10% off code — check your inbox.';
    } else {
      message = 'You\'re already on our list — check your inbox (and spam folder) for past offers.';
    }

    res.status(newlyCreated ? 201 : 200).json({
      message,
      promoCode: subscriber.promoCode,
      alreadySubscribed: !newlyCreated,
      welcomeSent: sendOk,
    });
  })
);

router.post(
  '/unsubscribe',
  asyncHandler(async (req, res) => {
    const { email } = req.body || {};
    const ok = validateEmailFormat(email);
    if (!ok.ok) return res.status(400).json({ message: ok.reason });
    const sub = await Subscriber.findOne({ email: ok.email });
    if (!sub) return res.json({ message: 'Email is not subscribed.' });
    sub.unsubscribed = true;
    await sub.save();
    res.json({ message: 'You\'ve been unsubscribed. Sorry to see you go!' });
  })
);

module.exports = router;
