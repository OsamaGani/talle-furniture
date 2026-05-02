import { Link } from 'react-router-dom';

// Shop-by-age tiles — a staple of every kids/baby e-commerce homepage.
// Each tile links into /shop with the matching ageGroup filter, so the
// Shop page already knows what to show without any extra wiring.

const AGES = [
  { label: '0-2 Years',  emoji: '👶', sub: 'Soft & sensory', color: 'from-pink-100 to-rose-100',     border: 'border-pink-200' },
  { label: '2-4 Years',  emoji: '🧒', sub: 'Imaginative play', color: 'from-amber-100 to-orange-100', border: 'border-amber-200' },
  { label: '4-6 Years',  emoji: '🎈', sub: 'Build & create',  color: 'from-emerald-100 to-teal-100',  border: 'border-emerald-200' },
  { label: '6-8 Years',  emoji: '🎨', sub: 'Learn & explore', color: 'from-sky-100 to-blue-100',      border: 'border-sky-200' },
  { label: '8 Years+',   emoji: '🚀', sub: 'STEM & games',    color: 'from-violet-100 to-purple-100', border: 'border-violet-200' },
  { label: '12 Years+',  emoji: '🎮', sub: 'Older kids & teens', color: 'from-rose-100 to-fuchsia-100', border: 'border-rose-200' },
];

export default function ShopByAge() {
  return (
    <section className="py-10 sm:py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-xs sm:text-sm font-bold text-primary-500 uppercase tracking-widest mb-1">Find the perfect gift</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">Shop by Age</h2>
          <p className="text-sm text-gray-600 mt-1">Age-appropriate toys hand-picked for every stage</p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
          {AGES.map((a) => (
            <Link
              key={a.label}
              to={`/shop?ageGroup=${encodeURIComponent(a.label)}`}
              className={`relative bg-gradient-to-br ${a.color} ${a.border} border-2 rounded-2xl p-3 sm:p-4 text-center transition hover:scale-[1.03] hover:shadow-lg group`}
            >
              <div className="text-3xl sm:text-4xl md:text-5xl mb-1 sm:mb-2 group-hover:scale-110 transition-transform">
                {a.emoji}
              </div>
              <p className="font-extrabold text-xs sm:text-sm text-gray-900 leading-tight">{a.label}</p>
              <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 hidden sm:block">{a.sub}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
