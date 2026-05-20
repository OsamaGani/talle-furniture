import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zip: user?.address?.zip || '',
      country: user?.address?.country || '',
    },
  });

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.password) delete payload.password;
    await updateProfile(payload);
    setForm({ ...form, password: '' });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl md:text-3xl font-bold">My Profile</h1>
        <div className="flex gap-2 flex-wrap">
          {user?.emailVerified ? (
            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">✓ EMAIL VERIFIED</span>
          ) : (
            <a href="/verify-email" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 text-xs font-bold px-3 py-1 rounded-full">⚠ EMAIL NOT VERIFIED</a>
          )}
        </div>
      </div>
      <form onSubmit={submit} className="bg-white border rounded-lg p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">New Password (leave blank to keep)</label>
            <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
        </div>

        <h2 className="font-bold text-lg pt-4 border-t">Default Address</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Street</label>
            <input className="input" value={form.address.street} onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })} />
          </div>
          <div><label className="label">City</label><input className="input" value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} /></div>
          <div><label className="label">State</label><input className="input" value={form.address.state} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} /></div>
          <div><label className="label">ZIP</label><input className="input" value={form.address.zip} onChange={(e) => setForm({ ...form, address: { ...form.address, zip: e.target.value } })} /></div>
          <div><label className="label">Country</label><input className="input" value={form.address.country} onChange={(e) => setForm({ ...form, address: { ...form.address, country: e.target.value } })} /></div>
        </div>

        <button type="submit" className="btn-primary">Save Changes</button>
      </form>
    </div>
  );
}
