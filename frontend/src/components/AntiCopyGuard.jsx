import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Lightweight anti-copy / anti-scrape DETERRENTS. None of these stop a
// determined developer — that's fundamentally impossible on the web — but
// they raise the bar enough that:
//   * Casual users can't right-click → "Save image as" your product photos
//   * Common keyboard shortcuts (Ctrl+S, Ctrl+U, F12) feel discouraging
//   * The browser console shows a clear ownership/legal warning
//
// What we DO NOT do:
//   * Disable text selection (legitimate users copy product names, prices,
//     order numbers all the time — breaking that is hostile UX)
//   * Anti-debugger infinite loops (annoying, easily bypassed, breaks
//     legitimate browser features for accessibility tools)
//   * Lock the entire page from interaction
//
// On admin / invoice / print routes the guard is fully off so the store
// owner can use DevTools, save labels, etc., without fighting their own site.

export default function AntiCopyGuard() {
  const { pathname } = useLocation();
  const isAdminOrPrint =
    pathname.startsWith('/admin') ||
    pathname.includes('/invoice') ||
    pathname.includes('/label');

  useEffect(() => {
    if (isAdminOrPrint) return;

    // 1. Block right-click on images only — keeps text right-click working
    //    (so customers can still "Search for this on Google", "Open in new
    //    tab", etc.) but stops the casual "Save image as" theft of product
    //    photos. Run on the document so dynamically-mounted images are caught.
    const onContextMenu = (e) => {
      const t = e.target;
      if (t && t.tagName === 'IMG') e.preventDefault();
    };

    // 2. Block "Save Page As" (Ctrl/⌘+S) and "View Source" (Ctrl/⌘+U).
    //    Pure deterrent — DevTools still expose everything to people who
    //    care to look. The point is to stop accidental / lazy copying.
    const onKeyDown = (e) => {
      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      if (ctrlOrCmd && (e.key === 's' || e.key === 'S')) e.preventDefault();
      if (ctrlOrCmd && (e.key === 'u' || e.key === 'U')) e.preventDefault();
    };

    // 3. Discourage drag-drop of images into other tabs / save targets.
    const onDragStart = (e) => {
      if (e.target?.tagName === 'IMG') e.preventDefault();
    };

    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('dragstart', onDragStart);

    return () => {
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('dragstart', onDragStart);
    };
  }, [isAdminOrPrint]);

  // Console-level warning. Anyone who DOES open DevTools sees a big banner
  // explaining the legal stance on copying. Doesn't prevent anything but
  // sets a clear paper trail for trademark / DMCA action later if needed.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.__toymallWarned) return;
    window.__toymallWarned = true;
    const big = 'font-size:18px;font-weight:bold;color:#e53935;';
    const note = 'font-size:13px;color:#374151;';
    // eslint-disable-next-line no-console
    console.log('%c⚠ Stop!', big);
    // eslint-disable-next-line no-console
    console.log(
      '%cThis is the developer console of Toy Mall (toymall.in).\n\n' +
      'The frontend code, design, and content on this site are © Toy Mall and ' +
      'protected under the Indian Copyright Act, 1957. Copying, scraping, or ' +
      'cloning the site is illegal and we will pursue trademark + DMCA action.\n\n' +
      'If you found a bug or security issue: please email security@toymall.in.\n' +
      'We pay bug bounties for genuine reports.',
      note
    );
  }, []);

  return null;
}
