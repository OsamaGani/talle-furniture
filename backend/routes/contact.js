const express = require('express');
const asyncHandler = require('express-async-handler');
const { sendEmail, validateEmailFormat } = require('../utils/email');

const router = express.Router();

const escape = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name = '', email = '', phone = '', subject = '', message = '' } = req.body || {};

    if (!name.trim() || !email.trim() || !message.trim()) {
      return res.status(400).json({ message: 'Name, email and message are required.' });
    }
    const ok = validateEmailFormat(email);
    if (!ok.ok) return res.status(400).json({ message: ok.reason });

    // Throttle/length sanity — keeps abusive payloads from getting forwarded.
    if (message.length > 5000) {
      return res.status(400).json({ message: 'Message is too long (max 5000 characters).' });
    }

    const TO = process.env.CONTACT_INBOX || 'support@toymall.in';
    const subjectLine = subject?.trim()
      ? `[Toy Mall Contact] ${subject.trim()}`
      : `[Toy Mall Contact] New enquiry from ${name.trim()}`;

    const html = `
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;">
    <div style="background:linear-gradient(135deg,#e53935,#ec4899);padding:24px;text-align:center;color:#fff;">
      <h1 style="margin:0;font-size:22px;font-weight:800;">New Contact Form Message</h1>
      <p style="margin:6px 0 0 0;font-size:13px;opacity:0.9;">Toy Mall · ${new Date().toLocaleString('en-IN')}</p>
    </div>
    <div style="padding:24px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;width:90px;color:#6b7280;font-weight:600;">From</td><td style="padding:8px 0;color:#111827;">${escape(name)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-weight:600;">Email</td><td style="padding:8px 0;color:#111827;"><a href="mailto:${escape(email)}" style="color:#e53935;text-decoration:none;">${escape(email)}</a></td></tr>
        ${phone ? `<tr><td style="padding:8px 0;color:#6b7280;font-weight:600;">Phone</td><td style="padding:8px 0;color:#111827;"><a href="tel:${escape(phone)}" style="color:#e53935;text-decoration:none;">${escape(phone)}</a></td></tr>` : ''}
        ${subject ? `<tr><td style="padding:8px 0;color:#6b7280;font-weight:600;">Subject</td><td style="padding:8px 0;color:#111827;">${escape(subject)}</td></tr>` : ''}
      </table>
      <div style="margin-top:16px;border-top:1px solid #e5e7eb;padding-top:16px;">
        <p style="margin:0 0 8px 0;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
        <div style="background:#f9fafb;border-radius:8px;padding:14px;color:#111827;line-height:1.55;white-space:pre-wrap;">${escape(message)}</div>
      </div>
      <div style="margin-top:24px;text-align:center;">
        <a href="mailto:${escape(email)}?subject=Re:%20${encodeURIComponent(subject || 'Your enquiry')}" style="display:inline-block;background:#e53935;color:#fff;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;">Reply to ${escape(name).split(' ')[0]}</a>
      </div>
    </div>
    <div style="background:#f9fafb;padding:14px;text-align:center;color:#9ca3af;font-size:11px;border-top:1px solid #e5e7eb;">
      This message was sent from the Contact form on toymall.com
    </div>
  </div>
</body></html>`;

    const text = `New contact form message — Toy Mall

From: ${name}
Email: ${email}
${phone ? `Phone: ${phone}\n` : ''}${subject ? `Subject: ${subject}\n` : ''}
Message:
${message}

— Sent from the Contact page on toymall.com`;

    const result = await sendEmail({
      to: TO,
      subject: subjectLine,
      html,
      text,
      replyTo: email, // so admin can hit "Reply" and reach the customer directly
    });

    if (!result.sent && !result.dev) {
      return res.status(500).json({ message: 'Could not send your message right now. Please try again.' });
    }

    res.json({ message: 'Thanks — your message has been sent. We typically reply within one working day.' });
  })
);

module.exports = router;
