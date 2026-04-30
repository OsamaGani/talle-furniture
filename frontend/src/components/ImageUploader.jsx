import { useState, useRef } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { FiUploadCloud, FiX, FiImage, FiLink } from 'react-icons/fi';
import { resolveImage } from '../utils/imageUrl';

/**
 * Reusable image uploader.
 *
 * Props:
 *   value: string OR string[]
 *   onChange: (value) => void
 *   multiple: boolean (default false) -- allow multiple images
 *   onMainChange: (url) => void -- only used in multiple mode (for "Set as main")
 *   mainImage: string -- only used in multiple mode
 *   label: string
 */
export default function ImageUploader({ value, onChange, multiple = false, onMainChange, mainImage, label = 'Image' }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const inputRef = useRef();

  const images = multiple ? (Array.isArray(value) ? value : []) : (value ? [value] : []);

  const MAX_BYTES = 5 * 1024 * 1024; // mirrors the backend multer limit

  const uploadFiles = async (files) => {
    const arr = Array.from(files);
    const nonImage = arr.filter((f) => !f.type.startsWith('image/'));
    if (nonImage.length) {
      return toast.error(`Not an image: ${nonImage[0].name}. Only JPG, PNG, WEBP allowed.`);
    }
    const tooBig = arr.find((f) => f.size > MAX_BYTES);
    if (tooBig) {
      const mb = (tooBig.size / 1024 / 1024).toFixed(1);
      return toast.error(`"${tooBig.name}" is ${mb} MB — max 5 MB per image. Compress and try again.`);
    }
    const valid = arr;

    setUploading(true);
    try {
      if (valid.length === 1) {
        const fd = new FormData();
        fd.append('image', valid[0]);
        // Don't set Content-Type manually — letting axios/browser add the multipart boundary.
        const { data } = await API.post('/upload', fd);
        if (multiple) onChange([...images, data.url]);
        else onChange(data.url);
        toast.success('Uploaded!');
      } else {
        const fd = new FormData();
        valid.forEach((f) => fd.append('images', f));
        const { data } = await API.post('/upload/multiple', fd);
        if (multiple) onChange([...images, ...data.urls]);
        else onChange(data.urls[0]);
        toast.success(`${data.urls.length} images uploaded`);
      }
    } catch (err) {
      // Log full server response so persistent issues are diagnosable in DevTools.
      console.error('Upload failed:', err.response?.status, err.response?.data || err.message);
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message;
      let msg = serverMsg;
      if (!msg) {
        if (status === 401) msg = 'Session expired — please log in again';
        else if (status === 403) msg = 'Admin access required to upload';
        else if (status === 413) msg = 'File too large (max 5 MB)';
        else if (!err.response) msg = 'Cannot reach server — is the backend running?';
        else msg = `Upload failed (HTTP ${status})`;
      }
      toast.error(msg);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };

  const removeImage = (img) => {
    if (multiple) {
      onChange(images.filter((i) => i !== img));
      if (mainImage === img && onMainChange) onMainChange('');
    } else {
      onChange('');
    }
  };

  const addUrl = () => {
    if (!urlInput.trim()) return;
    if (multiple) onChange([...images, urlInput.trim()]);
    else onChange(urlInput.trim());
    setUrlInput('');
    setShowUrl(false);
  };

  // Use the shared resolver so admin-side previews show backend-hosted
  // /uploads/... images via their absolute URL (cross-origin in production).
  const fullUrl = (img) => resolveImage(img);

  return (
    <div>
      {label && <label className="label">{label}</label>}

      {/* Existing images */}
      {images.length > 0 && (
        <div className={`grid ${multiple ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-1 max-w-[200px]'} gap-3 mb-3`}>
          {images.map((img, i) => (
            <div key={i} className="relative aspect-square bg-gray-50 border rounded-lg overflow-hidden group">
              <img src={fullUrl(img)} className="w-full h-full object-contain p-2" alt="" />
              <button
                type="button"
                onClick={() => removeImage(img)}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center shadow"
                title="Remove"
              >
                <FiX size={14} />
              </button>
              {multiple && onMainChange && (
                mainImage === img ? (
                  <span className="absolute bottom-1 left-1 bg-primary-500 text-white text-[10px] px-2 py-0.5 rounded font-bold">MAIN</span>
                ) : (
                  <button type="button" onClick={() => onMainChange(img)}
                    className="absolute bottom-1 left-1 bg-white/90 hover:bg-white text-[10px] px-2 py-0.5 rounded font-medium opacity-0 group-hover:opacity-100 transition">
                    Set Main
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drag-drop upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition
          ${dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-500 bg-gray-50 hover:bg-primary-50/30'}
          ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        <FiUploadCloud className="mx-auto text-primary-500 mb-2" size={32} />
        {uploading ? (
          <p className="text-sm font-semibold text-primary-500">Uploading...</p>
        ) : (
          <>
            <p className="text-sm font-semibold text-gray-700">
              Click to choose {multiple ? 'images' : 'an image'} from your computer
            </p>
            <p className="text-xs text-gray-500 mt-1">or drag &amp; drop {multiple ? 'files' : 'a file'} here</p>
            <p className="text-[11px] text-gray-400 mt-1">JPG, PNG, WEBP · max 5MB each</p>
          </>
        )}
      </div>

      {/* URL fallback */}
      <div className="mt-2">
        {!showUrl ? (
          <button type="button" onClick={() => setShowUrl(true)} className="text-xs text-gray-500 hover:text-primary-500 flex items-center gap-1">
            <FiLink size={12} /> Or paste an image URL
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              className="input text-sm"
              placeholder="https://..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
            />
            <button type="button" onClick={addUrl} className="btn-outline text-xs px-3 whitespace-nowrap">Add</button>
            <button type="button" onClick={() => { setShowUrl(false); setUrlInput(''); }} className="text-gray-400 hover:text-red-500 px-2">
              <FiX />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
