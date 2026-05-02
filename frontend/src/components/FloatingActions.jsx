import { useLocation } from 'react-router-dom';
import { FaWhatsapp } from 'react-icons/fa';
import { waLink } from '../config/contact';

export default function FloatingActions() {
  const { pathname } = useLocation();

  // Hide on print/invoice/label pages
  if (pathname.includes('/invoice') || pathname.includes('/label')) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-4 right-4 z-40">
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
