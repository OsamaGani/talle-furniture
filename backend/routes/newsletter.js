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
  const { renderEmail, escape } = require('../utils/emailLayout');
  const unsubscribeUrl = `${clientUrl}/unsubscribe?email=${encodeURIComponent(email)}`;

  const bodyHtml = `
    <p style="margin:0 0 14px 0;font-size:15px;">Hi there,</p>
    <p style="margin:0 0 16px 0;">
      Thanks for subscribing to Toy Mall updates! You'll be the first to hear about
      new arrivals, festive sales, and the occasional surprise we save for our list.
    </p>
    <p style="margin:0 0 12px 0;">As a small welcome gift, here's a code for your first order:</p>
    <div style="background:#fff5f5;border:2px dashed #e53935;padding:18px 16px;text-align:center;border-radius:10px;margin:16px 0;">
      <p style="margin:0;font-size:11px;color:#9b2c2c;font-weight:600;letter-spacing:1px;">YOUR WELCOME CODE</p>
      <p style="margin:8px 0 0 0;font-family:'Courier New',monospace;font-size:28px;font-weight:bold;color:#b71c1c;letter-spacing:6px;">${escape(promoCode)}</p>
      <p style="margin:8px 0 0 0;font-size:12px;color:#6b7280;">Apply at checkout · valid 30 days · one-time use</p>
    </div>
    <p style="margin:18px 0 0 0;color:#6b7280;font-size:13px;">
      You can unsubscribe at any time using the link at the bottom of this email.
      We won't send you more than 2–3 emails a month — promise.
    </p>
  `;

  const text = [
    'Hi there,',
    '',
    'Thanks for subscribing to Toy Mall updates! You\'ll be the first to hear about new arrivals, festive sales, and the occasional surprise we save for our list.',
    '',
    'Your welcome code:',
    `   ${promoCode}`,
    'Apply at checkout. Valid 30 days, one-time use.',
    '',
    `Browse the catalogue: ${clientUrl}/shop`,
    '',
    'You can unsubscribe at any time:',
    unsubscribeUrl,
    '',
    '— Team Toy Mall',
  ].join('\n');

  const html = renderEmail({
    preheader: `Welcome! Use code ${promoCode} for 10% off your first order.`,
    heroEmoji: '🎁',
    heroColor: '#0891b2',
    heroTitle: 'Subscription confirmed',
    heroSubtitle: 'Welcome to the Toy Mall list',
    bodyHtml,
    cta: { text: 'Browse the catalogue', url: `${clientUrl}/shop`, color: '#e53935' },
    footerNote: `You're receiving this because you subscribed at Toy Mall. <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>.`,
  });

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
