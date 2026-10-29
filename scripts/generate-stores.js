#!/usr/bin/env node

/**
 * generate-stores.js
 * 
 * Static Site Generator (SSG) for Perkfinity Store Landing Pages (/store/:slug).
 * - Queries the production API for all active, non-hidden merchants.
 * - Generates physical static HTML files at Website-Perkfinity/store/[slug]/index.html.
 * - Embeds self-referencing canonical tag to permanently fix Google de-indexing.
 * - Injects Schema.org JSON-LD (LocalBusiness/Restaurant/Offer) and high-intent commercial keywords.
 * - Auto-syncs Website-Perkfinity/sitemap.xml with updated URLs and lastmod timestamps.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const API_URL = 'https://perkfinity-backend.vercel.app/api/v1/public/local-merchants';
const WEBSITE_ROOT = path.resolve(__dirname, '..');
const STORE_DIR = path.join(WEBSITE_ROOT, 'store');
const SITEMAP_PATH = path.join(WEBSITE_ROOT, 'sitemap.xml');

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

function fetchMerchants() {
  return new Promise((resolve, reject) => {
    https.get(API_URL, (res) => {
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

function buildStorePageHtml(m, allMerchants) {
  const bName = m.business_name || m.merchant_name || 'Brand';
  const slug = slugify(bName);
  const city = m.city || 'Orange County';
  const state = m.state || 'CA';
  const zip = m.postal_code || '';
  const address = m.address || '';
  const fullAddr = [address, city, state, zip].filter(Boolean).join(', ');
  const offer = m.welcome_offer_text || 'Exclusive Member Perk';
  const category = m.business_category || 'Local Dining & Retail';
  const isVip = Boolean(m.is_fullpage_sponsored);
  const bannerUrl = m.promo_banner_url || m.cover_photo_url || '';
  const logoUrl = m.logo_url || '';
  const phone = formatPhone(m.public_phone || '');
  const email = m.public_email || '';
  const website = m.website || '';
  const orderUrl = m.order_url || '';
  const reviewUrl = m.review_url || '';
  const qrPublicCode = m.qr_public_code || '';
  const joinUrl = `https://perkfinity.net/join/${qrPublicCode}`;
  const canonicalUrl = `https://www.perkfinity.net/store/${slug}`;
  const citySlug = slugify(city);

  const initials = bName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  // Find other merchants in same city for bottom carousel
  const nearbyStores = allMerchants
    .filter(other => slugify(other.business_name) !== slug)
    .sort((a, b) => {
      if ((a.city || '').toLowerCase() === city.toLowerCase()) return -1;
      if ((b.city || '').toLowerCase() === city.toLowerCase()) return 1;
      return 0;
    })
    .slice(0, 4);

  const nearbyCardsHtml = nearbyStores.map(ns => {
    const nsName = ns.business_name || 'Store';
    const nsSlug = slugify(nsName);
    const nsCity = ns.city || 'Orange County';
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
            <div class="nearby-loc">📍 ${escapeHtml(nsCity)}</div>
          </div>
        </div>
        <div class="nearby-offer">${escapeHtml(nsOffer)}</div>
        <span class="nearby-view-btn">View Deals →</span>
      </a>
    `;
  }).join('');

  // Structured Data Schema.org
  const isRestaurant = /restaurant|cafe|bakery|dining|food|boba|coffee|juice|curry|sweets|dessert/i.test(category);
  const schemaType = isRestaurant ? 'Restaurant' : 'LocalBusiness';

  const schemaJson = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "name": bName,
    "url": canonicalUrl,
    "image": bannerUrl || logoUrl || "https://perkfinity.net/assets/Perkfinity-App-Icon.png",
    "telephone": phone || undefined,
    "priceRange": "$$",
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
      "description": `Exclusive VIP discount and member perks at ${bName} in ${city}, ${state}`
    }
  };

  return `<!doctype html>
<html lang="en">
<head>
  <base href="/" />
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(bName)} (${escapeHtml(city)}) Deals, Coupons &amp; Discounts | Perkfinity</title>
  <meta name="description" content="Discover verified ${escapeHtml(bName)} deals, store coupons, exclusive discounts, and member offers in ${escapeHtml(city)}, ${escapeHtml(state)}. Save at the counter with Perkfinity." />
  <meta name="keywords" content="${escapeHtml(bName)} deals, ${escapeHtml(bName)} coupons, ${escapeHtml(bName)} discounts, ${escapeHtml(city)} deals, ${escapeHtml(city)} coupons, store perks, customer loyalty" />
  <link rel="canonical" href="${canonicalUrl}" />

  <!-- OpenGraph -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:title" content="${escapeHtml(bName)} (${escapeHtml(city)}) Deals, Coupons &amp; Discounts — Perkfinity" />
  <meta property="og:description" content="Claim verified deals, exclusive coupons, and discounts at ${escapeHtml(bName)} in ${escapeHtml(city)}, ${escapeHtml(state)}. Free, privacy-first." />
  <meta property="og:image" content="${escapeHtml(bannerUrl || logoUrl || 'https://perkfinity.net/assets/Perkfinity-App-Icon.png')}" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(bName)} Deals &amp; Discounts — Perkfinity" />
  <meta name="twitter:description" content="Claim verified deals and member perks at ${escapeHtml(bName)} in ${escapeHtml(city)}, ${escapeHtml(state)}." />
  <meta name="twitter:image" content="${escapeHtml(bannerUrl || logoUrl || 'https://perkfinity.net/assets/Perkfinity-App-Icon.png')}" />

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
  ${JSON.stringify(schemaJson, null, 2)}
  </script>

  <link rel="icon" href="/assets/Perkfinity-App-Icon.png" />
  <link rel="stylesheet" href="/styles.css" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <script src="/config.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>

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
    .nav-signin { font-size: 14px; font-weight: 700; color: #5b3fa5 !important; border: 1.5px solid #5b3fa5 !important; padding: 7px 18px !important; border-radius: 10px !important; }
    .nav-signin:hover { background: #5b3fa5 !important; color: #fff !important; }

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
      background: rgba(0,0,0,0.55); color: #fff; border: 1px solid rgba(255,255,255,0.25);
      backdrop-filter: blur(6px); padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 700;
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
      background: #fff; border: 1px solid #E2E8F0; border-radius: 18px; padding: 20px; width: 100%; text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03); margin-bottom: 24px;
    }
    .qr-canvas-holder { width: 170px; height: 170px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; }
    .qr-scan-title { font-size: 13px; font-weight: 800; color: #0F172A; margin: 0 0 4px; }
    .qr-scan-desc { font-size: 12px; color: #64748B; margin: 0; line-height: 1.4; }

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
      <nav class="nav-links">
        <a href="/deals/orange-county">Local Deals</a>
        <a href="/codes.html">Online Perks</a>
        <a href="/merchants.html">For Business</a>
        <a href="/get-started.html" class="nav-signin">Get Free App</a>
      </nav>
    </div>
  </header>

  <!-- Breadcrumb Navigation -->
  <div class="breadcrumb-bar">
    <div class="container">
      <a href="/">Home</a> › 
      <a href="/deals/orange-county">Orange County</a> › 
      <a href="/deals/${escapeHtml(citySlug)}">${escapeHtml(city)}</a> › 
      <span>${escapeHtml(bName)} Deals</span>
    </div>
  </div>

  <!-- Store Landing Main -->
  <main class="store-container">
    <article class="store-hero-card" id="store-card">
      
      <!-- Main Content Column -->
      <div class="store-main-col">
        ${bannerUrl ? `
          <div class="store-banner-wrap">
            <span class="store-sponsored-badge">Verified Partner</span>
            <img src="${escapeHtml(bannerUrl)}" alt="${escapeHtml(bName)} Banner" class="store-banner-img" onerror="this.style.display='none';">
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
              <span style="font-size:13px; color:#64748B; font-weight:600;">📍 ${escapeHtml(city)}, ${escapeHtml(state)}</span>
            </div>
          </div>
        </div>

        ${m.promo_description ? `
          <div class="store-desc-box">
            <strong>📝 About this Business &amp; Promotion:</strong>
            ${escapeHtml(m.promo_description).replace(/\\n/g, '<br>')}
          </div>
        ` : ''}

        <!-- The Verified Deal -->
        <div class="perk-highlight-box">
          <div class="perk-tag">🎁 Exclusive Member Perk</div>
          <div class="perk-title" id="live-perk-text">${escapeHtml(offer)}</div>
          <p class="perk-sub">Claim this offer instantly by scanning the green Perkfinity stand at the counter using your smartphone camera or the free Perkfinity app.</p>
        </div>

        ${fullAddr ? `
          <div class="store-map-wrap">
            <iframe width="100%" height="180" frameborder="0" style="border:0;" src="https://maps.google.com/maps?q=${encodeURIComponent(fullAddr)}&t=&z=14&ie=UTF8&iwloc=&output=embed" allowfullscreen loading="lazy"></iframe>
          </div>
          <div class="store-address-text">
            <span>📍 ${escapeHtml(fullAddr)}</span>
          </div>
        ` : ''}
      </div>

      <!-- Action & QR Column -->
      <aside class="store-side-col">
        <div class="qr-card-wrap">
          <div class="qr-canvas-holder" id="qr-container">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${encodeURIComponent(joinUrl)}" alt="Perkfinity Counter QR Code" width="170" height="170" style="border-radius:12px; display:block;" />
          </div>
          <div class="qr-scan-title">Scan at Counter to Save</div>
          <p class="qr-scan-desc">Open your phone's camera, scan this QR code, and unlock your exclusive savings instantly at checkout.</p>
        </div>

        <div class="action-btn-group">
          ${orderUrl ? `<a href="${escapeHtml(orderUrl)}" target="_blank" rel="noopener nofollow" class="act-btn act-btn-order">🛒 Order / Book Now</a>` : ''}
          ${reviewUrl ? `<a href="${escapeHtml(reviewUrl)}" target="_blank" rel="noopener nofollow" class="act-btn act-btn-review">⭐ View Reviews</a>` : ''}
          ${website ? `<a href="${escapeHtml(website)}" target="_blank" rel="noopener nofollow" class="act-btn act-btn-web">🌐 Official Website</a>` : ''}
          ${phone ? `<a href="tel:${escapeHtml(m.public_phone)}" class="act-btn act-btn-phone">📞 Call ${escapeHtml(phone)}</a>` : ''}
          ${email ? `<a href="mailto:${escapeHtml(email)}" class="act-btn act-btn-email">✉️ Email Business</a>` : ''}
        </div>
      </aside>

    </article>

    <!-- Nearby Merchants Section -->
    ${nearbyCardsHtml ? `
      <section class="nearby-section">
        <h2 class="nearby-heading">More Verified Local Deals in ${escapeHtml(city)} &amp; Orange County</h2>
        <p class="nearby-sub">Discover other top-rated neighborhood favorites offering member perks right now:</p>
        <div class="nearby-grid">
          ${nearbyCardsHtml}
        </div>
        <div style="text-align:center;">
          <a href="/deals/orange-county" style="display:inline-block; background:#5B3FA5; color:#fff; font-weight:700; font-size:14px; padding:12px 28px; border-radius:12px; text-decoration:none;">← Browse All Orange County Deals &amp; Perks</a>
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
        <a href="/privacy-policy.html">Privacy Policy</a>
        <a href="/terms-of-use.html">Terms of Use</a>
        <a href="/merchants.html">For Merchants</a>
      </div>
    </div>
  </footer>

  <!-- Real-Time Client Hydration & QR Code Enhancement -->
  <script>
    (function() {
      // 1. Render high-res canvas QR code locally if QRCode library is active
      const joinUrl = "${joinUrl}";
      if (typeof QRCode !== 'undefined') {
        const qrContainer = document.getElementById('qr-container');
        QRCode.toCanvas(document.createElement('canvas'), joinUrl, { width: 170, margin: 0 }, function(err, canvas) {
          if (!err && canvas) {
            qrContainer.innerHTML = '';
            canvas.style.borderRadius = '12px';
            qrContainer.appendChild(canvas);
          }
        });
      }

      // 2. Real-Time Status Check (Guards against paused or deactivated merchants)
      fetch("${API_URL}")
        .then(res => res.json())
        .then(json => {
          if (!json.success || !Array.isArray(json.data)) return;
          const currentStore = json.data.find(item => item.id === "${m.id}");
          if (!currentStore || currentStore.is_hidden) {
            const card = document.getElementById('store-card');
            if (card) {
              card.innerHTML = '<div style="padding:48px; text-align:center; width:100%;"><h2 style="color:#991B1B;">Offer Currently Unavailable</h2><p style="color:#64748B;">This merchant offer has ended or is currently paused.</p><a href="/deals/orange-county" style="display:inline-block; margin-top:16px; background:#5B3FA5; color:#fff; padding:10px 24px; border-radius:10px; text-decoration:none; font-weight:700;">Explore Other Deals →</a></div>';
            }
          } else if (currentStore.welcome_offer_text && currentStore.welcome_offer_text !== "${escapeHtml(offer)}") {
            const perkEl = document.getElementById('live-perk-text');
            if (perkEl) perkEl.textContent = currentStore.welcome_offer_text;
          }
        })
        .catch(err => {
          // Graceful fallback: static HTML remains active
          console.warn('Real-time hydration check skipped:', err);
        });
    })();
  </script>

</body>
</html>`;
}

function updateSitemap(generatedSlugs) {
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.warn('sitemap.xml not found at', SITEMAP_PATH);
    return;
  }

  let sitemapContent = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const today = '2026-10-28';

  generatedSlugs.forEach(slug => {
    const storeUrl = `https://www.perkfinity.net/store/${slug}`;
    const urlBlock = `  <url>
    <loc>${storeUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`;

    // If already in sitemap, update lastmod
    const regex = new RegExp(`<url>\\s*<loc>https:\\/\\/www\\.perkfinity\\.net\\/store\\/${slug}<\\/loc>[\\s\\S]*?<\\/url>`, 'g');
    if (regex.test(sitemapContent)) {
      sitemapContent = sitemapContent.replace(regex, urlBlock);
    } else {
      // Append before closing </urlset>
      sitemapContent = sitemapContent.replace('</urlset>', `${urlBlock}\n</urlset>`);
    }
  });

  fs.writeFileSync(SITEMAP_PATH, sitemapContent, 'utf8');
  console.log(`✅ sitemap.xml updated with ${generatedSlugs.length} store URLs.`);
}

async function main() {
  console.log('🔄 Fetching active local merchants from production backend...');
  const merchants = await fetchMerchants();
  console.log(`Found ${merchants.length} active local merchants.`);

  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }

  const generatedSlugs = [];

  for (const m of merchants) {
    const slug = slugify(m.business_name);
    if (!slug) continue;

    const storeSubdir = path.join(STORE_DIR, slug);
    if (!fs.existsSync(storeSubdir)) {
      fs.mkdirSync(storeSubdir, { recursive: true });
    }

    const htmlContent = buildStorePageHtml(m, merchants);
    const indexPath = path.join(storeSubdir, 'index.html');

    fs.writeFileSync(indexPath, htmlContent, 'utf8');
    generatedSlugs.push(slug);
    console.log(`  ✓ Generated: /store/${slug}/index.html (${m.business_name})`);
  }

  // Auto-sync sitemap.xml
  updateSitemap(generatedSlugs);

  console.log(`\n🎉 Successfully pre-rendered ${generatedSlugs.length} store landing pages!`);
}

main().catch(err => {
  console.error('❌ Error during static store generation:', err);
  process.exit(1);
});
