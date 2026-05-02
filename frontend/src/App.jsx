import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import MobileBackBar from './components/MobileBackBar';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import VerifyEmailBanner from './components/VerifyEmailBanner';
import ScrollToTop from './components/ScrollToTop';
import RouteLoader from './components/RouteLoader';
import FloatingActions from './components/FloatingActions';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Loader from './components/Loader';

// Eager — these are the high-traffic public pages every visitor hits.
import Home from './pages/Home';
import Shop from './pages/Shop';
import Department from './pages/Department';
import Category from './pages/Category';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Lazy — split into separate chunks so the initial bundle stays small.
// Casual shoppers never download admin or account-management code.
const ActionToys      = lazy(() => import('./pages/ActionToys'));
const Checkout        = lazy(() => import('./pages/Checkout'));
const VerifyEmail     = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword  = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword   = lazy(() => import('./pages/ResetPassword'));
const Profile         = lazy(() => import('./pages/Profile'));
const MyOrders        = lazy(() => import('./pages/MyOrders'));
const OrderDetail     = lazy(() => import('./pages/OrderDetail'));
const Wholesale       = lazy(() => import('./pages/Wholesale'));
const About           = lazy(() => import('./pages/About'));
const Contact         = lazy(() => import('./pages/Contact'));
const Franchise       = lazy(() => import('./pages/Franchise'));
const Help            = lazy(() => import('./pages/Help'));
const Wishlist        = lazy(() => import('./pages/Wishlist'));
const ShippingPolicy  = lazy(() => import('./pages/policies/Shipping'));
const PrivacyPolicy   = lazy(() => import('./pages/policies/Privacy'));
const TermsOfService  = lazy(() => import('./pages/policies/Terms'));
const RefundPolicy    = lazy(() => import('./pages/policies/Refund'));

// Admin section — heavy + only ever used by store owner. Every page is
// lazy-loaded so the initial JS bundle for shoppers is dramatically smaller.
const AdminDashboard          = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts           = lazy(() => import('./pages/admin/Products'));
const AdminActionToys         = lazy(() => import('./pages/admin/ActionToys'));
const AdminProductForm        = lazy(() => import('./pages/admin/ProductForm'));
const AdminBulkAdd            = lazy(() => import('./pages/admin/BulkAdd'));
const AdminOrders             = lazy(() => import('./pages/admin/Orders'));
const AdminOrderDetail        = lazy(() => import('./pages/admin/OrderDetail'));
const AdminInvoice            = lazy(() => import('./pages/admin/Invoice'));
const AdminShippingLabel      = lazy(() => import('./pages/admin/ShippingLabel'));
const AdminUsers              = lazy(() => import('./pages/admin/Users'));
const AdminCategories         = lazy(() => import('./pages/admin/Categories'));
const AdminBrands             = lazy(() => import('./pages/admin/Brands'));
const AdminWholesaleCategories = lazy(() => import('./pages/admin/WholesaleCategories'));

export default function App() {
  const { pathname } = useLocation();
  const isInvoice = pathname.includes('/invoice') || pathname.includes('/label');
  return (
    <div className="flex min-h-screen flex-col bg-white overflow-x-clip pb-14 sm:pb-0">
      <ScrollToTop />
      {!isInvoice && <RouteLoader duration={700} />}
      {!isInvoice && <Navbar />}
      {!isInvoice && <MobileBackBar />}
      {!isInvoice && <VerifyEmailBanner />}
      {/* `key={pathname}` re-mounts the wrapper on each route change so the
           CSS keyframe restarts and every page gets a soft fade-in instead
           of popping in instantly. */}
      <main key={pathname} className="flex-1 animate-pageEnter">
        <Suspense fallback={<Loader size="lg" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/action-toys" element={<ActionToys />} />
          <Route path="/dept/:slug" element={<Department />} />
          <Route path="/category/:slug" element={<Category />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/wholesale" element={<Wholesale />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/franchise" element={<Franchise />} />
          <Route path="/help" element={<Help />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/order/:id" element={<OrderDetail />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/action-toys" element={<AdminActionToys />} />
            <Route path="/admin/products/bulk" element={<AdminBulkAdd />} />
            <Route path="/admin/products/new" element={<AdminProductForm />} />
            <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/brands" element={<AdminBrands />} />
            <Route path="/admin/wholesale-categories" element={<AdminWholesaleCategories />} />
          </Route>
          <Route element={<AdminRoute bare />}>
            <Route path="/admin/orders/:id/invoice" element={<AdminInvoice />} />
            <Route path="/admin/orders/:id/label" element={<AdminShippingLabel />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>
      {!isInvoice && <Footer />}
      {!isInvoice && <FloatingActions />}
      {!isInvoice && <BottomNav />}
    </div>
  );
}
