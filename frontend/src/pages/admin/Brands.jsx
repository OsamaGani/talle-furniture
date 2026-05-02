import { useEffect, useState } from 'react';
import API from '../../api/axios';
import Loader from '../../components/Loader';
import ImageUploader from '../../components/ImageUploader';
import toast from 'react-hot-toast';
import { FiTrash2, FiPlus, FiEdit2 } from 'react-icons/fi';
import { PLACEHOLDER } from '../../utils/imageUrl';

export default function AdminBrands() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', logo: '', description: '' });
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/brands');
      setList(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await API.put(`/brands/${editing}`, form);
      else await API.post('/brands', form);
      toast.success(editing ? 'Updated' : 'Created');
      setForm({ name: '', logo: '', description: '' });
      setEditing(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const edit = (b) => { setForm({ name: b.name, logo: b.logo, description: b.description }); setEditing(b._id); };
  const remove = async (id) => {
    if (!confirm('Delete?')) return;
    try { await API.delete(`/brands/${id}`); toast.success('Deleted'); load(); }
    catch (err) { toast.error('Failed'); }
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Brands</h1>
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="bg-white border rounded-lg overflow-x-auto">
          {loading ? <Loader /> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b text-left"><tr><th className="p-3">Logo</th><th>Name</th><th>Slug</th><th></th></tr></thead>
              <tbody>
                {list.map((b) => (
                  <tr key={b._id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-3"><img src={b.logo || PLACEHOLDER} className="w-10 h-10 rounded object-contain bg-gray-50" alt="" /></td>
                    <td className="font-medium">{b.name}</td>
                    <td className="text-gray-500">{b.slug}</td>
                    <td className="p-3 flex gap-1">
                      <button onClick={() => edit(b)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><FiEdit2 /></button>
                      <button onClick={() => remove(b._id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><FiTrash2 /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <form onSubmit={submit} className="bg-white border rounded-lg p-5 h-fit space-y-3">
          <h2 className="font-bold flex items-center gap-2"><FiPlus /> {editing ? 'Edit' : 'Add'} Brand</h2>
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <ImageUploader label="Brand Logo" value={form.logo} onChange={(img) => setForm({ ...form, logo: img })} />
          <div><label className="label">Description</label><textarea className="input" rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex gap-2">
            <button className="btn-primary flex-1" type="submit">{editing ? 'Update' : 'Create'}</button>
            {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: '', logo: '', description: '' }); }} className="border px-3 rounded">Cancel</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
