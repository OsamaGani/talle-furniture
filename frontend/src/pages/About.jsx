import PageHeader from '../components/PageHeader';
import Reveal from '../components/Reveal';
import { Link } from 'react-router-dom';
import { FiAward, FiHeart, FiTruck, FiShield, FiUsers, FiPackage, FiArrowRight } from 'react-icons/fi';
import SEO from '../components/SEO';

const values = [
  { icon: <FiAward />, title: 'Authentic Brands', desc: 'Every toy is sourced directly from authorized distributors. No fakes, ever.' },
  { icon: <FiHeart />, title: 'Made to Delight', desc: 'We hand-pick toys that spark joy, learning and imagination in kids of every age.' },
  { icon: <FiShield />, title: 'Safety First', desc: 'BIS / EN71 certified products that meet the strictest child-safety standards.' },
  { icon: <FiTruck />, title: 'Fast Delivery', desc: 'Free shipping over ₹999 across India. Most orders reach you within 5 days.' },
];

const stats = [
  { num: '5,200+', label: 'Happy Families' },
  { num: '850+',   label: 'Toys in Stock' },
  { num: '20+',    label: 'Top Brands' },
  { num: '99%',    label: 'Customer Smiles' },
];

export default function About() {
  return (
    <div>
      <SEO
        title="About Toy Mall — Authentic Toys, Trusted Brands, Pan-India Delivery"
        description="Toy Mall is a Mumbra-based online toy store delivering authentic LEGO, Hot Wheels, Barbie, Nerf and more across India. BIS/EN71 certified, fast shipping, COD available."
        path="/about"
      />
      <PageHeader
        title="About Toy Mall"
        subtitle="A neighbourhood toy store from Mumbra reaching kids across India — one smile at a time."
        breadcrumbs={[{ label: 'About Us' }]}
      />

      {/* Story */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <Reveal>
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-4">Our Story</h2>
              <p className="text-gray-700 leading-relaxed">
                Toy Mall began as a small storefront in Mobin Apartment, Amrut Nagar, Mumbra — founded by
                <strong> Abu Huraira Khan</strong> as a place where parents could discover quality toys
                without travelling all the way to the city. What started with a few shelves of building
                blocks and dolls has grown into an online catalogue of hundreds of carefully chosen toys
                from brands kids love around the world.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                We&apos;re still the same family-run shop at heart. Every order — big or small — is packed with the same
                care, whether it&apos;s a single toy car for a birthday gift or a wholesale carton headed for a partner
                shop in another city.
              </p>
              <div className="mt-5 inline-flex items-center gap-3 bg-primary-50 border border-primary-200 rounded-xl px-4 py-3">
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-pink-500 text-white font-extrabold flex items-center justify-center">A</span>
                <div>
                  <p className="font-bold text-sm text-gray-900">Abu Huraira Khan</p>
                  <p className="text-xs text-gray-500">Founder &amp; Owner</p>
                </div>
              </div>
            </div>
            <div className="aspect-square rounded-2xl overflow-hidden shadow-xl">
              <img src="https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=800" alt="Toy Mall store" className="w-full h-full object-cover" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* Stats */}
      <section className="bg-gradient-to-r from-primary-500 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl md:text-4xl font-extrabold">{s.num}</p>
              <p className="opacity-90 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <Reveal>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold">What we believe</h2>
            <p className="text-gray-600 mt-2">The values guiding every toy we stock and every box we ship.</p>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={i * 100}>
              <div className="bg-white border-2 border-gray-100 hover:border-primary-500 rounded-xl p-6 transition hover:shadow-lg group h-full">
                <div className="bg-primary-100 group-hover:bg-primary-500 group-hover:text-white text-primary-500 w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-3 transition">
                  {v.icon}
                </div>
                <h3 className="font-bold text-lg">{v.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{v.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTAs */}
      <section className="bg-gray-50 border-y">
        <div className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-6">
          <Link to="/wholesale" className="bg-gradient-to-r from-purple-600 to-primary-500 text-white rounded-xl p-8 hover:shadow-xl transition flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-extrabold">Run a shop?</h3>
              <p className="opacity-90 mt-1">Open a wholesale account and save up to 40%</p>
            </div>
            <FiArrowRight size={28} />
          </Link>
          <Link to="/contact" className="bg-gray-900 text-white rounded-xl p-8 hover:shadow-xl transition flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-extrabold">Get in touch</h3>
              <p className="opacity-90 mt-1">Visit our store in Mumbra or call +91 77380 28750</p>
            </div>
            <FiArrowRight size={28} />
          </Link>
        </div>
      </section>
    </div>
  );
}
