import { Link, useLocation } from 'react-router-dom';
import { FaWhatsapp } from 'react-icons/fa';
import { FiHelpCircle } from 'react-icons/fi';
import { waLink } from '../config/contact';

export default function FloatingActions() {
  const { pathname } = useLocation();

  // Hide on print/invoice/label pages — and on the Help page itself, where
  // the Help shortcut would be redundant.
  if (pathname.includes('/invoice') || pathname.includes('/label')) return null;

  // The Help button shouldn't appear on the Help page (you're already there).
  const showHelp = pathname !== '/help';

  return (
    // Stack of two floating actions: Help (top) and WhatsApp (bottom).
    // bottom-20 on mobile keeps both above the BottomNav (56 px); bottom-4
    // on desktop hugs the corner like every other site.
    <div className="fixed bottom-20 sm:bottom-4 right-4 z-40 flex flex-col items-end gap-3">
      {showHelp && (
        <Link
          to="/help"
          aria-label="Help & FAQs"
          title="Need help? Open our FAQs"
          className="group bg-white text-gray-800 border border-gray-200 hover:bg-primary-500 hover:text-white hover:border-primary-500 w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg flex items-center justify-center transition hover:scale-110"
        >
          <FiHelpCircle size={24} />
          {/* Inline label visible on hover (desktop) — gives the icon meaning */}
          <span className="hidden md:group-hover:flex absolute right-full mr-3 bg-gray-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md whitespace-nowrap items-center">
            Need help?
          </span>
        </Link>
      )}

      <a
        href={waLink('Hi Toy Mall! I have a question.')}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition hover:scale-110 animate-pulseRing relative"
      >
        <FaWhatsapp size={28} />
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">1</span>
      </a>
    </div>
  );
}
