import { useReveal, useCounter } from '../hooks/useReveal';
import { FiUsers, FiPackage, FiAward, FiSmile } from 'react-icons/fi';

const stats = [
  { icon: <FiUsers />,   target: 8000,  suffix: '+', label: 'Chairs Sold' },
  { icon: <FiPackage />, target: 400,   suffix: '+', label: 'Chairs in Catalog' },
  { icon: <FiAward />,   target: 15,    suffix: '+', label: 'Top Chair Brands' },
  { icon: <FiSmile />,   target: 98,    suffix: '%', label: 'Satisfaction' },
];

export default function StatsCounter() {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} className="bg-gray-900 text-white">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-12 grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <Stat key={s.label} {...s} start={visible} delay={i * 120} />
        ))}
      </div>
    </section>
  );
}

function Stat({ icon, target, suffix, label, start, delay }) {
  const value = useCounter(target, { start });
  return (
    <div className="text-center" style={{ transitionDelay: `${delay}ms` }}>
      <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur rounded-full text-2xl mb-2 animate-float">
        {icon}
      </div>
      <p className="text-3xl md:text-4xl font-extrabold">{value.toLocaleString()}{suffix}</p>
      <p className="text-sm opacity-90">{label}</p>
    </div>
  );
}
