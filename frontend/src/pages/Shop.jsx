import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import { FiFilter, FiX } from 'react-icons/fi';
import { allSubCategoryNames } from '../config/departments';
import SEO from '../components/SEO';
import { COMMON_COLORS, colorToBackground, isLightColor } from '../utils/colors';

const legacyCategories = ['Construction', 'Games', 'Pretend Play', 'Learning & Education', 'Vehicles', 'Active Play', 'Wooden Toys', 'Dolls', 'Action Figures', 'Ride Ons', 'Outdoor Toys', 'Books', 'Baby & Toddler'];
const categories = Array.from(new Set([...legacyCategories, ...allSubCategoryNames])).sort();
const brands = ['LEGO', 'Hot Wheels', 'Barbie', 'Nerf', 'Magna-Tiles', 'Crayola', 'Marvel', 'Transformers', 'Kinderkraft', 'Skillmatics', 'Bburago', 'Funskool'];
const ages = ['0-2 Years', '2-4 Years', '4-6 Years', '6-8 Years', '8 Years+'];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  const keyword = params.get('keyword') || '';
  const category = params.get('category') || '';
  const brand = params.get('brand') || '';
  const ageGroup = params.get('ageGroup') || '';
  const sort = params.get('sort') || '';
  const featured = params.get('featured') || '';
  const bestSeller = params.get('bestSeller') || '';
  const newArrival = params.get('newArrival') || '';
  const color = params.get('color') || '';

  useEffect(() => { setPage(1); }, [keyword, category, brand, ageGroup, sort, color]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const q = new URLSearchParams();
        if (keyword) q.set('keyword', keyword);
        if (category) q.set('category', category);
        if (brand) q.set('brand', brand);
        if (ageGroup) q.set('ageGroup', ageGroup);
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
  }, [keyword, category, brand, ageGroup, sort, featured, bestSeller, newArrival, color, page]);

  const updateParam = (key, value) => {
    const np = new URLSearchParams(params);
    if (value) np.set(key, value); else np.delete(key);
    setParams(np);
  };

  const clearAll = () => setParams({});

  const headerLabel = keyword ? `Results for "${keyword}"` :
    category || brand || ageGroup || (featured && 'Featured Toys') ||
    (bestSeller && 'Best Sellers') || (newArrival && 'New Arrivals') || 'All Toys';

  // Build a search-friendly title from whichever filters are active so each
  // permutation of the shop URL gets its own indexable page in Google.
  const seoTitle = keyword
    ? `${keyword} — Shop Toys Online`
    : (brand && category) ? `${brand} ${category} — Shop Online India`
    : brand ? `${brand} Toys — Buy Online in India`
    : category ? `${category} — Buy Online in India`
    : ageGroup ? `Toys for ${ageGroup} — Shop Online`
    : 'Shop All Toys Online — Best Prices in India';
  const seoDescription = keyword
    ? `Shop ${keyword} at Toy Mall. Best prices on toys in India with fast delivery and Cash on Delivery.`
    : `Browse ${headerLabel.toLowerCase()} at Toy Mall — top brands, age-appropriate toys, fast pan-India delivery, COD available, easy returns.`;

  const FilterPanel = (
    <div className="space-y-6 text-sm">
      <FilterGroup title="Category" items={categories} active={category} onChange={(v) => updateParam('category', v)} />
      <FilterGroup title="Brand" items={brands} active={brand} onChange={(v) => updateParam('brand', v)} />
      <FilterGroup title="Age Group" items={ages} active={ageGroup} onChange={(v) => updateParam('ageGroup', v)} />
      <ColorFilter active={color} onChange={(v) => updateParam('color', v)} />
      <button onClick={clearAll} className="text-primary-500 hover:underline">Clear All Filters</button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <SEO title={seoTitle} description={seoDescription} path="/shop" />
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4 sm:mb-6 border-b pb-3 sm:pb-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold truncate max-w-full">{headerLabel}</h1>
        <div className="flex items-center gap-2 sm:gap-3">
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

// Visual colour filter — clicking a swatch toggles it as the active filter.
// Single-select to keep the URL clean (one ?color= param). Common colours
// only; if a customer wants something exotic they can always type the
// keyword in the search bar.
function ColorFilter({ active, onChange }) {
  return (
    <div>
      <h3 className="font-bold mb-2">Color</h3>
      <div className="flex flex-wrap gap-1.5">
        {COMMON_COLORS.map((c) => {
          const bg = colorToBackground(c);
          const isActive = active.toLowerCase() === c.toLowerCase();
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(isActive ? '' : c)}
              title={c}
              aria-label={c}
              className={`relative w-8 h-8 rounded-full border-2 transition hover:scale-110 ${
                isActive ? 'border-primary-500 ring-2 ring-primary-200' : (isLightColor(c) ? 'border-gray-300' : 'border-white shadow-sm')
              }`}
              style={bg ? { background: bg } : { background: 'repeating-linear-gradient(45deg,#e5e7eb 0 4px,#fff 4px 8px)' }}
            >
              {isActive && (
                <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow text-xs">✓</span>
              )}
            </button>
          );
        })}
      </div>
      {active && (
        <button onClick={() => onChange('')} className="text-xs text-primary-500 hover:underline mt-2">
          Clear color
        </button>
      )}
    </div>
  );
}
