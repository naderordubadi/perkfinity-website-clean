#!/usr/bin/env node

/**
 * generate-stores.js
 *
 * Syncs static fallback files in Website-Perkfinity/store/[slug] and Website-Perkfinity/sitemap.xml
 * using the shared SSR engine in Website-Perkfinity/api/store-page.js and Website-Perkfinity/api/sitemap.js.
 * Note: Production also serves /store/:slug and /deals/:location dynamically via Vercel SSR functions.
 */

const fs = require('fs');
const path = require('path');
const { buildStorePageHtml, fetchMerchants, slugify } = require('../api/store-page');
const { buildSitemapXml } = require('../api/sitemap');

const WEBSITE_ROOT = path.resolve(__dirname, '..');
const STORE_DIR = path.join(WEBSITE_ROOT, 'store');
const SITEMAP_PATH = path.join(WEBSITE_ROOT, 'sitemap.xml');

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
    const flatPath = path.join(STORE_DIR, `${slug}.html`);

    fs.writeFileSync(indexPath, htmlContent, 'utf8');
    fs.writeFileSync(flatPath, htmlContent, 'utf8');
    generatedSlugs.push(slug);
    console.log(`  ✓ Generated: /store/${slug} (${m.business_name})`);
  }

  // Auto-sync sitemap.xml
  const sitemapXml = buildSitemapXml(merchants);
  fs.writeFileSync(SITEMAP_PATH, sitemapXml, 'utf8');
  console.log(`✅ sitemap.xml updated with ${generatedSlugs.length} store URLs and active city hubs.`);
}

main().catch(err => {
  console.error('❌ Error during static store generation:', err);
  process.exit(1);
});
