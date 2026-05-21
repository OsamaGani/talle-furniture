import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiLock, FiHome, FiShoppingBag, FiArrowLeft, FiUser, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function AccessDenied() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    document.title = '403 — Access Denied · Talle Furniture Mart';
  }, []);

  const handleSwitchAccount = () => {
    logout();
    navigate('/login', { state: { from: pathname } });
  };

  return (
    <div className="relative min-h-[80vh] flex items-center bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12 text-center w-full">
        {/* Quiet lock icon — single solid colour, no candy gradient or
            pulsing blur halo. Premium error pages stay calm. */}
        <div className="inline-block mb-6">
          <div className="w-20 h-20 mx-auto bg-red-50 ring-1 ring-red-100 text-red-600 rounded-full flex items-center justify-center">
            <FiLock size={36} />
          </div>
        </div>

        <p className="text-[10px] uppercase tracking-[3px] text-red-600 font-bold mb-3">Forbidden · 403</p>
        <h1 className="font-display font-medium text-5xl md:text-6xl tracking-tighter text-gray-900">
          Access denied
        </h1>
        <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-3 hidden">
          Access Denied
        </p>
        <p className="text-gray-600 mt-3 max-w-lg mx-auto">
          This area is reserved for <strong>administrators only</strong>.
          {user && (
            <>
              {' '}
              You're signed in as <span className="font-semibold text-gray-800">{user.email}</span>, which doesn't have admin
              privileges.
            </>
          )}
        </p>

        {pathname && (
          <p className="text-xs font-mono text-gray-500 mt-3 break-all">
            Blocked path: {pathname}
          </p>
        )}

        {/* Info card */}
        <div className="bg-white border border-amber-200 rounded-xl p-4 mt-6 text-left flex items-start gap-3 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
            <FiUser />
          </div>
          <div className="text-sm text-gray-700">
            <p className="font-semibold text-gray-900">Need admin access?</p>
            <p className="mt-0.5">
              If you believe this is a mistake, please contact the store owner. Customer accounts
              cannot view orders, products, users, or any admin tools.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-semibold px-5 py-2.5 rounded-lg shadow-sm transition"
          >
            <FiArrowLeft /> Go Back
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm transition"
          >
            <FiHome /> Back to Home
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm transition"
          >
            <FiShoppingBag /> Continue Shopping
          </Link>
          {user && (
            <button
              onClick={handleSwitchAccount}
              className="inline-flex items-center gap-2 bg-white hover:bg-red-50 border border-red-200 text-red-600 font-semibold px-5 py-2.5 rounded-lg shadow-sm transition"
            >
              <FiLogOut /> Sign in as Admin
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
