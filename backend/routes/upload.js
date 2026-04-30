const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
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

// Translates multer's terse codes ("LIMIT_FILE_SIZE") into messages users can act on.
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
  // Custom fileFilter rejection bubbles up here ("Only image files allowed")
  return res.status(400).json({ message: err.message || 'Upload failed' });
}

// Absolute URL so the frontend (which lives on a different origin in production)
// can load uploaded images without needing a proxy. Falls back to a relative
// path in pure local dev where API_BASE_URL isn't set.
const buildImageUrl = (req, filename) => {
  const base = process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;
  return `${base.replace(/\/$/, '')}/uploads/${filename}`;
};

router.post(
  '/',
  protect,
  admin,
  (req, res, next) => upload.single('image')(req, res, (err) => multerError(err, req, res, next)),
  (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    res.json({ url: buildImageUrl(req, req.file.filename) });
  }
);

router.post(
  '/multiple',
  protect,
  admin,
  (req, res, next) => upload.array('images', 6)(req, res, (err) => multerError(err, req, res, next)),
  (req, res) => {
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No files' });
    res.json({ urls: req.files.map((f) => buildImageUrl(req, f.filename)) });
  }
);

module.exports = router;
