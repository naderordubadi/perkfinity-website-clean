/**
 * Website-Perkfinity/api/store-page.js
 *
 * Dynamic Server-Side Rendered (SSR) Store Landing Page (/store/:slug).
 * - Preserves 100% of the exact visual layout & UX of /store/:slug.
 * - Dynamically resolves ANY active or newly unhidden/onboarded merchant in real time from the production API.
 * - Enriches <title>, <meta description>, <meta keywords>, and Schema.org JSON-LD using _seo-keywords.js
 *   so non-branded local category searches (e.g. "auto repair deals in Mission Viejo", "nail salon deals",
 *   "med spa specials") match the store page directly.
 */

const https = require('https');
const { classifyMerchantSEO } = require('./_seo-keywords');

const API_URL = 'https://perkfinity-backend.vercel.app/api/v1/public/local-merchants';
const ONLINE_API_URL = 'https://perkfinity-backend.vercel.app/api/v1/public/online-merchants';

function slugify(text) {
  if (!text) return '';
  return text.toString().toLowerCase().trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatPhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function buildAttributedUrl(rawUrl, medium = 'web_store_page', campaign = 'merchant_directory') {
  if (!rawUrl) return '';
  try {
    const url = new URL(rawUrl.startsWith('http') ? rawUrl : 'https://' + rawUrl);
    url.searchParams.set('utm_source', 'perkfinity');
    url.searchParams.set('utm_medium', medium);
    url.searchParams.set('utm_campaign', campaign);
    return url.toString();
  } catch (e) {
    return rawUrl;
  }
}

function getReviewSocialBtnLabel(url, ratingPlatform, ratingScore) {
  if (!url && !ratingPlatform) return '⭐ View Reviews';
  const u = (url || '').toLowerCase();
  if (u.includes('instagram.com') || u.includes('instagr.am')) return '📸 Follow on Instagram';
  if (u.includes('facebook.com') || u.includes('fb.me') || u.includes('fb.com')) return '👍 Follow on Facebook';
  if (u.includes('tiktok.com')) return '🎵 Follow on TikTok';
  if (u.includes('twitter.com') || u.includes('x.com')) return '𝕏 Follow on X';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return '▶️ Watch on YouTube';
  if (u.includes('linkedin.com')) return '💼 Connect on LinkedIn';
  if (u.includes('pinterest.com') || u.includes('pin.it')) return '📌 Follow on Pinterest';
  if (u.includes('threads.net')) return '🧵 Follow on Threads';
  if (u.includes('nextdoor.com')) return '🏡 View on Nextdoor';
  if (u.includes('bbb.org')) return '🛡️ View BBB Profile';
  if (u.includes('tripadvisor.com')) return '⭐ View TripAdvisor Reviews';
  if (u.includes('trustpilot.com')) return '⭐ View Trustpilot Reviews';
  if (u.includes('yelp.com') || ratingPlatform === 'Yelp') return '⭐ View Yelp Reviews';
  if (u.includes('google.com') || u.includes('g.page') || u.includes('maps.app.goo.gl') || ratingPlatform === 'Google') return '⭐ View Google Reviews';
  if (ratingPlatform && ratingScore) return `⭐ View ${ratingPlatform} Reviews`;
  return '⭐ View Reviews';
}

function fetchMerchants(queryParams = {}) {
  return new Promise((resolve, reject) => {
    const qs = new URLSearchParams();
    Object.entries(queryParams || {}).forEach(([k, v]) => {
      if (v) qs.append(k, v);
    });
    const fullUrl = qs.toString() ? `${API_URL}?${qs.toString()}` : API_URL;
    https.get(fullUrl, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          if (json.success && Array.isArray(json.data)) {
            resolve(json.data);
          } else {
            reject(new Error('Invalid API response format'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function fetchOnlineMerchants() {
  return new Promise((resolve, reject) => {
    https.get(ONLINE_API_URL, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          if (json.success && Array.isArray(json.data)) {
            const normalized = json.data.map(m => ({
              ...m,
              business_presence: m.business_presence || (m.city ? 'hybrid' : 'online')
            }));
            resolve(normalized);
          } else {
            reject(new Error('Invalid online-merchants API response format'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function buildStorePageHtml(m, allMerchants) {
  const bName = m.business_name || m.merchant_name || 'Brand';
  const slug = slugify(bName);
  const isOnlineOnly = m.business_presence === 'online';
  const hasCity = Boolean(m.city && String(m.city).trim());
  const city = hasCity ? String(m.city).trim() : (isOnlineOnly ? 'Online' : 'Orange County');
  const state = m.state || 'CA';
  const zip = m.postal_code || '';
  const address = m.address || '';
  const fullAddr = [address, hasCity ? city : '', hasCity ? state : '', zip].filter(Boolean).join(', ');
  const locationDisplay = (isOnlineOnly && !hasCity) ? 'Online Brand (Nationwide)' : `${city}, ${state}`;
  const offer = m.welcome_offer_text || 'Exclusive Member Perk';
  const category = m.business_category || (isOnlineOnly ? 'Online Shopping & Brand Perks' : 'Local Dining & Retail');
  const isVip = Boolean(m.is_fullpage_sponsored && (!m.fullpage_sponsored_until || new Date(m.fullpage_sponsored_until) >= new Date()));
  const bannerUrl = isVip ? (m.promo_banner_url || m.cover_photo_url || '') : '';
  const logoUrl = m.logo_url || '';
  const phone = formatPhone(m.public_phone || '');
  const cleanPhone = (m.public_phone || '').replace(/\D/g, '');
  const email = m.public_email || '';
  const website = m.website || '';
  const orderUrl = m.order_url || '';
  const reviewUrl = m.review_url || '';
  const attributedOrderUrl = buildAttributedUrl(orderUrl, 'web_store_page', 'order_booking');
  const attributedReviewUrl = buildAttributedUrl(reviewUrl, 'web_store_page', 'review_social');
  const attributedWebsiteUrl = buildAttributedUrl(website, 'web_store_page', 'official_website');
  const reviewBtnLabel = getReviewSocialBtnLabel(reviewUrl, m.rating_platform, m.rating_score);
  const qrPublicCode = m.qr_public_code || '';
  const joinUrl = `https://perkfinity.net/join/${qrPublicCode}`;
  const canonicalUrl = `https://www.perkfinity.net/store/${slug}`;
  const citySlug = hasCity ? slugify(city) : 'orange-county';

  const seo = classifyMerchantSEO(m);
  const initials = bName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  // Find other merchants in same city for bottom carousel
  const nearbyStores = (allMerchants || [])
    .filter(other => slugify(other.business_name) !== slug)
    .sort((a, b) => {
      if (hasCity && (a.city || '').toLowerCase() === city.toLowerCase()) return -1;
      if (hasCity && (b.city || '').toLowerCase() === city.toLowerCase()) return 1;
      return 0;
    })
    .slice(0, 4);

  const nearbyCardsHtml = nearbyStores.map(ns => {
    const nsName = ns.business_name || 'Store';
    const nsSlug = slugify(nsName);
    const nsIsOnlineNoCity = ns.business_presence === 'online' && !ns.city;
    const nsCity = nsIsOnlineNoCity ? 'Online Brand' : (ns.city || 'Orange County');
    const nsLocPrefix = nsIsOnlineNoCity ? '🌐' : '📍';
    const nsOffer = ns.welcome_offer_text || 'Exclusive member perk';
    const nsInitials = nsName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
    return `
      <a href="/store/${nsSlug}" class="nearby-card">
        <div class="nearby-card-top">
          ${ns.logo_url 
            ? `<img src="${escapeHtml(ns.logo_url)}" alt="${escapeHtml(nsName)} logo" class="nearby-logo" onerror="this.style.display='none';this.nextElementSibling.style.display='grid';"><div class="nearby-logo-placeholder" style="display:none;">${nsInitials}</div>`
            : `<div class="nearby-logo-placeholder">${nsInitials}</div>`}
          <div>
            <div class="nearby-title">${escapeHtml(nsName)}</div>
            <div class="nearby-loc">${nsLocPrefix} ${escapeHtml(nsCity)}</div>
          </div>
        </div>
        <div class="nearby-offer">${escapeHtml(nsOffer)}</div>
        <span class="nearby-view-btn">View Deals →</span>
      </a>
    `;
  }).join('');

  // Rich Schema.org JSON-LD with exact @type (AutoRepair, NailSalon, DaySpa, Restaurant, OnlineStore, etc.),
  // service keywords (knowsAbout), areaServed, and FAQPage for Google Rich Results
  const primarySchemaNode = (isOnlineOnly && !hasCity)
    ? {
        "@type": seo.schemaType === 'LocalBusiness' ? 'OnlineStore' : seo.schemaType,
        "@id": `${canonicalUrl}#business`,
        "name": bName,
        "description": seo.metaDescription,
        "url": canonicalUrl,
        "sameAs": [website, reviewUrl, orderUrl].filter(Boolean),
        "image": bannerUrl || logoUrl || "https://www.perkfinity.net/assets/Perkfinity-App-Icon.png",
        "telephone": phone || undefined,
        "knowsAbout": seo.serviceKeywords,
        "areaServed": { "@type": "Country", "name": "United States" },
        "makesOffer": {
          "@type": "Offer",
          "name": offer,
          "category": seo.primaryNiche,
          "description": `${offer} — Verified ${seo.primaryNiche.toLowerCase()} promo code & member perk at ${bName}`,
          "url": canonicalUrl,
          "eligibleRegion": { "@type": "Country", "name": "US" }
        }
      }
    : {
        "@type": seo.schemaType,
        "@id": `${canonicalUrl}#business`,
        "name": bName,
        "description": seo.metaDescription,
        "url": canonicalUrl,
        "sameAs": [website, reviewUrl, orderUrl].filter(Boolean),
        "image": bannerUrl || logoUrl || "https://www.perkfinity.net/assets/Perkfinity-App-Icon.png",
        "telephone": phone || undefined,
        "priceRange": "$$",
        "knowsAbout": seo.serviceKeywords,
        "areaServed": [
          { "@type": "City", "name": city },
          { "@type": "AdministrativeArea", "name": "Orange County, CA" }
        ],
        "address": {
          "@type": "PostalAddress",
          "streetAddress": address,
          "addressLocality": city,
          "addressRegion": state,
          "postalCode": zip,
          "addressCountry": "US"
        },
        "makesOffer": {
          "@type": "Offer",
          "name": offer,
          "category": seo.primaryNiche,
          "description": `${offer} — Verified ${seo.primaryNiche.toLowerCase()} deal & member perk at ${bName} in ${city}, ${state}`,
          "url": canonicalUrl,
          "eligibleRegion": {
            "@type": "Place",
            "name": `${city}, ${state} ${zip}`.trim()
          }
        }
      };

  const breadcrumbSchemaNode = (isOnlineOnly && !hasCity)
    ? {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Perkfinity", "item": "https://www.perkfinity.net/" },
          { "@type": "ListItem", "position": 2, "name": "Promo Codes & Brand Deals", "item": "https://www.perkfinity.net/codes" },
          { "@type": "ListItem", "position": 3, "name": `${bName} (${seo.primaryNiche} Deals)`, "item": canonicalUrl }
        ]
      }
    : {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Perkfinity", "item": "https://www.perkfinity.net/" },
          { "@type": "ListItem", "position": 2, "name": "Orange County Deals", "item": "https://www.perkfinity.net/deals/orange-county" },
          { "@type": "ListItem", "position": 3, "name": `${city} Deals`, "item": `https://www.perkfinity.net/deals/${citySlug}` },
          { "@type": "ListItem", "position": 4, "name": `${bName} (${seo.primaryNiche} Deals)`, "item": canonicalUrl }
        ]
      };

  const seoOverviewText = (isOnlineOnly && !hasCity)
    ? `${bName} is a verified Perkfinity partner specializing in ${seo.primaryNiche.toLowerCase()} (${seo.serviceKeywords.slice(0, 5).join(', ')}). Perkfinity members unlock an exclusive brand perk at ${bName}: "${offer}"${m.welcome_promo_code ? ` (member promo code ${m.welcome_promo_code} unlocked inside the free Perkfinity app)` : ''}.${website ? ` Visit ${website.replace(/^https?:\/\//, '').replace(/\/$/, '')} and redeem your member discount with 100% privacy.` : ''}`
    : `${bName} in ${city}, ${state}${zip ? ' ' + zip : ''} is a verified local business on Perkfinity specializing in ${seo.primaryNiche.toLowerCase()} (${seo.serviceKeywords.slice(0, 5).join(', ')}). Local shoppers and neighborhood members unlock an exclusive deal at ${bName}: "${offer}".${fullAddr ? ` Visit ${bName} at ${fullAddr} and scan the counter QR code with the free Perkfinity app to redeem.` : ''}`;

  const faqItems = (isOnlineOnly && !hasCity)
    ? [
        {
          q: `What promo codes or deals does ${bName} offer?`,
          a: `${bName} offers a verified Perkfinity member perk: "${offer}". Specializing in ${seo.primaryNiche.toLowerCase()} (${seo.serviceKeywords.slice(0, 4).join(', ')}), this offer is available nationwide to Perkfinity members.`
        },
        {
          q: `How do I claim the ${bName} promo code or discount?`,
          a: `Scan the official Perkfinity QR code for ${bName} with the free Perkfinity app to unlock "${offer}" instantly with 100% privacy (no phone number or email shared with the business).`
        },
        {
          q: `Is my personal information shared with ${bName} when I claim this perk?`,
          a: `No. Perkfinity is 100% privacy-first — ${bName} never sees your name, phone number, or email address when you join or redeem "${offer}".`
        }
      ]
    : [
        {
          q: `What deals or coupons does ${bName} in ${city} offer?`,
          a: `${bName} in ${city}, ${state} offers a verified Perkfinity member perk: "${offer}". Specializing in ${seo.primaryNiche.toLowerCase()} (${seo.serviceKeywords.slice(0, 4).join(', ')}).`
        },
        {
          q: `How do I claim the ${bName} discount in ${city}, ${state}?`,
          a: `Scan the official Perkfinity QR code at ${bName} (${fullAddr || city + ', ' + state}) with the free Perkfinity app to unlock "${offer}" instantly with 100% privacy (no phone number or email shared with the business).`
        },
        {
          q: `Where is ${bName} located and is my privacy protected?`,
          a: `${bName} serves customers in ${fullAddr || city + ', ' + state}. When you scan the Perkfinity QR code, your identity remains 100% anonymous — ${bName} never receives your phone number, email address, or personal data.`
        }
      ];

  const faqSchemaNode = {
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  };

  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      primarySchemaNode,
      breadcrumbSchemaNode,
      faqSchemaNode
    ]
  };

  return `<!doctype html>
<html lang="en">
<head>
  <base href="/" />
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(seo.pageTitle)}</title>
  <meta name="description" content="${escapeHtml(seo.metaDescription)}" />
  <meta name="keywords" content="${escapeHtml(seo.metaKeywords)}" />
  <link rel="canonical" href="${canonicalUrl}" />

  <!-- OpenGraph -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:title" content="${escapeHtml(seo.pageTitle)}" />
  <meta property="og:description" content="${escapeHtml(seo.metaDescription)}" />
  <meta property="og:image" content="${escapeHtml(bannerUrl || logoUrl || 'https://perkfinity.net/assets/Perkfinity-App-Icon.png')}" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(seo.pageTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(seo.metaDescription)}" />
  <meta name="twitter:image" content="${escapeHtml(bannerUrl || logoUrl || 'https://perkfinity.net/assets/Perkfinity-App-Icon.png')}" />

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
  ${JSON.stringify(schemaGraph, null, 2)}
  </script>

  <link rel="icon" href="/assets/Perkfinity-App-Icon.png" />
  <link rel="stylesheet" href="/styles.css" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <script src="/config.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
  <script src="/assets/js/merchant-modals.js?v=1.8"></script>

  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #F8FAFC; color: #1E293B; margin: 0; padding: 0; }

    /* Site Header */
    .site-header { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,0.97); backdrop-filter: blur(12px); border-bottom: 1px solid #f0eeff; }
    .nav-inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; height: 64px; display: flex; align-items: center; }
    .nav-brand { display: flex; align-items: center; margin-right: auto; text-decoration: none; }
    .nav-brand img { height: 32px; }
    .nav-links { display: flex; align-items: center; gap: 6px; }
    .nav-links a { font-size: 14px; font-weight: 600; color: #444; text-decoration: none; padding: 8px 14px; border-radius: 10px; transition: background 0.15s, color 0.15s; }
    .nav-links a:hover { background: #f5f3ff; color: #5b3fa5; }
    .nav-signin { font-size: 14px; font-weight: 700; color: #5b3fa5 !important; border: 1.5px solid #5b3fa5 !important; padding: 7px 18px !important; border-radius: 10px !important; background: transparent; cursor: pointer; text-decoration: none; }
    .nav-signin:hover { background: #5b3fa5 !important; color: #fff !important; }
    .nav-mobile-btn { display: none; background: none; border: none; cursor: pointer; padding: 8px; color: #444; font-size: 20px; }
    @media (max-width: 680px) {
      .nav-links { display: none; }
      .nav-mobile-btn { display: block; margin-left: auto; }
      .nav-links.open { display: flex; flex-direction: column; position: absolute; top: 64px; left: 0; right: 0; background: #fff; border-bottom: 1px solid #f0eeff; padding: 12px 16px; gap: 4px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); z-index: 99; }
    }

    /* Breadcrumbs */
    .breadcrumb-bar { background: #fff; border-bottom: 1px solid #E2E8F0; padding: 12px 24px; font-size: 13px; font-weight: 600; }
    .breadcrumb-bar .container { max-width: 1040px; margin: 0 auto; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; color: #64748B; }
    .breadcrumb-bar a { color: #5B3FA5; text-decoration: none; }
    .breadcrumb-bar a:hover { text-decoration: underline; }

    /* Main Container */
    .store-container { max-width: 1040px; margin: 32px auto 60px; padding: 0 20px; }

    /* The Store Card (matches merchant-modals.js) */
    .store-hero-card {
      background: #fff; border-radius: 24px; box-shadow: 0 20px 45px -10px rgba(0,0,0,0.08);
      border: 1px solid #E2E8F0; overflow: hidden;
      display: grid; grid-template-columns: 1fr 340px; gap: 0;
      margin-bottom: 48px;
    }
    @media (max-width: 860px) {
      .store-hero-card { grid-template-columns: 1fr; }
    }

    .store-main-col { padding: 36px; border-right: 1px solid #F1F5F9; }
    @media (max-width: 860px) {
      .store-main-col { border-right: none; border-bottom: 1px solid #F1F5F9; padding: 24px; }
    }

    .store-banner-wrap {
      position: relative; width: 100%; border-radius: 16px; overflow: hidden; margin-bottom: 24px;
      background: linear-gradient(135deg, #311C87 0%, #1E1B4B 100%);
      min-height: 200px; display: flex; align-items: center; justify-content: center;
    }
    .store-banner-img { width: 100%; height: 260px; object-fit: cover; display: block; }
    .store-sponsored-badge {
      position: absolute; top: 12px; left: 12px; z-index: 5;
      background: rgba(0,0,0,0.55); color: rgba(255,255,255,0.92); border: 1px solid rgba(255,255,255,0.2);
      backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; letter-spacing: 0.2px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    }

    .store-brand-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .store-logo-wrap { width: 68px; height: 68px; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(0,0,0,0.06); flex-shrink: 0; background: #fff; display: grid; place-items: center; }
    .store-logo-img { width: 100%; height: 100%; object-fit: contain; }
    .store-logo-placeholder { font-size: 24px; font-weight: 900; color: #5B3FA5; background: rgba(91,63,165,.08); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }

    .store-title { margin: 0 0 6px; font-size: 28px; font-weight: 900; color: #0F172A; }
    .store-rating-badge { background: #FFF7ED; color: #EA580C; font-weight: 800; font-size: 13px; padding: 4px 10px; border-radius: 20px; display: inline-flex; align-items: center; gap: 4px; }
    .store-cat-badge { background: #F1F5F9; color: #475569; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 20px; }

    .store-desc-box {
      background: #F8FAFC; border-left: 4px solid #8B5CF6; border-radius: 8px; padding: 18px; margin: 20px 0;
      font-size: 14.5px; color: #334155; line-height: 1.65;
    }
    .store-desc-box strong { color: #311C87; display: block; margin-bottom: 6px; }

    /* The Verified Perk Box */
    .perk-highlight-box {
      margin-top: 24px; background: #F8F6FF; border: 1.5px solid #E9D5FF; border-radius: 16px; padding: 22px;
      box-shadow: 0 8px 20px -6px rgba(139,92,246,0.15);
    }
    .perk-tag { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #7C3AED; margin-bottom: 6px; }
    .perk-title { font-size: 20px; font-weight: 900; color: #311C87; margin: 0 0 8px; }
    .perk-sub { font-size: 13.5px; color: #64748B; margin: 0; line-height: 1.5; font-weight: 500; }

    /* Map Box */
    .store-map-wrap { border-radius: 14px; overflow: hidden; border: 1px solid #E2E8F0; height: 180px; margin-top: 20px; }
    .store-address-text { font-size: 13px; color: #475569; margin-top: 8px; font-weight: 600; display: flex; align-items: center; gap: 6px; }

    /* Side Column (QR & Action Buttons) */
    .store-side-col { padding: 36px 28px; background: #FAFAFC; display: flex; flex-direction: column; align-items: center; }
    @media (max-width: 860px) {
      .store-side-col { padding: 28px 20px; }
    }

    .qr-card-wrap {
      background: #fff; border: 1px solid #E2E8F0; border-radius: 16px; padding: 18px; width: 100%; text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03); margin-bottom: 24px;
    }
    .qr-canvas-holder { width: 180px; height: 180px; margin: 0 auto; display: flex; align-items: center; justify-content: center; }
    .qr-link { display: block; margin-top: 8px; font-size: 11px; color: #3B82F6; font-weight: 700; word-break: break-all; margin-bottom: 14px; text-decoration: none; }
    .qr-link:hover { text-decoration: underline; }
    .qr-paths { display: flex; flex-direction: column; gap: 10px; text-align: left; margin-bottom: 12px; }
    .qr-path-amber { background: #FFFBEB; border: 1.5px solid #FDE68A; border-radius: 10px; padding: 10px 12px; }
    .qr-path-title-amber { font-size: 11px; font-weight: 900; color: #B45309; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
    .qr-path-desc-amber { margin: 0; font-size: 11.5px; font-weight: 700; color: #78350F; line-height: 1.4; }
    .qr-path-green { background: #F0FDF4; border: 1.5px solid #BBF7D0; border-radius: 10px; padding: 10px 12px; }
    .qr-path-title-green { font-size: 11px; font-weight: 900; color: #15803D; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
    .qr-path-desc-green { margin: 0; font-size: 11.5px; font-weight: 700; color: #166534; line-height: 1.4; }
    .qr-disclaimer { font-size: 11px; color: #94A3B8; font-weight: 700; text-align: center; line-height: 1.4; margin: 0; border-top: 1px solid #F1F5F9; padding-top: 10px; }
    .qr-disclaimer a { color: #5B3FA5; text-decoration: none; }
    .qr-disclaimer a:hover { text-decoration: underline; }

    /* Standard / Non-VIP Store Card (matches reveal-popup-dynamic) */
    .store-standard-card {
      max-width: 520px; margin: 0 auto 48px; background: #fff; border-radius: 24px; padding: 28px 24px;
      box-shadow: 0 20px 45px -10px rgba(0,0,0,0.08); border: 1px solid #E2E8F0; text-align: center;
    }
    .standard-brand-row { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; text-align: left; }
    .standard-logo-wrap { width: 56px; height: 56px; border-radius: 14px; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.05); display: grid; place-items: center; border: 1px solid #E2E8F0; background: #fff; }
    .standard-logo-img { width: 100%; height: 100%; object-fit: contain; }
    .standard-brand-name { font-size: 20px; font-weight: 900; color: #0F172A; margin: 0 0 4px; }
    .standard-offer-text { font-size: 14.5px; color: #7C3AED; font-weight: 700; margin: 0 0 6px; }
    .standard-meta-row { font-size: 12px; color: #64748B; font-weight: 600; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .standard-contact-links { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px; font-size: 12.5px; }
    .standard-contact-links a { color: #5B3FA5; font-weight: 700; text-decoration: none; }
    .standard-contact-links a:hover { text-decoration: underline; }
    .standard-qr-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px; margin-bottom: 20px; }

    /* Download App Modal */
    .download-modal-overlay {
      position: fixed; inset: 0; background: rgba(15,23,42,0.65); z-index: 9999;
      display: none; align-items: center; justify-content: center; padding: 20px;
      backdrop-filter: blur(5px);
    }
    .download-modal-box {
      background: #fff; border-radius: 24px; padding: 32px 28px; max-width: 440px; width: 100%;
      text-align: center; position: relative; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
      animation: modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modalSlideUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .download-modal-close {
      position: absolute; top: 16px; right: 16px; background: rgba(15,23,42,0.06); border: none;
      width: 32px; height: 32px; border-radius: 50%; font-size: 14px; font-weight: 700;
      color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background 0.15s;
    }
    .download-modal-close:hover { background: rgba(15,23,42,0.12); }
    .store-badge-btn {
      display: flex; align-items: center; justify-content: center; gap: 12px;
      padding: 13px 20px; border-radius: 14px; text-decoration: none; font-weight: 700;
      font-size: 14.5px; transition: transform 0.15s, opacity 0.15s;
    }
    .store-badge-btn:hover { transform: translateY(-2px); opacity: 0.95; }
    .btn-apple { background: #000; color: #fff; }
    .btn-google { background: #1E293B; color: #fff; border: 1px solid #334155; }

    .action-btn-group { display: flex; flex-direction: column; gap: 10px; width: 100%; }
    .act-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 13px 18px;
      border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none; transition: transform 0.1s, opacity 0.15s;
    }
    .act-btn:hover { opacity: 0.92; transform: translateY(-1px); }
    .act-btn-order { background: #16A34A; color: #fff; }
    .act-btn-review { background: #3B82F6; color: #fff; }
    .act-btn-web { background: #64748B; color: #fff; }
    .act-btn-phone { background: #0D9488; color: #fff; }
    .act-btn-email { background: #4F46E5; color: #fff; }

    /* Nearby Stores Section */
    .nearby-section { margin-top: 48px; border-top: 1px solid #E2E8F0; padding-top: 40px; }
    .nearby-heading { font-size: 20px; font-weight: 800; color: #0F172A; margin: 0 0 6px; }
    .nearby-sub { font-size: 14px; color: #64748B; margin: 0 0 24px; }
    .nearby-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .nearby-card {
      background: #fff; border-radius: 16px; border: 1px solid #E2E8F0; padding: 18px; text-decoration: none; color: inherit;
      display: flex; flex-direction: column; transition: box-shadow 0.2s, transform 0.2s;
    }
    .nearby-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.06); transform: translateY(-2px); }
    .nearby-card-top { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .nearby-logo { width: 42px; height: 42px; border-radius: 10px; object-fit: contain; }
    .nearby-logo-placeholder { width: 42px; height: 42px; border-radius: 10px; background: rgba(91,63,165,.08); color: #5B3FA5; font-size: 15px; font-weight: 900; display: grid; place-items: center; }
    .nearby-title { font-size: 15px; font-weight: 800; color: #0F172A; line-height: 1.3; }
    .nearby-loc { font-size: 12px; color: #64748B; margin-top: 2px; }
    .nearby-offer { font-size: 13px; font-weight: 700; color: #8B5CF6; margin: 0 0 14px; flex-grow: 1; }
    .nearby-view-btn { font-size: 12.5px; font-weight: 700; color: #5B3FA5; text-decoration: underline; margin-top: auto; }

    /* Footer */
    .site-footer { background: #0F172A; color: #94A3B8; padding: 48px 24px 32px; font-size: 13px; }
    .footer-inner { max-width: 1040px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
    .footer-links a { color: #CBD5E1; text-decoration: none; margin-left: 18px; }
    .footer-links a:hover { color: #fff; }
  </style>
</head>
<body>

  <!-- Site Navigation -->
  <header class="site-header">
    <div class="nav-inner">
      <a href="/" class="nav-brand">
        <img src="/assets/Perkfinity-Logo.png" alt="Perkfinity Logo" />
      </a>
      <button class="nav-mobile-btn" onclick="this.nextElementSibling.classList.toggle('open')" aria-label="Toggle menu">☰</button>
      <nav class="nav-links">
        <a href="/codes">Promo Codes</a>
        <a href="/localperks">Nearby Deals</a>
        <a href="/#download" onclick="document.getElementById('download-modal').style.display='flex'; return false;" class="nav-signin">Get Free App</a>
      </nav>
    </div>
  </header>

  <!-- Breadcrumb Navigation -->
  <div class="breadcrumb-bar">
    <div class="container">
      ${(isOnlineOnly && !hasCity) ? `
        <a href="/">Home</a> › 
        <a href="/codes">Promo Codes</a> › 
        <span>${escapeHtml(bName)} Deals</span>
      ` : `
        <a href="/">Home</a> › 
        <a href="/deals/orange-county">Orange County</a> › 
        <a href="/deals/${citySlug}">${escapeHtml(city)}</a> › 
        <span>${escapeHtml(bName)} Deals</span>
      `}
    </div>
  </div>

  <!-- Store Landing Main -->
  <main class="store-container">
    ${isVip ? `
      <article class="store-hero-card" id="store-card">
        
        <!-- Main Content Column -->
        <div class="store-main-col">
          ${bannerUrl ? `
            <div class="store-banner-wrap">
              <span id="sponsored-badge" class="store-sponsored-badge">Sponsored</span>
              <img src="${escapeHtml(bannerUrl)}" alt="${escapeHtml(bName)} — ${escapeHtml(seo.primaryNiche)} ${(isOnlineOnly && !hasCity) ? 'Promo Codes & Deals' : 'in ' + escapeHtml(city) + ', ' + escapeHtml(state)}" class="store-banner-img" onerror="this.style.display='none';">
            </div>
          ` : ''}

          <div class="store-brand-header">
            <div class="store-logo-wrap">
              ${logoUrl 
                ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(bName)} Logo" class="store-logo-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><div class="store-logo-placeholder" style="display:none;">${initials}</div>`
                : `<div class="store-logo-placeholder">${initials}</div>`}
            </div>
            <div>
              <h1 class="store-title">${escapeHtml(bName)}</h1>
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <span class="store-cat-badge">🏪 ${escapeHtml(category)}</span>
                ${m.rating_platform && m.rating_score ? `<span class="store-rating-badge">⭐ ${escapeHtml(m.rating_score)} ${escapeHtml(m.rating_platform)}</span>` : ''}
                <span style="font-size:13px; color:#64748B; font-weight:600;">${(isOnlineOnly && !hasCity) ? '🌐 ' + escapeHtml(locationDisplay) : '📍 ' + escapeHtml(locationDisplay)}</span>
              </div>
            </div>
          </div>

          ${m.promo_description ? `
            <div class="store-desc-box">
              <strong>📝 About this Business &amp; Promotion:</strong>
              ${escapeHtml(m.promo_description).replace(/\n/g, '<br>')}
            </div>
          ` : ''}

          <!-- The Verified Deal -->
          <div class="perk-highlight-box">
            <div class="perk-tag">🏷️ Exclusive Member Perk</div>
            <div class="perk-title" id="live-perk-text">${escapeHtml(offer)}</div>
            <p class="perk-sub">Scan the QR code to open/download Perkfinity and claim this offer!</p>
          </div>
        </div>

        <!-- Action & QR Column -->
        <aside class="store-side-col">
          <div class="qr-card-wrap">
            <div class="qr-canvas-holder" id="qr-container">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&amp;data=${encodeURIComponent(joinUrl)}" alt="Perkfinity Counter QR Code" width="180" height="180" style="border-radius:12px; display:block;" />
            </div>
            <a href="${joinUrl}" target="_blank" rel="noopener" class="qr-link">${escapeHtml(joinUrl)}</a>

            <div class="qr-paths">
              <div class="qr-path-amber">
                <div class="qr-path-title-amber">📱 DON&#39;T HAVE THE APP?</div>
                <p class="qr-path-desc-amber">${isOnlineOnly ? 'Open your phone&#39;s camera → Scan the QR code → Download Perkfinity → Join the store → Your promo code is revealed in the app.' : 'Open your phone&#39;s camera → Scan the QR code → Download Perkfinity → Join the merchant → Visit the store to activate your perk.'}</p>
              </div>
              <div class="qr-path-green">
                <div class="qr-path-title-green">✅ ALREADY HAVE THE APP?</div>
                <p class="qr-path-desc-green">${isOnlineOnly ? 'Open Perkfinity → Tap <strong>Scan</strong> → Scan this QR code → Join the store → View your exclusive promo code.' : 'Open Perkfinity → Tap <strong>Scan</strong> → Scan this QR code → Join the merchant → Visit the store and scan again to activate.'}</p>
              </div>
            </div>

            <p class="qr-disclaimer">
              Unlock your perk inside the app to redeem in person or online.<br>
              By joining, you agree to our <a href="/terms-of-use" target="_blank">Terms of Use</a> &amp;
              <a href="/privacy-policy" target="_blank">Privacy Policy</a>.
            </p>
          </div>

          <div class="action-btn-group">
            ${orderUrl ? `<a href="${escapeHtml(attributedOrderUrl)}" target="_blank" rel="noopener nofollow" onclick="if(window.trackOutboundClick)window.trackOutboundClick('${escapeHtml(m.id)}','order','${escapeHtml(attributedOrderUrl)}','web_store_page')" class="act-btn act-btn-order">🛒 Order / Book Now</a>` : ''}
            ${reviewUrl ? `<a href="${escapeHtml(attributedReviewUrl)}" target="_blank" rel="noopener nofollow" onclick="if(window.trackOutboundClick)window.trackOutboundClick('${escapeHtml(m.id)}','review_social','${escapeHtml(attributedReviewUrl)}','web_store_page')" class="act-btn act-btn-review">${escapeHtml(reviewBtnLabel)}</a>` : ''}
            ${website ? `<a href="${escapeHtml(attributedWebsiteUrl)}" target="_blank" rel="noopener nofollow" onclick="if(window.trackOutboundClick)window.trackOutboundClick('${escapeHtml(m.id)}','website','${escapeHtml(attributedWebsiteUrl)}','web_store_page')" class="act-btn act-btn-web">🌐 Official Website</a>` : ''}
            ${cleanPhone ? `<a href="tel:${escapeHtml(cleanPhone)}" onclick="if(window.trackOutboundClick)window.trackOutboundClick('${escapeHtml(m.id)}','phone','tel:${escapeHtml(cleanPhone)}','web_store_page')" class="act-btn act-btn-phone">📞 Call Business</a>` : ''}
            ${email ? `<a href="mailto:${escapeHtml(email)}" onclick="if(window.trackOutboundClick)window.trackOutboundClick('${escapeHtml(m.id)}','email','mailto:${escapeHtml(email)}','web_store_page')" class="act-btn act-btn-email">✉️ Email Business</a>` : ''}
          </div>

          ${fullAddr ? `
            <div style="width:100%; margin-top:20px;">
              <div style="font-weight:700; font-size:13.5px; color:#1E293B; margin-bottom:8px;">📍 Where To Redeem</div>
              <div class="store-map-wrap" style="margin-top:0;">
                <iframe width="100%" height="180" frameborder="0" style="border:0;" src="https://maps.google.com/maps?q=${encodeURIComponent(fullAddr)}&t=&z=14&ie=UTF8&iwloc=&output=embed" allowfullscreen loading="lazy"></iframe>
              </div>
              <div class="store-address-text">
                <span>📍 ${escapeHtml(fullAddr)}</span>
              </div>
            </div>
          ` : (isOnlineOnly ? `
            <div style="width:100%; margin-top:20px;">
              <div style="font-weight:700; font-size:13.5px; color:#1E293B; margin-bottom:8px;">📍 Where To Redeem</div>
              <div style="background:#F1F5F9; border-radius:12px; padding:16px; text-align:center; color:#64748B; font-weight:600; font-size:13px;">🌐 Online Store — Available Nationwide</div>
            </div>
          ` : '')}
        </aside>

      </article>
    ` : `
      <article class="store-standard-card" id="store-card">
        <div class="standard-brand-row">
          <div class="standard-logo-wrap">
            ${logoUrl 
              ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(bName)} Logo" class="standard-logo-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><div class="store-logo-placeholder" style="display:none; font-size:18px;">${initials}</div>`
              : `<div class="store-logo-placeholder" style="font-size:18px;">${initials}</div>`}
          </div>
          <div style="flex-grow:1;">
            <h1 class="standard-brand-name">${escapeHtml(bName)}</h1>
            <p class="standard-offer-text" id="live-perk-text">${escapeHtml(offer)}</p>
            <div class="standard-meta-row">
              <span>🏪 ${escapeHtml(category)}</span>
              <span>•</span>
              <span>${(isOnlineOnly && !hasCity) ? '🌐 ' + escapeHtml(locationDisplay) : '📍 ' + escapeHtml(locationDisplay)}</span>
            </div>
            ${(cleanPhone || email || website) ? `
              <div class="standard-contact-links">
                ${cleanPhone ? `<a href="tel:${escapeHtml(cleanPhone)}" onclick="if(window.trackOutboundClick)window.trackOutboundClick('${escapeHtml(m.id)}','phone','tel:${escapeHtml(cleanPhone)}','web_store_page')">📞 Call Business</a>` : ''}
                ${email ? `<a href="mailto:${escapeHtml(email)}" onclick="if(window.trackOutboundClick)window.trackOutboundClick('${escapeHtml(m.id)}','email','mailto:${escapeHtml(email)}','web_store_page')">✉️ Email Business</a>` : ''}
                ${website ? `<a href="${escapeHtml(attributedWebsiteUrl)}" target="_blank" rel="noopener nofollow" onclick="if(window.trackOutboundClick)window.trackOutboundClick('${escapeHtml(m.id)}','website','${escapeHtml(attributedWebsiteUrl)}','web_store_page')">🌐 Website</a>` : ''}
              </div>
            ` : ''}
          </div>
        </div>

        ${m.promo_description ? `
          <div class="store-desc-box" style="text-align:left; margin:0 0 20px 0;">
            <strong>📝 About this Business &amp; Promotion:</strong>
            ${escapeHtml(m.promo_description).replace(/\n/g, '<br>')}
          </div>
        ` : ''}

        <div class="standard-qr-box">
          <div class="qr-canvas-holder" id="qr-container" style="width:160px; height:160px; margin:0 auto 12px;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&amp;data=${encodeURIComponent(joinUrl)}" alt="Perkfinity Counter QR Code" width="160" height="160" style="border-radius:12px; display:block;" />
          </div>
          <a href="${joinUrl}" target="_blank" rel="noopener" class="qr-link">${escapeHtml(joinUrl)}</a>
        </div>

        <div class="qr-paths" style="margin-bottom:20px;">
          <div class="qr-path-amber">
            <div class="qr-path-title-amber">📱 DON&#39;T HAVE THE APP?</div>
            <p class="qr-path-desc-amber">${isOnlineOnly ? 'Open your phone&#39;s camera → Scan the QR code → Download Perkfinity → Join the store → Your promo code is revealed in the app.' : 'Open your phone&#39;s camera → Scan the QR code → Download Perkfinity → Join the merchant → Visit the store to activate your perk.'}</p>
          </div>
          <div class="qr-path-green">
            <div class="qr-path-title-green">✅ ALREADY HAVE THE APP?</div>
            <p class="qr-path-desc-green">${isOnlineOnly ? 'Open Perkfinity → Tap <strong>Scan</strong> → Scan this QR code → Join the store → View your exclusive promo code.' : 'Open Perkfinity → Tap <strong>Scan</strong> → Scan this QR code → Join the merchant → Visit the store and scan again to activate.'}</p>
          </div>
        </div>

        <p class="qr-disclaimer">
          Unlock your perk inside the app to redeem in person or online.<br>
          By joining, you agree to our <a href="/terms-of-use" target="_blank">Terms of Use</a> &amp;
          <a href="/privacy-policy" target="_blank">Privacy Policy</a>.
        </p>
      </article>
    `}

    <!-- Store Overview & FAQ Section (Matches FAQPage Schema.org JSON-LD for Rich Results & Indexing Quality) -->
    <section class="store-seo-details" style="max-width:860px; margin:0 auto 48px; background:#fff; border:1px solid #E2E8F0; border-radius:20px; padding:28px 32px; box-shadow:0 4px 16px rgba(15,23,42,0.03);">
      <h2 style="font-size:19px; font-weight:800; color:#0F172A; margin:0 0 10px;">About ${escapeHtml(bName)} Deals &amp; Member Perks</h2>
      <p style="font-size:14.5px; color:#334155; line-height:1.65; margin:0 0 24px;">${escapeHtml(seoOverviewText)}</p>
      <h3 style="font-size:16px; font-weight:800; color:#1E293B; margin:0 0 14px;">Frequently Asked Questions — ${escapeHtml(bName)}</h3>
      <div style="display:flex; flex-direction:column; gap:14px;">
        ${faqItems.map(item => `
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:14px 18px;">
            <div style="font-size:14px; font-weight:800; color:#311C87; margin-bottom:6px;">${escapeHtml(item.q)}</div>
            <p style="font-size:13.5px; color:#475569; line-height:1.55; margin:0;">${escapeHtml(item.a)}</p>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- Nearby Merchants Section -->
    ${nearbyCardsHtml ? `
      <section class="nearby-section">
        <h2 class="nearby-heading">${(isOnlineOnly && !hasCity) ? 'More Verified Promo Codes &amp; Local Deals on Perkfinity' : 'More Verified Local Deals in ' + escapeHtml(city) + ' &amp; Orange County'}</h2>
        <p class="nearby-sub">Discover other top-rated favorites offering member perks right now:</p>
        <div class="nearby-grid">
          ${nearbyCardsHtml}
        </div>
        <div style="text-align:center;">
          ${(isOnlineOnly && !hasCity)
            ? '<a href="/codes" style="display:inline-block; background:#5B3FA5; color:#fff; font-weight:700; font-size:14px; padding:12px 28px; border-radius:12px; text-decoration:none;">← Browse All Promo Codes &amp; Brand Deals</a>'
            : '<a href="/deals/' + citySlug + '" style="display:inline-block; background:#5B3FA5; color:#fff; font-weight:700; font-size:14px; padding:12px 28px; border-radius:12px; text-decoration:none;">← Browse All ' + escapeHtml(city) + ' Deals &amp; Perks</a>'}
        </div>
      </section>
    ` : ''}

  </main>

  <!-- Site Footer -->
  <footer class="site-footer">
    <div class="footer-inner">
      <div>
        <strong style="color:#fff;">Perkfinity</strong> — Privacy-First Local Customer Loyalty
      </div>
      <div class="footer-links">
        <a href="/privacy-policy">Privacy Policy</a>
        <a href="/terms-of-use">Terms of Use</a>
        <a href="/merchants">For Merchants</a>
      </div>
    </div>
  </footer>

  <!-- Download App Modal -->
  <div id="download-modal" class="download-modal-overlay" onclick="if(event.target===this)this.style.display='none'">
    <div class="download-modal-box">
      <button class="download-modal-close" onclick="document.getElementById('download-modal').style.display='none'" aria-label="Close">✕</button>
      <div style="font-size:36px; margin-bottom:12px;">📱</div>
      <h3 style="margin:0 0 8px; font-size:22px; font-weight:900; color:#0F172A;">Get the Free Perkfinity App</h3>
      <p style="margin:0 0 24px; font-size:14px; color:#64748B; line-height:1.5;">Scan at local counters, unlock verified member perks, and save with zero spam or tracking.</p>
      <div style="display:flex; flex-direction:column; gap:12px;">
        <a href="https://apps.apple.com/us/app/perkfinity-privacy-first-perks/id6759945540" target="_blank" rel="noopener noreferrer" class="store-badge-btn btn-apple">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
          <span>Download on App Store</span>
        </a>
        <a href="https://play.google.com/store/apps/details?id=net.perkfinity.app" target="_blank" rel="noopener noreferrer" class="store-badge-btn btn-google">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M3.18 23.76c.3.17.64.22.98.14l12.38-7.15-2.9-2.9-10.46 9.91zm-1.18-19.5v15.48c0 .52.28.97.73 1.22l10.58-10.58-3.47-3.47L2 4.26zM20.52 9.4L17.6 7.74 14.4 11l3.2 3.2 2.94-1.7c.84-.48.84-1.62-.02-2.1zM4.16.14L14.4 10.4l-3.2-3.2L2.18.38C2.47.14 2.86.04 3.25.14z"/></svg>
          <span>Get it on Google Play</span>
        </a>
      </div>
    </div>
  </div>

  <!-- Real-Time Client Hydration & QR Code Enhancement -->
  <script>
    (function() {
      const joinUrl = "${joinUrl}";
      const qrCanvasSize = ${isVip ? 180 : 160};
      if (typeof QRCode !== 'undefined') {
        const qrContainer = document.getElementById('qr-container');
        QRCode.toCanvas(document.createElement('canvas'), joinUrl, { width: qrCanvasSize, margin: 0 }, function(err, canvas) {
          if (!err && canvas) {
            qrContainer.innerHTML = '';
            canvas.style.borderRadius = '12px';
            qrContainer.appendChild(canvas);
          }
        });
      }

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          const dm = document.getElementById('download-modal');
          if (dm) dm.style.display = 'none';
        }
      });

      function applyStoreHydration(currentStore) {
        if (!currentStore || currentStore.is_hidden) {
          const card = document.getElementById('store-card');
          if (card) {
            card.innerHTML = '<div style="padding:48px; text-align:center; width:100%;"><h2 style="color:#991B1B;">Offer Currently Unavailable</h2><p style="color:#64748B;">This merchant offer has ended or is currently paused.</p><a href="${isOnlineOnly ? '/codes' : '/localperks'}" style="display:inline-block; margin-top:16px; background:#5B3FA5; color:#fff; padding:10px 24px; border-radius:10px; text-decoration:none; font-weight:700;">Explore Other Deals →</a></div>';
          }
        } else {
          if (currentStore.welcome_offer_text && currentStore.welcome_offer_text !== "${escapeHtml(offer)}") {
            const perkEl = document.getElementById('live-perk-text');
            if (perkEl) perkEl.textContent = currentStore.welcome_offer_text;
          }
          const isNowVip = Boolean(currentStore.is_fullpage_sponsored && (!currentStore.fullpage_sponsored_until || new Date(currentStore.fullpage_sponsored_until) >= new Date()));
          const badge = document.getElementById('sponsored-badge');
          if (badge && !isNowVip) {
            badge.remove();
          }
        }
      }

      fetch("${API_URL}?id=${escapeHtml(m.id)}")
        .then(res => res.json())
        .then(json => {
          if (!json.success || !Array.isArray(json.data)) return;
          const currentStore = json.data[0];
          if (!currentStore && ${isOnlineOnly ? 'true' : 'false'}) {
            return fetch("${ONLINE_API_URL}")
              .then(r => r.json())
              .then(oJson => {
                if (!oJson.success || !Array.isArray(oJson.data)) return;
                const onlineMatch = oJson.data.find(item => item.id === "${escapeHtml(m.id)}");
                applyStoreHydration(onlineMatch);
              });
          }
          applyStoreHydration(currentStore);
        })
        .catch(err => {
          console.warn('Real-time hydration check skipped:', err);
        });
    })();
  </script>

</body>
</html>`;
}

module.exports = async function handler(req, res) {
  try {
    const rawSlug = (req.query && (req.query.slug || req.query.store)) || (req.url.match(/\/(?:deals\/)?store\/([^/?#]+)/) || [])[1] || '';
    const targetSlug = slugify(decodeURIComponent(rawSlug));
    const isLegacyStoreRequest = Boolean(
      (req.query && req.query.store) ||
      (req.url && (req.url.startsWith('/localperks') || req.url.startsWith('/deals/store/')))
    );

    if (!targetSlug) {
      res.writeHead(308, { Location: 'https://www.perkfinity.net/localperks' });
      return res.end();
    }

    let merchants = await fetchMerchants({ slug: targetSlug });
    let match = merchants.find(m => slugify(m.business_name) === targetSlug)
      || merchants.find(m => slugify(m.business_name).startsWith(targetSlug) || targetSlug.startsWith(slugify(m.business_name)))
      || merchants[0];

    // Also check online-merchants if no exact match in local-merchants
    if (!match || slugify(match.business_name) !== targetSlug) {
      try {
        const onlineMerchants = await fetchOnlineMerchants();
        const exactOnline = onlineMerchants.find(m => slugify(m.business_name) === targetSlug);
        if (exactOnline) {
          match = exactOnline;
          if (merchants.length === 0) {
            merchants = [exactOnline, ...onlineMerchants.filter(o => o.id !== exactOnline.id).slice(0, 4)];
          }
        } else if (!match) {
          const prefixOnline = onlineMerchants.find(m => slugify(m.business_name).startsWith(targetSlug) || targetSlug.startsWith(slugify(m.business_name)));
          if (prefixOnline) {
            match = prefixOnline;
            merchants = [prefixOnline, ...onlineMerchants.filter(o => o.id !== prefixOnline.id).slice(0, 4)];
          }
        }
      } catch (e) {
        // Ignore online fallback error if local lookup already ran
      }
    }

    if (!match) {
      // Redirect unknown/hidden store slugs cleanly to canonical /localperks (without ?store= query string so Google Search Console never flags an Alternate Canonical page)
      res.writeHead(isLegacyStoreRequest ? 308 : 302, { Location: 'https://www.perkfinity.net/localperks' });
      return res.end();
    }

    const canonicalSlug = slugify(match.business_name);
    if (canonicalSlug && (isLegacyStoreRequest || targetSlug !== canonicalSlug)) {
      res.writeHead(308, { Location: `https://www.perkfinity.net/store/${canonicalSlug}` });
      return res.end();
    }

    const html = buildStorePageHtml(match, merchants);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).send(html);
  } catch (err) {
    console.error('SSR store-page error:', err);
    res.writeHead(302, { Location: '/localperks' });
    return res.end();
  }
};

module.exports.buildStorePageHtml = buildStorePageHtml;
module.exports.fetchMerchants = fetchMerchants;
module.exports.fetchOnlineMerchants = fetchOnlineMerchants;
module.exports.slugify = slugify;
