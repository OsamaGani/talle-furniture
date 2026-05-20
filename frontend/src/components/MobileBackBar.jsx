import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

// Friendly labels for the most-visited routes. Anything not listed shows
// just the arrow + "Back".
const ROUTE_LABELS = {
  '/shop':           'All Chairs',
  '/action-toys':    'Chair Repair',
  '/chair-repair':   'Chair Repair',
  '/cart':           'Your Cart',
  '/checkout':       'Checkout',
  '/wishlist':       'Wishlist',
  '/orders':         'My Orders',
  '/profile':        'My Profile',
  '/login':          'Sign In',
  '/register':       'Create Account',
  '/about':          'About Us',
  '/contact':        'Contact',
  '/help':           'Help Center',
  '/forgot-password':'Reset Password',
  '/shipping-policy':'Shipping Policy',
  '/privacy-policy': 'Privacy Policy',
  '/terms-of-service':'Terms of Service',
  '/refund-policy':  'Refunds',
};

function labelFor(pathname) {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
  if (pathname.startsWith('/product/'))  return 'Product Details';
  if (pathname.startsWith('/order/'))    return 'Order Details';
  if (pathname.startsWith('/category/')) return 'Category';
  if (pathname.startsWith('/dept/'))     return 'Department';
  if (pathname.startsWith('/reset-password/')) return 'Reset Password';
  return 'Back';
}

export default function MobileBackBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Hide on the home page (nowhere to "go back" to from there) and on
  // admin / print routes that have their own chrome.
  if (
    pathname === '/' ||
    pathname.startsWith('/admin') ||
    pathname.includes('/invoice') ||
    pathname.includes('/label')
  ) {
    return null;
  }

  const goBack = () => {
    // If the user landed directly on a deep link (e.g. via a Google result
    // or shared URL), browser history has just one entry — sending them
    // "back" would leave the site entirely. Fall back to home in that case.
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="sm:hidden border-b bg-white">
      <button
        type="button"
        onClick={goBack}
        className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 active:bg-gray-100 w-full"
        aria-label="Go back"
      >
        <FiArrowLeft size={18} className="text-gray-700" />
        <span className="truncate">{labelFor(pathname)}</span>
      </button>
    </div>
  );
}
