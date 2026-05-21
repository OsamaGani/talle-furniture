import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiArrowRight } from 'react-icons/fi';
import { getRecentlyViewed } from '../utils/recentlyViewed';
import { resolveImage, PLACEHOLDER } from '../utils/imageUrl';

// Lightweight Recently Viewed strip for the homepage.
// Reads from localStorage on mount — if the user hasn't browsed any
// products yet, the section renders nothing (no "empty state" clutter).

export default function RecentlyViewed() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(getRecentlyViewed());
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="py-8 sm:py-12 bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
        <div className="flex items-end justify-between mb-4 sm:mb-5">
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-primary-500 uppercase tracking-wider flex items-center gap-1.5">
              <FiClock /> Pick up where you left off
            </p>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 mt-1">Recently Viewed</h2>
          </div>
          <Link to="/shop" className="text-xs sm:text-sm text-primary-500 hover:underline font-semibold flex items-center gap-1 whitespace-nowrap">
            See all <FiArrowRight size={14} />
          </Link>
        </div>

        {/* Horizontal scroll strip — Amazon/FirstCry pattern. */}
        <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-3 -mx-3 sm:-mx-4 px-3 sm:px-4 snap-x">
          {items.map((p) => {
            const final = p.discount > 0
              ? +(p.price - (p.price * p.discount) / 100).toFixed(2)
              : p.price;
            return (
              <Link
                key={p._id}
                to={`/product/${p.slug || p._id}`}
                className="snap-start flex-shrink-0 w-[140px] sm:w-[170px] bg-white border rounded-lg overflow-hidden hover:border-primary-300 hover:shadow transition"
              >
                <div className="aspect-square bg-white relative">
                  <img
                    src={resolveImage(p.image)}
                    alt={p.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = PLACEHOLDER; }}
                  />
                  {p.discount > 0 && (
                    <span className="absolute top-1 left-1 bg-primary-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                      -{p.discount}%
                    </span>
                  )}
                </div>
                <div className="p-2">
                  {p.brand && (
                    <p className="text-[8px] uppercase tracking-wide text-gray-400 truncate font-semibold">{p.brand}</p>
                  )}
                  <p className="text-[11px] sm:text-xs text-gray-800 line-clamp-2 leading-snug">{p.name}</p>
                  <div className="flex items-baseline gap-1 mt-1 flex-wrap">
                    <span className="text-sm font-bold text-gray-900">₹{final.toFixed(0)}</span>
                    {p.discount > 0 && (
                      <span className="text-[10px] text-gray-400 line-through">₹{p.price?.toFixed?.(0)}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
