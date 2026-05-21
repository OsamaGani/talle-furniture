const express = require('express');
const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Category = require('../models/Category');

const router = express.Router();

// XML escape — prevents `&`, `<`, etc. in product names from breaking the
// sitemap. Google rejects an invalid sitemap silently.
const xml = (s = '') => String(s).replace(/[<>&'"]/g, (c) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
}[c]));

const STATIC_PATHS = [
  { path: '',                  changefreq: 'daily',   priority: '1.0' },
  { path: '/shop',             changefreq: 'daily',   priority: '0.9' },
  { path: '/chair-repair',     changefreq: 'weekly',  priority: '0.9' },
  // (legacy /action-toys route still resolves for old inbound links but
  // is intentionally NOT in the sitemap — we don't want Google to index
  // a URL literally named "action-toys" for a chair business.)
  { path: '/about',            changefreq: 'monthly', priority: '0.5' },
  { path: '/contact',          changefreq: 'monthly', priority: '0.5' },
  { path: '/help',             changefreq: 'monthly', priority: '0.4' },
  { path: '/shipping-policy',  changefreq: 'yearly',  priority: '0.3' },
  { path: '/privacy-policy',   changefreq: 'yearly',  priority: '0.3' },
  { path: '/terms-of-service', changefreq: 'yearly',  priority: '0.3' },
  { path: '/refund-policy',    changefreq: 'yearly',  priority: '0.3' },
];

router.get('/', asyncHandler(async (req, res) => {
  // SITE_URL is the public frontend origin — must be the same value the
  // frontend uses in its canonical / Open Graph tags or Google will dedupe
  // them against the wrong host.
  const site = (process.env.SITE_URL || process.env.CLIENT_URL?.split(',')[0] || 'https://tallefurnituremart.com').replace(/\/$/, '');

  const [products, categories] = await Promise.all([
    Product.find().select('slug _id updatedAt').lean(),
    Category.find().select('slug name updatedAt').lean(),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  const urls = [];

  // Static pages
  for (const p of STATIC_PATHS) {
    urls.push(`<url><loc>${xml(site + p.path)}</loc><lastmod>${today}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`);
  }

  // Categories (if any DB-backed categories exist)
  for (const c of categories) {
    if (!c.slug) continue;
    const lastmod = (c.updatedAt || new Date()).toISOString().slice(0, 10);
    urls.push(`<url><loc>${xml(`${site}/category/${c.slug}`)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`);
  }

  // Products — most important set; one URL per product, using the SEO slug
  // when present, else the legacy ObjectId. Lastmod helps Google know when
  // to recrawl after price/stock updates.
  for (const product of products) {
    const id = product.slug || product._id;
    const lastmod = (product.updatedAt || new Date()).toISOString().slice(0, 10);
    urls.push(`<url><loc>${xml(`${site}/product/${id}`)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

  res.set('Content-Type', 'application/xml; charset=utf-8');
  // 1 hour CDN cache so we don't hammer the DB on every Googlebot hit.
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(body);
}));

module.exports = router;
