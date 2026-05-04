import { useEffect, useRef, useState } from 'react';

// Threshold + rootMargin tuned together: the element only needs ~5% of
// its height in view, AND we extend the trigger zone 80px above the
// viewport bottom. Together this means the reveal starts firing while
// the card is still mostly off-screen, so by the time the user is
// looking AT the card it's already finishing its slide-in — the result
// reads as smooth presence rather than abrupt pop-in.
export function useReveal({ threshold = 0.05, once = true, rootMargin = '0px 0px -80px 0px' } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) obs.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, once, rootMargin]);

  return [ref, visible];
}

export function useCounter(target, { duration = 1500, start = false } = {}) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf, startTime;
    const step = (t) => {
      if (!startTime) startTime = t;
      const progress = Math.min((t - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}
