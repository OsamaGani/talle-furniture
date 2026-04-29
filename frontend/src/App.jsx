import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import VerifyEmailBanner from './components/VerifyEmailBanner';
import ScrollToTop from './components/ScrollToTop';
import FloatingActions from './components/FloatingActions';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import Home from './pages/Home';
import Shop from './pages/Shop';
import ActionToys from './pages/ActionToys';
import Department from './pages/Department';
import Category from './pages/Category';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Profile from './pages/Profile';
import MyOrders from './pages/MyOrders';
import OrderDetail from './pages/OrderDetail';
import Wholesale from './pages/Wholesale';
import About from './pages/About';
import Contact from './pages/Contact';
import Franchise from './pages/Franchise';
import Help from './pages/Help';
import Wishlist from './pages/Wishlist';
import ShippingPolicy from './pages/policies/Shipping';
import PrivacyPolicy from './pages/policies/Privacy';
import TermsOfService from './pages/policies/Terms';
import RefundPolicy from './pages/policies/Refund';
import NotFound from './pages/NotFound';

import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminActionToys from './pages/admin/ActionToys';
import AdminProductForm from './pages/admin/ProductForm';
import AdminBulkAdd from './pages/admin/BulkAdd';
import AdminOrders from './pages/admin/Orders';
import AdminOrderDetail from './pages/admin/OrderDetail';
import AdminInvoice from './pages/admin/Invoice';
import AdminShippingLabel from './pages/admin/ShippingLabel';
import AdminUsers from './pages/admin/Users';
import AdminCategories from './pages/admin/Categories';
import AdminBrands from './pages/admin/Brands';
import AdminWholesaleCategories from './pages/admin/WholesaleCategories';

export default function App() {
  const { pathname } = useLocation();
  const isInvoice = pathname.includes('/invoice') || pathname.includes('/label');
  return (
    <div className="flex min-h-screen flex-col bg-white overflow-x-clip">
      <ScrollToTop />
      {!isInvoice && <Navbar />}
      {!isInvoice && <VerifyEmailBanner />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/action-toys" element={<ActionToys />} />
          <Route path="/dept/:slug" element={<Department />} />
          <Route path="/category/:slug" element={<Category />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
      </main>
      {!isInvoice && <Footer />}
      {!isInvoice && <FloatingActions />}
    </div>
  );
}
