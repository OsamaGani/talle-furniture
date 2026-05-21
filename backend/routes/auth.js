const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { validateEmailFormat, generateOTP, sendVerificationOTP, sendEmail, maskEmail } = require('../utils/email');

const router = express.Router();

const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

const userPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  address: user.address,
  isAdmin: user.isAdmin,
  emailVerified: user.emailVerified,
  token: genToken(user._id),
});

const isDev = () => !process.env.SMTP_HOST || !process.env.SMTP_USER;

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });

    // Validate email format + reject disposable
    const emailCheck = validateEmailFormat(email);
    if (!emailCheck.ok) return res.status(400).json({ message: emailCheck.reason });

    // Strong password — keep aligned with the frontend strength meter (PasswordInput.jsx).
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain both upper and lower case letters' });
    }
    if (!/\d/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one number' });
    }

    const exists = await User.findOne({ email: emailCheck.email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const user = await User.create({
      name,
      email: emailCheck.email,
      password,
      verificationOTP: otp,
      otpExpiresAt,
      emailVerified: false,
    });

    await sendVerificationOTP(emailCheck.email, otp, name);

    res.status(201).json({
      ...userPayload(user),
      message: 'Account created. Please verify your email with the OTP.',
      // Dev helper — exposes OTP only when no SMTP configured. Remove in production.
      ...(isDev() ? { devOTP: otp } : {}),
    });
  })
);

router.post(
  '/verify-email',
  protect,
  asyncHandler(async (req, res) => {
    const { otp } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.emailVerified) return res.json({ message: 'Already verified', emailVerified: true });

    if (user.otpAttempts >= 5) {
      return res.status(429).json({ message: 'Too many wrong attempts. Resend the OTP.' });
    }
    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }
    if (!otp || user.verificationOTP !== otp.trim()) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({ message: `Wrong OTP. ${5 - user.otpAttempts} attempts left.` });
    }

    user.emailVerified = true;
    user.verificationOTP = '';
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;
    await user.save();

    res.json({ message: 'Email verified successfully', emailVerified: true });
  })
);

router.post(
  '/resend-otp',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.emailVerified) return res.json({ message: 'Already verified' });

    // Throttle — once per minute
    if (user.otpExpiresAt && (user.otpExpiresAt.getTime() - Date.now()) > 9 * 60 * 1000) {
      return res.status(429).json({ message: 'Please wait a minute before requesting another OTP.' });
    }

    const otp = generateOTP();
    user.verificationOTP = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otpAttempts = 0;
    await user.save();

    await sendVerificationOTP(user.email, otp, user.name);

    res.json({
      message: 'New OTP sent to your email',
      ...(isDev() ? { devOTP: otp } : {}),
    });
  })
);

// Per-account brute-force lockout — these stop a single account being
// pummelled even if the attacker rotates IPs to dodge the IP-based rate limit.
const LOCKOUT_THRESHOLD = 5;             // wrong-password attempts before lock
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 min

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() });

    // ---- Account locked ----
    // Check before verifying the password so we don't leak that the account
    // exists or that the password was correct during the lockout window.
    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      const minsLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      return res.status(429).json({
        message: `Too many failed attempts. This account is temporarily locked. Try again in ${minsLeft} minute${minsLeft === 1 ? '' : 's'}, or reset your password.`,
      });
    }

    // ---- Wrong credentials ----
    if (!user || !(await user.matchPassword(password))) {
      // Bump the counter on the matched account (keeps generic 401 to avoid
      // leaking whether the email exists). If the email doesn't exist, no
      // counter is bumped — but the attacker won't get in either.
      if (user) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= LOCKOUT_THRESHOLD) {
          user.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
          console.warn(`🔒 Account locked: ${user.email} (${user.failedLoginAttempts} failed attempts)`);
        }
        await user.save();
      }
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // ---- Success: reset counters ----
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = undefined;
      await user.save();
    }
    res.json(userPayload(user));
  })
);

router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    res.json(req.user);
  })
);

router.put(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.name = req.body.name || user.name;
    if (req.body.email && req.body.email !== user.email) {
      const emailCheck = validateEmailFormat(req.body.email);
      if (!emailCheck.ok) return res.status(400).json({ message: emailCheck.reason });
      const exists = await User.findOne({ email: emailCheck.email });
      if (exists) return res.status(400).json({ message: 'Email already in use' });
      user.email = emailCheck.email;
      user.emailVerified = false; // re-verify on email change
    }
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;
    user.businessName = req.body.businessName ?? user.businessName;
    user.gstNumber = req.body.gstNumber ?? user.gstNumber;

    // Password change requires the CURRENT password — defends against a
    // stolen JWT being used to lock the real owner out of their account.
    if (req.body.password) {
      const { currentPassword, password } = req.body;
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new one' });
      }
      const ok = await user.matchPassword(currentPassword);
      if (!ok) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      // Match the registration strength rules.
      if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
      }
      if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
        return res.status(400).json({ message: 'Password must contain both upper and lower case letters' });
      }
      if (!/\d/.test(password)) {
        return res.status(400).json({ message: 'Password must contain at least one number' });
      }
      user.password = password; // bcrypt hashed by User.pre('save')
    }
    const updated = await user.save();
    res.json(userPayload(updated));
  })
);

