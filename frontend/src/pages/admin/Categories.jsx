import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import Loader from '../../components/Loader';
import ImageUploader from '../../components/ImageUploader';
import toast from 'react-hot-toast';
import { FiTrash2, FiPlus, FiEdit2, FiSearch, FiHome, FiStar, FiPackage, FiExternalLink } from 'react-icons/fi';
import { PLACEHOLDER } from '../../utils/imageUrl';

export default function AdminCategories() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [form, setForm] = useState({ name: '', image: '', description: '', featuredOnHome: false, homeOrder: 999 });
  const [editing, setEditing] = useState(null);
  // Bulk-select state — same pattern as admin/Products.
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Product count per category. Fetched once (all products, name+category
  // only) and aggregated client-side — one round-trip instead of N category
  // counts. Used to render the "23 products" badge next to each row.
  const [counts, setCounts] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: cats }, { data: prodResp }] = await Promise.all([
        API.get('/categories'),
        API.get('/products?limit=500'),
      ]);
      setList(cats);
      const map = {};
      for (const p of (prodResp.products || [])) {
        if (!p.category) continue;
        map[p.category] = (map[p.category] || 0) + 1;
      }
      setCounts(map);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  // Filter visible rows. Live search by name (case-insensitive).
  const visible = keyword
    ? list.filter((c) => (c.name || '').toLowerCase().includes(keyword.toLowerCase()))
    : list;

  // Reconcile selection against currently visible rows on every refresh /
  // search so the toolbar can't claim to act on hidden items.
  useEffect(() => {
    const visibleIds = new Set(visible.map((c) => c._id));
    setSelected((prev) => {
      const next = new Set();
      for (const id of prev) if (visibleIds.has(id)) next.add(id);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, keyword]);

  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const toggleAllVisible = () => {
    setSelected((prev) => {
      if (prev.size === visible.length && visible.length > 0) return new Set();
      return new Set(visible.map((c) => c._id));
    });
  };

  const bulkDelete = async () => {
    const n = selected.size;
    if (n === 0) return;
    if (!confirm(`Delete ${n} categor${n === 1 ? 'y' : 'ies'}? This cannot be undone.`)) return;
    setBulkDeleting(true);
    let ok = 0, fail = 0;
    const ids = Array.from(selected);
    for (let i = 0; i < ids.length; i += 8) {
      const batch = ids.slice(i, i + 8);
      const results = await Promise.allSettled(batch.map((id) => API.delete(`/categories/${id}`)));
      for (const r of results) (r.status === 'fulfilled' ? ok++ : fail++);
    }
    setBulkDeleting(false);
    setSelected(new Set());
    if (ok > 0) toast.success(`Deleted ${ok} categor${ok === 1 ? 'y' : 'ies'}`);
    if (fail > 0) toast.error(`${fail} delete${fail === 1 ? '' : 's'} failed`);
    load();
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await API.put(`/categories/${editing}`, form);
      else await API.post('/categories', form);
      toast.success(editing ? 'Updated' : 'Created');
      setForm({ name: '', image: '', description: '', featuredOnHome: false, homeOrder: 999 });
      setEditing(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const edit = (c) => {
    setForm({
      name: c.name,
      image: c.image,
      description: c.description,
      featuredOnHome: !!c.featuredOnHome,
      homeOrder: typeof c.homeOrder === 'number' ? c.homeOrder : 999,
    });
    setEditing(c._id);
  };

  // Inline toggle for "Show on Homepage" — clicked from the table row so
  // the admin can flip categories on/off the homepage in one click without
  // opening the full edit form.
  const toggleHome = async (c) => {
    try {
      await API.put(`/categories/${c._id}`, { featuredOnHome: !c.featuredOnHome });
      toast.success(`${c.name} ${!c.featuredOnHome ? 'added to' : 'removed from'} homepage`);
      load();
    } catch (err) { toast.error('Failed'); }
  };

  const remove = async (id) => {
    if (!confirm('Delete?')) return;
    try { await API.delete(`/categories/${id}`); toast.success('Deleted'); load(); }
    catch (err) { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl md:text-3xl font-bold">Categories <span className="text-sm font-normal text-gray-500">({list.length})</span></h1>
        <div className="relative flex-1 max-w-xs">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search categories…"
            className="input pl-10"
          />
        </div>
      </div>

      {/* Bulk-action toolbar — only renders when at least one is ticked. */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-red-50 border-2 border-red-200 rounded-lg px-4 py-3 mb-3 animate-fadeIn">
          <p className="text-sm font-semibold text-red-800">
            {selected.size} categor{selected.size === 1 ? 'y' : 'ies'} selected
          </p>
          <div className="flex gap-2">
            <button onClick={() => setSelected(new Set())} className="text-sm font-semibold text-gray-700 hover:text-gray-900 px-3 py-1.5">
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

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="bg-white border rounded-lg overflow-x-auto">
          {loading ? <Loader /> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b text-left">
                <tr>
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      aria-label="Select all visible categories"
                      checked={visible.length > 0 && selected.size === visible.length}
                      onChange={toggleAllVisible}
                      className="accent-primary-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="p-3">Image</th>
                  <th>Name</th>
                  <th className="text-center">Products</th>
                  <th className="text-center">On Home</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr key={c._id} className={`border-b last:border-0 hover:bg-gray-50 ${selected.has(c._id) ? 'bg-red-50/40' : ''}`}>
                    <td className="p-3 w-8">
                      <input
                        type="checkbox"
                        aria-label={`Select ${c.name}`}
                        checked={selected.has(c._id)}
                        onChange={() => toggleOne(c._id)}
                        className="accent-primary-500 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="p-3">
                      <img src={c.image || PLACEHOLDER} className="w-10 h-10 rounded object-cover" alt="" />
                    </td>
                    <td>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{c.slug}</p>
                    </td>
                    <td className="text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                        (counts[c.name] || 0) > 0
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        <FiPackage size={11} /> {counts[c.name] || 0}
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => toggleHome(c)}
                        title={c.featuredOnHome
                          ? `On homepage (order ${c.homeOrder}) — click to remove`
                          : 'Click to feature on homepage Shop By Category rail'}
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border transition ${
                          c.featuredOnHome
                            ? 'bg-amber-100 text-amber-700 border-amber-300 shadow-sm'
                            : 'bg-white text-gray-400 border-gray-200 hover:border-amber-300 hover:text-amber-700'
                        }`}
                      >
                        {c.featuredOnHome ? <FiStar className="fill-current" /> : <FiStar />}
                        {c.featuredOnHome ? `#${c.homeOrder}` : 'Off'}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 items-center justify-end">
                        {/* Direct workflow: add a chair to THIS category in
                            one click — ProductForm reads ?category= from
                            the URL and pre-fills the dropdown. */}
                        <Link
                          to={`/admin/products/new?category=${encodeURIComponent(c.name)}&from=/admin/categories`}
                          title={`Add a new chair to "${c.name}"`}
                          className="inline-flex items-center gap-1 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold px-2.5 py-1.5 rounded shadow-sm"
                        >
                          <FiPlus size={12} /> Chair
                        </Link>
                        {/* See the public category page customers land on
                            when they click this tile on the homepage. */}
                        <a
                          href={`/shop?category=${encodeURIComponent(c.name)}`}
                          target="_blank" rel="noopener noreferrer"
                          title="Open the public category page in a new tab"
                          className="p-2 text-emerald-700 hover:bg-emerald-50 rounded"
                        >
                          <FiExternalLink />
                        </a>
                        <button onClick={() => edit(c)} title="Edit category" className="p-2 text-blue-600 hover:bg-blue-50 rounded"><FiEdit2 /></button>
                        <button onClick={() => remove(c._id)} title="Delete category" className="p-2 text-red-600 hover:bg-red-50 rounded"><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr><td colSpan="6" className="text-center py-10 text-gray-500">
                    {keyword ? `No categories match "${keyword}"` : 'No categories yet — add one on the right.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <form onSubmit={submit} className="bg-white border rounded-lg p-5 h-fit space-y-3">
          <h2 className="font-bold flex items-center gap-2"><FiPlus /> {editing ? 'Edit' : 'Add'} Category</h2>
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <ImageUploader label="Category Image" value={form.image} onChange={(img) => setForm({ ...form, image: img })} />
          <div><label className="label">Description</label><textarea className="input" rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>

          {/* Homepage tile controls — tick to surface this category in the
              public "Shop By Category" rail. homeOrder controls position
              (lower = earlier; up to 8 categories shown). */}
          <div className="border-t pt-3 space-y-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featuredOnHome}
                onChange={(e) => setForm({ ...form, featuredOnHome: e.target.checked })}
                className="accent-primary-500 w-4 h-4 mt-0.5"
              />
              <div className="text-sm">
                <span className="font-semibold flex items-center gap-1.5 text-gray-900"><FiHome size={14} /> Feature on Homepage</span>
                <p className="text-xs text-gray-500 mt-0.5">Show this category as a tile in the "Shop By Category" rail on the homepage.</p>
              </div>
            </label>
            {form.featuredOnHome && (
              <div>
                <label className="label">Display order</label>
                <input
                  type="number" min="0" max="999"
                  className="input"
                  value={form.homeOrder}
                  onChange={(e) => setForm({ ...form, homeOrder: Number(e.target.value) || 999 })}
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first. Up to 8 categories shown on the homepage.</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button className="btn-primary flex-1" type="submit">{editing ? 'Update' : 'Create'}</button>
            {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: '', image: '', description: '', featuredOnHome: false, homeOrder: 999 }); }} className="border px-3 rounded">Cancel</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
