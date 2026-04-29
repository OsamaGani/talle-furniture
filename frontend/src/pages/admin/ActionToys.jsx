import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import Loader from '../../components/Loader';
import {
  FiEdit2, FiTrash2, FiPlus, FiSearch, FiPackage, FiZap,
  FiEye, FiAlertCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// Locked to the "Action Figures" category — that's what the public /action-toys page reads.
const ACTION_CATEGORY = 'Action Figures';

const FLAG_TABS = [
  { id: 'all',         label: 'All Action Toys', emoji: '🎯' },
  { id: 'newArrival',  label: 'New Arrivals',    emoji: '✨' },
  { id: 'bestSeller',  label: 'Best Sellers',    emoji: '⭐' },
  { id: 'featured',    label: 'Featured',        emoji: '🌟' },
  { id: 'outOfStock',  label: 'Out of Stock',    emoji: '⚠' },
];

export default function AdminActionToys() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [tab, setTab] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 200, category: ACTION_CATEGORY });
      if (keyword) params.set('keyword', keyword);
      if (tab === 'newArrival') params.set('newArrival', 'true');
      if (tab === 'bestSeller') params.set('bestSeller', 'true');
      if (tab === 'featured')   params.set('featured', 'true');
      const { data } = await API.get(`/products?${params.toString()}`);
      let list = data.products || [];
      if (tab === 'outOfStock') list = list.filter((p) => p.stock === 0);
      setProducts(list);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load action toys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [keyword, tab]);

  const remove = async (id) => {
    if (!confirm('Delete this action toy? This cannot be undone.')) return;
    try {
      await API.delete(`/products/${id}`);
      toast.success('Action toy deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const toggleFlag = async (product, field) => {
    try {
      await API.put(`/products/${product._id}`, { [field]: !product[field] });
      const labels = { newArrival: 'New Arrival', bestSeller: 'Best Seller', featured: 'Featured' };
      toast.success(`${labels[field]} ${!product[field] ? 'added' : 'removed'}`);
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const updateStock = async (product, delta) => {
    const next = Math.max(0, product.stock + delta);
    if (next === product.stock) return;
    try {
      await API.put(`/products/${product._id}`, { stock: next });
      load();
    } catch {
      toast.error('Stock update failed');
    }
  };

  // Stats — quick KPI cards across the top
  const totals = {
    count: products.length,
    inStock: products.filter((p) => p.stock > 0).length,
    outOfStock: products.filter((p) => p.stock === 0).length,
    onSale: products.filter((p) => p.discount > 0).length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            🎯 Action Toys
          </h1>
          <p className="text-sm text-gray-500">
            Manage products shown on the <Link to="/action-toys" className="text-primary-500 hover:underline">/action-toys</Link> page.
            Category is locked to <span className="font-semibold">{ACTION_CATEGORY}</span>.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            to="/admin/products/bulk"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2.5 rounded-md inline-flex items-center gap-2 text-sm"
          >
            <FiPackage /> Bulk Add
          </Link>
          <Link
            to={`/admin/products/new?category=${encodeURIComponent(ACTION_CATEGORY)}&from=/admin/action-toys`}
            className="btn-primary inline-flex items-center gap-2"
          >
            <FiPlus /> Add Action Toy
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Total" value={totals.count}      color="bg-blue-50 text-blue-700" />
        <KpiCard label="In Stock" value={totals.inStock} color="bg-emerald-50 text-emerald-700" />
        <KpiCard label="Out of Stock" value={totals.outOfStock} color="bg-red-50 text-red-700" />
        <KpiCard label="On Sale" value={totals.onSale} color="bg-orange-50 text-orange-700" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
        {FLAG_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border-2 transition flex items-center gap-2
              ${tab === t.id
                ? 'bg-primary-500 text-white border-primary-500 shadow-md'
                : 'bg-white text-gray-700 border-gray-200 hover:border-primary-500 hover:text-primary-500'}`}
          >
            <span>{t.emoji}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search action toys by name…"
            className="input pl-10"
          />
        </div>
        {(keyword || tab !== 'all') && (
          <button
            onClick={() => { setKeyword(''); setTab('all'); }}
            className="text-sm text-primary-500 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="bg-white border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-left">
              <tr>
                <th className="p-3">Image</th>
                <th>Name</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Stock</th>
                <th className="text-center">Collections</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-b last:border-0 hover:bg-gray-50 align-middle">
                  <td className="p-3">
                    <img
                      src={p.image || p.images?.[0] || 'https://via.placeholder.com/60'}
                      className="w-12 h-12 rounded object-contain bg-gray-50 p-1"
                      alt=""
                    />
                  </td>
                  <td>
                    <p className="font-medium max-w-xs truncate">{p.name}</p>
                    {p.ageGroup && <p className="text-xs text-gray-500">{p.ageGroup}</p>}
                  </td>
                  <td className="text-xs text-gray-600">{p.brand}</td>
                  <td>
                    <p className="font-semibold">₹{p.price.toFixed(2)}</p>
                    {p.discount > 0 && <p className="text-xs text-primary-500">-{p.discount}%</p>}
                  </td>
                  <td>
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => updateStock(p, -1)}
                        className="w-6 h-6 rounded border text-xs hover:bg-gray-100"
                        title="Decrement stock"
                      >−</button>
                      <span className={`min-w-[2rem] text-center font-semibold ${p.stock === 0 ? 'text-red-600' : ''}`}>
                        {p.stock}
                      </span>
                      <button
                        onClick={() => updateStock(p, +1)}
                        className="w-6 h-6 rounded border text-xs hover:bg-gray-100"
                        title="Increment stock"
                      >+</button>
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="inline-flex gap-1">
                      <FlagPill
                        active={p.newArrival}
                        label="✨ New"
                        onClick={() => toggleFlag(p, 'newArrival')}
                        activeColor="bg-yellow-400 text-gray-900"
                      />
                      <FlagPill
                        active={p.bestSeller}
                        label="⭐ Best"
                        onClick={() => toggleFlag(p, 'bestSeller')}
                        activeColor="bg-orange-500 text-white"
                      />
                      <FlagPill
                        active={p.featured}
                        label="🌟 Feat"
                        onClick={() => toggleFlag(p, 'featured')}
                        activeColor="bg-purple-500 text-white"
                      />
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Link
                        to={`/product/${p._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                        title="View on site"
                      >
                        <FiEye />
                      </Link>
                      <Link
                        to={`/admin/products/${p._id}/edit?from=/admin/action-toys`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <FiEdit2 />
                      </Link>
                      <button
                        onClick={() => remove(p._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <FiAlertCircle className="mx-auto text-3xl text-gray-300 mb-2" />
                    <p className="text-gray-500">
                      {keyword || tab !== 'all'
                        ? 'No action toys match these filters.'
                        : 'No action toys yet.'}
                    </p>
                    <Link
                      to={`/admin/products/new?category=${encodeURIComponent(ACTION_CATEGORY)}&from=/admin/action-toys`}
                      className="text-primary-500 hover:underline text-sm mt-2 inline-flex items-center gap-1"
                    >
                      <FiZap /> Add your first action toy
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, color }) {
  return (
    <div className={`${color} rounded-lg p-3 sm:p-4 border`}>
      <p className="text-xs uppercase tracking-wide font-semibold opacity-80">{label}</p>
      <p className="text-2xl font-extrabold mt-0.5">{value}</p>
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
