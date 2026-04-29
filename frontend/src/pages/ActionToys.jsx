import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import Reveal from '../components/Reveal';
import {
  FiFilter, FiX, FiArrowRight, FiShield, FiTruck, FiAward, FiTarget,
  FiZap, FiStar,
} from 'react-icons/fi';

// Sub-category chips — `match` is a list of keywords, ANY match passes.
const subCategories = [
  { key: '',         label: 'All Action Toys',     emoji: '🎯', match: [] },
  { key: 'blasters', label: 'Dart Guns & Blasters', emoji: '🔫',
    match: ['gun', 'blaster', 'dart', 'nerf', 'shoot', 'fire'] },
  { key: 'robots',   label: 'Robot Toys',          emoji: '🤖',
    match: ['robot', 'transformer', 'gear', 'mech'] },
  { key: 'cars',     label: 'Die-Cast Cars',       emoji: '🏎',
    match: ['car', 'racer', 'die-cast', 'diecast', 'ferrari', 'hot wheels', 'vehicle'] },
  { key: 'heroes',   label: 'Action Figures',      emoji: '🦸',
    match: ['figure', 'spider', 'marvel', 'hero', 'avenger', 'batman'] },
  { key: 'launchers',label: 'Launchers',           emoji: '🚀',
    match: ['launcher', 'rocket', 'pneumatic', 'explorer', 'space'] },
  { key: 'sports',   label: 'Sports & Games',      emoji: '⚽',
    match: ['football', 'soccer', 'flicker', 'ball', 'tabletop', 'bubble'] },
];

const ages    = ['2-4 Years', '4-6 Years', '6-8 Years', '8 Years+'];
const colors  = ['Blue', 'Red', 'Black', 'Green', 'Yellow', 'Orange'];
const priceBuckets = [
  { label: 'Under ₹500',     min: 0,    max: 500 },
  { label: '₹500 – ₹1,000',  min: 500,  max: 1000 },
  { label: '₹1,000 – ₹2,000',min: 1000, max: 2000 },
  { label: 'Above ₹2,000',   min: 2000, max: 999999 },
];

// Highlight cards rendered above the grid (chanak-style "why action toys" strip).
const highlights = [
  { icon: <FiShield />, title: 'BIS Approved & Safe', desc: 'Non-toxic ABS plastic, soft foam darts, no sharp edges.' },
  { icon: <FiAward />,  title: 'Premium Quality',     desc: 'Long-lasting build, realistic detailing, kid-tested.' },
  { icon: <FiTarget />, title: 'Skill Building',      desc: 'Hand-eye coordination, motor skills, target practice.' },
  { icon: <FiTruck />,  title: 'Fast Delivery',       desc: 'Free shipping over ₹999, dispatch within 24 hours.' },
];

