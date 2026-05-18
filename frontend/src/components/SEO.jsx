import { Helmet } from 'react-helmet-async';

// Single source of truth for the public site URL — used in canonical links,
// Open Graph tags, sitemap entries, etc. Falls back to the Cloudflare Pages
// URL so SEO tags still work in dev / preview builds.
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://tallefurnituremart.com').replace(/\/$/, '');
export const SITE_NAME = 'Talle Furniture Mart';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;

// Title is appended with the brand on every page — "<page> · Talle Furniture Mart" —
// so search results show the brand even on long-tail product pages.
// Sweet spot: 50–60 chars before Google truncates with "...".
export default function SEO({
  title,
  description,
  image,
  path,                 // e.g. "/shop", "/product/talle-aero-executive"
  noIndex = false,
  type = 'website',     // 'website' | 'product' | 'article'
  jsonLd,               // raw object — gets stringified into a <script type="application/ld+json">
  keywords,             // optional comma-separated string for the legacy meta
}) {
  const fullTitle = title
    ? (title.includes(SITE_NAME) ? title : `${title} · ${SITE_NAME}`)
    : `${SITE_NAME} — Office Chair Manufacturer & Repair, Mumbai`;
  const fullUrl = `${SITE_URL}${path || ''}`;
  const ogImage = image || DEFAULT_OG_IMAGE;

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={fullUrl} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph — Facebook, LinkedIn, WhatsApp share previews */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
