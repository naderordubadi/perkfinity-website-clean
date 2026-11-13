/**
 * Website-Perkfinity/api/deals-page.js
 *
 * Dynamic Server-Side Rendered (SSR) City & County Hub (/deals/:location),
 * Directory Hub (/localperks), and Brand Codes Hub (/codes).
 * - Preserves the exact visual UI of localperks-view.html / codes-view.html.
 * - Exposes category-grouped /store/:slug and active /deals/:city links inside the real DOM
 *   via a clean, collapsed-by-default <details> directory at the bottom of the page (plus <noscript>).
 * - Marks 0-merchant cities/counties with <meta name="robots" content="noindex, follow" /> while keeping
 *   HTTP 200 and showing nearby deals for human visitors, automatically turning indexable once ≥1 store joins.
 */

const fs = require('fs');
const path = require('path');
const { classifyMerchantSEO, resolveRegionHub } = require('./_seo-keywords');
const { fetchMerchants, fetchOnlineMerchants, slugify } = require('./store-page');

const LOCALPERKS_PATH = path.resolve(__dirname, '..', 'localperks-view.html');
const CODES_PATH = path.resolve(__dirname, '..', 'codes-view.html');

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

function isCountySlug(slug) {
  return !slug || Boolean(COUNTY_MAP[slug]) || slug.endsWith('-county');
}

