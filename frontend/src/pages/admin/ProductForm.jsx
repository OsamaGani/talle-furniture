import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import API from '../../api/axios';
import Loader from '../../components/Loader';
import ImageUploader from '../../components/ImageUploader';
import toast from 'react-hot-toast';
import { FiPlus, FiSettings, FiX } from 'react-icons/fi';
import { allSubCategoryNames } from '../../config/departments';
import { COMMON_COLORS, colorToBackground, isLightColor } from '../../utils/colors';

// Fallback list — used only if /api/categories fails or is empty.
// Combines legacy parent-level categories with all new toyzone-style sub-categories.
const legacyCategories = ['Construction', 'Games', 'Pretend Play', 'Learning & Education', 'Vehicles', 'Active Play', 'Wooden Toys', 'Dolls', 'Action Figures', 'Ride Ons', 'Outdoor Toys', 'Books', 'Baby & Toddler', 'Novelty Toys'];
const fallbackCategories = Array.from(new Set([...legacyCategories, ...allSubCategoryNames])).sort();
const ages = ['', '0-2 Years', '2-4 Years', '4-6 Years', '6-8 Years', '8 Years+', '12 Years+'];

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;
  const prefillCategory = searchParams.get('category') || '';
  const redirectTo = searchParams.get('from') || '/admin/products';
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState(fallbackCategories);
  const [showQuickCat, setShowQuickCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);
  // Explicit toggle for brand custom-input mode — avoids fragile sentinel values.
  const [customBrand, setCustomBrand] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', brand: '', category: prefillCategory, ageGroup: '',
    price: 0, discount: 0, wholesalePrice: 0, wholesaleMinQty: 0,
    stock: 0, image: '', images: [],
    featured: false, bestSeller: false, newArrival: false, onDeal: false,
    colors: [],
  });
  const [colorInput, setColorInput] = useState('');

  const loadCategories = async () => {
    try {
      const { data } = await API.get('/categories');
      const names = (data || []).map((c) => c.name).filter(Boolean);
      if (names.length) setCategories(names);
    } catch (e) {
      // keep fallback list
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [{ data: bData }] = await Promise.all([
          API.get('/brands'),
          loadCategories(),
        ]);
        setBrands(bData);
        if (isEdit) {
          const { data } = await API.get(`/products/${id}`);
          setForm({
            name: data.name, description: data.description, brand: data.brand,
            category: data.category, ageGroup: data.ageGroup || '',
            price: data.price, discount: data.discount,
            wholesalePrice: data.wholesalePrice || 0, wholesaleMinQty: data.wholesaleMinQty || 0,
            stock: data.stock,
            image: data.image || '', images: data.images || [],
            featured: data.featured, bestSeller: data.bestSeller, newArrival: data.newArrival, onDeal: !!data.onDeal,
            colors: Array.isArray(data.colors) ? data.colors : [],
          });
          // If the saved brand isn't in the loaded brand list, open custom-input mode
          // so the existing value is editable instead of silently disappearing.
          const knownBrands = (bData || []).map((b) => b.name);
          if (data.brand && !knownBrands.includes(data.brand)) setCustomBrand(true);
        }
      } catch (e) { toast.error('Failed to load'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const createCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    setCreatingCat(true);
    try {
      await API.post('/categories', { name });
      await loadCategories();
      setForm((f) => ({ ...f, category: name }));
      setNewCatName('');
      setShowQuickCat(false);
      toast.success(`Category "${name}" added`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add category');
    } finally {
      setCreatingCat(false);
    }
  };

  // Catch the obvious failure modes before they round-trip to the server,
  // and surface the real Mongoose error message when one does come back.
  const validateForm = () => {
    if (!form.name?.trim())        return 'Product name is required';
    if (!form.description?.trim()) return 'Description is required';
    if (!form.brand?.trim())       return customBrand
      ? 'Type a custom brand name or pick one from the list'
      : 'Please select a brand';
    if (showQuickCat)              return 'Finish adding the new category (click Add) or cancel and pick an existing one';
    if (!form.category?.trim())    return 'Please select a category';
    if (!(+form.price > 0))        return 'Retail price must be greater than 0';
    if (+form.discount < 0 || +form.discount > 100) return 'Discount must be between 0 and 100';
    if (+form.stock < 0)           return 'Stock cannot be negative';
    if (!form.image && (!form.images || form.images.length === 0)) {
      return 'Please add at least one product image';
    }
    return null;
  };

  // Mongoose returns "Product validation failed: brand: Path `brand` is required., …".
  // Strip the prefix and de-duplicate field names so the toast is readable.
  const prettifyError = (raw) => {
    if (!raw) return 'Could not save product';
    const cleaned = String(raw).replace(/^Product validation failed:\s*/, '');
    const fields = [...cleaned.matchAll(/(\w+):\s*Path `\w+` is required/g)].map((m) => m[1]);
    if (fields.length) return `Missing required field${fields.length > 1 ? 's' : ''}: ${fields.join(', ')}`;
    return cleaned;
  };

  const submit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        brand: form.brand.trim(),
        category: form.category.trim(),
        price: +form.price,
        discount: +form.discount || 0,
        wholesalePrice: +form.wholesalePrice || 0,
        wholesaleMinQty: +form.wholesaleMinQty || 0,
        stock: +form.stock || 0,
        colors: (form.colors || []).map((c) => String(c).trim()).filter(Boolean),
      };
      if (isEdit) await API.put(`/products/${id}`, payload);
      else await API.post('/products', payload);
      toast.success(isEdit ? 'Product updated' : 'Product created');
      navigate(redirectTo);
    } catch (err) {
      console.error('Save product failed:', err.response?.data || err.message);
      toast.error(prettifyError(err.response?.data?.message) || 'Could not save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
      <form onSubmit={submit} className="bg-white border rounded-lg p-6 space-y-4 max-w-4xl">
        <div>
          <label className="label">Product Name *</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="label">Description *</label>
          <textarea className="input" rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="label">Brand *</label>
            {customBrand ? (
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="Type custom brand name"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => { setCustomBrand(false); setForm({ ...form, brand: '' }); }}
                  className="border px-3 rounded text-sm hover:bg-gray-50"
                  title="Back to brand list"
                >
                  ✕
                </button>
              </div>
            ) : (
              <select
                className="input"
                value={form.brand}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setCustomBrand(true);
                    setForm({ ...form, brand: '' });
                  } else {
                    setForm({ ...form, brand: e.target.value });
                  }
                }}
                required
              >
                <option value="">-- Select Brand --</option>
                {brands.map((b) => (
                  <option key={b._id} value={b.name}>{b.name}</option>
                ))}
                <option value="__custom__">+ Add custom brand…</option>
              </select>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <label className="label">Category *</label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowQuickCat((v) => !v)}
                  className="text-primary-500 hover:underline inline-flex items-center gap-1"
                >
                  <FiPlus size={12} /> {showQuickCat ? 'Cancel' : 'New'}
                </button>
                <Link
                  to="/admin/categories"
                  target="_blank"
                  className="text-gray-500 hover:text-primary-500 inline-flex items-center gap-1"
                  title="Manage categories"
                >
                  <FiSettings size={12} />
                </Link>
              </div>
            </div>
            <select
              className="input"
              value={form.category}
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  setShowQuickCat(true);
                } else {
                  setForm({ ...form, category: e.target.value });
                }
              }}
              required
              disabled={showQuickCat}
            >
              <option value="">-- Select Category --</option>
              {/* Merge any saved category into the list so edits always show the current value. */}
              {(form.category && !categories.includes(form.category)
                ? [form.category, ...categories]
                : categories
              ).map((c) => <option key={c} value={c}>{c}</option>)}
              <option value="__new__">+ Add new category…</option>
            </select>
            {showQuickCat && (
              <div className="mt-2 flex gap-2">
                <input
                  className="input flex-1"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="New category name"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); createCategory(); } }}
                />
                <button
                  type="button"
                  onClick={createCategory}
                  disabled={creatingCat || !newCatName.trim()}
                  className="btn-primary px-3 text-sm disabled:opacity-50"
                >
                  {creatingCat ? '…' : 'Add'}
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="label">Age Group</label>
            <select className="input" value={form.ageGroup} onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}>
              {ages.map((a) => <option key={a} value={a}>{a || '-- Any --'}</option>)}
            </select>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="label">Retail Price (₹) *</label>
            <input type="number" step="0.01" min="0" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </div>
          <div>
            <label className="label">Discount (%)</label>
            <input type="number" min="0" max="100" className="input" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
          </div>
          <div>
            <label className="label">Stock *</label>
            <input type="number" min="0" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-700 mb-2">🛍 Wholesale Pricing (optional)</h3>
          <p className="text-xs text-gray-600 mb-3">Wholesale customers automatically get this price when buying the minimum quantity.</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Wholesale Price (₹)</label>
              <input type="number" step="0.01" min="0" className="input" value={form.wholesalePrice} onChange={(e) => setForm({ ...form, wholesalePrice: e.target.value })} placeholder="e.g. 10.00" />
            </div>
            <div>
              <label className="label">Minimum Qty for Wholesale</label>
              <input type="number" min="0" className="input" value={form.wholesaleMinQty} onChange={(e) => setForm({ ...form, wholesaleMinQty: e.target.value })} placeholder="e.g. 10" />
            </div>
          </div>
        </div>

        <ImageUploader
          label="Product Images (upload from your computer — front, back, side, packaging, etc.)"
          multiple
          value={form.images}
          onChange={(imgs) => setForm({ ...form, images: imgs, image: form.image && imgs.includes(form.image) ? form.image : (imgs[0] || '') })}
          mainImage={form.image}
          onMainChange={(img) => setForm({ ...form, image: img })}
        />

        {/* Available colours — admin can add as many as the product comes in.
            Customer Shop page filters by these; product detail page shows
            them as visual swatches. Either click a quick-pick chip or type
            a custom colour name and press Enter. */}
        <div className="bg-gray-50 border rounded-lg p-4">
          <label className="label">Available Colours</label>
          <p className="text-xs text-gray-600 mb-3">
            Pick from the common chips below or type a custom colour and press Enter.
            These show up as colour swatches on the product page and let customers filter by colour on Shop.
          </p>

          {/* Selected colour chips */}
          {form.colors.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {form.colors.map((c) => {
                const bg = colorToBackground(c);
                return (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 bg-white border rounded-full pl-1.5 pr-2 py-1 text-sm"
                  >
                    <span
                      className={`w-5 h-5 rounded-full border ${isLightColor(c) ? 'border-gray-300' : 'border-white shadow-inner'}`}
                      style={bg ? { background: bg } : { background: 'repeating-linear-gradient(45deg,#e5e7eb 0 4px,#fff 4px 8px)' }}
                      title={c}
                    />
                    {c}
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, colors: form.colors.filter((x) => x !== c) })}
                      className="text-gray-400 hover:text-red-500"
                      aria-label={`Remove ${c}`}
                    >
                      <FiX size={14} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Custom colour input */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              className="input flex-1"
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  const v = colorInput.trim();
                  if (v && !form.colors.find((c) => c.toLowerCase() === v.toLowerCase())) {
                    setForm({ ...form, colors: [...form.colors, v] });
                  }
                  setColorInput('');
                }
              }}
              placeholder="Type a colour name and press Enter (e.g. Mint Green)"
            />
            <button
              type="button"
              onClick={() => {
                const v = colorInput.trim();
                if (v && !form.colors.find((c) => c.toLowerCase() === v.toLowerCase())) {
                  setForm({ ...form, colors: [...form.colors, v] });
                }
                setColorInput('');
              }}
              disabled={!colorInput.trim()}
              className="bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white px-4 rounded-md text-sm"
            >
              Add
            </button>
          </div>

          {/* Quick-pick common colours */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Quick pick</p>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_COLORS.map((c) => {
              const already = form.colors.some((x) => x.toLowerCase() === c.toLowerCase());
              const bg = colorToBackground(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    if (already) {
                      setForm({ ...form, colors: form.colors.filter((x) => x.toLowerCase() !== c.toLowerCase()) });
                    } else {
                      setForm({ ...form, colors: [...form.colors, c] });
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 border rounded-full px-2 py-1 text-xs transition ${
                    already
                      ? 'bg-primary-500 border-primary-500 text-white'
                      : 'bg-white border-gray-200 hover:border-primary-400 text-gray-700'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full border ${isLightColor(c) ? 'border-gray-300' : 'border-white/70'}`}
                    style={bg ? { background: bg } : { background: 'repeating-linear-gradient(45deg,#e5e7eb 0 3px,#fff 3px 6px)' }}
                  />
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="accent-primary-500" /> Featured</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.bestSeller} onChange={(e) => setForm({ ...form, bestSeller: e.target.checked })} className="accent-primary-500" /> Best Seller</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.newArrival} onChange={(e) => setForm({ ...form, newArrival: e.target.checked })} className="accent-primary-500" /> New Arrival</label>
          <label className="flex items-center gap-2 text-orange-700">
            <input type="checkbox" checked={form.onDeal} onChange={(e) => setForm({ ...form, onDeal: e.target.checked })} className="accent-orange-500" />
            ⚡ Today's Deal
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}</button>
          <button type="button" onClick={() => navigate('/admin/products')} className="border px-5 py-2.5 rounded-md hover:bg-gray-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
