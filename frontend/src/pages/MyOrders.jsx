import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import Loader from '../components/Loader';
import { FiArrowRight, FiPackage, FiClock, FiCheckCircle, FiXCircle, FiTruck } from 'react-icons/fi';
import { resolveImage } from '../utils/imageUrl';

const statusColor = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  packed: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusLabel = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all / active / delivered / cancelled

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/orders/myorders');
        setOrders(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const counts = useMemo(() => ({
    all: orders.length,
    active: orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }), [orders]);

  const filtered = useMemo(() => {
    if (filter === 'active') return orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
    if (filter === 'delivered') return orders.filter(o => o.status === 'delivered');
    if (filter === 'cancelled') return orders.filter(o => o.status === 'cancelled');
    return orders;
  }, [orders, filter]);

  if (loading) return <Loader />;

  const FILTERS = [
    { id: 'all',       label: 'All Orders',  icon: <FiPackage />,    count: counts.all },
    { id: 'active',    label: 'Active',      icon: <FiTruck />,      count: counts.active },
    { id: 'delivered', label: 'Delivered',   icon: <FiCheckCircle />,count: counts.delivered },
    { id: 'cancelled', label: 'Cancelled',   icon: <FiXCircle />,    count: counts.cancelled },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">My Orders</h1>
      <p className="text-sm text-gray-500 mb-6">Track, manage, and review your past purchases</p>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white border rounded-lg">
          <FiPackage size={56} className="mx-auto text-gray-300 mb-3" />
          <h2 className="text-lg font-bold mb-1">No orders yet</h2>
          <p className="text-gray-600 text-sm mb-4">Looks like you haven't placed any orders. Browse our toy collection and find something special.</p>
          <Link to="/shop" className="btn-primary inline-block">Start Shopping →</Link>
        </div>
      ) : (
        <>
          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`whitespace-nowrap inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border-2 transition ${
                  filter === f.id
                    ? 'bg-primary-500 text-white border-primary-500 shadow'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary-400 hover:text-primary-500'
                }`}
              >
                {f.icon}
                {f.label}
                {f.count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    filter === f.id ? 'bg-white/30' : 'bg-gray-100'
                  }`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 bg-gray-50 border-2 border-dashed rounded-lg">
              <p className="text-gray-500">No orders in this category</p>
            </div>
          )}
        <div className="space-y-3">
          {filtered.map((o) => (
            <Link to={`/order/${o._id}`} key={o._id} className="block bg-white border rounded-lg p-4 hover:shadow-md hover:border-primary-300 transition group">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-mono font-bold text-sm">{o.orderNumber || `#${o._id.slice(-8).toUpperCase()}`}</p>
                  <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString()}</p>
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColor[o.status] || 'bg-gray-100'}`}>
                  {statusLabel[o.status] || o.status}
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {o.items.slice(0, 4).map((it) => (
                  <img key={it._id} src={resolveImage(it.image)} alt={it.name} className="w-14 h-14 rounded border bg-gray-50 object-contain p-1 flex-shrink-0" />
                ))}
                {o.items.length > 4 && (
                  <div className="w-14 h-14 rounded border bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">+{o.items.length - 4}</div>
                )}
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t">
                <div>
                  <p className="text-xs text-gray-500">{o.items.length} item(s) · {o.paymentMethod}</p>
                  <p className="font-bold">₹{o.totalPrice.toFixed(2)}</p>
                </div>
                <span className="text-sm text-primary-500 font-semibold group-hover:underline flex items-center gap-1">
                  Track <FiArrowRight />
                </span>
              </div>
            </Link>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
