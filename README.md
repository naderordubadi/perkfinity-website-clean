# Perkfinity Landing Page v6 (Functional + Mockup-Matched)

This version fixes the issues shown in your screenshots:
- Removes the “ghost text” in the purple launch band (we no longer use a screenshot texture with text)
- Uses proper on-brand SVG icons (no emoji)
- Tightens spacing/typography to match the approved mockup
- Keeps all interactive parts as real HTML (nav + both email forms)

## Email capture (actually works)
This package includes a Vercel Serverless Function:
- `/api/subscribe`

To make it save emails, set a Vercel Environment Variable:
- `FORMSPREE_ENDPOINT` = your Formspree endpoint (free)

Then both forms send to `/api/subscribe` automatically.

### Quick Formspree setup
1) Create a form on Formspree and copy the endpoint URL
2) In Vercel Project → Settings → Environment Variables
3) Add `FORMSPREE_ENDPOINT` with the URL
4) Redeploy

## Deploy
Repo root should include:
- index.html
- styles.css
- app.js
- /assets (folder)
- /api/subscribe.js (for email capture)

