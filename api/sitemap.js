/**
 * Website-Perkfinity/api/sitemap.js
 *
 * Dynamic XML Sitemap Generator (/sitemap.xml).
 * - Lists core static pages with stable deployment dates.
 * - Dynamically lists only active (≥1 live merchant) /deals/:city hubs, /localperks, /codes,
 *   and active /store/:slug landing pages using real m.updated_at dates.
 * - Excludes 0-merchant cities and deduplicates all <loc> URLs so Google Search Console stays 100% clean.
 */

const { fetchMerchants, fetchOnlineMerchants, slugify } = require('./store-page');

const STATIC_DEPLOY_DATE = '2026-11-09';
const FALLBACK_MERCHANT_DATE = '2026-11-01';

const COUNTY_SLUGS = new Set([
  'orange-county',
  'los-angeles-county',
  'san-diego-county',
  'riverside-county',
  'san-bernardino-county'
]);

const CORE_PAGES = [
  { loc: 'https://www.perkfinity.net/', changefreq: 'daily', priority: '1.0', lastmodKey: 'all' },
  { loc: 'https://www.perkfinity.net/codes', changefreq: 'daily', priority: '0.9', lastmodKey: 'online' },
  { loc: 'https://www.perkfinity.net/localperks', changefreq: 'daily', priority: '0.9', lastmodKey: 'local' },
  { loc: 'https://www.perkfinity.net/deals/orange-county', changefreq: 'daily', priority: '0.9', lastmodKey: 'local' },
  { loc: 'https://www.perkfinity.net/merchants', changefreq: 'weekly', priority: '0.8' },
  { loc: 'https://www.perkfinity.net/get-started', changefreq: 'weekly', priority: '0.8' },
  { loc: 'https://www.perkfinity.net/apply', changefreq: 'weekly', priority: '0.8' },
  { loc: 'https://www.perkfinity.net/enterprise', changefreq: 'monthly', priority: '0.7' },
  { loc: 'https://www.perkfinity.net/about', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://www.perkfinity.net/faq', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://www.perkfinity.net/contact', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://www.perkfinity.net/privacy-policy', changefreq: 'monthly', priority: '0.4' },
  { loc: 'https://www.perkfinity.net/terms-of-use', changefreq: 'monthly', priority: '0.4' }
];

function isCountySlug(slug) {
  return !slug || COUNTY_SLUGS.has(slug) || slug.endsWith('-county');
}

function formatLastMod(dateVal, fallback = FALLBACK_MERCHANT_DATE) {
  if (!dateVal) return fallback;
  const parsed = new Date(dateVal);
  if (Number.isNaN(parsed.getTime())) return fallback;
  const now = new Date();
  const clamped = parsed > now ? now : parsed;
  return clamped.toISOString().split('T')[0];
}

function maxDate(a, b) {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

function buildSitemapXml(merchants, onlineMerchants = []) {
  const localList = Array.isArray(merchants) ? merchants : [];
  const onlineList = Array.isArray(onlineMerchants) ? onlineMerchants : [];

  // Map active citySlug -> max updated_at (only non-online merchants, excluding *-county)
  const cityMap = new Map();
  let maxLocalDate = '';

  localList.forEach(m => {
    if (m.business_presence === 'online') return;
    const mod = formatLastMod(m.updated_at, FALLBACK_MERCHANT_DATE);
    maxLocalDate = maxDate(maxLocalDate, mod);
    const cs = slugify(m.city);
    if (cs && !isCountySlug(cs)) {
      cityMap.set(cs, maxDate(cityMap.get(cs), mod));
    }
  });

  let maxOnlineDate = '';
  onlineList.forEach(m => {
    const mod = formatLastMod(m.updated_at, FALLBACK_MERCHANT_DATE);
    maxOnlineDate = maxDate(maxOnlineDate, mod);
  });

  const maxAllDate = maxDate(maxLocalDate, maxOnlineDate) || STATIC_DEPLOY_DATE;
  const hubDates = {
    all: maxDate(maxAllDate, STATIC_DEPLOY_DATE),
    local: maxDate(maxLocalDate, STATIC_DEPLOY_DATE),
    online: maxDate(maxOnlineDate, STATIC_DEPLOY_DATE)
  };

  // Collect unique active storeSlug -> max updated_at across both local & online lists
  const storeMap = new Map();
  [...localList, ...onlineList].forEach(m => {
    const s = slugify(m.business_name);
    if (!s) return;
    const mod = formatLastMod(m.updated_at, FALLBACK_MERCHANT_DATE);
    storeMap.set(s, maxDate(storeMap.get(s), mod));
  });

  const urlEntries = [];
  const seenLocs = new Set();

  function addEntry(loc, lastmod, changefreq, priority) {
    if (!loc || seenLocs.has(loc)) return;
    seenLocs.add(loc);
    urlEntries.push(`  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`);
  }

  CORE_PAGES.forEach(p => {
    const mod = p.lastmodKey ? hubDates[p.lastmodKey] : STATIC_DEPLOY_DATE;
    addEntry(p.loc, mod, p.changefreq, p.priority);
  });

  cityMap.forEach((lastmod, cs) => {
    addEntry(`https://www.perkfinity.net/deals/${cs}`, lastmod, 'daily', '0.9');
  });

  storeMap.forEach((lastmod, slug) => {
    addEntry(`https://www.perkfinity.net/store/${slug}`, lastmod, 'weekly', '0.85');
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>
`;
}

module.exports = async function handler(req, res) {
  try {
    const [merchants, onlineMerchants] = await Promise.all([
      fetchMerchants(),
      fetchOnlineMerchants().catch(() => [])
    ]);
    const xml = buildSitemapXml(merchants, onlineMerchants);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    return res.status(200).send(xml);
  } catch (err) {
    console.error('SSR sitemap error:', err);
    const xml = buildSitemapXml([], []);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(200).send(xml);
  }
};

module.exports.buildSitemapXml = buildSitemapXml;
module.exports.formatLastMod = formatLastMod;
