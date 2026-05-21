// Email helper — logs to console in dev, supports nodemailer in prod when SMTP env vars are set.

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', 'temp-mail.org', '10minutemail.com',
  'guerrillamail.com', 'throwaway.email', 'fakeinbox.com', 'sharklasers.com',
  'yopmail.com', 'getnada.com', 'maildrop.cc', 'trashmail.com',
  'dispostable.com', 'mintemail.com', 'mailnesia.com', 'getairmail.com',
]);

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function validateEmailFormat(email) {
  if (!email || typeof email !== 'string') return { ok: false, reason: 'Email is required' };
  email = email.trim().toLowerCase();
  if (email.length > 254) return { ok: false, reason: 'Email is too long' };
  if (!EMAIL_REGEX.test(email)) return { ok: false, reason: 'Invalid email format' };

  const domain = email.split('@')[1];
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { ok: false, reason: 'Disposable email addresses are not allowed' };
  }
  // Common typos guard
  const TYPOS = { 'gmial.com': 'gmail.com', 'gnail.com': 'gmail.com', 'gmaill.com': 'gmail.com', 'yaho.com': 'yahoo.com', 'hotnail.com': 'hotmail.com' };
  if (TYPOS[domain]) {
    return { ok: false, reason: `Did you mean ${email.split('@')[0]}@${TYPOS[domain]}?` };
  }
  return { ok: true, email };
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Mask an email address for log-safe printing: foo.bar@gmail.com → f******@gmail.com.
// Keeps the first character + the domain so logs are still useful for debugging,
// but never writes the full email to disk — which would be a real PII leak in
// Render's persistent log storage, accessible to anyone with dashboard access.
function maskEmail(email) {
  if (!email || typeof email !== 'string') return '<no email>';
  const [local = '', domain = ''] = email.split('@');
  if (!domain) return '***';
  return `${local.charAt(0)}${'*'.repeat(Math.max(1, local.length - 1))}@${domain}`;
}

async function sendEmail({ to, subject, html, text, replyTo, headers }) {
  // If real SMTP is configured (SMTP_HOST), use nodemailer
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: +process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Talle Furniture Mart" <${process.env.SMTP_USER}>`,
        to, subject, html, text,
        ...(replyTo ? { replyTo } : {}),
        ...(headers ? { headers } : {}),
      });
      return { sent: true };
    } catch (err) {
      console.error('Email send failed:', err.message);
      return { sent: false, error: err.message };
    }
  }
  // Dev mode — log to console
  console.log('\n📧 ----- EMAIL (dev mode, no SMTP configured) -----');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${text || html.replace(/<[^>]+>/g, '')}`);
  console.log('--------------------------------------------------\n');
  return { sent: false, dev: true };
}

async function sendVerificationOTP(email, otp, name = '') {
  const { renderEmail, escape } = require('./emailLayout');
  const firstName = (name || 'there').split(' ')[0];
  const subject = `${otp} is your Talle Furniture Mart verification code`;

  const bodyHtml = `
    <p style="margin:0 0 14px 0;font-size:15px;">Hi <strong>${escape(firstName)}</strong>,</p>
    <p style="margin:0 0 18px 0;">
      Welcome to Talle Furniture Mart! Use the code below to verify your email and finish creating your account.
    </p>
    <div style="background:#fff5f5;border:2px dashed #e53935;padding:18px 16px;text-align:center;border-radius:10px;margin:18px 0;">
      <p style="margin:0;font-size:11px;font-weight:600;color:#9b2c2c;letter-spacing:1px;">VERIFICATION CODE</p>
      <p style="margin:8px 0 0 0;font-family:'Courier New',monospace;font-size:36px;font-weight:bold;color:#b71c1c;letter-spacing:10px;">${escape(otp)}</p>
    </div>
    <p style="margin:0;color:#6b7280;font-size:13px;">
      This code expires in <strong>10 minutes</strong>. For security, never share it with anyone — Talle Furniture Mart staff will never ask for it.
    </p>
    <p style="margin:14px 0 0 0;color:#6b7280;font-size:13px;">
      Didn't sign up? You can safely ignore this email — no account will be created.
    </p>
  `;

  const text = [
    `Hi ${firstName},`,
    '',
    'Welcome to Talle Furniture Mart! Use this code to verify your email:',
    '',
    `   ${otp}`,
    '',
    'This code expires in 10 minutes.',
    'For security, never share it with anyone.',
    '',
    'Didn\'t sign up? You can safely ignore this email.',
    '',
    '— Team Talle Furniture Mart',
  ].join('\n');

  const html = renderEmail({
    preheader: `Your verification code is ${otp}. Expires in 10 minutes.`,
    heroEmoji: '🔐',
    heroColor: '#b91c1c',
    heroTitle: 'Verify your email',
    heroSubtitle: 'One more step to finish setting up your account',
    bodyHtml,
  });

  return sendEmail({ to: email, subject, html, text });
}

module.exports = { validateEmailFormat, generateOTP, sendEmail, sendVerificationOTP, maskEmail };
