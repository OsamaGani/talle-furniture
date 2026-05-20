const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Order = require('../models/Order');

// `featuredOnHome` + `homeOrder` here pre-populate the public "Shop By
// Category" homepage rail with 8 tiles on a fresh seed. Admin can change
// the selection at any time from /admin/categories without code edits.
const categories = [
  { name: 'General', image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600' },
  { name: 'Executive Chairs', image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600', featuredOnHome: true, homeOrder: 1 },
  { name: 'Ergonomic Chairs', image: 'https://images.unsplash.com/photo-1505843490701-5be5d1b31f8f?w=600' },
  { name: 'Workstation Chairs', image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600' },
  { name: 'Visitor Chairs', image: 'https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=600' },
  { name: 'Mesh Chairs', image: 'https://images.unsplash.com/photo-1505797149-35ebcfa1c2bd?w=600' },
  { name: 'Pro Gaming Chairs', image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600', featuredOnHome: true, homeOrder: 5 },
  { name: 'Recliners', image: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=600', featuredOnHome: true, homeOrder: 4 },
  { name: 'Lounge Chairs', image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600' },
  { name: 'Accent Chairs', image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600' },
  { name: 'Dining Chairs', image: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=600' },
  { name: 'Bar Stools', image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600' },
  { name: 'Cafe Chairs', image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600' },
  { name: 'Folding Chairs', image: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=600' },
  { name: 'Garden Chairs', image: 'https://images.unsplash.com/photo-1595514535215-9a5e0e8e7d9c?w=600' },
  { name: 'Banquet Chairs', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600' },
  { name: 'Salon Chairs', image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600' },
  { name: 'Bean Bags', image: 'https://images.unsplash.com/photo-1567016526105-22da7c13161a?w=600' },
  // New from the futuristicconcepts.in feature comparison
  // Using a different photo (gaming-chair shot) for Premium / Ergohuman
  // because the original mesh-chair image rendered nearly-white on the
  // round-tile background and looked broken to admins.
  { name: 'Premium / Ergohuman',   image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600', featuredOnHome: true, homeOrder: 2 },
  { name: 'Cushion Series',        image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600' },
  { name: 'Training Room Chairs',  image: 'https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=600', featuredOnHome: true, homeOrder: 3 },
  { name: 'Tandem Seating',        image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600' },
  { name: 'Cafeteria Chairs',      image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600' },
  // Sofas & Couches
  { name: '3-Seater Sofa',         image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600' },
  { name: 'L-Shaped Couch',        image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600', featuredOnHome: true, homeOrder: 6 },
  { name: 'Curved Couch',          image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600' },
  // Tables & Desks
  { name: 'Wooden Dining Tables',  image: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=600', featuredOnHome: true, homeOrder: 7 },
  { name: 'Coffee Tables',         image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=600' },
  { name: 'Side Tables',           image: 'https://images.unsplash.com/photo-1567016526105-22da7c13161a?w=600' },
  { name: 'Office Desks',          image: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=600', featuredOnHome: true, homeOrder: 8 },
];

// Talle does its own manufacturing â€” no resold brands.
// "Other" is kept as a fallback so the quick-add flow can still drop
// products without forcing the admin to pick a brand.
const brands = [
  'Talle', 'Other',
].map((name) => ({ name, logo: '' }));

// All products are own-manufactured under the Talle brand.
// Naming convention: "Talle <Model> <Type>" so the brand reads as
// in-house rather than the catch-all listing of resold competitor brands
// the original seed used to carry.
const products = [
  {
    name: 'Talle Aero Executive High-Back Office Chair',
    description: 'Premium executive chair with high-back lumbar support, breathable mesh, adjustable armrests and reclining tilt mechanism. Built for 8+ hour workdays.',
    brand: 'Talle', category: 'Executive Chairs', material: 'Mesh',
    price: 12999, discount: 25, stock: 40,
    image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800',
    images: ['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800'],
    featured: true, bestSeller: true, rating: 4.8, numReviews: 142,
  },
  {
    name: 'Talle Optima Ergonomic Workstation Chair',
    description: 'Mid-back ergonomic chair with synchro-tilt, adjustable lumbar, 3D armrests and class-4 hydraulic. BIFMA-grade build for daily office use.',
    brand: 'Talle', category: 'Ergonomic Chairs', material: 'Mesh',
    price: 16499, discount: 18, stock: 22,
    image: 'https://images.unsplash.com/photo-1505843490701-5be5d1b31f8f?w=800',
    images: ['https://images.unsplash.com/photo-1505843490701-5be5d1b31f8f?w=800'],
    featured: true, rating: 4.7, numReviews: 96,
  },
  {
    name: 'Talle Monster Pro Gaming Chair',
    description: 'Racing-style gaming chair with 4D armrests, lumbar pillow, retractable footrest, 180° recline and PU leather upholstery. Built for marathon sessions.',
    brand: 'Talle', category: 'Pro Gaming Chairs', material: 'Faux Leather',
    price: 21999, discount: 30, stock: 18,
    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800',
    images: ['https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800'],
    featured: true, bestSeller: true, rating: 4.6, numReviews: 211,
    colors: ['Black', 'Red', 'Blue'],
  },
  {
    name: 'Talle Spruce Manager Mid-Back Chair',
    description: 'Sturdy manager chair with cushioned seat, fixed armrests, gas-lift height adjustment and durable nylon base.',
    brand: 'Talle', category: 'Workstation Chairs', material: 'Fabric',
    price: 7499, discount: 12, stock: 55,
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800',
    images: ['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800'],
    bestSeller: true, rating: 4.4, numReviews: 78,
  },
  {
    name: 'Talle Visitor Chair (Set of 2) — Steel Frame',
    description: 'Sturdy visitor / guest chair with cushioned seat & back, durable steel frame and stackable design. Pack of 2.',
    brand: 'Talle', category: 'Visitor Chairs', material: 'Fabric',
    price: 4999, discount: 20, stock: 80,
    image: 'https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=800',
    images: ['https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=800'],
    featured: true, rating: 4.5, numReviews: 64,
  },
  {
    name: 'Talle Athena Mesh Office Chair',
    description: 'Breathable mesh back, contoured seat cushion, 2D adjustable armrests and smooth-glide nylon casters. Backed by our 3-year warranty.',
    brand: 'Talle', category: 'Mesh Chairs', material: 'Mesh',
    price: 8999, discount: 22, stock: 60,
    image: 'https://images.unsplash.com/photo-1505797149-35ebcfa1c2bd?w=800',
    images: ['https://images.unsplash.com/photo-1505797149-35ebcfa1c2bd?w=800'],
    bestSeller: true, newArrival: true, rating: 4.5, numReviews: 187,
  },
  {
    name: 'Talle Boss Premium Leather Executive Chair',
    description: 'Top-grain bonded leather executive chair with thick padding, recline lock, padded armrests and chrome aluminium base.',
    brand: 'Talle', category: 'Executive Chairs', material: 'Leather',
    price: 18999, discount: 15, stock: 14,
    image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800',
    images: ['https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800'],
    featured: true, rating: 4.7, numReviews: 53,
  },
  {
    name: 'Talle Theater 1-Seater Recliner',
    description: 'Single-seater manual recliner with extra-deep cushion, footrest, and 160° recline. Premium fabric upholstery, lifetime mechanism warranty.',
    brand: 'Talle', category: 'Recliners', material: 'Fabric',
    price: 28999, discount: 20, stock: 8,
    image: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800',
    images: ['https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800'],
    featured: true, newArrival: true, rating: 4.8, numReviews: 34,
  },
  {
    name: 'Talle Mid-Century Modern Accent Chair',
    description: 'Wooden-legged accent chair with velvet upholstery, button-tufted back. Perfect statement piece for living rooms.',
    brand: 'Talle', category: 'Accent Chairs', material: 'Wood',
    price: 14999, discount: 25, stock: 12,
    image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800',
    images: ['https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800'],
    newArrival: true, rating: 4.6, numReviews: 28,
    colors: ['Mustard', 'Emerald', 'Navy'],
  },
  {
    name: 'Talle Plastic Dining Chair (Set of 2)',
    description: 'Solid plastic dining chair, ergonomic curved back and broad seat. Stackable, weather-resistant, easy to clean.',
    brand: 'Talle', category: 'Dining Chairs', material: 'Plastic',
    price: 2999, discount: 10, stock: 120,
    image: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=800',
    images: ['https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=800'],
    bestSeller: true, rating: 4.3, numReviews: 156,
  },
  {
    name: 'Talle Industrial Bar Stool (Pack of 2)',
    description: 'Industrial-style bar stool with metal frame, wooden seat, footrest and height-adjustable swivel. Perfect for kitchen islands & home bars.',
    brand: 'Talle', category: 'Bar Stools', material: 'Metal',
    price: 6499, discount: 30, stock: 30,
    image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800',
    images: ['https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800'],
    rating: 4.4, numReviews: 41,
  },
  {
    name: 'Talle Solid Sheesham Wood Cafe Chair',
    description: 'Handcrafted solid sheesham wood cafe chair with natural finish. Sturdy, timeless and built to last decades.',
    brand: 'Talle', category: 'Cafe Chairs', material: 'Wood',
    price: 5499, discount: 0, stock: 24,
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800',
    images: ['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800'],
    rating: 4.7, numReviews: 38,
  },
  {
    name: 'Talle Steel Folding Chair (Set of 4)',
    description: 'Heavy-duty steel folding chair set with cushioned seat. Holds up to 113 kg. Folds flat for storage, ideal for events & extra guests.',
    brand: 'Talle', category: 'Folding Chairs', material: 'Metal',
    price: 4499, discount: 35, stock: 75,
    image: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=800',
    images: ['https://images.unsplash.com/photo-1503602642458-232111445657?w=800'],
    bestSeller: true, rating: 4.5, numReviews: 209,
  },
  {
    name: 'Talle Tiffany Banquet Chair — Wedding Edition',
    description: 'Elegant gold-finished tiffany chair with cushioned seat. Stackable up to 10. Designed for weddings, banquets and event halls.',
    brand: 'Talle', category: 'Banquet Chairs', material: 'Metal',
    price: 2499, discount: 12, stock: 200,
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
    images: ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800'],
    featured: true, rating: 4.6, numReviews: 87,
    colors: ['Gold', 'Silver', 'White'],
  },
  {
    name: 'Talle Compact Ergonomic Office Chair',
    description: 'Affordable mesh ergonomic chair with adjustable lumbar, height and tilt-lock. Our entry-level work-from-home pick.',
    brand: 'Talle', category: 'Ergonomic Chairs', material: 'Mesh',
    price: 5999, discount: 40, stock: 65,
    image: 'https://images.unsplash.com/photo-1505843490701-5be5d1b31f8f?w=800',
    images: ['https://images.unsplash.com/photo-1505843490701-5be5d1b31f8f?w=800'],
    bestSeller: true, rating: 4.3, numReviews: 318,
  },
  {
    name: 'Talle XL Bean Bag with Beans',
    description: 'XXL bean bag, pre-filled with high-density beans. Waterproof and tear-resistant outer cover. Perfect for kids rooms & casual lounging.',
    brand: 'Talle', category: 'Bean Bags', material: 'Fabric',
    price: 2499, discount: 50, stock: 90,
    image: 'https://images.unsplash.com/photo-1567016526105-22da7c13161a?w=800',
    images: ['https://images.unsplash.com/photo-1567016526105-22da7c13161a?w=800'],
    bestSeller: true, newArrival: true, rating: 4.4, numReviews: 245,
    colors: ['Black', 'Brown', 'Red', 'Blue'],
  },
  {
    name: 'Talle Salon Hydraulic Styling Chair',
    description: 'Heavy-duty salon chair with hydraulic lift, 360° swivel, footrest and PU leather upholstery. Suitable for unisex salons & spas.',
    brand: 'Talle', category: 'Salon Chairs', material: 'Faux Leather',
    price: 18999, discount: 22, stock: 6,
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800',
    images: ['https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800'],
    featured: true, rating: 4.5, numReviews: 32,
  },
  {
    name: 'Talle Outdoor Patio Lounge Chair',
    description: 'All-weather rattan-style outdoor lounge chair with cushioned seat. UV-resistant and rust-proof aluminium frame.',
    brand: 'Talle', category: 'Garden Chairs', material: 'Plastic',
    price: 8999, discount: 18, stock: 16,
    image: 'https://images.unsplash.com/photo-1595514535215-9a5e0e8e7d9c?w=800',
    images: ['https://images.unsplash.com/photo-1595514535215-9a5e0e8e7d9c?w=800'],
    newArrival: true, rating: 4.5, numReviews: 19,
  },
  {
    name: 'Talle Lounge Reading Chair with Ottoman',
    description: 'Mid-century scoop-back lounge chair with matching ottoman. Soft fabric upholstery and solid wood legs. Ideal reading nook companion.',
    brand: 'Talle', category: 'Lounge Chairs', material: 'Fabric',
    price: 19999, discount: 15, stock: 11,
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800',
    images: ['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800'],
    featured: true, rating: 4.7, numReviews: 26,
  },
  {
    name: 'Talle Reupholstery Service — Office Chair',
    description: 'Professional reupholstery service for office & executive chairs. Choose from premium mesh, fabric or leather. Doorstep pickup in Mumbai. 7-day turnaround.',
    brand: 'Talle', category: 'General', material: 'Cushion',
    price: 1999, discount: 0, stock: 999,
    image: 'https://images.unsplash.com/photo-1505843490701-5be5d1b31f8f?w=800',
    images: ['https://images.unsplash.com/photo-1505843490701-5be5d1b31f8f?w=800'],
    featured: true, bestSeller: true, rating: 4.9, numReviews: 412,
  },
  {
    name: 'Talle Hydraulic Cylinder Replacement (Class-4)',
    description: 'Heavy-duty BIFMA-grade class-4 hydraulic gas-lift cylinder. Universal fit for office & gaming chairs. Includes professional installation in Mumbai.',
    brand: 'Talle', category: 'General', material: 'Metal',
    price: 1299, discount: 10, stock: 300,
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800',
    images: ['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800'],
    bestSeller: true, rating: 4.7, numReviews: 168,
  },
  {
    name: 'Talle Premium Caster Wheels (Set of 5)',
    description: 'Smooth-glide polyurethane caster wheels — won\'t scratch hardwood floors. Universal stem fits 95% of office chairs.',
    brand: 'Talle', category: 'General', material: 'Plastic',
    price: 799, discount: 25, stock: 500,
    image: 'https://images.unsplash.com/photo-1505797149-35ebcfa1c2bd?w=800',
    images: ['https://images.unsplash.com/photo-1505797149-35ebcfa1c2bd?w=800'],
    bestSeller: true, newArrival: true, rating: 4.6, numReviews: 233,
  },
  // ─── Premium / Ergohuman flagship line ─────────────────────────────
  {
    name: 'Talle Ergohuman Pro Premium Chair',
    description: 'Flagship ergonomic chair with synchro-tilt, 4D armrests, adjustable headrest, lumbar support and aluminium base. Built for executives who sit 10+ hours a day.',
    brand: 'Talle', category: 'Premium / Ergohuman', material: 'Mesh',
    price: 34999, discount: 18, stock: 12,
    image: 'https://images.unsplash.com/photo-1505843490701-5be5d1b31f8f?w=800',
    images: ['https://images.unsplash.com/photo-1505843490701-5be5d1b31f8f?w=800'],
    featured: true, bestSeller: true, rating: 4.9, numReviews: 87,
  },
  {
    name: 'Talle Ergohuman Elite Mesh Chair',
    description: 'Premium full-mesh chair with adjustable seat depth, neck rest and dynamic lumbar. Director-level seating.',
    brand: 'Talle', category: 'Premium / Ergohuman', material: 'Mesh',
    price: 28999, discount: 22, stock: 14,
    image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800',
    images: ['https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800'],
    featured: true, rating: 4.8, numReviews: 54,
  },
  // ─── Cushion Series ────────────────────────────────────────────────
  {
    name: 'Talle Cushion Series High-Back Executive',
    description: 'Extra-deep cushioned executive chair with bonded leather upholstery, padded armrests and metal base. Plush comfort for boardrooms.',
    brand: 'Talle', category: 'Cushion Series', material: 'Leather',
    price: 22999, discount: 20, stock: 10,
    image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800',
    images: ['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800'],
    featured: true, rating: 4.7, numReviews: 41,
  },
  // ─── Training Room Chairs ──────────────────────────────────────────
  {
    name: 'Talle Training Room Stackable Chair',
    description: 'Lightweight stackable chair with foldable writing tablet, padded seat and chrome legs. Perfect for training rooms, classrooms and seminar halls.',
    brand: 'Talle', category: 'Training Room Chairs', material: 'Fabric',
    price: 3499, discount: 15, stock: 150,
    image: 'https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=800',
    images: ['https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=800'],
    bestSeller: true, rating: 4.5, numReviews: 96,
    colors: ['Black', 'Grey', 'Blue'],
  },
  // ─── Tandem Seating (airport-style multi-seat benches) ─────────────
  {
    name: 'Talle Tandem 3-Seater Waiting Bench',
    description: 'Airport / hospital-style 3-seater tandem bench with steel frame and cushioned PU seats. Powder-coated finish, scratch-resistant.',
    brand: 'Talle', category: 'Tandem Seating', material: 'Metal',
    price: 11999, discount: 12, stock: 30,
    image: 'https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=800',
    images: ['https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=800'],
    featured: true, rating: 4.6, numReviews: 38,
  },
  {
    name: 'Talle Tandem 4-Seater Lounge Bench',
    description: '4-seater tandem bench with arm dividers and integrated side table. Built for lobbies, lounges and large waiting areas.',
    brand: 'Talle', category: 'Tandem Seating', material: 'Faux Leather',
    price: 17999, discount: 10, stock: 18,
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800',
    images: ['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800'],
    newArrival: true, rating: 4.5, numReviews: 22,
  },
  // ─── Cafeteria Chairs (separate from cafe chairs) ──────────────────
  {
    name: 'Talle Cafeteria Stackable Chair (Set of 4)',
    description: 'Heavy-duty stackable cafeteria chair with steel frame and easy-clean polypropylene seat. Built for office canteens and food courts.',
    brand: 'Talle', category: 'Cafeteria Chairs', material: 'Plastic',
    price: 5499, discount: 18, stock: 120,
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800',
    images: ['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800'],
    bestSeller: true, rating: 4.4, numReviews: 73,
    colors: ['Red', 'Green', 'Blue', 'White'],
  },
  // ─── Sofas & Couches (NEW department) ──────────────────────────────
  {
    name: 'Talle Aurora 3-Seater Sofa',
    description: 'Modern 3-seater sofa with deep cushion seat, solid hardwood frame and stain-resistant upholstery. Mumbai-made, ships flat-pack.',
    brand: 'Talle', category: '3-Seater Sofa', material: 'Fabric',
    price: 38999, discount: 22, stock: 8,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'],
    featured: true, bestSeller: true, rating: 4.7, numReviews: 56,
    colors: ['Grey', 'Beige', 'Charcoal'],
  },
  {
    name: 'Talle Lumen L-Shaped Sectional Couch',
    description: 'Large L-shaped sectional couch with chaise lounge. Reversible orientation, fits any living room corner. Premium fabric upholstery.',
    brand: 'Talle', category: 'L-Shaped Couch', material: 'Fabric',
    price: 64999, discount: 15, stock: 5,
    image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800',
    images: ['https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800'],
    featured: true, newArrival: true, rating: 4.8, numReviews: 29,
  },
  {
    name: 'Talle Crescent Curved 4-Seater Couch',
    description: 'Statement curved couch for modern living rooms. Hand-stitched velvet upholstery, brass-finish legs. Conversation-friendly C-shape.',
    brand: 'Talle', category: 'Curved Couch', material: 'Fabric',
    price: 79999, discount: 18, stock: 3,
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800',
    images: ['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800'],
    featured: true, rating: 4.9, numReviews: 17,
    colors: ['Mustard', 'Emerald', 'Navy', 'Blush'],
  },
  // ─── Tables & Desks (NEW department) ───────────────────────────────
  {
    name: 'Talle Sheesham Solid Wood Dining Table (6-Seater)',
    description: 'Handcrafted solid sheesham (Indian rosewood) dining table with natural grain finish. Seats 6 comfortably. Pairs with our wooden dining chairs.',
    brand: 'Talle', category: 'Wooden Dining Tables', material: 'Wood',
    price: 32999, discount: 20, stock: 10,
    image: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=800',
    images: ['https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=800'],
    featured: true, bestSeller: true, rating: 4.8, numReviews: 64,
  },
  {
    name: 'Talle Walnut Coffee Table',
    description: 'Mid-century coffee table with walnut top, tapered hairpin legs and concealed lower shelf for magazines / remotes.',
    brand: 'Talle', category: 'Coffee Tables', material: 'Wood',
    price: 8999, discount: 25, stock: 22,
    image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800',
    images: ['https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800'],
    bestSeller: true, rating: 4.6, numReviews: 48,
  },
  {
    name: 'Talle Nesting Side Tables (Set of 2)',
    description: 'Set of 2 nesting side tables — slide together to save floor space, pull apart for couch-side use. Powder-coated metal base.',
    brand: 'Talle', category: 'Side Tables', material: 'Metal',
    price: 4999, discount: 15, stock: 35,
    image: 'https://images.unsplash.com/photo-1567016526105-22da7c13161a?w=800',
    images: ['https://images.unsplash.com/photo-1567016526105-22da7c13161a?w=800'],
    rating: 4.4, numReviews: 31,
    colors: ['Black', 'Gold', 'White'],
  },
  {
    name: 'Talle Executive L-Shape Office Desk',
    description: 'L-shape executive desk with cable management, modesty panel and lockable drawer pedestal. Engineered wood, scratch-resistant laminate.',
    brand: 'Talle', category: 'Office Desks', material: 'Wood',
    price: 24999, discount: 18, stock: 14,
    image: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800',
    images: ['https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800'],
    featured: true, newArrival: true, rating: 4.7, numReviews: 39,
  },
  {
    name: 'Talle Conference Table (8-Seater Boat-Shape)',
    description: '8-seater boat-shape conference table with integrated cable grommets and wire trays. Engineered wood top, metal frame.',
    brand: 'Talle', category: 'Conference Tables', material: 'Wood',
    price: 42999, discount: 20, stock: 6,
    image: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800',
    images: ['https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800'],
    featured: true, rating: 4.8, numReviews: 22,
  },
];

// Chair-shop sub-categories â€” mirrors frontend/src/config/departments.js.
// Each item is a sub-category Product.category can match. Kept here so the
// backend can upsert them as Category records without importing frontend code.
const CHAIR_SUBCATEGORIES = [
  // Office Chairs (incl. premium / cushion / training / tandem additions)
  'Executive Chairs', 'Ergonomic Chairs', 'Workstation Chairs', 'Visitor Chairs',
  'Conference Chairs', 'Mesh Chairs', 'Premium / Ergohuman', 'Cushion Series',
  'Training Room Chairs', 'Tandem Seating',
  // Gaming Chairs
  'Pro Gaming Chairs', 'Racing Style Chairs', 'Streaming Chairs', 'Floor Gaming Chairs',
  // Home & Living
  'Recliners', 'Lounge Chairs', 'Accent Chairs', 'Rocking Chairs', 'Arm Chairs',
  // Dining & Cafe (cafeteria added)
  'Dining Chairs', 'Bar Stools', 'Cafe Chairs', 'Cafeteria Chairs', 'Restaurant Chairs',
  // Outdoor & Garden
  'Patio Chairs', 'Garden Chairs', 'Folding Chairs', 'Beach Chairs',
  // Banquet & Event
  'Banquet Chairs', 'Wedding Chairs', 'Hotel Chairs', 'Tiffany Chairs',
  // Kids & Study
  'Study Chairs', 'Kids Chairs', 'Bean Bags',
  // Salon & Medical
  'Salon Chairs', 'Barber Chairs', 'Medical Stools', 'Wheelchairs',
  // Sofas & Couches (NEW department)
  '1-Seater Sofa', '2-Seater Sofa', '3-Seater Sofa',
  'L-Shaped Couch', 'Curved Couch', 'Lounge Couch',
  // Tables & Desks (NEW department)
  'Wooden Dining Tables', 'Coffee Tables', 'Center Tables', 'Side Tables',
  'Consoles', 'Bar Trolleys', 'Conference Tables', 'Office Desks',
  // Repair & Refurbish
  'Cushion Replacement', 'Hydraulic Repair', 'Wheel & Base Repair', 'Reupholstery',
  // Chair Accessories
  'Seat Cushions', 'Lumbar Support', 'Caster Wheels', 'Hydraulic Cylinder', 'Armrest Pads',
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
  // â€” otherwise every new doc has slug=undefined and the unique index rejects
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
  if (broken.length) console.log(`ðŸ”§ Backfilled slugs on ${broken.length} category record(s)`);

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
      console.log(`ðŸŒ± Added ${toAdd.length} new sub-categories`);
    } catch (err) {
      // Don't bring the server down for a seed hiccup â€” log and move on.
      console.warn('âš ï¸  Sub-category seed had conflicts, continuing:', err.message);
    }
  }

  // One-time backfill: any COD order that's already been marked delivered but
  // somehow stayed isPaid=false should be flipped â€” without this the revenue
  // dashboard would forever underreport on existing orders.
  const codBackfill = await Order.updateMany(
    { paymentMethod: 'COD', status: 'delivered', isPaid: false },
    [{ $set: { isPaid: true, paidAt: { $ifNull: ['$deliveredAt', '$$NOW'] } } }]
  );
  if (codBackfill.modifiedCount > 0) {
    console.log(`ðŸ’° Backfilled isPaid on ${codBackfill.modifiedCount} delivered COD order(s)`);
  }

}

// Idempotent helpers â€” each one only inserts what's missing. Safe to run on
// every server startup, even on a partially-seeded database.

async function seedDefaultUsersIfMissing() {
  const adminEmail = 'admin@tallefurnituremart.com';
  const customerEmail = 'customer@tallefurnituremart.com';
  if (!(await User.findOne({ email: adminEmail }))) {
    await User.create({ name: 'Admin', email: adminEmail, password: 'admin123', isAdmin: true, emailVerified: true });
    console.log('ðŸŒ± Created admin user (admin@tallefurnituremart.com / admin123)');
  }
  if (!(await User.findOne({ email: customerEmail }))) {
    await User.create({ name: 'Demo Customer', email: customerEmail, password: 'customer123', emailVerified: true });
    console.log('ðŸŒ± Created demo customer (customer@tallefurnituremart.com / customer123)');
  }
}

async function seedCategoriesIfMissing() {
  const existingNames = new Set((await Category.find().select('name')).map((c) => c.name));
  let added = 0;
  for (const c of categories) {
    if (!existingNames.has(c.name)) {
      try { await Category.create(c); added++; } catch (err) {
        console.warn(`âš ï¸  Could not insert category "${c.name}": ${err.message}`);
      }
    }
  }
  if (added) console.log(`ðŸŒ± Added ${added} legacy categories`);
}

async function seedBrandsIfMissing() {
  const existingNames = new Set((await Brand.find().select('name')).map((b) => b.name));
  let added = 0;
  for (const b of brands) {
    if (!existingNames.has(b.name)) {
      try { await Brand.create(b); added++; } catch (err) {
        console.warn(`âš ï¸  Could not insert brand "${b.name}": ${err.message}`);
      }
    }
  }
  if (added) console.log(`ðŸŒ± Added ${added} brands`);
}

async function seedProductsIfMissing() {
  const productCount = await Product.countDocuments();
  if (productCount > 0) return;
  console.log(`ðŸŒ± No products found â€” seeding ${products.length} demo products...`);
  let added = 0;
  for (const p of products) {
    try { await Product.create(p); added++; } catch (err) {
      console.warn(`âš ï¸  Could not insert product "${p.name}": ${err.message}`);
    }
  }
  console.log(`ðŸŒ± Added ${added}/${products.length} demo products`);
}

async function seedIfEmpty() {
  await ensureDefaults();
  await seedDefaultUsersIfMissing();
  await seedCategoriesIfMissing();
  await seedBrandsIfMissing();
  await seedProductsIfMissing();
  console.log('âœ… Seed checks complete');
  return true;
}

module.exports = { seedIfEmpty };
