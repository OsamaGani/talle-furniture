const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const WholesaleCategory = require('../models/WholesaleCategory');

const categories = [
  { name: 'General', image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600' },
  { name: 'Construction', image: 'https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=600' },
  { name: 'Games', image: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=600' },
  { name: 'Pretend Play', image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600' },
  { name: 'Learning & Education', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600' },
  { name: 'Vehicles', image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600' },
  { name: 'Active Play', image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600' },
  { name: 'Wooden Toys', image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600' },
  { name: 'Dolls', image: 'https://images.unsplash.com/photo-1606503153255-59d8b8b6a9ec?w=600' },
  { name: 'Action Figures', image: 'https://images.unsplash.com/photo-1608889335941-32ac5f2041b9?w=600' },
  { name: 'Ride Ons', image: 'https://images.unsplash.com/photo-1597007051304-15387f9e0a18?w=600' },
  { name: 'Outdoor Toys', image: 'https://images.unsplash.com/photo-1560859251-d563a49c5e4a?w=600' },
  { name: 'Novelty Toys', image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600' },
  { name: 'Books', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600' },
  { name: 'Baby & Toddler', image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600' },
];

const brands = [
  'Other', 'LEGO', 'Hot Wheels', 'Barbie', 'Nerf', 'Magna-Tiles', 'Funskool',
  'Kinderkraft', 'Skillmatics', 'Crayola', 'Marvel', 'Transformers',
  'Bburago', 'Majorette', 'Maisto', 'Jada', 'Mattel', 'Hasbro',
  'Fisher-Price', 'Disney', 'Funko',
].map((name) => ({ name, logo: '' }));

const products = [
  {
    name: 'LEGO Classic Creative Bricks Box 11717',
    description: 'A treasure trove of creative possibilities with 1500 colorful LEGO bricks for unlimited building.',
    brand: 'LEGO', category: 'Construction', ageGroup: '4-6 Years',
    price: 89.99, discount: 15, wholesalePrice: 65.00, wholesaleMinQty: 10, stock: 25,
    image: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=800',
    images: ['https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=800'],
    featured: true, bestSeller: true, rating: 4.8, numReviews: 124,
  },
  {
    name: 'Hot Wheels 20-Car Gift Pack',
    description: 'A great selection of 20 die-cast vehicles in 1:64 scale. Perfect for collectors and racers.',
    brand: 'Hot Wheels', category: 'Vehicles', ageGroup: '4-6 Years',
    price: 24.99, discount: 20, stock: 50,
    image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=800',
    images: ['https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=800'],
    featured: true, bestSeller: true, rating: 4.7, numReviews: 89,
  },
  {
    name: 'Barbie Dreamhouse Adventures Doll',
    description: 'Barbie doll with fashion accessories, ready for endless adventures and storytelling.',
    brand: 'Barbie', category: 'Dolls', ageGroup: '4-6 Years',
    price: 49.99, discount: 10, stock: 30,
    image: 'https://images.unsplash.com/photo-1606503153255-59d8b8b6a9ec?w=800',
    images: ['https://images.unsplash.com/photo-1606503153255-59d8b8b6a9ec?w=800'],
    featured: true, newArrival: true, rating: 4.6, numReviews: 67,
  },
  {
    name: 'Nerf Elite 2.0 Commander Blaster',
    description: 'Nerf blaster with 6-dart rotating drum, includes 12 Nerf Elite darts.',
    brand: 'Nerf', category: 'Action Figures', ageGroup: '8 Years+',
    price: 34.99, discount: 25, stock: 40,
    image: 'https://images.unsplash.com/photo-1608889335941-32ac5f2041b9?w=800',
    images: ['https://images.unsplash.com/photo-1608889335941-32ac5f2041b9?w=800'],
    bestSeller: true, rating: 4.5, numReviews: 102,
  },
  {
    name: 'Magna-Tiles Clear Colors 100 Piece Set',
    description: 'Magnetic 3D building tiles in vibrant colors. STEM learning through play.',
    brand: 'Magna-Tiles', category: 'Construction', ageGroup: '2-4 Years',
    price: 119.99, discount: 0, stock: 20,
    image: 'https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=800',
    images: ['https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=800'],
    featured: true, newArrival: true, rating: 4.9, numReviews: 215,
  },
  {
    name: 'Crayola Inspiration Art Case 140 Pieces',
    description: 'Complete art set with crayons, markers, colored pencils and paper.',
    brand: 'Crayola', category: 'Learning & Education', ageGroup: '4-6 Years',
    price: 39.99, discount: 30, stock: 60,
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
    images: ['https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800'],
    bestSeller: true, rating: 4.7, numReviews: 156,
  },
  {
    name: 'Wooden Educational Shape Sorter',
    description: 'Classic wooden shape sorting toy that develops fine motor skills and shape recognition.',
    brand: 'Funskool', category: 'Wooden Toys', ageGroup: '0-2 Years',
    price: 19.99, discount: 0, stock: 80,
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800',
    images: ['https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800'],
    rating: 4.4, numReviews: 45,
  },
  {
    name: 'Kinderkraft Moov 3-in-1 Stroller',
    description: 'Modern, stylish baby stroller convertible to pram and car seat.',
    brand: 'Kinderkraft', category: 'Baby & Toddler', ageGroup: '0-2 Years',
    price: 399.99, discount: 15, stock: 12,
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800',
    images: ['https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800'],
    featured: true, rating: 4.8, numReviews: 38,
  },
  {
    name: 'Marvel Spider-Man Action Figure 12-Inch',
    description: 'Highly detailed Spider-Man figure with multiple points of articulation.',
    brand: 'Marvel', category: 'Action Figures', ageGroup: '4-6 Years',
    price: 29.99, discount: 0, stock: 45,
    image: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=800',
    images: ['https://images.unsplash.com/photo-1635805737707-575885ab0820?w=800'],
    newArrival: true, rating: 4.6, numReviews: 73,
  },
  {
    name: 'Space Explorer Pack of 2 Pneumatic Gun Toy',
    description: 'Air-powered pneumatic gun toy pack with safe foam darts. BIS approved, indoor/outdoor play for kids 5+. Develops hand-eye coordination.',
    brand: 'Other', category: 'Action Figures', ageGroup: '4-6 Years',
    price: 17.49, discount: 20, stock: 35,
    image: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800',
    images: ['https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800'],
    bestSeller: true, rating: 4.5, numReviews: 88,
  },
  {
    name: 'Street Viper Big Blaster Motorized Dart Gun (Blue)',
    description: 'Motorized dart gun with rotating drum, soft foam darts, 60-foot firing range, rechargeable battery. Color: Blue.',
    brand: 'Nerf', category: 'Action Figures', ageGroup: '8 Years+',
    price: 39.99, discount: 55, stock: 22,
    image: 'https://images.unsplash.com/photo-1595079676714-7ba11deef9bf?w=800',
    images: ['https://images.unsplash.com/photo-1595079676714-7ba11deef9bf?w=800'],
    featured: true, bestSeller: true, rating: 4.7, numReviews: 142,
  },
  {
    name: 'High Performance Six Fire Toy Blaster',
    description: 'Six-shot rotating-barrel toy blaster with soft darts. Realistic styling, kid-safe build. Indoor/outdoor target play.',
    brand: 'Nerf', category: 'Action Figures', ageGroup: '6-8 Years',
    price: 12.99, discount: 8, stock: 60,
    image: 'https://images.unsplash.com/photo-1604079628040-94301bb21b91?w=800',
    images: ['https://images.unsplash.com/photo-1604079628040-94301bb21b91?w=800'],
    rating: 4.3, numReviews: 51,
  },
  {
    name: 'Premium Metal Die-Cast Sports Racer Car (Red)',
    description: 'Heavy metal die-cast 1:32 sports car with realistic engine sound, LED lights, opening doors. Color: Red.',
    brand: 'Hot Wheels', category: 'Action Figures', ageGroup: '4-6 Years',
    price: 9.99, discount: 50, stock: 70,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
    images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800'],
    bestSeller: true, rating: 4.6, numReviews: 96,
  },
  {
    name: 'Gear Robot Car for Kids (Blue)',
    description: 'Transforming gear robot car with realistic mechanical detailing. Switches between car and robot mode. Color: Blue.',
    brand: 'Transformers', category: 'Action Figures', ageGroup: '6-8 Years',
    price: 19.99, discount: 0, stock: 28,
    image: 'https://images.unsplash.com/photo-1535378620166-273708d44e4c?w=800',
    images: ['https://images.unsplash.com/photo-1535378620166-273708d44e4c?w=800'],
    newArrival: true, rating: 4.4, numReviews: 37,
  },
  {
    name: 'Mini Football Tabletop Portable Soccer Flicker',
    description: 'Compact desktop soccer flicker game for two players. Portable, perfect for travel and quick action breaks.',
    brand: 'Funskool', category: 'Action Figures', ageGroup: '8 Years+',
    price: 19.99, discount: 50, stock: 32,
    image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800',
    images: ['https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800'],
    rating: 4.5, numReviews: 64,
  },
  {
    name: 'Cat Bubble Machine Toy with Glowing Lights',
    description: 'Cat-shaped bubble blaster with LED glowing lights. Continuous bubble action — perfect for outdoor parties.',
    brand: 'Other', category: 'Action Figures', ageGroup: '2-4 Years',
    price: 8.49, discount: 0, stock: 80,
    image: 'https://images.unsplash.com/photo-1560743173-567a3b5658b1?w=800',
    images: ['https://images.unsplash.com/photo-1560743173-567a3b5658b1?w=800'],
    newArrival: true, rating: 4.2, numReviews: 28,
  },
  {
    name: 'Skillmatics Guess in 10 Card Game',
    description: 'Trivia card game that develops critical thinking. Perfect for family game night.',
    brand: 'Skillmatics', category: 'Games', ageGroup: '6-8 Years',
    price: 14.99, discount: 0, stock: 100,
    image: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800',
    images: ['https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800'],
    bestSeller: true, rating: 4.7, numReviews: 198,
  },
  {
    name: 'Bburago Ferrari 1:18 Die-Cast Model',
    description: 'Authentic Ferrari scale model with opening doors, hood and detailed interior.',
    brand: 'Bburago', category: 'Vehicles', ageGroup: '8 Years+',
    price: 49.99, discount: 10, stock: 18,
    image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800',
    images: ['https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800'],
    rating: 4.5, numReviews: 32,
  },
  {
    name: 'Pretend Play Kitchen Set Deluxe',
    description: 'Realistic play kitchen with sounds, lights, and 30+ accessories.',
    brand: 'Funskool', category: 'Pretend Play', ageGroup: '2-4 Years',
    price: 149.99, discount: 20, stock: 15,
    image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800',
    images: ['https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800'],
    featured: true, rating: 4.6, numReviews: 54,
  },
  {
    name: 'Outdoor Trampoline 8FT with Safety Net',
    description: 'Premium outdoor trampoline with full safety enclosure for hours of fun.',
    brand: 'Funskool', category: 'Outdoor Toys', ageGroup: '6-8 Years',
    price: 299.99, discount: 25, stock: 8,
    image: 'https://images.unsplash.com/photo-1560859251-d563a49c5e4a?w=800',
    images: ['https://images.unsplash.com/photo-1560859251-d563a49c5e4a?w=800'],
    rating: 4.4, numReviews: 27,
  },
  {
    name: 'Electric Ride-On Car Mercedes',
    description: '12V battery powered ride-on car with remote control, lights and music.',
    brand: 'Kinderkraft', category: 'Ride Ons', ageGroup: '2-4 Years',
    price: 249.99, discount: 15, stock: 10,
    image: 'https://images.unsplash.com/photo-1597007051304-15387f9e0a18?w=800',
    images: ['https://images.unsplash.com/photo-1597007051304-15387f9e0a18?w=800'],
    featured: true, newArrival: true, rating: 4.7, numReviews: 41,
  },
  {
    name: 'My First Encyclopedia Animal Atlas',
    description: 'Beautifully illustrated children\'s encyclopedia covering animals around the world.',
    brand: 'Funskool', category: 'Books', ageGroup: '6-8 Years',
    price: 19.99, discount: 0, stock: 70,
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800',
    images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800'],
    rating: 4.8, numReviews: 89,
  },
  {
    name: 'Transformers Optimus Prime Figure',
    description: 'Convertible Optimus Prime figure that transforms from robot to truck.',
    brand: 'Transformers', category: 'Action Figures', ageGroup: '6-8 Years',
    price: 39.99, discount: 0, stock: 35,
    image: 'https://images.unsplash.com/photo-1608889335941-32ac5f2041b9?w=800',
    images: ['https://images.unsplash.com/photo-1608889335941-32ac5f2041b9?w=800'],
    newArrival: true, rating: 4.6, numReviews: 64,
  },
];

// Toyzone-style hierarchy. Mirrors frontend/src/config/departments.js.
// Each item is a sub-category Product.category can match. Kept here so the
// backend can upsert them as Category records without importing frontend code.
const TOYZONE_SUBCATEGORIES = [
  // Ride-On & Cycles
  'Kick Scooters', 'Magic Car', 'Ride On', 'Tricycle', 'Wave Roller',
  // Pretend & Play
  'Doll House', 'Kitchen Sets', 'Tent House', 'Swords',
  // Push & Pull Toy
  'Friction Toys', 'Pull Along', 'Pull String',
  // Action Games
  'Toy Guns', 'Frog Games', 'Bump N Go',
  // Baby Gear & Utility
  'Infants', 'Bath Tub', 'Baby Walker', 'Potty Seats', 'Musical Toys', 'Kids Furniture',
  // Sports & Outdoor
  'Pop Catch', 'Cricket Set', 'Bowling Set', 'Basket Ball', 'Sports Toys',
  // Toys & Games
  'Bubble Toys', 'Walkie Talkie', 'Chairs', 'Educational Toys', 'Drum',
  // Wooden Toys
  'Board Games', 'Carroms', 'Tables',
  // Rechargeable
  'Rechargeable',
  // Construction & Building
  'Building Blocks', 'Cubes',
];

async function ensureDefaults() {
  // Always make sure "General" category and "Other" brand exist as fallbacks for quick-add
  const generalCat = await Category.findOne({ name: 'General' });
  if (!generalCat) await Category.create({ name: 'General', image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600' });
  const otherBrand = await Brand.findOne({ name: 'Other' });
  if (!otherBrand) await Brand.create({ name: 'Other', logo: '' });

  // Upsert each toyzone-style sub-category so admin sees the full list in
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
    (await Category.find({ name: { $in: TOYZONE_SUBCATEGORIES } }).select('name')).map((c) => c.name)
  );
  const toAdd = TOYZONE_SUBCATEGORIES.filter((n) => !existing.has(n));
  if (toAdd.length) {
    try {
      await Category.insertMany(
        toAdd.map((name) => ({ name, slug: slugify(name) })),
        { ordered: false } // keep going if a single doc collides on an existing slug
      );
      console.log(`🌱 Added ${toAdd.length} new sub-categories`);
    } catch (err) {
      // Don't bring the server down for a seed hiccup — log and move on.
      console.warn('⚠️  Sub-category seed had conflicts, continuing:', err.message);
    }
  }

  // Seed default Hot Wholesale Categories tiles if none exist yet
  const wcCount = await WholesaleCategory.countDocuments();
  if (wcCount === 0) {
    await WholesaleCategory.insertMany([
      { name: 'LEGO Sets',  image: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=400', link: '/shop?brand=LEGO',         order: 1 },
      { name: 'Hot Wheels', image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=400', link: '/shop?brand=Hot%20Wheels', order: 2 },
      { name: 'Soft Toys',  image: 'https://images.unsplash.com/photo-1606503153255-59d8b8b6a9ec?w=400', link: '/shop?category=Dolls',     order: 3 },
      { name: 'Educational',image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400', link: '/shop?category=Learning%20%26%20Education', order: 4 },
    ]);
    console.log('🌱 Seeded 4 wholesale category tiles');
  }
}

async function seedIfEmpty() {
  await ensureDefaults();
  const userCount = await User.countDocuments();
  if (userCount > 0) return false;

  console.log('🌱 Seeding initial data...');
  await User.create({ name: 'Admin', email: 'admin@toymall.com', password: 'admin123', isAdmin: true, emailVerified: true });
  await User.create({ name: 'Demo Customer', email: 'customer@toymall.com', password: 'customer123', emailVerified: true });

  for (const c of categories) await Category.create(c);
  for (const b of brands) await Brand.create(b);
  for (const p of products) await Product.create(p);

  console.log('✅ Seed complete:');
  console.log('   Admin    -> admin@toymall.com / admin123');
  console.log('   Customer -> customer@toymall.com / customer123');
  return true;
}

module.exports = { seedIfEmpty };