// ==================================================================
// Password reset
// ==================================================================
//
// Flow:
// 1) User submits email at /forgot-password
// 2) Backend generates a 32-byte random token. Plaintext token goes in the
//    email link; SHA-256 hash is stored on the user (so a DB leak can't be
//    used to reset accounts).
// 3) User clicks the link, lands on /reset-password/:token, types new password
// 4) Backend hashes the URL token, looks up the user, validates expiry,
//    bcrypt-hashes the new password (via User pre-save hook), clears the
//    reset fields.
// ==================================================================

const PASSWORD_RESET_TTL_MIN = 30; // 30 min — short enough for safety, long enough for the customer to read the email

const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = req.body || {};
    const ok = validateEmailFormat(email);
    // We deliberately respond identically whether the email exists or not —
    // this prevents attackers from enumerating which addresses have accounts.
    const genericResponse = {
      message: 'If an account exists for that email, we\'ve sent a password reset link. Check your inbox (and spam).',
    };
    if (!ok.ok) return res.json(genericResponse);

    const user = await User.findOne({ email: ok.email });
    if (!user) return res.json(genericResponse);

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashToken(rawToken);
    user.resetPasswordExpiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MIN * 60 * 1000);
    await user.save();

    // CLIENT_URL may be a comma-separated list (e.g. 'https://new.com,https://old.com')
    // — emails always use the FIRST entry (the canonical/current domain). Without
    // this split, the reset link ends up as 'https://new.com,https://old.com/reset-...'
    // which is broken.
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

    const { renderEmail, escape } = require('../utils/emailLayout');
    const firstName = user.name?.split(' ')[0] || 'there';

    const subject = 'Reset your Talle Furniture Mart password';
    const bodyHtml = `
      <p style="margin:0 0 14px 0;font-size:15px;">Hi <strong>${escape(firstName)}</strong>,</p>
      <p style="margin:0 0 16px 0;">
        We received a request to reset the password on your Talle Furniture Mart account.
        Tap the button below to choose a new one — this link works for the next
        <strong>${PASSWORD_RESET_TTL_MIN} minutes</strong>.
      </p>
      <p style="margin:22px 0 0 0;color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb;padding-top:18px;">
        <strong style="color:#111827;">Didn't ask for a reset?</strong><br>
        Safe to ignore this email. Your password won't change unless you click the link, and the link expires automatically.
      </p>
    `;

    const text = [
      `Hi ${firstName},`,
      '',
      'We received a request to reset the password on your Talle Furniture Mart account.',
      `Open this link to set a new one (valid for ${PASSWORD_RESET_TTL_MIN} minutes):`,
      '',
      resetUrl,
      '',
      'Didn\'t ask for a password reset? You can safely ignore this email — your password won\'t change unless you click the link.',
      '',
      '— Team Talle Furniture Mart',
    ].join('\n');

    const html = renderEmail({
      preheader: 'Tap the link to set a new password (valid 30 min).',
      heroEmoji: '🔑',
      heroColor: '#1f2937',
      heroTitle: 'Reset your password',
      heroSubtitle: `This link is valid for ${PASSWORD_RESET_TTL_MIN} minutes`,
      bodyHtml,
      cta: { text: 'Reset password', url: resetUrl, color: '#e53935' },
    });

    try {
      await sendEmail({ to: user.email, subject, html, text });
      console.log(`🔑 Password reset link sent to ${maskEmail(user.email)}`);
    } catch (err) {
      console.error('Reset email send failed:', err.message);
      // Don't expose the email failure to the user — they'd see different
      // responses based on email-existence, which leaks info. They can retry.
    }

    res.json(genericResponse);
  })
);

router.post(
  '/reset-password/:token',
  asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body || {};
    if (!token) return res.status(400).json({ message: 'Reset token is required' });
    if (!password) return res.status(400).json({ message: 'New password is required' });

    // Match the registration strength rules so the new password is at least as strong.
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain both upper and lower case letters' });
    }
    if (!/\d/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one number' });
    }

    const hashed = hashToken(token);
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpiresAt: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({ message: 'This reset link has expired or is invalid. Please request a new one.' });
    }

    user.password = password; // bcrypt hashed by User.pre('save')
    user.resetPasswordToken = '';
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    console.log(`🔑 Password reset for ${maskEmail(user.email)}`);
    res.json({ message: 'Password reset successfully. You can now sign in with your new password.' });
  })
);

module.exports = router;
