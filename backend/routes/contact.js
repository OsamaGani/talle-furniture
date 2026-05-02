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

    const { renderEmail } = require('../utils/emailLayout');
    const replyMailto = `mailto:${escape(email)}?subject=${encodeURIComponent('Re: ' + (subject || 'Your enquiry'))}`;

    const bodyHtml = `
      <p style="margin:0 0 14px 0;color:#6b7280;font-size:13px;">
        A new message arrived through the Contact form at <strong>${new Date().toLocaleString('en-IN')}</strong>.
      </p>
      <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;margin:8px 0 18px 0;">
        <tr>
          <td style="padding:6px 0;width:90px;color:#6b7280;font-weight:600;">From</td>
          <td style="padding:6px 0;color:#111827;">${escape(name)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-weight:600;">Email</td>
          <td style="padding:6px 0;"><a href="mailto:${escape(email)}" style="color:#e53935;text-decoration:none;">${escape(email)}</a></td>
        </tr>
        ${phone ? `
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-weight:600;">Phone</td>
          <td style="padding:6px 0;"><a href="tel:${escape(phone)}" style="color:#e53935;text-decoration:none;">${escape(phone)}</a></td>
        </tr>` : ''}
        ${subject ? `
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-weight:600;">Subject</td>
          <td style="padding:6px 0;color:#111827;">${escape(subject)}</td>
        </tr>` : ''}
      </table>
      <div style="border-top:1px solid #e5e7eb;padding-top:16px;">
        <p style="margin:0 0 8px 0;color:#6b7280;font-size:11px;font-weight:600;letter-spacing:1px;">MESSAGE</p>
        <div style="background:#f9fafb;border-left:3px solid #e53935;border-radius:6px;padding:14px 16px;color:#111827;line-height:1.6;white-space:pre-wrap;font-size:14px;">${escape(message)}</div>
      </div>
    `;

    const html = renderEmail({
      preheader: `${name} sent you a message via the Contact form.`,
      heroEmoji: '✉️',
      heroColor: '#e53935',
      heroTitle: 'New Contact Form Message',
      heroSubtitle: `From ${name}`,
      bodyHtml,
      cta: { text: `Reply to ${name.split(' ')[0]}`, url: replyMailto, color: '#e53935' },
    });

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
