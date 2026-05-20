import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';
import { FiTrash2, FiEye, FiPrinter, FiTag } from 'react-icons/fi';

const STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
const statusColor = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  packed: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/orders');
      setOrders(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status, e) => {
    e.stopPropagation();
    try {
      await API.put(`/orders/${id}/status`, { status });
      toast.success('Status updated');
      load();
    } catch (err) { toast.error('Failed'); }
  };

  const remove = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this order?')) return;
    try {
      await API.delete(`/orders/${id}`);
      toast.success('Deleted');
      load();
    } catch (err) { toast.error('Failed'); }
  };

  const filtered = orders.filter((o) => {
    if (filter && o.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (o.orderNumber || o._id).toLowerCase().includes(q) ||
             o.user?.name?.toLowerCase().includes(q) ||
             o.user?.email?.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Orders ({orders.length})</h1>
        <div className="flex gap-2 flex-wrap">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order # / customer..." className="input max-w-xs" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input max-w-xs">
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b text-left">
            <tr>
              <th className="p-3">Order</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr
                key={o._id}
                onClick={() => navigate(`/admin/orders/${o._id}`)}
                className="border-b last:border-0 hover:bg-blue-50 cursor-pointer"
              >
                <td className="p-3 font-mono text-primary-500 font-semibold">
                  {o.orderNumber || `#${o._id.slice(-6).toUpperCase()}`}
                </td>
                <td>
                  <p className="font-medium">{o.user?.name || 'Guest'}</p>
                  <p className="text-xs text-gray-500">{o.user?.email}</p>
                </td>
                <td className="text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td>{o.items.length}</td>
                <td className="font-bold">₹{o.totalPrice.toFixed(2)}</td>
                <td>{o.isPaid ? '✅' : '❌'}</td>
                <td>
                  <select value={o.status} onChange={(e) => updateStatus(o._id, e.target.value, e)} onClick={(e) => e.stopPropagation()}
                    className={`select-sm text-xs rounded px-2 py-1 font-semibold border ${statusColor[o.status]}`}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                  {/* Show who cancelled — helps admin tell customer-driven
                      vs admin-driven cancellations apart at a glance. */}
                  {o.status === 'cancelled' && o.cancelledBy && (
                    <span
                      className={`block mt-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                        o.cancelledBy === 'customer'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                      title={o.cancelledReason || ''}
                    >
                      by {o.cancelledBy}
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${o._id}`); }} title="View" className="p-2 text-blue-600 hover:bg-blue-50 rounded"><FiEye /></button>
                    <button onClick={(e) => { e.stopPropagation(); window.open(`/admin/orders/${o._id}/label`, '_blank'); }} title="Shipping Label" className="p-2 text-purple-600 hover:bg-purple-50 rounded"><FiTag /></button>
                    <button onClick={(e) => { e.stopPropagation(); window.open(`/admin/orders/${o._id}/invoice`, '_blank'); }} title="Print Invoice" className="p-2 text-gray-600 hover:bg-gray-50 rounded"><FiPrinter /></button>
                    <button onClick={(e) => remove(o._id, e)} title="Delete" className="p-2 text-red-600 hover:bg-red-50 rounded"><FiTrash2 /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="9" className="text-center py-8 text-gray-500">No orders match</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
