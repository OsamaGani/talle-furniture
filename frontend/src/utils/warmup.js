// Render's free tier sleeps a service after ~15 min of inactivity. The
// first request after sleep takes 30–50 s to wake it up, which means the
// home page product API calls hang and the customer sees a blank screen.
//
// Mitigation: as soon as the SPA mounts, fire a single low-cost GET at
// the API origin. It wakes the backend in the background while the user
// is still looking at the static shell, so by the time they land on
// /shop or /product/* the server is already warm.

const API_URL = import.meta.env.VITE_API_URL || '/api';
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

let pinged = false;
export function warmUpBackend() {
  if (pinged) return;
  pinged = true;
  // Don't await, don't toast on failure, don't block render — pure
  // fire-and-forget. AbortController gives us a hard cap so a stuck
  // fetch doesn't sit in the browser's connection pool forever.
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 60_000);
    fetch(`${API_ORIGIN}/`, { signal: controller.signal, mode: 'cors' }).catch(() => {});
  } catch {
    // ignore — happens in environments without fetch (SSR, old browsers)
  }
}
