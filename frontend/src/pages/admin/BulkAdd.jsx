import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiUpload, FiSave, FiPackage } from 'react-icons/fi';

const categories = [
  'Executive Chairs', 'Ergonomic Chairs', 'Workstation Chairs', 'Visitor Chairs',
  'Mesh Chairs', 'Premium / Ergohuman', 'Cushion Series', 'Training Room Chairs',
  'Tandem Seating', 'Pro Gaming Chairs', 'Recliners', 'Lounge Chairs',
  'Accent Chairs', 'Dining Chairs', 'Bar Stools', 'Cafe Chairs',
  'Cafeteria Chairs', 'Restaurant Chairs', 'Folding Chairs', 'Garden Chairs',
  'Banquet Chairs', 'Salon Chairs', 'Bean Bags',
  '1-Seater Sofa', '2-Seater Sofa', '3-Seater Sofa',
  'L-Shaped Couch', 'Curved Couch', 'Lounge Couch',
  'Wooden Dining Tables', 'Coffee Tables', 'Side Tables', 'Center Tables',
  'Consoles', 'Bar Trolleys', 'Conference Tables', 'Office Desks',
  'General',
];
const materialOptions = ['', 'Mesh', 'Leather', 'Faux Leather', 'Fabric', 'Plastic', 'Wood', 'Metal', 'Cushion'];

const blankRow = () => ({
  name: '', description: '', price: '', discount: 0,
  stock: 0, image: '', uploading: false,
});

// Locked canonical brand list — Talle does its own manufacturing so the
// only sensible values are 'Talle' (in-house) and 'Other' (one-off
// external supply). Static so leftover toy-brand rows in the DB never
// pollute this dropdown.
const FURNITURE_BRANDS = ['Talle', 'Other'];

