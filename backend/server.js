require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
const connectDB = require('./config/db');
const { seedIfEmpty } = require('./utils/seedData');

// Fail fast if the JWT secret is missing or weak — a predictable secret means
// anyone can forge admin tokens. Bail at startup rather than booting insecure.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.includes('change_me')) {
  console.error('❌  JWT_SECRET is missing, too short, or still set to the placeholder. Refusing to start.');
  console.error('    Generate one: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  process.exit(1);
}

const app = express();

// Render / Cloudflare put the real client IP in X-Forwarded-For. Without
// trust proxy, express-rate-limit sees every request as coming from the
// load balancer and either rate-limits everyone together or refuses to start.
app.set('trust proxy', 1);

(async () => {
  try {
    await connectDB();
    await seedIfEmpty();
  } catch (err) {
    // A seeding hiccup must never silently kill the API. Log loudly and keep listening.
    console.error('⚠️  Startup seed/connect error:', err.message);
  }
})();

// Last-resort safety net so an unhandled rejection (eg. mongo unique-index race)
// can't terminate Node and take the API down with it.
process.on('unhandledRejection', (err) => {
  console.error('⚠️  unhandledRejection:', err?.message || err);
});

// Security headers — XSS, clickjacking, MIME-sniffing, HSTS.
// crossOriginResourcePolicy=cross-origin so the frontend on a different
// origin can still load /uploads/* images.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Strict CORS allowlist. CLIENT_URL can be a comma-separated list to support
// the production domain plus a staging / preview URL.
const ALLOWED_ORIGINS = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow same-origin / curl / mobile apps (no Origin header)
    if (!origin) return cb(null, true);
    const normalized = origin.replace(/\/$/, '');
    if (ALLOWED_ORIGINS.includes(normalized)) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: false, // tokens travel in Authorization header, not cookies
}));

// Razorpay webhook MUST read the raw body for HMAC signature verification.
// Mount before express.json() — otherwise the body is parsed and we can't
// recompute the signature against the original bytes.
app.use('/api/payment/razorpay/webhook', express.raw({ type: 'application/json' }));

// Tight body limit — JSON requests should never need megabytes. Image
// uploads use multer with its own 5MB cap.
app.use(express.json({ limit: '200kb' }));

// Strip any keys starting with $ or containing dots — defends against
// NoSQL injection like ?email[$gt]= or body { "email": {"$ne": null} }.
app.use(mongoSanitize());

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  // Force browsers to honour our content-type and not sniff a different one.
  // Without this, an attacker uploading a polyglot image could trigger XSS.
  setHeaders: (res) => {
    res.set('X-Content-Type-Options', 'nosniff');
  },
}));

// ==================================================================
// Rate limiters — keyed per-IP. Mounted BEFORE the routes that need them.
// ==================================================================
const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Try again in a few minutes.' },
});
const limiterEmail = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Try again later.' },
});
const limiterGlobal = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', limiterAuth);
app.use('/api/auth/register', limiterAuth);
app.use('/api/auth/forgot-password', limiterEmail);
app.use('/api/auth/verify-email', limiterAuth);
app.use('/api/auth/resend-otp', limiterEmail);
app.use('/api/newsletter', limiterEmail);
app.use('/api/contact', limiterEmail);
app.use('/api/', limiterGlobal); // safety net for everything else

app.get('/', (req, res) => res.json({ message: 'Toy Mall API is running' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/brands', require('./routes/brands'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/wholesale-categories', require('./routes/wholesaleCategories'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/newsletter', require('./routes/newsletter'));

app.use((err, req, res, next) => {
  console.error(err);
  // Don't leak validator/internal error detail to the client.
  const isProd = process.env.NODE_ENV === 'production';
  const status = err.status || 500;
  const message = (status >= 500 && isProd) ? 'Server error' : (err.message || 'Server Error');
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Toy Mall API running on port ${PORT}`));
