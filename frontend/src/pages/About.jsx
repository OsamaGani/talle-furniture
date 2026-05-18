import PageHeader from '../components/PageHeader';
import Reveal from '../components/Reveal';
import { Link } from 'react-router-dom';
import { FiAward, FiHeart, FiTruck, FiShield, FiArrowRight } from 'react-icons/fi';
import SEO from '../components/SEO';

const values = [
  { icon: <FiAward />,  title: 'Office Chair Specialists', desc: 'Manufacturer of executive, ergonomic, workstation, visitor and revolving office chairs — built and inspected by craftsmen with 15+ years of seating experience.' },
  { icon: <FiHeart />,  title: 'Customised To Order',      desc: 'Need a specific fabric, height, armrest or branding? We make chairs to your spec. Also full lines for restaurants, wooden dining sets, and bespoke seating.' },
  { icon: <FiShield />, title: 'Repair &amp; Refurbish',   desc: 'Hydraulic replacement, cushion redo, reupholstery, wheel &amp; base fix — bring a tired chair, take home one that feels brand new.' },
  { icon: <FiTruck />,  title: 'D2D Service Mumbai',       desc: 'Door-to-door pickup &amp; delivery across Mumbai &amp; nearby areas. Pan-India dispatch available. Real human on +91 93261 66875.' },
];

const stats = [
  { num: '15+',     label: 'Years in Business' },
  { num: '8,000+',  label: 'Chairs Sold' },
  { num: '4.9★',    label: 'Google Rating (213 reviews)' },
  { num: '24×7',    label: 'Open All Days' },
];

export default function About() {
  return (
    <div>
      <SEO
        title="About Us — Chair Manufacturer & Repair Workshop, Saki Naka Mumbai"
        description="Talle Furniture Mart is a family-run chair manufacturer & repair workshop in Saki Naka, Mumbai. 15+ years, 4.9★ Google rating (213 reviews), founded by Abdul Rab. Office, banquet, restaurant chairs + D2D repair."
        path="/about"
        keywords="talle furniture mart, abdul rab chair manufacturer, chair manufacturer sakinaka, chair repair mumbai, office chair workshop mumbai, ergonomic chair maker india, banquet chair manufacturer, family run furniture workshop mumbai, chair reupholstery sakinaka, d2d chair service mumbai"
      />
      <PageHeader
        title="Specialist in Office Chairs & Repairs — Mumbai"
        subtitle="Talle Furniture Mart is a Saki Naka-based manufacturer and repair workshop. All kinds of office chairs, customised seating, wooden dining sets, restaurant chairs and full D2D service across Mumbai &amp; nearby — with pan-India delivery."
        breadcrumbs={[{ label: 'About Us' }]}
      />

      {/* Story */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <Reveal>
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-4">Our Story</h2>
              <p className="text-gray-700 leading-relaxed">
                Talle Furniture Mart opened at D'Souza Sadan, Saki Naka with one simple
                goal: give Mumbai a chair shop where the people fitting the cylinder
                actually know how it works. Founded by <strong>Abdul Rab</strong>, the
                shop quickly became the place offices, banquet halls and restaurants
                came to for genuine seating that lasted.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                Word spread, and customers from every Mumbai suburb — and beyond — started
                asking if we could deliver, repair their tired chairs, manufacture custom
                runs for new offices. So we built this online store and a doorstep service
                operation. Whether you walk into our workshop or order from across the
                country, the promise is the same: <strong>real components, fair prices,
                and a shop owner who personally signs off on every repair.</strong>
              </p>
              <div className="mt-5 inline-flex items-center gap-3 bg-primary-50 border border-primary-200 rounded-xl px-4 py-3">
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-pink-500 text-white font-extrabold flex items-center justify-center">A</span>
                <div>
                  <p className="font-bold text-sm text-gray-900">Abdul Rab</p>
                  <p className="text-xs text-gray-500">Founder &amp; Master Craftsman</p>
                </div>
              </div>
            </div>
            <div className="aspect-square rounded-2xl overflow-hidden shadow-xl">
              <img src="https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800" alt="Talle Furniture Mart workshop" className="w-full h-full object-cover" />
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
            <h2 className="text-2xl md:text-3xl font-extrabold">How We Run the Workshop</h2>
            <p className="text-gray-600 mt-2">Four standards we don't compromise on — for every chair that leaves the shop.</p>
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
          <Reveal direction="left">
            <Link to="/wholesale" className="bg-gradient-to-r from-purple-600 to-primary-500 text-white rounded-xl p-8 hover:shadow-xl transition flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-extrabold">Outfitting an office?</h3>
                <p className="opacity-90 mt-1">Open a wholesale account for the best rates</p>
              </div>
              <FiArrowRight size={28} />
            </Link>
          </Reveal>
          <Reveal direction="right" delay={150}>
            <Link to="/contact" className="bg-gray-900 text-white rounded-xl p-8 hover:shadow-xl transition flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-extrabold">Need a repair quote?</h3>
                <p className="opacity-90 mt-1">Visit our Sakinaka workshop or call +91 93261 66875</p>
              </div>
              <FiArrowRight size={28} />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
