/**
 * Website-Perkfinity/api/deals-page.js
 *
 * Dynamic Server-Side Rendered (SSR) City & County Hub (/deals/:location).
 * - Serves the 100% identical visual UI of localperks.html for human visitors.
 * - Dynamically resolves ANY city or county (e.g., /deals/mission-viejo, /deals/lake-forest,
 *   /deals/irvine, /deals/orange-county, or any future city where a merchant signs up).
 * - Fixes the canonical tag bug (sets self-referencing canonical https://www.perkfinity.net/deals/:location).
 * - Injects server-side <title>, <h1>, <meta description>, <meta keywords>, Schema.org ItemList,
 *   and a category-grouped <noscript> directory (Auto Repair Deals, Spa Deals, Nail Salon Deals,
 *   Restaurant Deals, etc.) so Google ranks both the city page AND the linked /store/:slug pages.
 */

const fs = require('fs');
const path = require('path');
const { classifyMerchantSEO } = require('./_seo-keywords');
const { fetchMerchants, slugify } = require('./store-page');

const LOCALPERKS_PATH = path.resolve(__dirname, '..', 'localperks-view.html');

const COUNTY_MAP = {
  'orange-county': { name: 'Orange County', type: 'county', state: 'CA' },
  'los-angeles-county': { name: 'Los Angeles County', type: 'county', state: 'CA' },
  'san-diego-county': { name: 'San Diego County', type: 'county', state: 'CA' },
  'riverside-county': { name: 'Riverside County', type: 'county', state: 'CA' },
  'san-bernardino-county': { name: 'San Bernardino County', type: 'county', state: 'CA' }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolveLocationInfo(rawSlug, merchants) {
  const clean = slugify(rawSlug || 'orange-county');
  if (COUNTY_MAP[clean]) {
    return { slug: clean, ...COUNTY_MAP[clean] };
  }
  if (clean.endsWith('-county')) {
    const title = clean.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return { slug: clean, name: title, type: 'county', state: 'CA' };
  }

  // Check if any active merchant matches this city slug for exact capitalization/state
  const cityMerchant = (merchants || []).find(m => slugify(m.city) === clean);
  if (cityMerchant) {
    return {
      slug: clean,
      name: cityMerchant.city.trim(),
      type: 'city',
      state: cityMerchant.state || 'CA'
    };
  }

  const title = clean.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return { slug: clean, name: title, type: 'city', state: 'CA' };
}

function buildDealsPageHtml(rawLocSlug, allMerchants) {
  const loc = resolveLocationInfo(rawLocSlug, allMerchants);
  const canonicalUrl = `https://www.perkfinity.net/deals/${loc.slug}`;

  // Filter merchants for this city (or all merchants if county-level / fallback)
  let matchingMerchants = allMerchants;
  if (loc.type === 'city') {
    const cityMatches = allMerchants.filter(m => slugify(m.city) === loc.slug);
    if (cityMatches.length > 0) {
      matchingMerchants = cityMatches;
    }
  }

  // Classify all matching merchants
  const enriched = matchingMerchants.map(m => ({
    merchant: m,
    seo: classifyMerchantSEO(m),
    slug: slugify(m.business_name)
  }));

  // Group by categoryHeading for semantic <noscript> & keyword summary
  const groups = {};
  enriched.forEach(item => {
    const heading = item.seo.categoryHeading;
    if (!groups[heading]) groups[heading] = [];
    groups[heading].push(item);
  });

  // Collect distinct niches & top keyword phrases in this location
  const distinctNiches = [...new Set(enriched.map(e => e.seo.primaryNiche.split(/[,&]/)[0].trim()))].slice(0, 6);
  const nicheSummary = distinctNiches.length > 0
    ? distinctNiches.join(', ')
    : 'Auto Repair, Restaurants, Smoothies, Spa & Retail';

  const topMerchantsPreview = enriched
    .slice(0, 5)
    .map(e => `${e.merchant.business_name} (${e.seo.shortOffer} ${e.seo.primaryNiche.split(/[,&]/)[0].trim()})`)
    .join(', ');

  const pageTitle = `${loc.name}, ${loc.state} Deals, Coupons & Local Discounts — ${nicheSummary} | Perkfinity`;
  const metaDescription = `Verified ${loc.name}, ${loc.state} deals, store coupons & local discounts: ${topMerchantsPreview || 'independent shops, restaurants, auto repair, spas & salons'}. Claim free on Perkfinity.`;

  const locKeywords = [];
  enriched.forEach(e => {
    e.seo.serviceKeywords.slice(0, 3).forEach(kw => {
      locKeywords.push(`${kw} in ${loc.name}`);
      locKeywords.push(`${loc.name} ${kw}`);
    });
    locKeywords.push(`${e.merchant.business_name} ${loc.name} deals`);
  });
  locKeywords.push(`${loc.name} deals`, `${loc.name} coupons`, `${loc.name} local discounts`, 'Perkfinity');
  const seenKw = new Set();
  const dedupedKw = locKeywords.filter(k => {
    const l = k.toLowerCase();
    if (seenKw.has(l)) return false;
    seenKw.add(l);
    return true;
  }).slice(0, 22).join(', ');

  // Build Schema.org CollectionPage + ItemList
  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${canonicalUrl}#webpage`,
        "url": canonicalUrl,
        "name": pageTitle,
        "description": metaDescription,
        "isPartOf": {
          "@type": "WebSite",
          "name": "Perkfinity",
          "url": "https://www.perkfinity.net"
        }
      },
      {
        "@type": "ItemList",
        "name": `Verified Local Deals & Coupons in ${loc.name}, ${loc.state}`,
        "url": canonicalUrl,
        "numberOfItems": enriched.length,
        "itemListElement": enriched.map((e, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "item": {
            "@type": e.seo.schemaType,
            "name": e.merchant.business_name,
            "url": `https://www.perkfinity.net/store/${e.slug}`,
            "description": e.seo.metaDescription,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": e.merchant.address || '',
              "addressLocality": e.merchant.city || loc.name,
              "addressRegion": e.merchant.state || loc.state,
              "postalCode": e.merchant.postal_code || '',
              "addressCountry": "US"
            },
            "makesOffer": {
              "@type": "Offer",
              "name": e.merchant.welcome_offer_text || 'Exclusive Member Perk',
              "category": e.seo.primaryNiche
            }
          }
        }))
      }
    ]
  };

  // Build category-grouped <noscript> HTML so Googlebot sees H2 sections for "Auto Repair Deals in Mission Viejo", etc.
  const noscriptSectionsHtml = Object.entries(groups).map(([heading, items]) => {
    const lis = items.map(({ merchant: m, seo, slug }) => {
      const mCity = m.city || loc.name;
      const mOffer = m.welcome_offer_text || 'Exclusive Member Perk';
      return `<li><a href="/store/${slug}"><strong>${escapeHtml(m.business_name)} (${escapeHtml(mCity)}) — ${escapeHtml(seo.primaryNiche)} Deals &amp; Coupons</strong></a>: ${escapeHtml(mOffer)} — <em>${escapeHtml(seo.serviceKeywords.slice(0, 5).join(', '))} in ${escapeHtml(mCity)}, ${escapeHtml(m.state || 'CA')}</em></li>`;
    }).join('\n          ');
    return `
        <h3 style="margin-top:16px;">${escapeHtml(heading)} in ${escapeHtml(loc.name)}, ${escapeHtml(loc.state)}</h3>
        <ul>
          ${lis}
        </ul>`;
  }).join('\n');

  let html = fs.readFileSync(LOCALPERKS_PATH, 'utf8');

  // 1. Replace <title>, <meta description>, <meta keywords>, and <link rel="canonical">
  html = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(pageTitle)}</title>`
  );
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(metaDescription)}" />`
  );
  html = html.replace(
    /<meta\s+name="keywords"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="keywords" content="${escapeHtml(dedupedKw)}" />`
  );
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${canonicalUrl}" />`
  );

  // 2. Replace OpenGraph & Twitter tags
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${canonicalUrl}" />`
  );
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${escapeHtml(pageTitle)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${escapeHtml(metaDescription)}" />`
  );

  // 3. Replace JSON-LD script block
  html = html.replace(
    /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i,
    `<script type="application/ld+json">\n${JSON.stringify(schemaGraph, null, 2)}\n  </script>`
  );

  // 4. Replace initial H1 (#hero-title) so Googlebot sees the city/county H1 immediately
  const heroHeading = loc.type === 'county'
    ? `Exclusive Deals &amp; Local Perks Across ${escapeHtml(loc.name)}, ${escapeHtml(loc.state)}`
    : `Exclusive Deals &amp; Local Perks in ${escapeHtml(loc.name)}, ${escapeHtml(loc.state)}`;
  html = html.replace(
    /<h1\s+id="hero-title">[\s\S]*?<\/h1>/i,
    `<h1 id="hero-title">${heroHeading}</h1>`
  );

  // 5. Enrich <noscript> block with live category-grouped links for this city/county
  html = html.replace(
    /<noscript>[\s\S]*?<\/noscript>/i,
    `<noscript>
      <div style="max-width:960px;margin:32px auto;padding:24px;background:#fff;border-radius:16px;border:1px solid #e5e7eb;">
        <h2>Verified Local Deals, Store Coupons &amp; Member Discounts in ${escapeHtml(loc.name)}, ${escapeHtml(loc.state)}</h2>
        <p>${escapeHtml(metaDescription)}</p>
        ${noscriptSectionsHtml}
      </div>
    </noscript>`
  );

  return html;
}

