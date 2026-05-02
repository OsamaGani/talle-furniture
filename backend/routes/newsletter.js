const express = require('express');
const asyncHandler = require('express-async-handler');
const Subscriber = require('../models/Subscriber');
const { sendEmail, validateEmailFormat } = require('../utils/email');

const router = express.Router();

// Welcome email — transactional tone (subject + content) so Gmail/Yahoo
// don't auto-route to spam. Heavy "WELCOME / 10% OFF / 🎉" patterns are
// classic spam triggers, so we keep it understated and lead with the
// account confirmation.
function buildWelcomeEmail(email, promoCode, clientUrl) {
  const unsubscribeUrl = `${clientUrl}/unsubscribe?email=${encodeURIComponent(email)}`;

  const html = `
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;">
    <div style="background:#111827;padding:20px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">
        <span style="color:#e53935;">Toy</span>Mall
      </h1>
    </div>
    <div style="padding:28px 24px;color:#374151;line-height:1.6;">
      <h2 style="margin:0 0 12px 0;font-size:20px;font-weight:700;color:#111827;">Subscription confirmed</h2>
      <p style="margin:0 0 16px 0;">Hi,</p>
      <p style="margin:0 0 16px 0;">Thanks for subscribing to Toy Mall updates. Your email has been added to our list, and you'll be the first to hear about new arrivals and seasonal offers.</p>
      <p style="margin:0 0 16px 0;">To say thanks, here's a one-time discount code for your first order:</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:16px;text-align:center;border-radius:8px;margin:16px 0;">
        <p style="margin:0;font-size:11px;color:#6b7280;font-weight:600;letter-spacing:1px;">DISCOUNT CODE</p>
        <p style="margin:6px 0 0 0;font-family:monospace;font-size:24px;letter-spacing:4px;font-weight:700;color:#111827;">${promoCode}</p>
        <p style="margin:6px 0 0 0;font-size:12px;color:#6b7280;">Apply at checkout · valid 30 days</p>
      </div>
      <p style="margin:20px 0 0 0;">
        <a href="${clientUrl}/shop" style="display:inline-block;background:#111827;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Browse the catalogue</a>
      </p>
      <p style="color:#6b7280;font-size:13px;margin:24px 0 0 0;">
        Questions? Reply to this email or contact us at <a href="mailto:support@toymall.in" style="color:#374151;">support@toymall.in</a>.
      </p>
    </div>
    <div style="background:#f9fafb;padding:14px 20px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#6b7280;">Toy Mall · Mobin Apartment A Wing, Shop No. 4, Mumbra, Thane — 400612</p>
      <p style="margin:6px 0 0 0;font-size:11px;color:#9ca3af;">
        You're receiving this because you subscribed at toymall.
        <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body></html>`;

  const text = `Subscription confirmed — Toy Mall

Hi,

Thanks for subscribing to Toy Mall updates. Your email has been added to our list, and you'll be the first to hear about new arrivals and seasonal offers.

To say thanks, here's a one-time discount code for your first order:

  Discount code: ${promoCode}
  Apply at checkout. Valid for 30 days.

Browse the catalogue: ${clientUrl}/shop

Questions? Reply to this email or contact us at support@toymall.in.

— Toy Mall
Mobin Apartment A Wing, Shop No. 4, Mumbra, Thane — 400612

You're receiving this because you subscribed. Unsubscribe: ${unsubscribeUrl}`;

  // Gmail / Yahoo / Microsoft strongly prefer marketing email that
  // declares one-click unsubscribe — without these headers they down-rank
  // the message into Promotions / Spam.
  const headers = {
    'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:support@toymall.in?subject=Unsubscribe>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    'X-Mailer': 'Toy Mall',
  };

  return { html, text, headers };
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
        const { html, text, headers } = buildWelcomeEmail(cleanEmail, promo, clientUrl);
        const result = await sendEmail({
          to: cleanEmail,
          // Plain-language subject — no emojis, no "10% OFF" — so Gmail
          // treats it like a transactional confirmation instead of bulk mail.
          subject: 'Subscription confirmed - Toy Mall',
          html,
          text,
          headers,
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
