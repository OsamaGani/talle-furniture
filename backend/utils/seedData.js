const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Order = require('../models/Order');

// `featuredOnHome` + `homeOrder` here pre-populate the public "Shop By
// Category" homepage rail with 8 tiles on a fresh seed. Admin can change
// the selection at any time from /admin/categories without code edits.
// Categories mirror futuristicconcepts.in's product-category structure —
// pure office-seating focus. Same nine canonical categories as the
// reference site (Office Chair, Executive, Ergonomic, Premium, Designer,
// Gaming, Study, Tandem, Cafeteria) plus the IndiaMART specialties
// (Training & Classroom, Boardroom, X-Series) and a Table Bases entry.
const categories = [
  // Office Chairs department
  { name: 'Office Chair',                   image: 'https://images.unsplash.com/photo-1505797149-35ebcfa1c2bd?w=600' },
  { name: 'Executive',                      image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600', featuredOnHome: true, homeOrder: 1 },
  { name: 'Ergonomic',                      image: 'https://images.unsplash.com/photo-1505843490701-5be5d1b31f8f?w=600', featuredOnHome: true, homeOrder: 2 },
  { name: 'Boardroom Chairs',               image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600' },
  { name: 'X-Series Chairs',                image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600' },
  // Premium & Designer department
  { name: 'Premium',                        image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600', featuredOnHome: true, homeOrder: 3 },
  { name: 'Designer',                       image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600', featuredOnHome: true, homeOrder: 4 },
  // Gaming Chairs department
  { name: 'Gaming',                         image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600', featuredOnHome: true, homeOrder: 5 },
  // Education & Public Seating department
  { name: 'Study Chair',                    image: 'https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=600' },
  { name: 'Training & Classroom Chairs',    image: 'https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=600', featuredOnHome: true, homeOrder: 6 },
  { name: 'Tandem',                         image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600', featuredOnHome: true, homeOrder: 7 },
  { name: 'Cafeteria',                      image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600', featuredOnHome: true, homeOrder: 8 },
  // Accessories department
  { name: 'Table Bases',                    image: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=600' },
];

// Talle does its own manufacturing — no resold brands.
// "Other" is kept as a fallback so the quick-add flow can still drop
// products without forcing the admin to pick a brand.
const brands = [
  'Talle', 'Other',
].map((name) => ({ name, logo: '' }));

// All products are own-manufactured under the Talle brand. Categories
// here match the new FC-style canonical list (Office Chair / Executive /
// Ergonomic / Premium / Designer / Gaming / Study Chair / Training &
// Classroom / Tandem / Cafeteria / Boardroom / X-Series / Table Bases).
const products = [
  // ─── Office Chairs ─────────────────────────────────────────────────
  {
    name: 'Talle Aero Executive High-Back Office Chair',
    description: 'Premium executive chair with high-back lumbar support, breathable mesh, adjustable armrests and reclining tilt mechanism. Built for 8+ hour workdays.',
    brand: 'Talle', category: 'Executive', material: 'Mesh',
    price: 12999, discount: 25, stock: 40,
    image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800',
    images: ['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800'],
    featured: true, bestSeller: true, rating: 4.8, numReviews: 142,
  },
  {
    name: 'Talle Boss Premium Leather Executive Chair',
    description: 'Top-grain bonded leather executive chair with thick padding, recline lock, padded armrests and chrome aluminium base.',
    brand: 'Talle', category: 'Executive', material: 'Leather',
    price: 18999, discount: 15, stock: 14,
    image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800',
    images: ['https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800'],
    featured: true, rating: 4.7, numReviews: 53,
  },
  {
    name: 'Talle Optima Ergonomic Workstation Chair',
    description: 'Mid-back ergonomic chair with synchro-tilt, adjustable lumbar, 3D armrests and class-4 hydraulic. BIFMA-grade build for daily office use.',
    brand: 'Talle', category: 'Ergonomic', material: 'Mesh',
    price: 16499, discount: 18, stock: 22,
    image: 'https://images.unsplash.com/photo-1505843490701-5be5d1b31f8f?w=800',
    images: ['https://images.unsplash.com/photo-1505843490701-5be5d1b31f8f?w=800'],
    featured: true, rating: 4.7, numReviews: 96,
  },
  {
    name: 'Talle Compact Ergonomic Office Chair',
    description: 'Affordable mesh ergonomic chair with adjustable lumbar, height and tilt-lock. Our entry-level work-from-home pick.',
    brand: 'Talle', category: 'Ergonomic', material: 'Mesh',
    price: 5999, discount: 40, stock: 65,
    image: 'https://images.unsplash.com/photo-1505843490701-5be5d1b31f8f?w=800',
    images: ['https://images.unsplash.com/photo-1505843490701-5be5d1b31f8f?w=800'],
    bestSeller: true, rating: 4.3, numReviews: 318,
  },
  {
    name: 'Talle Athena Mesh Office Chair',
    description: 'Breathable mesh back, contoured seat cushion, 2D adjustable armrests and smooth-glide nylon casters. Backed by our 3-year warranty.',
    brand: 'Talle', category: 'Office Chair', material: 'Mesh',
    price: 8999, discount: 22, stock: 60,
    image: 'https://images.unsplash.com/photo-1505797149-35ebcfa1c2bd?w=800',
    images: ['https://images.unsplash.com/photo-1505797149-35ebcfa1c2bd?w=800'],
    bestSeller: true, newArrival: true, rating: 4.5, numReviews: 187,
  },
  {
    name: 'Talle Spruce Manager Mid-Back Chair',
    description: 'Sturdy manager chair with cushioned seat, fixed armrests, gas-lift height adjustment and durable nylon base.',
    brand: 'Talle', category: 'Office Chair', material: 'Fabric',
    price: 7499, discount: 12, stock: 55,
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800',
    images: ['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800'],
    bestSeller: true, rating: 4.4, numReviews: 78,
  },
  {
    name: 'Talle Boardroom Leather High-Back Chair',
    description: 'Polished bonded-leather boardroom chair with cushioned headrest, padded armrests and chrome 5-star base. Built for owner cabins and conference rooms.',
    brand: 'Talle', category: 'Boardroom Chairs', material: 'Leather',
    price: 19999, discount: 15, stock: 18,
    image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800',
    images: ['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800'],
    featured: true, rating: 4.7, numReviews: 36,
  },
  {
    name: 'Talle X-Series Ergonomic Task Chair',
    description: 'X-Series mesh task chair with synchronised tilt, sliding seat depth and 4D armrests — the most popular fleet chair in our line-up.',
    brand: 'Talle', category: 'X-Series Chairs', material: 'Mesh',
    price: 14999, discount: 20, stock: 28,
    image: 'https://images.unsplash.com/photo-1505797149-35ebcfa1c2bd?w=800',
    images: ['https://images.unsplash.com/photo-1505797149-35ebcfa1c2bd?w=800'],
    bestSeller: true, newArrival: true, rating: 4.6, numReviews: 84,
  },

  // ─── Premium & Designer ────────────────────────────────────────────
  {
    name: 'Talle Ergohuman Pro Premium Chair',
    description: 'Flagship ergonomic chair with synchro-tilt, 4D armrests, adjustable headrest, lumbar support and aluminium base. Built for executives who sit 10+ hours a day.',
    brand: 'Talle', category: 'Premium', material: 'Mesh',
    price: 34999, discount: 18, stock: 12,
    image: 'https://images.unsplash.com/photo-1505843490701-5be5d1b31f8f?w=800',
    images: ['https://images.unsplash.com/photo-1505843490701-5be5d1b31f8f?w=800'],
    featured: true, bestSeller: true, rating: 4.9, numReviews: 87,
  },
  {
    name: 'Talle Ergohuman Elite Mesh Chair',
    description: 'Premium full-mesh chair with adjustable seat depth, neck rest and dynamic lumbar. Director-level seating.',
    brand: 'Talle', category: 'Premium', material: 'Mesh',
    price: 28999, discount: 22, stock: 14,
    image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800',
    images: ['https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800'],
    featured: true, rating: 4.8, numReviews: 54,
  },
  {
    name: 'Talle Designer Lounge Statement Chair',
    description: 'Sculpted designer lounge chair with curved silhouette, velvet upholstery and brass-finish legs. Statement piece for reception and lobby areas.',
    brand: 'Talle', category: 'Designer', material: 'Fabric',
    price: 22999, discount: 18, stock: 9,
    image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800',
    images: ['https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800'],
    featured: true, newArrival: true, rating: 4.7, numReviews: 31,
    colors: ['Mustard', 'Emerald', 'Navy'],
  },

  // ─── Gaming ────────────────────────────────────────────────────────
  {
    name: 'Talle Monster Pro Gaming Chair',
    description: 'Racing-style gaming chair with 4D armrests, lumbar pillow, retractable footrest, 180° recline and PU leather upholstery. Built for marathon sessions.',
    brand: 'Talle', category: 'Gaming', material: 'Faux Leather',
    price: 21999, discount: 30, stock: 18,
    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800',
    images: ['https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800'],
    featured: true, bestSeller: true, rating: 4.6, numReviews: 211,
    colors: ['Black', 'Red', 'Blue'],
  },

  // ─── Education & Public Seating ────────────────────────────────────
  {
    name: 'Talle T2 Study Chair',
    description: 'Compact study chair with padded seat, mesh back and silent castors. Designed for hostels, libraries and student desks.',
    brand: 'Talle', category: 'Study Chair', material: 'Mesh',
    price: 4999, discount: 15, stock: 110,
    image: 'https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=800',
    images: ['https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=800'],
    bestSeller: true, rating: 4.4, numReviews: 96,
  },
  {
    name: 'Talle Training Room Stackable Chair',
    description: 'Lightweight stackable chair with foldable writing tablet, padded seat and chrome legs. Perfect for training rooms, classrooms and seminar halls.',
    brand: 'Talle', category: 'Training & Classroom Chairs', material: 'Fabric',
    price: 3499, discount: 15, stock: 150,
    image: 'https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=800',
    images: ['https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=800'],
    bestSeller: true, rating: 4.5, numReviews: 96,
    colors: ['Black', 'Grey', 'Blue'],
  },
  {
    name: 'Talle Tandem 3-Seater Waiting Bench',
    description: 'Airport / hospital-style 3-seater tandem bench with steel frame and cushioned PU seats. Powder-coated finish, scratch-resistant.',
    brand: 'Talle', category: 'Tandem', material: 'Metal',
    price: 11999, discount: 12, stock: 30,
    image: 'https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=800',
    images: ['https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=800'],
    featured: true, rating: 4.6, numReviews: 38,
  },
  {
    name: 'Talle Tandem 4-Seater Lounge Bench',
    description: '4-seater tandem bench with arm dividers and integrated side table. Built for lobbies, lounges and large waiting areas.',
    brand: 'Talle', category: 'Tandem', material: 'Faux Leather',
    price: 17999, discount: 10, stock: 18,
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800',
    images: ['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800'],
    newArrival: true, rating: 4.5, numReviews: 22,
  },
  {
    name: 'Talle Cafeteria Stackable Chair (Set of 4)',
    description: 'Heavy-duty stackable cafeteria chair with steel frame and easy-clean polypropylene seat. Built for office canteens and food courts.',
    brand: 'Talle', category: 'Cafeteria', material: 'Plastic',
    price: 5499, discount: 18, stock: 120,
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800',
    images: ['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800'],
    bestSeller: true, rating: 4.4, numReviews: 73,
    colors: ['Red', 'Green', 'Blue', 'White'],
  },

  // ─── Accessories ───────────────────────────────────────────────────
  {
    name: 'Talle Cast-Iron Table Base (Round)',
    description: 'Heavy-duty cast-iron round table base — fits 600-900 mm tops. Powder-coated finish, anti-slip floor pads. Standard cafeteria spec.',
    brand: 'Talle', category: 'Table Bases', material: 'Metal',
    price: 3499, discount: 10, stock: 60,
    image: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=800',
    images: ['https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=800'],
    bestSeller: true, rating: 4.5, numReviews: 28,
  },
];

// Chair-shop sub-categories — mirrors frontend/src/config/departments.js.
// Each item is a sub-category Product.category can match. Kept here so the
// backend can upsert them as Category records without importing frontend code.
const CHAIR_SUBCATEGORIES = [
  // Office Chairs department
  'Office Chair', 'Executive', 'Ergonomic', 'Boardroom Chairs', 'X-Series Chairs',
  // Premium & Designer
  'Premium', 'Designer',
  // Gaming
  'Gaming',
  // Education & Public Seating
  'Study Chair', 'Training & Classroom Chairs', 'Tandem', 'Cafeteria',
  // Accessories
  'Table Bases',
];

async function ensureDefaults() {
  // Always make sure "General" category and "Other" brand exist as fallbacks for quick-add
  const generalCat = await Category.findOne({ name: 'General' });
  if (!generalCat) await Category.create({ name: 'General', image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600' });
  const otherBrand = await Brand.findOne({ name: 'Other' });
  if (!otherBrand) await Brand.create({ name: 'Other', logo: '' });

  // Upsert each chair-style sub-category so admin sees the full list in
  // /admin/categories and the dropdowns. Only inserts what's missing.
  // IMPORTANT: insertMany() skips pre('save') hooks, so we set slug explicitly
  // — otherwise every new doc has slug=undefined and the unique index rejects
  // the second insert with E11000 (which crashes backend startup).
  const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Backfill any pre-existing categories that ended up with a missing/empty slug
  // (eg. created via a prior buggy insertMany). Without this, a unique-index
  // collision on the null/empty slug blocks every new insert below.
  const broken = await Category.find({
    $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }],
  }).select('name slug');
  for (const doc of broken) {
    if (!doc.name) continue;
    let candidate = slugify(doc.name);
    if (!candidate) continue;
    // Ensure uniqueness against existing slugs
    let n = 1;
    let unique = candidate;
    while (await Category.findOne({ slug: unique, _id: { $ne: doc._id } })) {
      unique = `${candidate}-${n++}`;
    }
    await Category.updateOne({ _id: doc._id }, { $set: { slug: unique } });
  }
  if (broken.length) console.log(`🔧 Backfilled slugs on ${broken.length} category record(s)`);

  const existing = new Set(
    (await Category.find({ name: { $in: CHAIR_SUBCATEGORIES } }).select('name')).map((c) => c.name)
  );
  const toAdd = CHAIR_SUBCATEGORIES.filter((n) => !existing.has(n));
  if (toAdd.length) {
    try {
      await Category.insertMany(
        toAdd.map((name) => ({ name, slug: slugify(name) })),
        { ordered: false } // keep going if a single doc collides on an existing slug
      );
      console.log(`🌱 Added ${toAdd.length} new sub-categories`);
    } catch (err) {
      // Don't bring the server down for a seed hiccup — log and move on.
      console.warn('⚠️   Sub-category seed had conflicts, continuing:', err.message);
    }
  }

  // One-time backfill: any COD order that's already been marked delivered but
  // somehow stayed isPaid=false should be flipped — without this the revenue
  // dashboard would forever underreport on existing orders.
  const codBackfill = await Order.updateMany(
    { paymentMethod: 'COD', status: 'delivered', isPaid: false },
    [{ $set: { isPaid: true, paidAt: { $ifNull: ['$deliveredAt', '$$NOW'] } } }]
  );
  if (codBackfill.modifiedCount > 0) {
    console.log(`💰 Backfilled isPaid on ${codBackfill.modifiedCount} delivered COD order(s)`);
  }

}

// Idempotent helpers — each one only inserts what's missing. Safe to run on
// every server startup, even on a partially-seeded database.

async function seedDefaultUsersIfMissing() {
  // Admin credentials MUST come from env vars in production. The previous
  // hardcoded 'admin123' password was a real security hole — anyone who
  // saw this repo could log in. Now:
  //   - Production (NODE_ENV=production): admin only seeded if ADMIN_EMAIL
  //     and ADMIN_PASSWORD are both set. If missing, log a loud warning
  //     and skip — never create a default admin with a guessable password.
  //   - Dev (no NODE_ENV / 'development'): fall back to admin/admin123 so
  //     a fresh local install still has a working admin to log in with.
  const isProd = process.env.NODE_ENV === 'production';
  const adminEmail = process.env.ADMIN_EMAIL || (isProd ? null : 'admin@tallefurnituremart.com');
  const adminPassword = process.env.ADMIN_PASSWORD || (isProd ? null : 'admin123');

  if (adminEmail && adminPassword) {
    if (!(await User.findOne({ email: adminEmail }))) {
      await User.create({ name: 'Admin', email: adminEmail, password: adminPassword, isAdmin: true, emailVerified: true });
      const masked = adminPassword.replace(/./g, '•');
      console.log(`🌱 Created admin user (${adminEmail} / ${masked})`);
    }
  } else if (isProd) {
    console.warn('⚠️  ADMIN_EMAIL or ADMIN_PASSWORD env var missing — skipping admin seed. Set both on Render to bootstrap an admin account.');
  }

  // Demo customer is dev-only. Never seeded in production.
  if (!isProd) {
    const customerEmail = 'customer@tallefurnituremart.com';
    if (!(await User.findOne({ email: customerEmail }))) {
      await User.create({ name: 'Demo Customer', email: customerEmail, password: 'customer123', emailVerified: true });
      console.log('🌱 Created demo customer (customer@tallefurnituremart.com / customer123)');
    }
  }
}

async function seedCategoriesIfMissing() {
  const existingNames = new Set((await Category.find().select('name')).map((c) => c.name));
  let added = 0;
  for (const c of categories) {
    if (!existingNames.has(c.name)) {
      try { await Category.create(c); added++; } catch (err) {
        console.warn(`⚠️   Could not insert category "${c.name}": ${err.message}`);
      }
    }
  }
  if (added) console.log(`🌱 Added ${added} legacy categories`);
}

async function seedBrandsIfMissing() {
  const existingNames = new Set((await Brand.find().select('name')).map((b) => b.name));
  let added = 0;
  for (const b of brands) {
    if (!existingNames.has(b.name)) {
      try { await Brand.create(b); added++; } catch (err) {
        console.warn(`⚠️   Could not insert brand "${b.name}": ${err.message}`);
      }
    }
  }
  if (added) console.log(`🌱 Added ${added} brands`);
}

async function seedProductsIfMissing() {
  const productCount = await Product.countDocuments();
  if (productCount > 0) return;
  console.log(`🌱 No products found — seeding ${products.length} demo products...`);
  let added = 0;
  for (const p of products) {
    try { await Product.create(p); added++; } catch (err) {
      console.warn(`⚠️   Could not insert product "${p.name}": ${err.message}`);
    }
  }
  console.log(`🌱 Added ${added}/${products.length} demo products`);
}

async function seedIfEmpty() {
  await ensureDefaults();
  await seedDefaultUsersIfMissing();
  await seedCategoriesIfMissing();
  await seedBrandsIfMissing();
  await seedProductsIfMissing();
  console.log('✅ Seed checks complete');
  return true;
}

module.exports = { seedIfEmpty };
