const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { validateEmailFormat, generateOTP, sendVerificationOTP, sendEmail } = require('../utils/email');

const router = express.Router();

const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

const userPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  address: user.address,
  isAdmin: user.isAdmin,
  accountType: user.accountType,
  businessName: user.businessName,
  gstNumber: user.gstNumber,
  wholesaleApproved: user.wholesaleApproved,
  emailVerified: user.emailVerified,
  token: genToken(user._id),
});

const isDev = () => !process.env.SMTP_HOST || !process.env.SMTP_USER;

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, accountType, businessName, gstNumber } = req.body;
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
      accountType: accountType === 'wholesale' ? 'wholesale' : 'retail',
      businessName: businessName || '',
      gstNumber: gstNumber || '',
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

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() });
    if (user && (await user.matchPassword(password))) {
      res.json(userPayload(user));
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
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

    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

    const subject = 'Reset your Toy Mall password';
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
      <h2 style="margin:0 0 12px 0;font-size:20px;font-weight:700;color:#111827;">Reset your password</h2>
      <p style="margin:0 0 16px 0;">Hi ${user.name?.split(' ')[0] || 'there'},</p>
      <p style="margin:0 0 16px 0;">
        We received a request to reset the password on your Toy Mall account.
        Click the button below to set a new password — this link is valid for the next ${PASSWORD_RESET_TTL_MIN} minutes.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:#e53935;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">Reset password</a>
      </div>
      <p style="margin:0 0 8px 0;color:#6b7280;font-size:13px;">Or paste this link into your browser:</p>
      <p style="margin:0 0 16px 0;word-break:break-all;color:#374151;font-size:13px;">${resetUrl}</p>
      <p style="margin:24px 0 0 0;color:#6b7280;font-size:13px;">
        Didn't ask for a password reset? You can safely ignore this email — your password won't change unless you click the link.
      </p>
    </div>
    <div style="background:#f9fafb;padding:14px 20px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#6b7280;">Toy Mall · Mobin Apartment A Wing, Shop No. 4, Mumbra, Thane — 400612</p>
    </div>
  </div>
</body></html>`;

    const text = `Reset your Toy Mall password

Hi ${user.name?.split(' ')[0] || 'there'},

We received a request to reset the password on your Toy Mall account.
Open this link to set a new password (valid for ${PASSWORD_RESET_TTL_MIN} minutes):

${resetUrl}

Didn't ask for a password reset? You can safely ignore this email.

— Toy Mall`;

    try {
      await sendEmail({ to: user.email, subject, html, text });
      console.log(`🔑 Password reset link sent to ${user.email}`);
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

    console.log(`🔑 Password reset for ${user.email}`);
    res.json({ message: 'Password reset successfully. You can now sign in with your new password.' });
  })
);

module.exports = router;
