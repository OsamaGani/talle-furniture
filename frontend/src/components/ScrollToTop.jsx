import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Hash link inside the same page — smoothly scroll to that section.
    if (hash) {
      const el = document.querySelector(hash);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    }

    // Route change: smooth-scroll to top when we're already near the top
    // (feels natural). Otherwise jump instantly so the new page is visible
    // right away — long smooth scrolls from deep on the previous page just
    // make the new content feel slow to appear.
    const y = window.scrollY;
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: y < 600 ? 'smooth' : 'auto',
    });
  }, [pathname, hash]);

  return null;
}
