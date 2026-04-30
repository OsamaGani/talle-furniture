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
        from: process.env.SMTP_FROM || `"Toy Mall" <${process.env.SMTP_USER}>`,
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
  const subject = `Your Toy Mall verification code: ${otp}`;
  const text = `Hi ${name || 'there'},\n\nYour Toy Mall email verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't sign up, ignore this email.\n\n— Team Toy Mall, Mumbra, Thane`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color:#e53935">Toy Mall — Verify your email</h2>
      <p>Hi ${name || 'there'},</p>
      <p>Use this code to verify your email address:</p>
      <div style="background:#fff5f5;border:2px dashed #e53935;padding:16px;text-align:center;font-size:32px;letter-spacing:8px;font-weight:bold;color:#b71c1c;border-radius:8px;margin:16px 0;">${otp}</div>
      <p style="color:#666;font-size:13px">This code expires in 10 minutes. If you didn't create an account, just ignore this email.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
      <p style="color:#999;font-size:12px;text-align:center">Toy Mall · Mobin Apartment A Wing, Shop No. 4, Amrut Nagar, Near Dargah Road, Mumbra, Thane — 400612</p>
    </div>
  `;
  return sendEmail({ to: email, subject, html, text });
}

module.exports = { validateEmailFormat, generateOTP, sendEmail, sendVerificationOTP };
