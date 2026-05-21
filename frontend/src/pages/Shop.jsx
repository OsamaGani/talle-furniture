import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../api/axios';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import { FiFilter, FiX, FiPlus } from 'react-icons/fi';
import { allSubCategoryNames, materials } from '../config/departments';
import SEO from '../components/SEO';
import { COMMON_COLORS, colorToBackground, isLightColor } from '../utils/colors';
import { useAuth } from '../context/AuthContext';

const categories = Array.from(new Set(allSubCategoryNames)).sort();
// Talle is the only brand (own manufacturing) — kept for legacy products
// only. The brand filter is hidden from the UI since there's effectively
// nothing to filter; leaving the array here so anything that imports it
// still resolves cleanly.
const brands = ['Talle', 'Other'];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  const keyword = params.get('keyword') || '';
  const category = params.get('category') || '';
  const brand = params.get('brand') || '';
  const material = params.get('material') || '';
  const sort = params.get('sort') || '';
  const featured = params.get('featured') || '';
  const bestSeller = params.get('bestSeller') || '';
  const newArrival = params.get('newArrival') || '';
  const color = params.get('color') || '';

  useEffect(() => { setPage(1); }, [keyword, category, brand, material, sort, color]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const q = new URLSearchParams();
        if (keyword) q.set('keyword', keyword);
        if (category) q.set('category', category);
        if (brand) q.set('brand', brand);
        if (material) q.set('material', material);
        if (sort) q.set('sort', sort);
        if (featured) q.set('featured', featured);
        if (bestSeller) q.set('bestSeller', bestSeller);
        if (newArrival) q.set('newArrival', newArrival);
        if (color) q.set('color', color);
        q.set('page', page);
        q.set('limit', 24);
        const { data } = await API.get(`/products?${q.toString()}`);
        setProducts(data.products);
        setPages(data.pages);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [keyword, category, brand, material, sort, featured, bestSeller, newArrival, color, page]);

  const updateParam = (key, value) => {
    const np = new URLSearchParams(params);
    if (value) np.set(key, value); else np.delete(key);
    setParams(np);
    // Auto-close the mobile filter drawer after any selection so the
    // customer sees the filtered results immediately. No-op on desktop
    // because the sidebar isn't a drawer there — showFilter stays false
    // and the always-visible aside renders independently.
    setShowFilter(false);
  };

  const clearAll = () => { setParams({}); setShowFilter(false); };

  const headerLabel = keyword ? `Results for "${keyword}"` :
    category || brand || material || (featured && 'Featured Chairs') ||
    (bestSeller && 'Best Sellers') || (newArrival && 'New Arrivals') || 'All Chairs';

  // Build a search-friendly title from whichever filters are active so each
  // permutation of the shop URL gets its own indexable page in Google.
  // Sweet spot: 50–60 chars before truncation.
  const seoTitle = keyword
    ? `${keyword} — Shop Chairs Mumbai`
    : (brand && category) ? `${brand} ${category} — Mumbai`
    : category ? `${category} — Buy Online · Mumbai Manufacturer`
    : material ? `${material} Chairs — Talle Mumbai`
    : 'Shop All Chairs, Sofas & Tables — Talle Mumbai';
  const seoDescription = keyword
    ? `Shop ${keyword} at Talle Furniture Mart — Mumbai's own chair manufacturer. Free Mumbai delivery on ₹2,999+, COD, expert repair.`
    : `Browse ${headerLabel.toLowerCase()} — own-manufactured in Saki Naka, Mumbai. Free Mumbai delivery on ₹2,999+, COD available, 6-month warranty.`;

  const FilterPanel = (
    <div className="space-y-6 text-sm">
      <FilterGroup title="Category" items={categories} active={category} onChange={(v) => updateParam('category', v)} />
      {/* Brand filter intentionally hidden — Talle does its own manufacturing
          so every product carries the same brand and the filter would always
          collapse to one option. Re-enable if a second brand is ever added. */}
      <FilterGroup title="Material" items={materials} active={material} onChange={(v) => updateParam('material', v)} />
      <ColorFilter active={color} onChange={(v) => updateParam('color', v)} />
      <button onClick={clearAll} className="text-primary-500 hover:underline">Clear All Filters</button>
    </div>
  );

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-4 sm:py-6">
      <SEO
        title={seoTitle}
        description={seoDescription}
        path="/shop"
        keywords={[
          category && `${category.toLowerCase()} mumbai`,
          category && `buy ${category.toLowerCase()} online india`,
          category && `wholesale ${category.toLowerCase()} mumbai`,
          material && `${material.toLowerCase()} chair mumbai`,
          keyword && `${keyword.toLowerCase()} mumbai`,
          'office chair mumbai',
          'chair manufacturer saki naka',
          'best office chair india',
          'ergonomic chair mumbai',
          'chair price list mumbai',
          'bulk office chairs mumbai',
          'chair shop near me',
          'cod office chair mumbai',
        ].filter(Boolean).join(', ')}
      />
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4 sm:mb-6 border-b pb-3 sm:pb-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold truncate max-w-full">{headerLabel}</h1>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin shortcut — shown only when the logged-in user is an
              admin AND we're filtering by a specific category. Drops the
              admin straight into the New Product form with that category
              pre-selected, so populating a category from the live page is
              a single click. */}
          {user?.isAdmin && category && (
            <Link
              to={`/admin/products/new?category=${encodeURIComponent(category)}&from=/shop?category=${encodeURIComponent(category)}`}
              className="inline-flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white font-bold px-3 py-2 rounded text-xs sm:text-sm shadow"
              title={`Add a new product to "${category}"`}
            >
              <FiPlus size={14} /> Add to {category}
            </Link>
          )}
          <button onClick={() => setShowFilter(true)} className="lg:hidden flex items-center gap-1.5 border px-3 py-2 rounded text-sm">
            <FiFilter size={14} /> Filters
          </button>
          <select value={sort} onChange={(e) => updateParam('sort', e.target.value)} className="select-sm border rounded px-2 sm:px-3 py-2 text-xs sm:text-sm bg-white">
            <option value="">Sort: Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Name (A-Z)</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Empty-category nudge for admins. If a category has zero products
          and the viewer is an admin, surface a helpful CTA instead of just
          the generic 'No products found' message. */}
      {!loading && user?.isAdmin && category && products.length === 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 sm:p-6 mb-4 text-center">
          <p className="text-base sm:text-lg font-bold text-amber-800">
            "{category}" has no products yet
          </p>
          <p className="text-sm text-amber-700 mt-1">
            Customers landed here from the homepage and are seeing an empty page. Add at least one product to fill it.
          </p>
          <Link
            to={`/admin/products/new?category=${encodeURIComponent(category)}&from=/shop?category=${encodeURIComponent(category)}`}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-full shadow mt-3"
          >
            <FiPlus /> Add the first {category} product
          </Link>
        </div>
      )}

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
          {loading ? <Loader /> : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg">No products found</p>
              <button onClick={clearAll} className="btn-primary mt-4">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {products.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
              {pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {[...Array(pages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-10 h-10 rounded ${page === i + 1 ? 'bg-primary-500 text-white' : 'border hover:bg-gray-50'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
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
          <li><button onClick={() => onChange('')} className="text-xs text-primary-500 hover:underline mt-1">Clear</button></li>
        )}
      </ul>
    </div>
  );
}

// Colour filter — each row is a swatch + name pill. Single-select to keep
// the URL clean (one ?color= param). Reading the colour name avoids the
// "is that black or dark blue?" guess from a tiny circle.
function ColorFilter({ active, onChange }) {
  return (
    <div>
      <h3 className="font-bold mb-2">Color</h3>
      <ul className="space-y-1">
        {COMMON_COLORS.map((c) => {
          const bg = colorToBackground(c);
          const isActive = active.toLowerCase() === c.toLowerCase();
          return (
            <li key={c}>
              <label className="flex items-center gap-2 cursor-pointer hover:text-primary-500">
                <input
                  type="radio"
                  checked={isActive}
                  onChange={() => onChange(c)}
                  className="accent-primary-500"
                />
                <span
                  className={`w-4 h-4 rounded-full inline-block border ${isLightColor(c) ? 'border-gray-300' : 'border-white shadow-inner'}`}
                  style={bg ? { background: bg } : { background: 'repeating-linear-gradient(45deg,#e5e7eb 0 3px,#fff 3px 6px)' }}
                />
                {c}
              </label>
            </li>
          );
        })}
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