module.exports = async function handler(req, res) {
  try {
    const rawLoc = (req.query && (req.query.location || req.query.loc || req.query.city))
      || (req.url.match(/\/deals\/([^/?#]+)/) || [])[1]
      || 'orange-county';

    const decodedLoc = decodeURIComponent(rawLoc);
    const cleanLoc = slugify(decodedLoc);
    if (!cleanLoc || cleanLoc === 'parentslug' || /[\${}]/.test(decodedLoc) || /[\${}]/.test(rawLoc)) {
      res.writeHead(308, { Location: 'https://www.perkfinity.net/localperks' });
      return res.end();
    }
    const isFromLocalperksQuery = Boolean(
      (req.url && req.url.startsWith('/localperks')) ||
      (req.query && (req.query.city || req.query.loc))
    );
    if (isFromLocalperksQuery || decodedLoc !== cleanLoc) {
      res.writeHead(308, { Location: `https://www.perkfinity.net/deals/${cleanLoc}` });
      return res.end();
    }

    const isCounty = Boolean(COUNTY_MAP[cleanLoc] || cleanLoc.endsWith('-county'));
    let merchants = [];
    if (!isCounty && cleanLoc) {
      const cityQuery = cleanLoc.replace(/-/g, ' ');
      merchants = await fetchMerchants({ city: cityQuery });
    }
    if (!merchants || merchants.length === 0) {
      merchants = await fetchMerchants();
    }
    const html = buildDealsPageHtml(cleanLoc, merchants);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).send(html);
  } catch (err) {
    console.error('SSR deals-page error:', err);
    res.writeHead(302, { Location: '/localperks' });
    return res.end();
  }
};

module.exports.buildDealsPageHtml = buildDealsPageHtml;