function extractActiveCities(merchants) {
  const cityMap = new Map();
  (merchants || []).forEach(m => {
    if (m.business_presence === 'online') return;
    if (!m.city || !String(m.city).trim()) return;
    const cName = String(m.city).trim();
    const cSlug = slugify(cName);
    if (cSlug && !isCountySlug(cSlug) && !cityMap.has(cSlug)) {
      cityMap.set(cSlug, cName);
    }
  });
  return Array.from(cityMap.entries())
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildBottomSeoDirectoryHtml({ summaryTitle, activeCities = [], groups = null, onlineItems = null, locName = '' }) {
  const navLinks = [
    `<a href="/deals/orange-county" style="color:#5b3fa5;font-weight:600;text-decoration:none;">Orange County Deals</a>`,
    ...activeCities.map(c =>
      `<a href="/deals/${c.slug}" style="color:#5b3fa5;font-weight:600;text-decoration:none;">${escapeHtml(c.name)} Deals</a>`
    ),
    `<a href="/localperks" style="color:#5b3fa5;font-weight:600;text-decoration:none;">All Nearby Deals</a>`,
    `<a href="/codes" style="color:#5b3fa5;font-weight:600;text-decoration:none;">Online Promo Codes</a>`
  ].join(' &middot; ');

  let bodyHtml = '';
  if (groups) {
    const locSuffix = locName ? ` in ${escapeHtml(locName)}` : '';
    bodyHtml = Object.entries(groups).map(([heading, items]) => {
      const lis = items.map(({ merchant: m, seo, slug }) => {
        const mCity = m.city ? String(m.city).trim() : (locName || 'Orange County');
        const mOffer = m.welcome_offer_text || 'Exclusive Member Perk';
        return `<li style="margin:4px 0;"><a href="/store/${slug}" style="color:#5b3fa5;font-weight:700;text-decoration:underline;">${escapeHtml(m.business_name || m.merchant_name)} (${escapeHtml(mCity)}) — ${escapeHtml(seo.primaryNiche)} Deals &amp; Coupons</a>: ${escapeHtml(mOffer)} <span style="color:#64748b;">(${escapeHtml(seo.shortOffer)})</span></li>`;
      }).join('\n            ');
      return `
          <div style="margin-top:14px;">
            <h3 style="margin:0 0 6px;font-size:14.5px;font-weight:800;color:#1e293b;">${escapeHtml(heading)}${locSuffix}</h3>
            <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.65;color:#475569;">
              ${lis}
            </ul>
          </div>`;
    }).join('\n');
  } else if (onlineItems) {
    const lis = onlineItems.map(({ merchant: m, seo, slug }) => {
      const bName = m.business_name || m.merchant_name || 'Brand';
      const bOffer = m.welcome_offer_text || 'Exclusive Member Perk';
      const bLoc = m.city ? String(m.city).trim() : 'Online Nationwide';
      return `<li style="margin:4px 0;"><a href="/store/${slug}" style="color:#5b3fa5;font-weight:700;text-decoration:underline;">${escapeHtml(bName)} (${escapeHtml(bLoc)}) — ${escapeHtml(seo.primaryNiche)} Promo Codes &amp; Deals</a>: ${escapeHtml(bOffer)} <span style="color:#64748b;">(${escapeHtml(seo.shortOffer)})</span></li>`;
    }).join('\n            ');
    bodyHtml = `
          <div style="margin-top:14px;">
            <h3 style="margin:0 0 6px;font-size:14.5px;font-weight:800;color:#1e293b;">Verified Brand Promo Codes &amp; Store Pages</h3>
            <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.65;color:#475569;">
              ${lis}
            </ul>
          </div>`;
  }

  return `
    <section class="seo-directory-footer" aria-label="Verified Directory Index" style="max-width:1100px;margin:12px auto 36px;padding:0 20px;">
      <details style="background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:14px 20px;box-shadow:0 2px 10px rgba(15,23,42,0.03);">
        <summary style="cursor:pointer;font-size:13.5px;font-weight:700;color:#475569;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:12px;">
          <span>${escapeHtml(summaryTitle)}</span>
          <span aria-hidden="true" style="font-size:16px;font-weight:700;color:#64748b;">+</span>
        </summary>
        <div style="margin-top:14px;padding-top:14px;border-top:1px solid #f1f5f9;">
          <nav aria-label="Active location hubs" style="font-size:13px;line-height:1.8;color:#64748b;margin-bottom:8px;">
            <strong style="color:#1e293b;">Active Deal Hubs:</strong> ${navLinks}
          </nav>
          ${bodyHtml}
        </div>
      </details>
    </section>
  </main>`;
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
  const safeAll = Array.isArray(allMerchants) ? allMerchants : [];
  const loc = resolveLocationInfo(rawLocSlug, safeAll);
  const canonicalUrl = `https://www.perkfinity.net/deals/${loc.slug}`;
  const activeCities = extractActiveCities(safeAll);

  // Determine exact merchant matches vs 0-merchant fallback
  let hasExactMerchants = true;
  let matchingMerchants = safeAll;

  if (loc.type === 'city') {
    const cityMatches = safeAll.filter(m => m.business_presence !== 'online' && slugify(m.city) === loc.slug);
    hasExactMerchants = cityMatches.length > 0;
    matchingMerchants = hasExactMerchants ? cityMatches : safeAll;
  } else if (loc.type === 'county') {
    const countyMatches = safeAll.filter(
      m => m.business_presence !== 'online' && resolveRegionHub(m.city, m.state).slug === loc.slug
    );
    hasExactMerchants = countyMatches.length > 0;
    matchingMerchants = hasExactMerchants ? countyMatches : safeAll;
  }

  // Classify all matching merchants
  const enriched = matchingMerchants.map(m => ({
    merchant: m,
    seo: classifyMerchantSEO(m),
    slug: slugify(m.business_name)
  })).filter(e => e.slug);

  // Group by categoryHeading
  const groups = {};
  enriched.forEach(item => {
    const heading = item.seo.categoryHeading;
    if (!groups[heading]) groups[heading] = [];
    groups[heading].push(item);
  });

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

  // Inject noindex for 0-merchant cities/counties so Google does not index thin/duplicate fallback hubs
  if (!hasExactMerchants) {
    html = html.replace(
      /(<meta\s+name="viewport"[^>]*>)/i,
      `$1\n  <meta name="robots" content="noindex, follow" />\n  <script>window.__PERKFINITY_EMPTY_LOCATION_FALLBACK = true;</script>`
    );
  }

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
  html = html.replace(
    /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i,
    `<script type="application/ld+json">\n${JSON.stringify(schemaGraph, null, 2)}\n  </script>`
  );

  const heroHeading = loc.type === 'county'
    ? `Exclusive Deals &amp; Local Perks Across ${escapeHtml(loc.name)}, ${escapeHtml(loc.state)}`
    : `Exclusive Deals &amp; Local Perks in ${escapeHtml(loc.name)}, ${escapeHtml(loc.state)}`;
  html = html.replace(
    /<h1\s+id="hero-title"[^>]*>[\s\S]*?<\/h1>/i,
    `<h1 id="hero-title" style="font-size: 20px; margin: 0 0 4px 0; color: #fff;">${heroHeading}</h1>`
  );

  if (!hasExactMerchants) {
    html = html.replace(
      /<p\s+id="hero-sub"[^>]*>[\s\S]*?<\/p>/i,
      `<p id="hero-sub" style="font-size: 14px; margin: 0; color: rgba(255,255,255,0.8);">No businesses in ${escapeHtml(loc.name)} have joined yet — showing verified nearby perks.</p>`
    );
  }

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

  // Inject real-DOM collapsed SEO directory at bottom of page ONLY when exact location has merchants
  if (hasExactMerchants && enriched.length > 0) {
    const bottomDirectory = buildBottomSeoDirectoryHtml({
      summaryTitle: `Explore Verified Categories & Store Directory in ${loc.name}, ${loc.state} (${enriched.length} Businesses)`,
      activeCities,
      groups,
      locName: `${loc.name}, ${loc.state}`
    });
    html = html.replace(/<\/main>/i, bottomDirectory);
  }

  return html;
}

function buildDirectoryPageHtml(allMerchants) {
  let html = fs.readFileSync(LOCALPERKS_PATH, 'utf8');
  if (!Array.isArray(allMerchants) || allMerchants.length === 0) {
    return html;
  }

  const enriched = allMerchants.map(m => ({
    merchant: m,
    seo: classifyMerchantSEO(m),
    slug: slugify(m.business_name || m.merchant_name)
  })).filter(e => e.slug);

  const activeCities = extractActiveCities(allMerchants);
  const groups = {};
  enriched.forEach(item => {
    const heading = item.seo.categoryHeading;
    if (!groups[heading]) groups[heading] = [];
    groups[heading].push(item);
  });

  const regionalLinks = [
    `<a href="/deals/orange-county" style="color:#5b3fa5; font-weight:700; text-decoration:underline;">Orange County Deals Hub</a>`,
    ...activeCities.map(c =>
      `<a href="/deals/${c.slug}" style="color:#5b3fa5; font-weight:700; text-decoration:underline;">${escapeHtml(c.name)} Local Perks</a>`
    )
  ].join(' · \n              ');

  const merchantLinks = enriched.map(({ merchant: m, seo, slug }) => {
    const mCity = m.city ? ` (${escapeHtml(String(m.city).trim())})` : '';
    const mOffer = m.welcome_offer_text || 'Exclusive Member Perk';
    return `<a href="/store/${slug}" style="color:#5b3fa5; font-weight:700; text-decoration:underline;">${escapeHtml(m.business_name || m.merchant_name)}${mCity} Deals &amp; Coupons</a> — ${escapeHtml(mOffer)} (${escapeHtml(seo.primaryNiche)})`;
  }).join(' · \n              ');

  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://www.perkfinity.net/localperks#webpage",
        "url": "https://www.perkfinity.net/localperks",
        "name": "Nearby Deals & Local Business Perks",
        "isPartOf": {
          "@type": "WebSite",
          "name": "Perkfinity",
          "url": "https://www.perkfinity.net"
        },
        "description": "Directory of local storefronts, food trucks, and services offering member perks in Orange County, CA and participating cities."
      },
      {
        "@type": "ItemList",
        "name": "Local Store & Service Perks",
        "url": "https://www.perkfinity.net/localperks",
        "itemListOrder": "https://schema.org/ItemListOrderAscending",
        "numberOfItems": enriched.length,
        "itemListElement": enriched.map((e, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "item": {
            "@type": e.seo.schemaType,
            "name": e.merchant.business_name || e.merchant.merchant_name,
            "url": `https://www.perkfinity.net/store/${e.slug}`,
            "description": e.seo.metaDescription
          }
        }))
      }
    ]
  };

  html = html.replace(
    /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i,
    `<script type="application/ld+json">\n${JSON.stringify(schemaGraph, null, 2)}\n  </script>`
  );

  html = html.replace(
    /<noscript>[\s\S]*?<\/noscript>/i,
    `<noscript>
          <div style="background:#fff; border-radius:16px; padding:32px; margin-top:24px; box-shadow:0 4px 20px rgba(0,0,0,0.06); max-width:800px; margin-left:auto; margin-right:auto;">
            <h2 style="font-size:20px; font-weight:800; color:#1a1a2e; margin-top:0;">Local Business &amp; Service Perks</h2>
            <p style="color:#555; line-height:1.6;">Perkfinity connects shoppers with independent storefronts, food trucks, pop-up markets, and local services across participating cities. Scan the countertop QR stand at participating counters to unlock instant rewards.</p>
            <h3 style="font-size:16px; font-weight:700; color:#5b3fa5;">Active Regional Directories</h3>
            <p style="color:#555; line-height:1.6; margin-bottom:14px;">
              ${regionalLinks}
            </p>
            <h3 style="font-size:16px; font-weight:700; color:#5b3fa5;">Featured Local Merchant Deals, Coupons &amp; Offers</h3>
            <p style="color:#555; line-height:1.8; margin-bottom:0;">
              ${merchantLinks}
            </p>
          </div>
        </noscript>`
  );

  const bottomDirectory = buildBottomSeoDirectoryHtml({
    summaryTitle: `Explore Verified Categories & Local Business Directory (${enriched.length} Active Businesses)`,
    activeCities,
    groups,
    locName: ''
  });
  html = html.replace(/<\/main>/i, bottomDirectory);

  return html;
}

