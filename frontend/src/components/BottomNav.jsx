import { NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiGrid, FiHeart, FiShoppingCart, FiUser } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

// Bottom tab bar visible only on phones — mirrors the navigation pattern
// every Indian e-commerce app uses (Flipkart, Amazon, Myntra, Meesho).
// Hidden on admin / invoice / print routes that have their own chrome.

export default function BottomNav() {
  const { pathname } = useLocation();
  const { itemCount } = useCart();
  const { count: wishCount } = useWishlist();
  const { user } = useAuth();

  if (
    pathname.startsWith('/admin') ||
    pathname.includes('/invoice') ||
    pathname.includes('/label')
  ) {
    return null;
  }

  // Account tab points to /profile when logged in, /login otherwise.
  const accountTo = user ? '/profile' : '/login';

  const tabs = [
    { to: '/',         icon: FiHome,         label: 'Home',     end: true },
    { to: '/shop',     icon: FiGrid,         label: 'Shop' },
    { to: '/wishlist', icon: FiHeart,        label: 'Wishlist', badge: wishCount },
    { to: '/cart',     icon: FiShoppingCart, label: 'Cart',     badge: itemCount },
    { to: accountTo,   icon: FiUser,         label: user ? 'Account' : 'Sign In' },
  ];

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t shadow-[0_-2px_10px_rgba(0,0,0,0.04)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Bottom navigation"
    >
      <ul className="grid grid-cols-5">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <li key={t.label}>
              <NavLink
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1.5 gap-0.5 text-[10px] font-medium transition-colors ${
                    isActive ? 'text-primary-500' : 'text-gray-600 active:text-primary-500'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative">
                      <Icon size={20} className={isActive ? 'fill-primary-500/10' : ''} />
                      {t.badge > 0 && (
                        <span className="absolute -top-1.5 -right-2 bg-primary-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center leading-none">
                          {t.badge > 99 ? '99+' : t.badge}
                        </span>
                      )}
                    </span>
                    <span>{t.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
