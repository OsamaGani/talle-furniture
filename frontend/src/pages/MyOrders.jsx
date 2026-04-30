import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import Loader from '../components/Loader';
import { FiArrowRight } from 'react-icons/fi';
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

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/orders/myorders');
        setOrders(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white border rounded-lg">
          <p className="text-gray-600">You haven't placed any orders yet.</p>
          <Link to="/shop" className="btn-primary inline-block mt-4">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
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
      )}
    </div>
  );
}