function buildCodesPageHtml(onlineMerchants, localMerchants = []) {
  let html = fs.readFileSync(CODES_PATH, 'utf8');
  if (!Array.isArray(onlineMerchants) || onlineMerchants.length === 0) {
    return html;
  }

  const enriched = onlineMerchants.map(m => ({
    merchant: m,
    seo: classifyMerchantSEO(m),
    slug: slugify(m.business_name || m.merchant_name)
  })).filter(e => e.slug);

  const activeCities = extractActiveCities(localMerchants);

  const brandLinks = enriched.map(({ merchant: m, seo, slug }) => {
    const bName = m.business_name || m.merchant_name || 'Brand';
    const bOffer = m.welcome_offer_text || 'Exclusive Member Perk';
    const bLoc = m.city ? ` (${escapeHtml(String(m.city).trim())})` : ' (Online)';
    return `<li><a href="/store/${slug}" style="color:#5b3fa5; font-weight:700; text-decoration:underline;"><strong>${escapeHtml(bName)}${bLoc} Promo Codes &amp; Deals</strong></a>: ${escapeHtml(bOffer)} — <em>${escapeHtml(seo.primaryNiche)}</em></li>`;
  }).join('\n              ');

  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://www.perkfinity.net/codes#webpage",
        "url": "https://www.perkfinity.net/codes",
        "name": "Verified Online Promo Codes & Brand Deals",
        "isPartOf": {
          "@type": "WebSite",
          "name": "Perkfinity",
          "url": "https://www.perkfinity.net"
        },
        "description": "Directory of verified online brand promo codes and instant discounts."
      },
      {
        "@type": "ItemList",
        "name": "Perkfinity Online Brand Discounts & Promo Codes",
        "url": "https://www.perkfinity.net/codes",
        "numberOfItems": enriched.length,
        "itemListElement": enriched.map((e, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "item": {
            "@type": e.seo.schemaType,
            "name": e.merchant.business_name || e.merchant.merchant_name,
            "url": `https://www.perkfinity.net/store/${e.slug}`,
            "description": e.seo.metaDescription,
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

  html = html.replace(
    /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i,
    `<script type="application/ld+json">\n${JSON.stringify(schemaGraph, null, 2)}\n  </script>`
  );

  html = html.replace(
    /<noscript>[\s\S]*?<\/noscript>/i,
    `<noscript>
          <div style="background:#fff; border-radius:16px; padding:32px; margin-top:24px; box-shadow:0 4px 20px rgba(0,0,0,0.06); max-width:800px; margin-left:auto; margin-right:auto;">
            <h2 style="font-size:20px; font-weight:800; color:#1a1a2e; margin-top:0;">Browse Verified Perkfinity Deals &amp; Promo Codes</h2>
            <p style="color:#555; line-height:1.6;">Perkfinity partners with leading online, hybrid, and local merchants across Orange County and nationwide to offer verified member discounts and exclusive perks with zero customer tracking.</p>
            <h3 style="font-size:16px; font-weight:700; color:#5b3fa5;">Featured Online &amp; Hybrid Brand Deals, Promo Codes &amp; Coupons</h3>
            <ul style="color:#444; line-height:1.8;">
              ${brandLinks}
            </ul>
            <p style="color:#555; font-size:14px; margin-bottom:0;">To unlock promo codes and scan in-store QR counter stands, download the free Perkfinity app on iOS or Android, or enable JavaScript in your browser.</p>
          </div>
        </noscript>`
  );

  const bottomDirectory = buildBottomSeoDirectoryHtml({
    summaryTitle: `Explore Verified Brand Store Pages & Promo Code Directory (${enriched.length} Brands)`,
    activeCities,
    onlineItems: enriched
  });
  html = html.replace(/<\/main>/i, bottomDirectory);

  return html;
}

module.exports = async function handler(req, res) {
  try {
    if (req.query && req.query.mode === 'codes') {
      let onlineMerchants = [];
      let localMerchants = [];
      try {
        [onlineMerchants, localMerchants] = await Promise.all([
          fetchOnlineMerchants(),
          fetchMerchants().catch(() => [])
        ]);
      } catch (e) {}
      const html = buildCodesPageHtml(onlineMerchants, localMerchants);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      return res.status(200).send(html);
    }

    const hasCityQuery = Boolean(req.query && (req.query.city || req.query.loc || req.query.location));
    if (req.query && req.query.mode === 'directory' && !hasCityQuery) {
      let localMerchants = [];
      try {
        localMerchants = await fetchMerchants();
      } catch (e) {}
      const html = buildDirectoryPageHtml(localMerchants);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      return res.status(200).send(html);
    }

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

    // Fetch all active local/hybrid merchants once so we know exact city/county matches AND active hubs
    const merchants = await fetchMerchants();
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
module.exports.buildDirectoryPageHtml = buildDirectoryPageHtml;
module.exports.buildCodesPageHtml = buildCodesPageHtml;
