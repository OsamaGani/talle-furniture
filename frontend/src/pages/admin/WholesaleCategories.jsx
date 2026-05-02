import { useEffect, useState } from 'react';
import API from '../../api/axios';
import Loader from '../../components/Loader';
import ImageUploader from '../../components/ImageUploader';
import toast from 'react-hot-toast';
import { FiTrash2, FiPlus, FiEdit2, FiArrowUp, FiArrowDown, FiEye, FiEyeOff, FiExternalLink } from 'react-icons/fi';
import { PLACEHOLDER } from '../../utils/imageUrl';

const emptyForm = { name: '', image: '', link: '', order: 0, active: true };

export default function AdminWholesaleCategories() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/wholesale-categories/all');
      setList(data);
    } catch (e) {
      toast.error('Failed to load wholesale categories');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      if (editing) {
        await API.put(`/wholesale-categories/${editing}`, form);
        toast.success('Tile updated');
      } else {
        await API.post('/wholesale-categories', form);
        toast.success('Tile added');
      }
      resetForm();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const edit = (c) => {
    setForm({
      name: c.name || '',
      image: c.image || '',
      link: c.link || '',
      order: c.order ?? 0,
      active: c.active !== false,
    });
    setEditing(c._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this tile? This cannot be undone.')) return;
    try {
      await API.delete(`/wholesale-categories/${id}`);
      toast.success('Deleted');
      if (editing === id) resetForm();
      load();
    } catch {
      toast.error('Failed');
    }
  };

  const toggleActive = async (c) => {
    try {
      await API.put(`/wholesale-categories/${c._id}`, { active: !c.active });
      load();
    } catch {
      toast.error('Failed');
    }
  };

  const move = async (c, direction) => {
    const newOrder = (c.order ?? 0) + direction;
    try {
      await API.put(`/wholesale-categories/${c._id}`, { order: newOrder });
      load();
    } catch {
      toast.error('Failed to reorder');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Hot Wholesale Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            These tiles appear on the public <a href="/wholesale" target="_blank" rel="noreferrer" className="text-primary-500 hover:underline">/wholesale</a> page.
          </p>
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
          {list.length} tile{list.length === 1 ? '' : 's'} · {list.filter((c) => c.active).length} active
        </span>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Table */}
        <div className="bg-white border rounded-lg overflow-x-auto">
          {loading ? (
            <Loader />
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-2">📦</p>
              <p className="font-semibold">No tiles yet</p>
              <p className="text-sm">Add your first wholesale category tile using the form on the right.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b text-left">
                <tr>
                  <th className="p-3 w-16">Order</th>
                  <th className="p-3 w-20">Image</th>
                  <th className="p-3">Name</th>
                  <th className="p-3 hidden md:table-cell">Link</th>
                  <th className="p-3 w-24">Status</th>
                  <th className="p-3 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c, idx) => (
                  <tr key={c._id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-700 w-5 text-center">{c.order ?? 0}</span>
                        <div className="flex flex-col">
                          <button
                            onClick={() => move(c, -1)}
                            disabled={idx === 0}
                            title="Move up"
                            className="p-0.5 text-gray-500 hover:text-primary-500 disabled:opacity-30"
                          >
                            <FiArrowUp size={12} />
                          </button>
                          <button
                            onClick={() => move(c, +1)}
                            disabled={idx === list.length - 1}
                            title="Move down"
                            className="p-0.5 text-gray-500 hover:text-primary-500 disabled:opacity-30"
                          >
                            <FiArrowDown size={12} />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <img
                        src={c.image || PLACEHOLDER}
                        className="w-14 h-14 rounded object-cover border"
                        alt={c.name}
                      />
                    </td>
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 hidden md:table-cell text-xs text-gray-500 truncate max-w-[220px]">
                      {c.link ? (
                        <a href={c.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary-500">
                          {c.link} <FiExternalLink size={11} />
                        </a>
                      ) : (
                        <span className="italic">/shop?category={c.name}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => toggleActive(c)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                          c.active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {c.active ? <><FiEye size={11} /> Visible</> : <><FiEyeOff size={11} /> Hidden</>}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => edit(c)} title="Edit" className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                          <FiEdit2 />
                        </button>
                        <button onClick={() => remove(c._id)} title="Delete" className="p-2 text-red-600 hover:bg-red-50 rounded">
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Form */}
        <form onSubmit={submit} className="bg-white border rounded-lg p-5 h-fit space-y-3 lg:sticky lg:top-32">
          <div className="flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <FiPlus /> {editing ? 'Edit Tile' : 'Add Tile'}
            </h2>
            {editing && (
              <button type="button" onClick={resetForm} className="text-xs text-gray-500 hover:underline">
                + New
              </button>
            )}
          </div>

          <div>
            <label className="label">Name *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. LEGO Sets"
            />
          </div>

          <ImageUploader
            label="Tile Image"
            value={form.image}
            onChange={(img) => setForm({ ...form, image: img })}
          />

          <div>
            <label className="label">Link <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              className="input"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="/shop?brand=LEGO"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to default to <code className="text-[10px] bg-gray-100 px-1 rounded">/shop?category={form.name || 'Name'}</code>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Sort Order</label>
              <input
                type="number"
                className="input"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Visibility</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, active: !form.active })}
                className={`w-full input flex items-center justify-center gap-2 font-semibold ${
                  form.active ? 'text-green-700' : 'text-gray-600'
                }`}
              >
                {form.active ? <><FiEye /> Visible</> : <><FiEyeOff /> Hidden</>}
              </button>
            </div>
          </div>

          {/* Live preview */}
          {form.image && (
            <div>
              <label className="label">Preview</label>
              <div className="relative aspect-square rounded-xl overflow-hidden shadow border">
                <img src={form.image} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-3">
                  <h3 className="text-white font-bold text-base drop-shadow">{form.name || 'Tile name'}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button className="btn-primary flex-1" type="submit" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update Tile' : 'Add Tile'}
            </button>
            {editing && (
              <button type="button" onClick={resetForm} className="border px-3 rounded">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
