import { Link } from 'react-router-dom';

// Shop-by-material tiles — chair-mart's homepage facet.
// Each tile links into /shop with the matching material filter, so the
// Shop page already knows what to show without any extra wiring.
//
// Component name kept as ShopByAge to avoid breaking every import; the
// default export and folder name still work — only the UI is rematerialised
// for the chair business. Rename later in a focused refactor if you want.

const MATERIALS = [
  { label: 'Mesh',         emoji: '🕸',  sub: 'Breathable office', color: 'from-sky-100 to-blue-100',       border: 'border-sky-200' },
  { label: 'Leather',      emoji: '🟫',  sub: 'Premium executive', color: 'from-stone-100 to-amber-100',    border: 'border-amber-300' },
  { label: 'Faux Leather', emoji: '🪑', sub: 'Gaming & sport',    color: 'from-red-100 to-rose-100',       border: 'border-rose-200' },
  { label: 'Fabric',       emoji: '🧵', sub: 'Lounge & accent',   color: 'from-emerald-100 to-teal-100',   border: 'border-emerald-200' },
  { label: 'Wood',         emoji: '🪵', sub: 'Dining & cafe',     color: 'from-amber-100 to-orange-100',   border: 'border-amber-200' },
  { label: 'Metal',        emoji: '⚙',  sub: 'Banquet & folding', color: 'from-slate-100 to-zinc-100',     border: 'border-slate-200' },
];

export default function ShopByAge() {
  return (
    <section className="py-10 sm:py-14 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-xs sm:text-sm font-bold text-primary-500 uppercase tracking-widest mb-1">Choose what fits</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">Shop by Material</h2>
          <p className="text-sm text-gray-600 mt-1">From breathable mesh to premium leather — pick the feel you want</p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
          {MATERIALS.map((m) => (
            <Link
              key={m.label}
              to={`/shop?material=${encodeURIComponent(m.label)}`}
              className={`relative bg-gradient-to-br ${m.color} ${m.border} border-2 rounded-2xl p-3 sm:p-4 text-center transition hover:scale-[1.03] hover:shadow-lg group`}
            >
              <div className="text-3xl sm:text-4xl md:text-5xl mb-1 sm:mb-2 group-hover:scale-110 transition-transform">
                {m.emoji}
              </div>
              <p className="font-extrabold text-xs sm:text-sm text-gray-900 leading-tight">{m.label}</p>
              <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 hidden sm:block">{m.sub}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