export default function BulkAdd() {
  const navigate = useNavigate();
  // Brands locked to the canonical list — no API call, no Toy Mall leftovers.
  const [brands] = useState(FURNITURE_BRANDS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Shared settings — applied to all rows. Default brand to 'Talle' so
  // the admin doesn't have to pick it every time.
  const [shared, setShared] = useState({
    category: '',
    brand: 'Talle',
    material: '',
    featured: false,
    bestSeller: false,
    newArrival: true,
  });

  const [rows, setRows] = useState([blankRow(), blankRow(), blankRow()]);

  const updateRow = (i, patch) => {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((rs) => [...rs, blankRow()]);
  const removeRow = (i) => setRows((rs) => rs.length === 1 ? [blankRow()] : rs.filter((_, idx) => idx !== i));
  const duplicateRow = (i) => {
    setRows((rs) => {
      const copy = [...rs];
      copy.splice(i + 1, 0, { ...rs[i], name: rs[i].name + ' (copy)' });
      return copy;
    });
  };

  const uploadImage = async (i, file) => {
    if (!file) return;
    updateRow(i, { uploading: true });
    const fd = new FormData();
    fd.append('image', file);
    try {
      const { data } = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateRow(i, { image: data.url, uploading: false });
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Upload failed');
      updateRow(i, { uploading: false });
    }
  };

  const validate = () => {
    if (!shared.category || !shared.brand) {
      toast.error('Pick category and brand at the top first');
      return false;
    }
    const validRows = rows.filter((r) => r.name.trim() && +r.price > 0);
    if (validRows.length === 0) {
      toast.error('Add at least one product (name + price required)');
      return false;
    }
    return validRows;
  };

  const submit = async () => {
    const validRows = validate();
    if (!validRows) return;
    setSaving(true);
    let success = 0;
    let failed = 0;
    for (const r of validRows) {
      try {
        await API.post('/products', {
          name: r.name.trim(),
          description: r.description.trim() || `${r.name} - ${shared.brand} ${shared.category}`,
          brand: shared.brand,
          category: shared.category,
          material: shared.material,
          price: +r.price,
          discount: +r.discount,
          stock: +r.stock || 10,
          image: r.image,
          images: r.image ? [r.image] : [],
          featured: shared.featured,
          bestSeller: shared.bestSeller,
          newArrival: shared.newArrival,
        });
        success++;
      } catch (err) {
        failed++;
        console.error(`Failed: ${r.name}`, err);
      }
    }
    setSaving(false);
    if (success > 0) toast.success(`✅ Added ${success} products`);
    if (failed > 0) toast.error(`❌ ${failed} failed — check console`);
    if (failed === 0) navigate('/admin/products');
  };

  if (loading) return <Loader />;

  const validCount = rows.filter((r) => r.name.trim() && +r.price > 0).length;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><FiPackage /> Bulk Add Products</h1>
          <p className="text-sm text-gray-600">Add many products to one category in one go</p>
        </div>
      </div>

      {/* Step 1: Shared settings */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-purple-500 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm">1</span>
          <h2 className="font-bold">Common settings (apply to all products below)</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="label">Category *</label>
            <select className="input" value={shared.category} onChange={(e) => setShared({ ...shared, category: e.target.value })} required>
              <option value="">-- Pick category --</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Brand *</label>
            <select className="input" value={shared.brand} onChange={(e) => setShared({ ...shared, brand: e.target.value })} required>
              <option value="">-- Pick brand --</option>
              {brands.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Material</label>
            <select className="input" value={shared.material} onChange={(e) => setShared({ ...shared, material: e.target.value })}>
              {materialOptions.map((m) => <option key={m} value={m}>{m || '-- Any material --'}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={shared.newArrival} onChange={(e) => setShared({ ...shared, newArrival: e.target.checked })} className="accent-primary-500 w-4 h-4" />
            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-semibold">✨ New Arrival</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={shared.bestSeller} onChange={(e) => setShared({ ...shared, bestSeller: e.target.checked })} className="accent-primary-500 w-4 h-4" />
            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-semibold">⭐ Best Seller</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={shared.featured} onChange={(e) => setShared({ ...shared, featured: e.target.checked })} className="accent-primary-500 w-4 h-4" />
            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-semibold">🌟 Featured</span>
          </label>
        </div>
      </div>

      {/* Step 2: Rows */}
      <div className="bg-white border rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-purple-500 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm">2</span>
          <h2 className="font-bold">Products ({validCount} ready · {rows.length} rows)</h2>
        </div>

        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start border rounded-lg p-3 bg-gray-50/50">
              <div className="col-span-12 sm:col-span-1 flex sm:flex-col items-center sm:items-start justify-between">
                <span className="text-xs text-gray-500 font-mono">#{i + 1}</span>
              </div>

              {/* Image */}
              <div className="col-span-3 sm:col-span-2">
                <label className="block aspect-square bg-white border-2 border-dashed border-gray-300 hover:border-primary-500 rounded cursor-pointer relative overflow-hidden">
                  {r.image ? (
                    <img src={r.image} className="w-full h-full object-contain p-1" alt="" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-xs">
                      {r.uploading ? <span>...</span> : <><FiUpload /><span className="mt-1">Photo</span></>}
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(i, e.target.files[0])} disabled={r.uploading} />
                </label>
              </div>

              {/* Name & description */}
              <div className="col-span-9 sm:col-span-4 space-y-1">
                <input
                  className="input text-sm"
                  placeholder="Product name *"
                  value={r.name}
                  onChange={(e) => updateRow(i, { name: e.target.value })}
                />
                <textarea
                  className="input text-xs"
                  rows="2"
                  placeholder="Description (optional)"
                  value={r.description}
                  onChange={(e) => updateRow(i, { description: e.target.value })}
                />
              </div>

              {/* Pricing */}
              <div className="col-span-12 sm:col-span-4 grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">Price ₹</label>
                  <input type="number" step="0.01" min="0" className="input text-sm" placeholder="0.00" value={r.price} onChange={(e) => updateRow(i, { price: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">Disc%</label>
                  <input type="number" min="0" max="100" className="input text-sm" placeholder="0" value={r.discount} onChange={(e) => updateRow(i, { discount: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">Stock</label>
                  <input type="number" min="0" className="input text-sm" placeholder="10" value={r.stock} onChange={(e) => updateRow(i, { stock: e.target.value })} />
                </div>
              </div>

              {/* Actions */}
              <div className="col-span-12 sm:col-span-1 flex sm:flex-col gap-1 justify-end">
                <button type="button" onClick={() => duplicateRow(i)} title="Duplicate" className="p-1.5 text-blue-600 hover:bg-blue-100 rounded text-xs">📋</button>
                <button type="button" onClick={() => removeRow(i)} title="Remove" className="p-1.5 text-red-600 hover:bg-red-100 rounded">
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button onClick={addRow} className="mt-4 w-full border-2 border-dashed border-gray-300 hover:border-primary-500 hover:bg-primary-50/30 rounded-lg py-3 text-sm font-semibold text-gray-600 hover:text-primary-500 transition flex items-center justify-center gap-2">
          <FiPlus /> Add another product row
        </button>
      </div>

      {/* Submit bar */}
      <div className="sticky bottom-0 bg-white border-t-2 -mx-4 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xl rounded-t-xl z-10">
        <div className="text-sm">
          <p className="font-semibold">{validCount} product{validCount !== 1 ? 's' : ''} ready to save</p>
          <p className="text-xs text-gray-500">
            All will be added to <span className="font-bold">{shared.category || '(pick category)'}</span> · <span className="font-bold">{shared.brand || '(pick brand)'}</span>
            {shared.newArrival && ' · ✨ New Arrival'}
            {shared.bestSeller && ' · ⭐ Best Seller'}
            {shared.featured && ' · 🌟 Featured'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/admin/products')} className="border px-4 py-2.5 rounded-md text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={saving || validCount === 0} className="btn-primary inline-flex items-center gap-2 disabled:opacity-50">
            <FiSave /> {saving ? 'Saving...' : `Save all ${validCount} products`}
          </button>
        </div>
      </div>
    </div>
  );
}
