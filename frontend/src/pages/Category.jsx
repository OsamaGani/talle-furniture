import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams, Navigate } from 'react-router-dom';
import API from '../api/axios';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import Reveal from '../components/Reveal';
import { getCategory, getDepartment } from '../config/departments';
import { FiFilter, FiX, FiArrowRight, FiZap } from 'react-icons/fi';
import SEO from '../components/SEO';

const materials = ['Mesh', 'Leather', 'Faux Leather', 'Fabric', 'Plastic', 'Wood', 'Metal'];
const priceBuckets = [
  { label: 'Under ₹2,000',       min: 0,     max: 2000 },
  { label: '₹2,000 – ₹5,000',    min: 2000,  max: 5000 },
  { label: '₹5,000 – ₹15,000',   min: 5000,  max: 15000 },
  { label: 'Above ₹15,000',      min: 15000, max: 9999999 },
];

export default function Category() {
  const { slug } = useParams();
  const cat = getCategory(slug);
  if (!cat) return <Navigate to="/shop" replace />;
  const dept = getDepartment(cat.deptSlug);

  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  const material = params.get('material') || '';
  const priceIdx = params.get('price')    || '';
  const sort     = params.get('sort')     || '';
  const inStock  = params.get('inStock')  === '1';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const q = new URLSearchParams();
        q.set('category', cat.name);
        if (material) q.set('material', material);
        if (sort) q.set('sort', sort);
        q.set('limit', 60);
        const { data } = await API.get(`/products?${q.toString()}`);
        if (!cancelled) setProducts(data.products || []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, material, sort]);

  const filtered = useMemo(() => {
    let list = products;
    if (priceIdx !== '') {
      const b = priceBuckets[+priceIdx];
      if (b) {
        list = list.filter((p) => {
          const f = p.discount > 0 ? p.price - (p.price * p.discount) / 100 : p.price;
          return f >= b.min && f < b.max;
        });
      }
    }
    if (inStock) list = list.filter((p) => p.stock > 0);
    return list;
  }, [products, priceIdx, inStock]);

  const updateParam = (key, value) => {
    const np = new URLSearchParams(params);
    if (value === '' || value === null || value === undefined) np.delete(key);
    else np.set(key, value);
    setParams(np);
  };

  const clearAll = () => setParams({});

  // Sibling categories (same department, excluding current) — for cross-sell.
  const siblings = dept ? dept.items.filter((i) => i.slug !== cat.slug) : [];

  const FilterPanel = (
    <div className="space-y-6 text-sm">
      <FilterGroup
        title="Material"
        items={materials}
        active={material}
        onChange={(v) => updateParam('material', v === material ? '' : v)}
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
              <button onClick={() => updateParam('price', '')} className="text-xs text-primary-500 hover:underline mt-1">
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
      <button onClick={clearAll} className="text-primary-500 hover:underline font-semibold">
        Clear All Filters
      </button>
    </div>
  );

  return (
    <div className="bg-white">
      <SEO
        title={`${cat.name} — Mumbai Manufacturer · Talle`}
        description={`Buy ${cat.name.toLowerCase()} — own-manufactured by Talle Furniture Mart in Saki Naka, Mumbai. ${cat.tagline || ''} Free Mumbai delivery on ₹2,999+, COD, 6-month warranty.`.trim()}
        path={`/category/${slug}`}
        keywords={[
          `${cat.name.toLowerCase()} mumbai`,
          `${cat.name.toLowerCase()} manufacturer mumbai`,
          `buy ${cat.name.toLowerCase()} online india`,
          `wholesale ${cat.name.toLowerCase()} mumbai`,
          `bulk ${cat.name.toLowerCase()} for office`,
          `${cat.name.toLowerCase()} price mumbai`,
          `best ${cat.name.toLowerCase()} india`,
          `${cat.name.toLowerCase()} supplier andheri powai saki naka`,
          `${cat.name.toLowerCase()} cod mumbai`,
          'talle furniture mart',
        ].join(', ')}
      />
      {/* Hero */}
      <section className={`relative overflow-hidden bg-gradient-to-br ${dept?.color || 'from-primary-500 to-pink-600'} text-white`}>
        <div className="absolute -top-20 -right-10 w-72 h-72 bg-white/15 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-24 -left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <nav className="text-xs sm:text-sm text-white/80 mb-3 flex items-center gap-2 flex-wrap">
            <Link to="/" className="hover:underline">Home</Link>
            <span>/</span>
            <Link to="/shop" className="hover:underline">Shop</Link>
            {dept && <>
              <span>/</span>
              <Link to={`/dept/${dept.slug}`} className="hover:underline">{dept.name}</Link>
            </>}
            <span>/</span>
            <span className="text-white font-semibold">{cat.name}</span>
          </nav>

          {dept && (
            <span className="inline-block w-fit bg-white/20 backdrop-blur text-white text-[10px] sm:text-xs font-extrabold px-3 py-1.5 rounded-full mb-3 tracking-wide">
              {dept.emoji} {dept.name}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight drop-shadow-lg max-w-3xl">
            {cat.name}
          </h1>
        </div>
      </section>

      {/* Filters + grid */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4 sm:mb-6 border-b pb-3 sm:pb-4">
          <div>
            <h2 className="text-lg sm:text-2xl font-extrabold">{cat.name}</h2>
            <p className="text-xs sm:text-sm text-gray-500">
              {loading ? 'Loading…' : `${filtered.length} product${filtered.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => setShowFilter(true)} className="lg:hidden flex items-center gap-1.5 border px-3 py-2 rounded text-sm">
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
            <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setShowFilter(false)}>
              <div className="bg-white w-72 h-full p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
                <p className="text-gray-700 font-semibold text-lg">No products yet in {cat.name}</p>
                <p className="text-gray-500 text-sm mt-1">
                  We&apos;re stocking up — try a related category below.
                </p>
                <div className="flex justify-center gap-3 mt-5 flex-wrap">
                  <button onClick={clearAll} className="btn-primary">Clear Filters</button>
                  {dept && (
                    <Link to={`/dept/${dept.slug}`} className="border border-gray-300 hover:border-primary-500 hover:text-primary-500 font-semibold px-5 py-2 rounded transition">
                      Browse {dept.name}
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filtered.map((p, i) => (
                  <Reveal key={p._id} delay={i * 30}>
                    <ProductCard product={p} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related sub-categories from same department */}
      {siblings.length > 0 && (
        <section className="bg-gray-50 border-t">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="text-lg sm:text-xl font-extrabold mb-4">More from {dept.name}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {siblings.map((s) => (
                <Link
                  key={s.slug}
                  to={`/category/${s.slug}`}
                  className="bg-white border rounded-xl p-4 hover:shadow-md hover:border-primary-300 transition group"
                >
                  <p className="font-semibold group-hover:text-primary-500">{s.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 inline-flex items-center gap-1">
                    Browse <FiArrowRight size={11} />
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
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
            <button onClick={() => onChange('')} className="text-xs text-primary-500 hover:underline mt-1">
              Clear
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
