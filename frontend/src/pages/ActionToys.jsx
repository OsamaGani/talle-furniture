import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import Reveal from '../components/Reveal';
import SEO from '../components/SEO';
import {
  FiFilter, FiX, FiArrowRight, FiShield, FiTruck, FiAward, FiTool,
  FiZap, FiStar, FiPhone, FiMapPin, FiHelpCircle, FiChevronDown, FiCheck,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { PHONE_PRIMARY_DISPLAY, PHONE_PRIMARY_TEL, waLink } from '../config/contact';

// Areas we serve — fuel for "chair repair in <neighborhood>" searches.
// Google reads these neighborhood names from the rendered DOM AND from the
// Service JSON-LD's areaServed field below, so it knows to surface this
// page when someone searches "chair repair in Sakinaka" or "office chair
// shop in Powai". Order: closest to workshop first, then by office density.
const AREAS_SERVED = [
  'Saki Naka', 'Andheri East', 'Andheri West', 'Marol', 'Chakala',
  'Powai', 'Vikhroli', 'Kurla', 'Ghatkopar', 'Mulund',
  'Jogeshwari', 'Goregaon', 'Malad', 'BKC (Bandra Kurla Complex)',
  'Bandra', 'Lower Parel', 'Worli', 'Thane', 'Navi Mumbai', 'Mira Road',
];

// FAQ — every question is phrased the way real customers actually Google it.
// Each entry is also written into the FAQPage JSON-LD so Google can use
// them as 'People Also Ask' rich snippets in SERP.
const FAQS = [
  {
    q: 'Where is the best chair repair shop in Sakinaka, Mumbai?',
    a: `Talle Furniture Mart at Shop No. 5, D'Souza Sadan, near Peninsula Grand Hotel, Saki Naka, Mumbai — open 24×7, 4.9★ on Google with 213+ reviews. Mumbai's longest-running chair-only workshop, established 2009. Call ${PHONE_PRIMARY_DISPLAY} for a quote.`,
  },
  {
    q: 'Do you offer doorstep chair repair in Mumbai?',
    a: `Yes — door-to-door (D2D) chair pickup, repair and return across Mumbai and nearby areas. We cover Saki Naka, Andheri, Powai, Kurla, BKC, Bandra, Lower Parel, Thane and beyond. WhatsApp a photo of your chair on ${PHONE_PRIMARY_DISPLAY} for a same-day quote.`,
  },
  {
    q: 'How much does it cost to repair an office chair?',
    a: 'It depends on the part. Hydraulic cylinder replacement starts at ₹1,299. Caster wheel set (5 pcs) ₹799. Full reupholstery starts at ₹1,999. We send a transparent quote on WhatsApp before starting any work — no surprise charges.',
  },
  {
    q: 'Can you replace the hydraulic cylinder of my office chair?',
    a: 'Yes. We stock BIFMA-grade class-4 gas-lift cylinders that fit 95% of office and gaming chairs. Replacement takes 15 minutes, can be done at your office or at our Saki Naka workshop, includes 6-month warranty.',
  },
  {
    q: 'How long does chair reupholstery take?',
    a: 'Most chair reupholstery jobs are returned within 7 days. Same-day turnaround for minor cushion-top swaps. For bulk orders (10+ chairs from a single office), we schedule a workshop visit and turn the lot in 3–5 working days.',
  },
  {
    q: 'Do you repair branded office chairs like Featherlite, Godrej or Green Soul?',
    a: 'Yes — we service every major office-chair brand including Featherlite, Godrej Interio, Green Soul, Wakefit, Boss, HOF, Durian, Herman Miller, Steelcase and more. Branded parts available as well as cost-effective universal alternatives.',
  },
  {
    q: 'What warranty do you give on chair repairs?',
    a: '6-month workmanship warranty on every repair. If the same part fails within 6 months, we fix it free of charge. Talle-brand new chairs ship with a 5-year structural warranty.',
  },
  {
    q: 'Do you manufacture office chairs in Mumbai?',
    a: 'Yes — Talle is an own-manufactured brand. We make executive, ergonomic, banquet, restaurant, tandem-seating, custom office chairs, sofas and wooden dining sets out of our Saki Naka workshop. Trusted by WeWork, Roller Bearing, Upstep Academy and 300+ Mumbai businesses for bulk orders.',
  },
];

// Sub-category chips — `match` is a list of keywords, ANY match passes.
// Filters the catalog down to chair-service-adjacent listings (repair packs,
// spare parts, refurb-friendly base models).
const subCategories = [
  { key: '',           label: 'All Services & Parts',  emoji: '🔧', match: [] },
  { key: 'hydraulic',  label: 'Hydraulic Repair',      emoji: '⛽',  match: ['hydraulic', 'cylinder', 'gas-lift', 'gaslift'] },
  { key: 'reupholster',label: 'Reupholstery',          emoji: '🧵', match: ['reupholster', 'upholstery', 'cushion', 'fabric replace'] },
  { key: 'wheels',     label: 'Wheels & Base',         emoji: '⚙',  match: ['wheel', 'caster', 'base', 'star base'] },
  { key: 'armrest',    label: 'Armrest & Lumbar',      emoji: '💪', match: ['armrest', 'arm rest', 'lumbar', 'headrest'] },
  { key: 'office',     label: 'Office Chair Service',  emoji: '💼', match: ['executive', 'ergonomic', 'workstation', 'office'] },
  { key: 'gaming',     label: 'Gaming Chair Service',  emoji: '🎮', match: ['gaming', 'racing', 'pro gaming'] },
];

const materials = ['Mesh', 'Leather', 'Faux Leather', 'Fabric', 'Plastic', 'Wood', 'Metal'];
const colors    = ['Black', 'Brown', 'Grey', 'White', 'Red', 'Blue', 'Beige'];
const priceBuckets = [
  { label: 'Under ₹1,000',       min: 0,     max: 1000 },
  { label: '₹1,000 – ₹3,000',    min: 1000,  max: 3000 },
  { label: '₹3,000 – ₹10,000',   min: 3000,  max: 10000 },
  { label: 'Above ₹10,000',      min: 10000, max: 9999999 },
];

// Highlight cards rendered above the grid — chair-care promise.
const highlights = [
  { icon: <FiShield />, title: 'BIFMA-Certified Parts', desc: 'Class-4 hydraulics, premium fabrics — same standards as new chairs.' },
  { icon: <FiAward />,  title: '15+ Years Experience',  desc: 'Mumbai\'s trusted chair workshop, run by craftsmen since 2009.' },
  { icon: <FiTool />,   title: 'Doorstep Service',      desc: 'Pickup, repair, return — no need to drag the chair down 5 floors.' },
  { icon: <FiTruck />,  title: '7-Day Turnaround',      desc: 'Most repairs returned within a week. Same-day for minor fixes.' },
];

export default function ActionToys() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  const sub        = params.get('sub')      || '';
  const material   = params.get('material') || '';
  const color      = params.get('color')    || '';
  const priceIdx   = params.get('price')    || '';
  const sort       = params.get('sort')     || '';
  const inStock    = params.get('inStock')  === '1';

  // Fetch everything that could plausibly be a repair-relevant listing: the
  // "General" catch-all bucket (where the seed puts service line items) plus
  // anything that mentions repair / spare keywords in name or description.
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const q = new URLSearchParams();
        if (material) q.set('material', material);
        if (sort)     q.set('sort', sort);
        q.set('limit', 60);
        const { data } = await API.get(`/products?${q.toString()}`);
        const all = data.products || [];
        // Keep only listings that look service-adjacent: brand=Talle, or
        // names containing repair / cushion / cylinder / wheel keywords.
        const serviceKeywords = ['repair', 'cushion', 'cylinder', 'wheel', 'reupholster', 'service', 'replacement', 'caster', 'hydraulic'];
        const filtered = all.filter((p) => {
          const hay = `${p.name} ${p.description || ''} ${p.brand || ''}`.toLowerCase();
          return p.brand === 'Talle' || serviceKeywords.some((kw) => hay.includes(kw));
        });
        setProducts(filtered);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [material, sort]);

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
        title="Material"
        items={materials}
        active={material}
        onChange={(v) => updateParam('material', v === material ? '' : v)}
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

  // Combined JSON-LD: Service (drives local pack) + FAQPage (drives 'People
  // Also Ask' rich snippets). Bundled as @graph so we ship one <script>
  // block instead of two.
  const seoJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': 'https://tallefurnituremart.com/chair-repair#chair-repair-service',
        'name': 'Chair Repair & Reupholstery — Mumbai',
        'description': 'Doorstep office chair repair, hydraulic replacement, reupholstery, wheel & base fix across Mumbai. 6-month warranty.',
        'serviceType': 'Furniture repair service',
        'provider': { '@id': 'https://tallefurnituremart.com/#localbusiness' },
        'areaServed': AREAS_SERVED.map((a) => ({ '@type': 'Place', 'name': `${a}, Mumbai` })),
        'offers': {
          '@type': 'AggregateOffer',
          'lowPrice': '799',
          'highPrice': '4999',
          'priceCurrency': 'INR',
          'offerCount': '5',
        },
      },
      {
        '@type': 'FAQPage',
        'mainEntity': FAQS.map((f) => ({
          '@type': 'Question',
          'name': f.q,
          'acceptedAnswer': { '@type': 'Answer', 'text': f.a },
        })),
      },
    ],
  };

  return (
    <div className="bg-white">
      <SEO
        title="Chair Repair Near Me · Saki Naka, Andheri, Powai · Talle Mumbai"
        description="Doorstep chair repair across Mumbai — hydraulic replacement, reupholstery, wheel & cushion fix. Saki Naka workshop, 4.9★ Google, 213+ reviews, 6-month warranty. Call +91 93261 66875."
        path="/chair-repair"
        keywords="chair repair near me, chair repair sakinaka, chair repair andheri, chair repair powai, chair repair mumbai, office chair repair shop sakinaka, hydraulic chair replacement mumbai, chair reupholstery mumbai, doorstep chair repair, revolving chair repair sakinaka, gas lift replacement chair, chair workshop mumbai, talle furniture mart repair, abdul rab chair repair"
        jsonLd={seoJsonLd}
      />
      {/* Hero — premium editorial treatment. Real workshop photo with a
          dark charcoal overlay (was amber-orange-red gradient + floating
          blur orbs). Amber-on-charcoal eyebrow + serif headline matches
          the auth + home pages so the brand reads cohesively. */}
      <section className="relative overflow-hidden text-white">
        <img
          src="https://images.unsplash.com/photo-1592078615290-033ee584e267?w=1600&q=85&auto=format&fit=crop"
          alt="Talle Furniture Mart chair repair workshop in Saki Naka, Mumbai"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/70 to-gray-900/40" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
          {/* Breadcrumb */}
          <nav className="text-xs sm:text-sm text-white/70 mb-4 flex items-center gap-2">
            <Link to="/" className="hover:text-white transition">Home</Link>
            <span>/</span>
            <span className="text-white font-semibold">Chair Repair</span>
          </nav>

          <p className="text-[10px] sm:text-xs uppercase tracking-[3px] text-amber-300 font-bold mb-4">
            Chair Repair · Saki Naka, Mumbai
          </p>
          <h1 className="font-display font-medium text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.05] drop-shadow-md max-w-3xl">
            Chair repair, at your door.
          </h1>
          <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-white/85 max-w-2xl leading-relaxed">
            Mumbai's go-to chair repair workshop since 2009 — hydraulic replacement,
            reupholstery, wheel &amp; base fix and full refurbishing. Doorstep pickup
            across Saki Naka, Andheri, Powai, Kurla, BKC, Bandra, Lower Parel and Thane.
          </p>

          <ul className="flex flex-wrap gap-x-5 gap-y-2 mt-6 sm:mt-7 text-xs sm:text-sm text-white/85">
            <li className="flex items-center gap-1.5"><FiCheck size={14} className="text-amber-300" /> BIFMA-grade parts</li>
            <li className="flex items-center gap-1.5"><FiCheck size={14} className="text-amber-300" /> Doorstep pickup</li>
            <li className="flex items-center gap-1.5"><FiCheck size={14} className="text-amber-300" /> 7-day turnaround</li>
            <li className="flex items-center gap-1.5"><FiCheck size={14} className="text-amber-300" /> 6-month warranty</li>
          </ul>

          <div className="flex flex-wrap gap-3 mt-7 sm:mt-8">
            <a
              href={`tel:${PHONE_PRIMARY_TEL}`}
              className="inline-flex items-center gap-2 bg-white text-gray-900 hover:bg-amber-300 font-semibold text-sm px-5 py-3 rounded-lg transition active:scale-[0.99]"
            >
              <FiPhone size={16} /> Call {PHONE_PRIMARY_DISPLAY}
            </a>
            <a
              href={waLink('Hi Talle! I need a chair repair quote.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-3 rounded-lg transition active:scale-[0.99]"
            >
              <FaWhatsapp size={16} /> WhatsApp Quote
            </a>
          </div>
        </div>
      </section>

      {/* Sub-category chips — quick filters */}
      <section className="border-b sticky top-[57px] md:top-0 z-30 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-3 overflow-x-auto no-scrollbar">
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
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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

      {/* Areas We Serve — drives "chair repair in <neighborhood>" SEO.
          Each pill is a static text node so Google can read it. Mobile
          horizontal scroll, desktop wraps to grid. */}
      <section className="border-b bg-white">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-8 sm:py-10">
          <div className="text-center mb-5">
            <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full mb-2">
              <FiMapPin size={12} /> AREAS WE SERVE
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              Doorstep Chair Repair Across Mumbai
            </h2>
            <p className="text-gray-600 mt-1 text-sm sm:text-base max-w-2xl mx-auto">
              We pick up, repair and return chairs in 20+ Mumbai neighbourhoods —
              same-day in Saki Naka, Andheri and Powai.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {AREAS_SERVED.map((area) => (
              <span
                key={area}
                className="inline-flex items-center gap-1 bg-gray-50 hover:bg-amber-50 border border-gray-200 hover:border-amber-300 text-gray-800 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full transition cursor-default"
              >
                <FiMapPin size={11} className="text-amber-600" /> {area}
              </span>
            ))}
            <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full">
              + Your area?{' '}
              <a href={waLink('Hi Talle! Do you cover my area for chair repair?')} target="_blank" rel="noopener noreferrer" className="underline ml-1">
                WhatsApp us
              </a>
            </span>
          </div>
        </div>
      </section>

      {/* Filters + grid */}
      <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-6 sm:py-8">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4 sm:mb-6 border-b pb-3 sm:pb-4">
          <div>
            <h2 className="text-lg sm:text-2xl font-extrabold">
              {(subCategories.find((c) => c.key === sub) || subCategories[0]).label}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              {loading ? 'Loading…' : `${filtered.length} item${filtered.length === 1 ? '' : 's'}`}
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
                <p className="text-gray-700 font-semibold text-lg">No service items match these filters</p>
                <p className="text-gray-500 text-sm mt-1">Try clearing some filters, or call us for a custom quote.</p>
                <div className="flex justify-center gap-3 mt-5">
                  <button onClick={clearAll} className="btn-primary">Clear Filters</button>
                  <Link to="/contact" className="border border-gray-300 hover:border-primary-500 hover:text-primary-500 font-semibold px-5 py-2 rounded transition">
                    Get a Custom Quote
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

      {/* FAQ section — every question is the literal phrasing customers
          Google. Combined with the FAQPage JSON-LD above, this is what
          drives 'People Also Ask' rich snippets on SERP. Each answer
          includes the phone number and key local terms (Sakinaka, Mumbai)
          so neighborhood searches resolve to this page. */}
      <section className="bg-gray-50 border-t">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full mb-2">
              <FiHelpCircle size={12} /> COMMON QUESTIONS
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              Chair Repair FAQ
            </h2>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              The questions Mumbai customers ask us every day.
            </p>
          </div>
          <div className="space-y-2">
            {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} defaultOpen={i === 0} />)}
          </div>
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600 mb-3">Still have a question?</p>
            <div className="flex flex-wrap justify-center gap-2">
              <a
                href={`tel:${PHONE_PRIMARY_TEL}`}
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-full shadow"
              >
                <FiPhone /> Call {PHONE_PRIMARY_DISPLAY}
              </a>
              <a
                href={waLink('Hi Talle! I have a chair repair question.')}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-full shadow"
              >
                💬 WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SEO / category description content */}
      <section className="bg-gray-50 border-t">
        <div className="max-w-5xl mx-auto px-4 py-12 prose prose-sm sm:prose-base">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-gray-900">
              Chair Repair & Refurbishing in Mumbai
            </h2>
            <p className="text-gray-600">
              A good chair is worth saving. We rebuild executive, ergonomic, gaming and dining
              chairs from the cushion up — replacing worn hydraulics, frayed mesh, broken wheels
              and tired upholstery. Most of our customers spend a fraction of the cost of a new
              chair and get another 5+ years out of one they already love.
            </p>

            <div className="grid sm:grid-cols-2 gap-5 mt-8 not-prose">
              <BulletCard
                icon={<FiTool />}
                title="Hydraulic Cylinder Replacement"
                desc="Class-4 BIFMA-certified gas-lifts. Stop the chair from sinking. Same-day service for most models."
              />
              <BulletCard
                icon={<FiZap />}
                title="Full Reupholstery"
                desc="Choose from premium mesh, fabric or PU leather. Cushion redo, foam replacement included."
              />
              <BulletCard
                icon={<FiAward />}
                title="Wheel & Base Fix"
                desc="Replace cracked star bases, swap noisy wheels for smooth polyurethane casters."
              />
              <BulletCard
                icon={<FiStar />}
                title="Complete Refurbishing"
                desc="Bring in a tired chair, take home one that looks and feels brand new — for half the price."
              />
            </div>

            <h3 className="mt-10 text-xl font-bold text-gray-900">Why customers choose Talle</h3>
            <ul className="text-gray-600 list-disc pl-5 space-y-1">
              <li>15+ years of chair-only craftsmanship — we don't dabble, we specialise.</li>
              <li>Genuine spares: BIFMA-rated hydraulics, branded casters, original-fit cushions.</li>
              <li>Doorstep pickup &amp; drop across Mumbai — no muscle work for you.</li>
              <li>Transparent quote before we start. No surprise charges.</li>
              <li>6-month workmanship warranty on every repair.</li>
            </ul>

            <div className="mt-10 not-prose">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition"
              >
                Browse All Chairs <FiArrowRight />
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

// Accordion item for the FAQ section. Each one is keyboard-accessible
// (<details>/<summary>) so Google can render the closed answer text too —
// this matters because the FAQPage JSON-LD only counts as valid if the
// answer text is actually visible / parseable in the DOM.
function FaqItem({ q, a, defaultOpen = false }) {
  return (
    <details
      className="group bg-white border border-gray-200 hover:border-amber-300 rounded-xl overflow-hidden transition open:shadow-md"
      open={defaultOpen}
    >
      <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 font-semibold text-gray-900 hover:bg-amber-50/50 transition">
        <span className="text-sm sm:text-base">{q}</span>
        <FiChevronDown
          size={18}
          className="flex-shrink-0 text-amber-600 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="px-4 sm:px-5 pb-4 text-sm sm:text-[15px] text-gray-700 leading-relaxed border-t border-gray-100 pt-3">
        {a}
      </div>
    </details>
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
