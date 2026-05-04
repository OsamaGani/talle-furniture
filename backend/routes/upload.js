const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Cloudinary is the production image host — files survive Render
// redeploys (Render's free tier wipes /uploads/ on every push) AND get
// served from a global CDN with automatic format conversion + resizing.
// Falls back to local disk storage if no Cloudinary credentials are set,
// so local dev still works without needing an account.
const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let cloudinary = null;
if (useCloudinary) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log(`☁️  Cloudinary upload enabled (cloud: ${process.env.CLOUDINARY_CLOUD_NAME})`);
} else {
  console.warn('⚠️  Cloudinary not configured — falling back to local /uploads disk storage. ' +
    'Files will be wiped on every Render redeploy. Set CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET env vars to enable.');
}

// === Local-disk fallback path (only used when Cloudinary is not configured) ===
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!useCloudinary && !fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// === Multer storage strategy depends on the host ===
//   * Cloudinary path → memoryStorage so the file lives as a Buffer that
//     we stream up to Cloudinary's API. No disk write happens.
//   * Local-dev path  → diskStorage in /uploads/ as before.
const storage = useCloudinary
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadDir),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
      },
    });

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('Only image files allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

function multerError(err, _req, res, next) {
  if (!err) return next();
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'Image is too large. Max size is 5 MB per file.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected file field. Please retry.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files at once (max 6).' });
    }
    return res.status(400).json({ message: err.message || 'Upload failed' });
  }
  return res.status(400).json({ message: err.message || 'Upload failed' });
}

// Stream the in-memory buffer up to Cloudinary. Returns the secure HTTPS
// URL Cloudinary serves the asset from (it's already CDN-backed). Folder
// is set so all the shop's uploads land in one place — easier to audit
// + delete in bulk later.
function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'toymall/products',
        resource_type: 'image',
        // No public_id — Cloudinary auto-generates a unique one. Using a
        // unique id every upload means we never accidentally overwrite a
        // previous image even if two products had the same source filename.
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// Absolute URL builder — only used in the local-dev fallback path.
const buildLocalImageUrl = (req, filename) => {
  const base = process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;
  return `${base.replace(/\/$/, '')}/uploads/${filename}`;
};

// Resolve a single uploaded file's public URL, regardless of which storage
// backend handled it.
async function resolveUploadedUrl(req, file) {
  if (useCloudinary) {
    return uploadBufferToCloudinary(file.buffer);
  }
  return buildLocalImageUrl(req, file.filename);
}

router.post(
  '/',
  protect,
  admin,
  (req, res, next) => upload.single('image')(req, res, (err) => multerError(err, req, res, next)),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    try {
      const url = await resolveUploadedUrl(req, req.file);
      res.json({ url });
    } catch (err) {
      console.error('Cloudinary upload failed:', err.message);
      res.status(500).json({ message: 'Image upload failed. Please try again.' });
    }
  }
);

router.post(
  '/multiple',
  protect,
  admin,
  (req, res, next) => upload.array('images', 6)(req, res, (err) => multerError(err, req, res, next)),
  async (req, res) => {
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No files' });
    try {
      const urls = await Promise.all(req.files.map((f) => resolveUploadedUrl(req, f)));
      res.json({ urls });
    } catch (err) {
      console.error('Cloudinary upload failed:', err.message);
      res.status(500).json({ message: 'Some images failed to upload. Please try again.' });
    }
  }
);

module.exports = router;
