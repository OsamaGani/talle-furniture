import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Brief overlay loader shown on every route change. Gives navigation a
 * smooth "loading" feel without blocking real interactivity for long.
 *
 * Behaviour:
 *   - Skips the very first render (so the initial page load isn't gated).
 *   - Shows on every subsequent route change for `duration` ms.
 *   - Fades in/out via CSS, so it doesn't feel abrupt.
 */
export default function RouteLoader({ duration = 700 }) {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [pathname, duration]);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity duration-300 ${
        visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex flex-col items-center gap-3">
        {/* Brand mark + spinner */}
        <div className="relative w-14 h-14">
          <span className="absolute inset-0 rounded-full border-4 border-primary-100" />
          <span className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center text-xl font-extrabold text-primary-500">
            T
          </span>
        </div>
        <p className="text-xs font-semibold text-gray-500 tracking-wide uppercase">
          Loading…
        </p>
      </div>
    </div>
  );
}
