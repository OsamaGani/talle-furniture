import { useEffect, useState } from 'react';
import API from '../../api/axios';
import Loader from '../../components/Loader';
import ImageUploader from '../../components/ImageUploader';
import toast from 'react-hot-toast';
import { FiTrash2, FiPlus, FiEdit2, FiSearch } from 'react-icons/fi';
import { PLACEHOLDER } from '../../utils/imageUrl';

export default function AdminCategories() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [form, setForm] = useState({ name: '', image: '', description: '' });
  const [editing, setEditing] = useState(null);
  // Bulk-select state — same pattern as admin/Products.
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/categories');
      setList(data);
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
      setForm({ name: '', image: '', description: '' });
      setEditing(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const edit = (c) => { setForm({ name: c.name, image: c.image, description: c.description }); setEditing(c._id); };

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
                  <th>Slug</th>
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
                    <td className="font-medium">{c.name}</td>
                    <td className="text-gray-500">{c.slug}</td>
                    <td className="p-3 flex gap-1">
                      <button onClick={() => edit(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><FiEdit2 /></button>
                      <button onClick={() => remove(c._id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><FiTrash2 /></button>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr><td colSpan="5" className="text-center py-10 text-gray-500">
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
          <div className="flex gap-2">
            <button className="btn-primary flex-1" type="submit">{editing ? 'Update' : 'Create'}</button>
            {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: '', image: '', description: '' }); }} className="border px-3 rounded">Cancel</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
