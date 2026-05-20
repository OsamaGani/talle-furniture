import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiBox, FiShoppingBag, FiUsers, FiTag, FiAward, FiPackage, FiMenu, FiX, FiBriefcase, FiTarget } from 'react-icons/fi';

const links = [
  { to: '/admin', label: 'Dashboard', icon: <FiHome />, end: true },
  { to: '/admin/products', label: 'Products', icon: <FiBox /> },
  { to: '/admin/chair-repair', label: 'Service & Parts', icon: <FiTarget /> },
  { to: '/admin/products/bulk', label: 'Bulk Add', icon: <FiPackage />, accent: true },
  { to: '/admin/orders', label: 'Orders', icon: <FiShoppingBag /> },
  { to: '/admin/users', label: 'Users', icon: <FiUsers /> },
  { to: '/admin/categories', label: 'Categories', icon: <FiTag /> },
  { to: '/admin/brands', label: 'Brands', icon: <FiAward /> },
];

export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const current = links.find((l) => l.end ? pathname === l.to : pathname.startsWith(l.to))?.label || 'Admin';

  const navContent = (
    <>
      <h2 className="text-lg font-bold text-gray-900 px-3 py-2">Admin Panel</h2>
      <nav className="space-y-1 mt-2">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
                isActive ? 'bg-primary-500 text-white' : (l.accent ? 'bg-purple-50 text-purple-700 font-semibold hover:bg-purple-100' : 'hover:bg-gray-100 text-gray-700')
              }`
            }
          >
            {l.icon} {l.label}
          </NavLink>
        ))}
      </nav>
    </>
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 lg:gap-6">
      {/* Mobile bar with current section + menu button */}
      <div className="lg:hidden flex items-center justify-between bg-white border rounded-lg p-3">
        <div>
          <p className="text-xs text-gray-500">Admin</p>
          <p className="font-bold">{current}</p>
        </div>
        <button onClick={() => setOpen(true)} className="bg-primary-500 text-white px-3 py-2 rounded inline-flex items-center gap-2 text-sm">
          <FiMenu /> Menu
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block bg-white border rounded-lg p-3 h-fit lg:sticky lg:top-32">
        {navContent}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white p-4 overflow-y-auto shadow-2xl animate-fadeLeft">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold">Admin Menu</span>
              <button onClick={() => setOpen(false)} className="p-1"><FiX /></button>
            </div>
            {navContent}
          </div>
        </div>
      )}

      <section className="min-w-0">{children}</section>
    </div>
  );
}
