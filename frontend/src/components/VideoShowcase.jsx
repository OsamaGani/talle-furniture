import { useState } from 'react';
import { FiPlay, FiX } from 'react-icons/fi';
import Reveal from './Reveal';

// Chair-related demo videos. These are publicly-available YouTube videos
// chosen as stand-ins until Abdul uploads Talle's own workshop / product
// reels. To swap one out, just paste the new video's 11-character YouTube
// ID into youtubeId (the part after "v=" in the URL).
const videos = [
  {
    title: 'Inside the Chair Workshop',
    desc: 'Watch how an office chair is built — frame, mesh, hydraulic & base',
    thumb: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800',
    youtubeId: 'p1nUFGCO0RY',
  },
  {
    title: 'Ergonomic Setup Guide',
    desc: 'How to dial in your chair for an 8-hour workday — lumbar, height, tilt',
    thumb: 'https://images.unsplash.com/photo-1505843490701-5be5d1b31f8f?w=800',
    youtubeId: 'F8_ME4VwTiw',
  },
  {
    title: 'Gaming Chair Walkthrough',
    desc: 'Racing-style features explained — 4D armrests, recline lock & footrest',
    thumb: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800',
    youtubeId: 'ck46cWxq5Tw',
  },
];

export default function VideoShowcase() {
  const [active, setActive] = useState(null);

  return (
    <section className="bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-16">
        <Reveal>
          <div className="text-center mb-10">
            <span className="inline-block bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">▶ WATCH IN ACTION</span>
            <h2 className="text-3xl md:text-4xl font-extrabold">See the Chairs in Action</h2>
            <p className="text-gray-300 mt-2">Real product videos so you know exactly what you're getting</p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-5">
          {videos.map((v, i) => (
            <Reveal key={v.title} delay={i * 150}>
              <button
                onClick={() => setActive(v)}
                className="relative w-full aspect-video rounded-xl overflow-hidden group block"
              >
                <img src={v.thumb} alt={v.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-2xl animate-pulseRing group-hover:scale-110 transition">
                    <FiPlay size={26} className="ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                  <p className="font-bold text-white">{v.title}</p>
                  <p className="text-xs text-gray-300">{v.desc}</p>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Modal */}
      {active && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setActive(null)}>
          <button onClick={() => setActive(null)} className="absolute top-4 right-4 text-white hover:text-primary-500 z-10">
            <FiX size={36} />
          </button>
          <div className="w-full max-w-4xl aspect-video animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <iframe
              className="w-full h-full rounded-xl"
              src={`https://www.youtube.com/embed/${active.youtubeId}?autoplay=1&rel=0`}
              title={active.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </section>
  );
}
