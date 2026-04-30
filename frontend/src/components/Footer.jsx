import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import FollowUs from './FollowUs';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        {/* Brand column — full width on mobile, single column on desktop */}
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-1 mb-3">
            <span className="text-2xl font-extrabold text-primary-500">Toy</span>
            <span className="text-2xl font-extrabold text-white">Mall</span>
          </div>
          <p className="text-sm">Your one-stop shop for the best toys from top global brands. Bringing smiles to children since day one.</p>
          <div className="mt-5">
            <FollowUs dark />
          </div>
        </div>

        <div>
          <h3 className="font-bold text-white mb-3">Reach Us</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-primary-500">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-primary-500">Contact</Link></li>
            <li><Link to="/wholesale" className="hover:text-yellow-400 font-semibold">🛍 Wholesale</Link></li>
            <li><Link to="/franchise" className="hover:text-primary-500">Franchise</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-white mb-3">Store Policies</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/shipping-policy" className="hover:text-primary-500">Shipping Policy</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-primary-500">Privacy Policy</Link></li>
            <li><Link to="/terms-of-service" className="hover:text-primary-500">Terms of Service</Link></li>
            <li><Link to="/refund-policy" className="hover:text-primary-500">Refund Policy</Link></li>
            <li><Link to="/help" className="hover:text-primary-500">Help / FAQs</Link></li>
          </ul>
        </div>

        <div className="col-span-2 md:col-span-1">
          <h3 className="font-bold text-white mb-3">Subscribe</h3>
          <p className="text-sm mb-3">Get latest deals and offers in your inbox.</p>
          {/* Stacked on mobile, joined input + button on sm+ */}
          <form className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <input
              type="email"
              className="flex-1 min-w-0 px-3 py-2 rounded-md sm:rounded-l-md sm:rounded-r-none bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              placeholder="Email address"
            />
            <button
              type="submit"
              className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-4 py-2 rounded-md sm:rounded-l-none sm:rounded-r-md text-sm transition whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center gap-2"><FiPhone /> +91 86557 87075</li>
            <li className="flex items-center gap-2"><FiMail /> Huraira735@gmail.com</li>
            <li className="flex items-start gap-2"><FiMapPin className="mt-1 flex-shrink-0" /> <span>Toy Mall, Mobin Apartment A Wing, Shop No. 4, Amrut Nagar, Near Dargah Road, Mumbra, Thane — 400612</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 text-sm text-center text-gray-400">
          © {new Date().getFullYear()} Toy Mall. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
