// Single source of truth for the toyzone-style category hierarchy.
// Used by: Navbar mega-menu, Department page, Category page, admin dropdowns, seed.
// `slug` is what shows up in URLs (/dept/:slug and /category/:slug).
// `name` is the canonical category string stored on Product.category.

export const departments = [
  {
    slug: 'ride-on-cycles',
    name: 'Ride-On & Cycles',
    emoji: '🛴',
    color: 'from-sky-500 to-blue-600',
    blurb: 'Scooters, ride-ons, tricycles and more — keep them moving.',
    items: [
      { slug: 'kick-scooters', name: 'Kick Scooters' },
      { slug: 'magic-car',     name: 'Magic Car' },
      { slug: 'ride-on',       name: 'Ride On' },
      { slug: 'tricycle',      name: 'Tricycle' },
      { slug: 'wave-roller',   name: 'Wave Roller' },
    ],
  },
  {
    slug: 'pretend-play',
    name: 'Pretend & Play',
    emoji: '🏠',
    color: 'from-pink-500 to-rose-600',
    blurb: 'Imagination-led play — doll houses, kitchens, swords and more.',
    items: [
      { slug: 'doll-house',   name: 'Doll House' },
      { slug: 'kitchen-sets', name: 'Kitchen Sets' },
      { slug: 'tent-house',   name: 'Tent House' },
      { slug: 'swords',       name: 'Swords' },
    ],
  },
  {
    slug: 'push-pull-toy',
    name: 'Push & Pull Toy',
    emoji: '🚂',
    color: 'from-amber-500 to-orange-600',
    blurb: 'Classic friction, pull-along and pull-string toys for early movers.',
    items: [
      { slug: 'friction-toys', name: 'Friction Toys' },
      { slug: 'pull-along',    name: 'Pull Along' },
      { slug: 'pull-string',   name: 'Pull String' },
    ],
  },
  {
    slug: 'action-games',
    name: 'Action Games',
    emoji: '🎯',
    color: 'from-red-500 to-rose-700',
    blurb: 'Toy guns, bump-n-go cars and adrenaline-packed action play.',
    items: [
      { slug: 'toy-guns',   name: 'Toy Guns' },
      { slug: 'frog-games', name: 'Frog Games' },
      { slug: 'bump-n-go',  name: 'Bump N Go' },
    ],
  },
  {
    slug: 'baby-gear-utility',
    name: 'Baby Gear & Utility',
    emoji: '👶',
    color: 'from-teal-500 to-cyan-600',
    blurb: 'Everything for infants — bath tubs, walkers, musical toys & furniture.',
    items: [
      { slug: 'infants',        name: 'Infants' },
      { slug: 'bath-tub',       name: 'Bath Tub' },
      { slug: 'baby-walker',    name: 'Baby Walker' },
      { slug: 'potty-seats',    name: 'Potty Seats' },
      { slug: 'musical-toys',   name: 'Musical Toys' },
      { slug: 'kids-furniture', name: 'Kids Furniture' },
    ],
  },
  {
    slug: 'sports-outdoor',
    name: 'Sports & Outdoor',
    emoji: '⚽',
    color: 'from-emerald-500 to-green-700',
    blurb: 'Get them outside — cricket, basketball, bowling and pop-catch sets.',
    items: [
      { slug: 'pop-catch',   name: 'Pop Catch' },
      { slug: 'cricket-set', name: 'Cricket Set' },
      { slug: 'bowling-set', name: 'Bowling Set' },
      { slug: 'basket-ball', name: 'Basket Ball' },
      { slug: 'sports-toys', name: 'Sports Toys' },
    ],
  },
  {
    slug: 'toys-games',
    name: 'Toys & Games',
    emoji: '🎲',
    color: 'from-purple-500 to-fuchsia-600',
    blurb: 'Bubble toys, walkie talkies, drums and educational classics.',
    items: [
      { slug: 'bubble-toys',      name: 'Bubble Toys' },
      { slug: 'walkie-talkie',    name: 'Walkie Talkie' },
      { slug: 'chairs',           name: 'Chairs' },
      { slug: 'educational-toys', name: 'Educational Toys' },
      { slug: 'drum',             name: 'Drum' },
    ],
  },
  {
    slug: 'wooden-toys',
    name: 'Wooden Toys',
    emoji: '🪵',
    color: 'from-yellow-700 to-amber-800',
    blurb: 'Heirloom-quality wooden games — board games, carrom and tables.',
    items: [
      { slug: 'board-games', name: 'Board Games' },
      { slug: 'carroms',     name: 'Carroms' },
      { slug: 'tables',      name: 'Tables' },
    ],
  },
  {
    slug: 'rechargeable',
    name: 'Rechargeable',
    emoji: '🔋',
    color: 'from-lime-500 to-green-600',
    blurb: 'Battery-powered, rechargeable toys — long playtime, no replacements.',
    items: [
      { slug: 'rechargeable-toys', name: 'Rechargeable' },
    ],
  },
  {
    slug: 'construction-building',
    name: 'Construction & Building Toys',
    emoji: '🧱',
    color: 'from-orange-600 to-red-700',
    blurb: 'Building blocks, cubes and STEM-friendly construction sets.',
    items: [
      { slug: 'building-blocks', name: 'Building Blocks' },
      { slug: 'cubes',           name: 'Cubes' },
    ],
  },
];

// ---- Lookups (build once) ----
const _bySlug = {};
const _byName = {};
const _allItems = [];
for (const d of departments) {
  _bySlug[d.slug] = d;
  for (const it of d.items) {
    const enriched = { ...it, deptSlug: d.slug, deptName: d.name };
    _bySlug[it.slug] = enriched;
    _byName[it.name.toLowerCase()] = enriched;
    _allItems.push(enriched);
  }
}

export function getDepartment(slug) {
  const d = _bySlug[slug];
  return d && d.items ? d : null;
}

export function getCategory(slug) {
  const c = _bySlug[slug];
  return c && !c.items ? c : null;
}

export function getCategoryByName(name) {
  return _byName[(name || '').toLowerCase()] || null;
}

// Flat list of every sub-category (for admin dropdowns, Shop filter, seeding).
export const allSubCategoryNames = _allItems.map((i) => i.name);
export const allSubCategories = _allItems;
