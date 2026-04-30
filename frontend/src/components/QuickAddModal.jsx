import { useState, useRef } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { FiX, FiUpload, FiCheck } from 'react-icons/fi';
import { resolveImage } from '../utils/imageUrl';

/**
 * Quick add — minimal form to drop a product into a specific collection.
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   onSaved: () => void  (called after successful save)
 *   collection: 'newArrival' | 'bestSeller' | 'featured' | null
 *   collectionLabel: string  e.g. "New Arrivals"
 */
export default function QuickAddModal({ open, onClose, onSaved, collection, collectionLabel }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState(10);
  const [discount, setDiscount] = useState(0);
  const [image, setImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  if (!open) return null;

  const reset = () => {
    setName(''); setPrice(''); setStock(10); setDiscount(0); setImage('');
  };

  const close = () => { reset(); onClose(); };

  const uploadFile = async (file) => {
    if (!file?.type?.startsWith('image/')) return toast.error('Please pick an image');
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const { data } = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImage(data.url);
      toast.success('Image uploaded');
    } catch (err) { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const submit = async (e, addAnother = false) => {
    e?.preventDefault();
    if (!name.trim()) return toast.error('Product name required');
    if (!+price || +price <= 0) return toast.error('Valid price required');
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: name.trim(),
        brand: 'Other',
        category: 'General',
        price: +price,
        discount: +discount,
        stock: +stock,
        image,
        images: image ? [image] : [],
        featured: collection === 'featured',
        bestSeller: collection === 'bestSeller',
        newArrival: collection === 'newArrival' || !collection,
      };
      await API.post('/products', payload);
      toast.success(`✅ Added to ${collectionLabel}`);
      onSaved?.();
      if (addAnother) reset();
      else close();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fadeIn" onClick={close}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b">
          <div>
            <h2 className="text-lg font-bold">Quick Add</h2>
            <p className="text-xs text-gray-500">Will be added to <span className="font-semibold text-primary-500">{collectionLabel}</span></p>
          </div>
          <button onClick={close} className="text-gray-400 hover:text-gray-700 p-1"><FiX size={22} /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Image */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.[0]) uploadFile(e.dataTransfer.files[0]); }}
            onClick={() => !image && fileRef.current?.click()}
            className={`border-2 border-dashed rounded-lg ${image ? 'p-0 bg-white' : 'p-6 cursor-pointer text-center'} transition
              ${dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-500 bg-gray-50'}`}
          >
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadFile(e.target.files[0])} />
            {image ? (
              <div className="relative aspect-square max-h-48 mx-auto">
                <img src={resolveImage(image)} className="w-full h-full object-contain p-2 rounded-lg" alt="" />
                <button type="button" onClick={(e) => { e.stopPropagation(); setImage(''); }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600">
                  <FiX size={14} />
                </button>
              </div>
            ) : uploading ? (
              <p className="text-sm text-primary-500 font-semibold">Uploading...</p>
            ) : (
              <>
                <FiUpload className="mx-auto text-primary-500 mb-2" size={28} />
                <p className="text-sm font-semibold text-gray-700">Click or drop product image</p>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP</p>
              </>
            )}
          </div>

          <div>
            <label className="label">Product Name *</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. LEGO City Police Station" required autoFocus />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Price ₹ *</label>
              <input type="number" step="0.01" min="0" className="input" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" required />
            </div>
            <div>
              <label className="label">Disc %</label>
              <input type="number" min="0" max="100" className="input" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="label">Stock</label>
              <input type="number" min="0" className="input" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="10" />
            </div>
          </div>

          <p className="text-xs text-gray-500 italic">
            Brand &amp; category default to "Other" / "General". You can edit this product later for full details.
          </p>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={(e) => submit(e, true)} disabled={saving || uploading} className="btn-outline flex-1 inline-flex items-center justify-center gap-2 text-sm">
              {saving ? '...' : '+ Save & Add Another'}
            </button>
            <button type="submit" disabled={saving || uploading} className="btn-primary flex-1 inline-flex items-center justify-center gap-2">
              <FiCheck /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