export default function ActionToys() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  const sub        = params.get('sub')      || '';
  const ageGroup   = params.get('ageGroup') || '';
  const color      = params.get('color')    || '';
  const priceIdx   = params.get('price')    || '';
  const sort       = params.get('sort')     || '';
  const inStock    = params.get('inStock')  === '1';

  // Fetch the Action Figures category once — we filter client-side for chips/colors.
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const q = new URLSearchParams();
        q.set('category', 'Action Figures');
        if (ageGroup) q.set('ageGroup', ageGroup);
        if (sort)     q.set('sort', sort);
        q.set('limit', 60);
        const { data } = await API.get(`/products?${q.toString()}`);
        setProducts(data.products || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [ageGroup, sort]);

  const filtered = useMemo(() => {
    let list = products;
    if (sub) {
      const chip = subCategories.find((c) => c.key === sub);
      const keywords = chip?.match ?? [];
      if (keywords.length) {
        list = list.filter((p) => {
          const hay = `${p.name} ${p.description || ''}`.toLowerCase();
          return keywords.some((kw) => hay.includes(kw));
        });
      }
    }
    if (color) {
      list = list.filter((p) =>
        `${p.name} ${p.description || ''}`.toLowerCase().includes(color.toLowerCase()),
      );
    }
    if (priceIdx !== '') {
      const bucket = priceBuckets[+priceIdx];
      if (bucket) {
        list = list.filter((p) => {
          const f = p.discount > 0 ? p.price - (p.price * p.discount) / 100 : p.price;
          return f >= bucket.min && f < bucket.max;
        });
      }
    }
    if (inStock) list = list.filter((p) => p.stock > 0);
    return list;
  }, [products, sub, color, priceIdx, inStock]);

  const updateParam = (key, value) => {
    const np = new URLSearchParams(params);
    if (value === '' || value === null || value === undefined) np.delete(key);
    else np.set(key, value);
    setParams(np);
  };

  const clearAll = () => setParams({});

  const FilterPanel = (
    <div className="space-y-6 text-sm">
      <FilterGroup
        title="Age Group"
        items={ages}
        active={ageGroup}
        onChange={(v) => updateParam('ageGroup', v === ageGroup ? '' : v)}
      />
      <FilterGroup
        title="Color"
        items={colors}
        active={color}
        onChange={(v) => updateParam('color', v === color ? '' : v)}
      />
      <div>
        <h3 className="font-bold mb-2">Price</h3>
        <ul className="space-y-1">
          {priceBuckets.map((b, i) => (
            <li key={b.label}>
              <label className="flex items-center gap-2 cursor-pointer hover:text-primary-500">
                <input
                  type="radio"
                  checked={priceIdx === String(i)}
                  onChange={() => updateParam('price', String(i))}
                  className="accent-primary-500"
                />
                {b.label}
              </label>
            </li>
          ))}
          {priceIdx !== '' && (
            <li>
              <button
                onClick={() => updateParam('price', '')}
                className="text-xs text-primary-500 hover:underline mt-1"
              >
                Clear
              </button>
            </li>
          )}
        </ul>
      </div>
      <div>
        <h3 className="font-bold mb-2">Availability</h3>
        <label className="flex items-center gap-2 cursor-pointer hover:text-primary-500">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => updateParam('inStock', e.target.checked ? '1' : '')}
            className="accent-primary-500"
          />
          In Stock Only
        </label>
      </div>
      <button
        onClick={clearAll}
        className="text-primary-500 hover:underline font-semibold"
      >
        Clear All Filters
      </button>
    </div>
  );

  return (
    <div className="bg-white">
      {/* Hero banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-red-600 to-rose-700 text-white">
        <img
          src="https://images.unsplash.com/photo-1608889335941-32ac5f2041b9?w=1600"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay"
        />
        <div className="absolute -top-20 -right-10 w-80 h-80 bg-yellow-300/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-24 -left-10 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 md:py-20">
          {/* Breadcrumb */}
          <nav className="text-xs sm:text-sm text-white/80 mb-3 sm:mb-4 flex items-center gap-2">
            <Link to="/" className="hover:underline">Home</Link>
            <span>/</span>
            <Link to="/shop" className="hover:underline">Shop</Link>
            <span>/</span>
            <span className="text-white font-semibold">Action Toys</span>
          </nav>

          <span className="inline-block w-fit bg-yellow-300 text-gray-900 text-[10px] sm:text-xs font-extrabold px-3 py-1.5 rounded-full mb-3 tracking-wide shadow">
            🎯 ACTION & ADVENTURE
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight drop-shadow-lg max-w-3xl">
            Action Toys for Kids
          </h1>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-xl text-white/95 max-w-2xl">
            Discover the best action toys online — safe, durable & exciting. Dart guns, blasters,
            die-cast cars, robots and more, built to combine adrenaline with safety.
          </p>

          <div className="flex flex-wrap gap-2 sm:gap-3 mt-5 sm:mt-7 text-xs sm:text-sm">
            <span className="bg-white/20 backdrop-blur px-3 py-1.5 rounded-full font-semibold">✓ BIS Approved</span>
            <span className="bg-white/20 backdrop-blur px-3 py-1.5 rounded-full font-semibold">✓ Made for Kids 5+</span>
            <span className="bg-white/20 backdrop-blur px-3 py-1.5 rounded-full font-semibold">✓ Up to 55% Off</span>
            <span className="bg-white/20 backdrop-blur px-3 py-1.5 rounded-full font-semibold">✓ Free Shipping ₹999+</span>
          </div>
        </div>
      </section>

      {/* Sub-category chips — quick filters */}
      <section className="border-b sticky top-[57px] md:top-0 z-30 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 overflow-x-auto">
          <div className="flex gap-2 sm:gap-3 min-w-max">
            {subCategories.map((c) => {
              const active = sub === c.key;
              return (
                <button
                  key={c.label}
                  onClick={() => updateParam('sub', c.key)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap border transition ${
                    active
                      ? 'bg-primary-500 text-white border-primary-500 shadow'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-primary-400 hover:text-primary-500'
                  }`}
                >
                  <span>{c.emoji}</span> {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Highlight strip */}
      <section className="border-b bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {highlights.map((h) => (
            <div key={h.title} className="flex items-start gap-3 bg-white border rounded-lg p-3 sm:p-4 hover:shadow-md transition">
              <div className="bg-primary-50 text-primary-600 w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                {h.icon}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm">{h.title}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Filters + grid */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4 sm:mb-6 border-b pb-3 sm:pb-4">
          <div>
            <h2 className="text-lg sm:text-2xl font-extrabold">
              {(subCategories.find((c) => c.key === sub) || subCategories[0]).label}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              {loading ? 'Loading…' : `${filtered.length} product${filtered.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowFilter(true)}
              className="lg:hidden flex items-center gap-1.5 border px-3 py-2 rounded text-sm"
            >
              <FiFilter size={14} /> Filters
            </button>
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="border rounded px-2 sm:px-3 py-2 text-xs sm:text-sm bg-white"
            >
              <option value="">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name (A-Z)</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          <aside className="hidden lg:block">{FilterPanel}</aside>

          {showFilter && (
            <div
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              onClick={() => setShowFilter(false)}
            >
              <div
                className="bg-white w-72 h-full p-4 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-lg">Filters</h2>
                  <button onClick={() => setShowFilter(false)}><FiX /></button>
                </div>
                {FilterPanel}
              </div>
            </div>
          )}

          <div>
            {loading ? (
              <Loader />
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed rounded-xl">
                <FiZap className="mx-auto text-5xl text-primary-400 mb-3" />
                <p className="text-gray-700 font-semibold text-lg">No action toys match these filters</p>
                <p className="text-gray-500 text-sm mt-1">Try clearing some filters or browse the full shop.</p>
                <div className="flex justify-center gap-3 mt-5">
                  <button onClick={clearAll} className="btn-primary">Clear Filters</button>
                  <Link to="/shop" className="border border-gray-300 hover:border-primary-500 hover:text-primary-500 font-semibold px-5 py-2 rounded transition">
                    Browse All Toys
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filtered.map((p, i) => (
                  <Reveal key={p._id} delay={i * 40}>
                    <ProductCard product={p} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SEO / category description content (chanak-style long-form) */}
      <section className="bg-gray-50 border-t">
        <div className="max-w-5xl mx-auto px-4 py-12 prose prose-sm sm:prose-base">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-gray-900">
              Buy Action Toys Online — Safe, Durable & Exciting
            </h2>
            <p className="text-gray-600">
              Action toys turn ordinary afternoons into adventures. From soft-dart blasters and
              motorized launchers to die-cast cars and remote-control robots, our action collection
              is designed for kids who love movement, speed and a little friendly competition.
              Every toy in this category is built around one promise — combine adrenaline with safety.
            </p>

            <div className="grid sm:grid-cols-2 gap-5 mt-8 not-prose">
              <BulletCard
                icon={<FiTarget />}
                title="Dart Guns & Blasters"
                desc="Soft-foam darts, 30–60 ft firing range, rechargeable motorized models with rotating drums for non-stop play."
              />
              <BulletCard
                icon={<FiZap />}
                title="Pneumatic Launchers"
                desc="Air-powered space-explorer guns and rocket launchers for outdoor target practice."
              />
              <BulletCard
                icon={<FiAward />}
                title="Premium Die-Cast Cars"
                desc="Metal-body sports cars with realistic engine sounds, LED lights, and opening doors."
              />
              <BulletCard
                icon={<FiStar />}
                title="Robots & Action Figures"
                desc="Gear robots, transforming heroes and posable figures that bring imagination to life."
              />
            </div>

            <h3 className="mt-10 text-xl font-bold text-gray-900">Why parents choose our action toys</h3>
            <ul className="text-gray-600 list-disc pl-5 space-y-1">
              <li>BIS-approved, non-toxic ABS plastic — no sharp edges, no harsh chemicals.</li>
              <li>Designed for kids 5+, with age-appropriate complexity and safety features.</li>
              <li>Develops hand-eye coordination, fine motor skills and strategic thinking.</li>
              <li>Tested for indoor and outdoor play — durable enough to survive everyday adventure.</li>
              <li>Authentic stock from leading brands like Nerf, Marvel, Transformers and Hot Wheels.</li>
            </ul>

            <div className="mt-10 not-prose">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition"
              >
                Browse All Toys <FiArrowRight />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function FilterGroup({ title, items, active, onChange }) {
  return (
    <div>
      <h3 className="font-bold mb-2">{title}</h3>
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it}>
            <label className="flex items-center gap-2 cursor-pointer hover:text-primary-500">
              <input
                type="radio"
                checked={active === it}
                onChange={() => onChange(it)}
                className="accent-primary-500"
              />
              {it}
            </label>
          </li>
        ))}
        {active && (
          <li>
            <button
              onClick={() => onChange('')}
              className="text-xs text-primary-500 hover:underline mt-1"
            >
              Clear
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}

function BulletCard({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-3 bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition">
      <div className="bg-primary-50 text-primary-600 w-11 h-11 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-bold">{title}</p>
        <p className="text-sm text-gray-600 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
