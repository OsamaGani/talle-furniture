import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import Loader from '../../components/Loader';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiPackage, FiStar, FiAward, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import QuickAddModal from '../../components/QuickAddModal';
import { allSubCategoryNames } from '../../config/departments';
import { resolveImage } from '../../utils/imageUrl';

const TAB_TO_COLLECTION = {
  newArrival: { key: 'newArrival', label: 'New Arrivals' },
  bestSeller: { key: 'bestSeller', label: 'Best Sellers' },
  featured:   { key: 'featured',   label: 'Featured' },
  onDeal:     { key: 'onDeal',     label: "Today's Deals" },
  all:        { key: 'newArrival', label: 'New Arrivals' }, // default for "all" tab
};

const COLLECTION_TABS = [
  { id: 'all',         label: 'All Products',  emoji: '📦' },
  { id: 'newArrival',  label: 'New Arrivals',  emoji: '✨' },
  { id: 'bestSeller',  label: 'Best Sellers',  emoji: '⭐' },
  { id: 'featured',    label: 'Featured',      emoji: '🌟' },
  { id: 'onDeal',      label: "Today's Deals", emoji: '⚡' },
];

const QUICK_CATEGORIES = Array.from(new Set(allSubCategoryNames)).sort();

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [tab, setTab] = useState('all');
  const [category, setCategory] = useState('');
  const [counts, setCounts] = useState({ all: 0, newArrival: 0, bestSeller: 0, featured: 0, onDeal: 0 });
  const [quickOpen, setQuickOpen] = useState(false);
  // Bulk-select state. Set<string> of product._id values that are ticked.
  // Cleared whenever the visible list changes so we never accidentally
  // act on a selection from a previous filter / tab.
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 200 });
      if (keyword) params.set('keyword', keyword);
      if (category) params.set('category', category);
      if (tab === 'newArrival') params.set('newArrival', 'true');
      if (tab === 'bestSeller') params.set('bestSeller', 'true');
      if (tab === 'featured')   params.set('featured', 'true');
      if (tab === 'onDeal')     params.set('onDeal', 'true');

      const { data } = await API.get(`/products?${params.toString()}`);
      setProducts(data.products);

      // Load counts in parallel for tab badges
      const [allRes, newRes, bestRes, featRes, dealRes] = await Promise.all([
        API.get('/products?limit=1'),
        API.get('/products?newArrival=true&limit=1'),
        API.get('/products?bestSeller=true&limit=1'),
        API.get('/products?featured=true&limit=1'),
        API.get('/products?onDeal=true&limit=1'),
      ]);
      setCounts({
        all: allRes.data.total,
        newArrival: newRes.data.total,
        bestSeller: bestRes.data.total,
        featured: featRes.data.total,
        onDeal: dealRes.data.total,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [keyword, tab, category]);

  // Whenever the visible product list changes, drop any selection that no
  // longer matches a visible row. Keeps the bulk-action toolbar honest.
  useEffect(() => {
    const visibleIds = new Set(products.map((p) => p._id));
    setSelected((prev) => {
      const next = new Set();
      for (const id of prev) if (visibleIds.has(id)) next.add(id);
      return next;
    });
  }, [products]);

  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const toggleAllVisible = () => {
    setSelected((prev) => {
      if (prev.size === products.length && products.length > 0) return new Set();
      return new Set(products.map((p) => p._id));
    });
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    const n = selected.size;
    if (!confirm(`Delete ${n} product${n === 1 ? '' : 's'}? This cannot be undone.`)) return;
    setBulkDeleting(true);
    let ok = 0;
    let fail = 0;
    // Fire deletes in parallel but cap concurrency to ~8 so we don't
    // hammer the backend with 200 simultaneous requests on big cleanups.
    const ids = Array.from(selected);
    const CONCURRENCY = 8;
    for (let i = 0; i < ids.length; i += CONCURRENCY) {
      const batch = ids.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(batch.map((id) => API.delete(`/products/${id}`)));
      for (const r of results) (r.status === 'fulfilled' ? ok++ : fail++);
    }
    setBulkDeleting(false);
    setSelected(new Set());
    if (ok > 0) toast.success(`Deleted ${ok} product${ok === 1 ? '' : 's'}`);
    if (fail > 0) toast.error(`${fail} delete${fail === 1 ? '' : 's'} failed`);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await API.delete(`/products/${id}`);
      toast.success('Product deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const FLAG_LABELS = {
    newArrival: 'New Arrival',
    bestSeller: 'Best Seller',
    featured: 'Featured',
    onDeal: "Today's Deal",
  };

  const toggleFlag = async (product, field) => {
    try {
      await API.put(`/products/${product._id}`, { [field]: !product[field] });
      toast.success(`${FLAG_LABELS[field] || field} ${!product[field] ? 'added' : 'removed'}`);
      load();
    } catch (err) {
      toast.error('Failed');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h1 className="text-2xl md:text-3xl font-bold">Products</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setQuickOpen(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-4 py-2.5 rounded-md inline-flex items-center gap-2 text-sm shadow"
          >
            <FiZap /> Quick Add to {TAB_TO_COLLECTION[tab].label}
          </button>
          <Link to="/admin/products/bulk" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2.5 rounded-md inline-flex items-center gap-2 text-sm">
            <FiPackage /> Bulk Add
          </Link>
          <Link to="/admin/products/new" className="btn-primary inline-flex items-center gap-2"><FiPlus /> Add Product</Link>
        </div>
      </div>

      <QuickAddModal
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        onSaved={load}
        collection={TAB_TO_COLLECTION[tab].key}
        collectionLabel={TAB_TO_COLLECTION[tab].label}
      />

      {/* Collection tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-3">
        {COLLECTION_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border-2 transition flex items-center gap-2
              ${tab === t.id
                ? 'bg-primary-500 text-white border-primary-500 shadow-md'
                : 'bg-white text-gray-700 border-gray-200 hover:border-primary-500 hover:text-primary-500'}`}
          >
            <span>{t.emoji}</span> {t.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${tab === t.id ? 'bg-white/20' : 'bg-gray-100'}`}>
              {counts[t.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search by name..."
            className="input pl-10"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input max-w-xs">
          <option value="">All Categories</option>
          {QUICK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {(category || keyword || tab !== 'all') && (
          <button onClick={() => { setKeyword(''); setCategory(''); setTab('all'); }} className="text-sm text-primary-500 hover:underline">
            Clear all
          </button>
        )}
      </div>

      {/* Bulk-action toolbar — only renders when at least one product is ticked.
          Lets the admin wipe stale / off-brand products in one shot instead of
          clicking 30 delete buttons one at a time. */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-red-50 border-2 border-red-200 rounded-lg px-4 py-3 mb-3 animate-fadeIn">
          <p className="text-sm font-semibold text-red-800">
            {selected.size} product{selected.size === 1 ? '' : 's'} selected
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setSelected(new Set())}
              className="text-sm font-semibold text-gray-700 hover:text-gray-900 px-3 py-1.5"
            >
              Clear
            </button>
            <button
              onClick={bulkDelete}
              disabled={bulkDeleting}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-md inline-flex items-center gap-2 text-sm shadow disabled:opacity-60"
            >
              <FiTrash2 /> {bulkDeleting ? 'Deleting…' : `Delete ${selected.size} selected`}
            </button>
          </div>
        </div>
      )}

      {loading ? <Loader /> : (
        <div className="bg-white border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-left">
              <tr>
                <th className="p-3 w-8">
                  <input
                    type="checkbox"
                    aria-label="Select all visible products"
                    checked={products.length > 0 && selected.size === products.length}
                    onChange={toggleAllVisible}
                    className="accent-primary-500 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="p-3">Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th className="text-center">Collections</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p._id}
                  className={`border-b last:border-0 hover:bg-gray-50 ${selected.has(p._id) ? 'bg-red-50/40' : ''}`}
                >
                  <td className="p-3 w-8">
                    <input
                      type="checkbox"
                      aria-label={`Select ${p.name}`}
                      checked={selected.has(p._id)}
                      onChange={() => toggleOne(p._id)}
                      className="accent-primary-500 w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="p-3">
                    <img src={resolveImage(p.image || p.images?.[0])} className="w-12 h-12 rounded object-contain bg-gray-50 p-1" alt="" />
                  </td>
                  <td>
                    <p className="font-medium max-w-xs truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.brand}</p>
                  </td>
                  <td>{p.category}</td>
                  <td>
                    <p className="font-semibold">₹{p.price.toFixed(2)}</p>
                    {p.discount > 0 && <p className="text-xs text-primary-500">-{p.discount}%</p>}
                  </td>
                  <td className={p.stock === 0 ? 'text-red-600 font-bold' : ''}>{p.stock}</td>

                  {/* Inline toggle pills */}
                  <td className="text-center">
                    <div className="inline-flex gap-1">
                      <FlagPill active={p.newArrival} label="✨ New" onClick={() => toggleFlag(p, 'newArrival')} activeColor="bg-yellow-400 text-gray-900" />
                      <FlagPill active={p.bestSeller} label="⭐ Best" onClick={() => toggleFlag(p, 'bestSeller')} activeColor="bg-orange-500 text-white" />
                      <FlagPill active={p.featured}   label="🌟 Feat" onClick={() => toggleFlag(p, 'featured')}   activeColor="bg-purple-500 text-white" />
                      <FlagPill active={p.onDeal}     label="⚡ Deal" onClick={() => toggleFlag(p, 'onDeal')}     activeColor="bg-red-500 text-white" />
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="flex gap-1">
                      <Link to={`/admin/products/${p._id}/edit`} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><FiEdit2 /></Link>
                      <button onClick={() => remove(p._id)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete"><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan="8" className="text-center py-12">
                  <p className="text-gray-500">No products in this view.</p>
                  <Link to="/admin/products/new" className="text-primary-500 hover:underline text-sm mt-2 inline-block">+ Add a product</Link>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FlagPill({ active, label, onClick, activeColor }) {
  return (
    <button
      onClick={onClick}
      title={`Click to ${active ? 'remove from' : 'add to'} this collection`}
      className={`text-[11px] font-semibold px-2 py-1 rounded-full border transition
        ${active ? `${activeColor} border-transparent shadow` : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-700'}`}
    >
      {label}
    </button>
  );
}
