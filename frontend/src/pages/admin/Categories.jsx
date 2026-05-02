import { useEffect, useState } from 'react';
import API from '../../api/axios';
import Loader from '../../components/Loader';
import ImageUploader from '../../components/ImageUploader';
import toast from 'react-hot-toast';
import { FiTrash2, FiPlus, FiEdit2 } from 'react-icons/fi';
import { PLACEHOLDER } from '../../utils/imageUrl';

export default function AdminCategories() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', image: '', description: '' });
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/categories');
      setList(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

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
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Categories</h1>
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="bg-white border rounded-lg overflow-x-auto">
          {loading ? <Loader /> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b text-left">
                <tr><th className="p-3">Image</th><th>Name</th><th>Slug</th><th></th></tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c._id} className="border-b last:border-0 hover:bg-gray-50">
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
