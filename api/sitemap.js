/**
 * Website-Perkfinity/api/sitemap.js
 *
 * Dynamic XML Sitemap Generator (/sitemap.xml).
 * - Automatically lists all core static pages, all active /deals/:city and /deals/:county hubs,
 *   and all active (unhidden) /store/:slug merchant landing pages directly from the production API.
 * - Whenever a new business signs up or a pre-setup business is unhidden in Admin,
 *   it automatically appears in /sitemap.xml without running any build script.
 */

const { fetchMerchants, fetchOnlineMerchants, slugify } = require('./store-page');

const CORE_PAGES = [
  { loc: 'https://www.perkfinity.net/', changefreq: 'daily', priority: '1.0' },
  { loc: 'https://www.perkfinity.net/codes', changefreq: 'daily', priority: '0.9' },
  { loc: 'https://www.perkfinity.net/localperks', changefreq: 'daily', priority: '0.9' },
  { loc: 'https://www.perkfinity.net/deals/orange-county', changefreq: 'daily', priority: '0.9' },
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

function buildSitemapXml(merchants, onlineMerchants = []) {
  const today = new Date().toISOString().split('T')[0];

  // Collect all unique active city slugs (plus standard OC hubs) from local/mobile/hybrid merchants only
  const citySlugs = new Set(['mission-viejo', 'lake-forest', 'irvine']);
  (merchants || []).forEach(m => {
    if (m.business_presence === 'online') return;
    const cs = slugify(m.city);
    if (cs) citySlugs.add(cs);
  });

  // Collect all unique active store slugs across both local/hybrid/mobile AND online merchants
  const storeSlugs = [];
  const seenStore = new Set();
  [...(merchants || []), ...(onlineMerchants || [])].forEach(m => {
    const s = slugify(m.business_name);
    if (s && !seenStore.has(s)) {
      seenStore.add(s);
      storeSlugs.push(s);
    }
  });

  const urlEntries = [];

  CORE_PAGES.forEach(p => {
    urlEntries.push(`  <url>
    <loc>${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`);
  });

  citySlugs.forEach(cs => {
    urlEntries.push(`  <url>
    <loc>https://www.perkfinity.net/deals/${cs}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`);
  });

  storeSlugs.forEach(slug => {
    urlEntries.push(`  <url>
    <loc>https://www.perkfinity.net/store/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`);
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
