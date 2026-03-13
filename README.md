# Perkfinity — For Members (Real Coded Page)

This is a **real HTML/CSS/JS** build (not a single full-page image).

## Files
- `indexformembers.html` — Members landing page
- `members-real.css` — Styles
- `members-real.js` — JS (nav + waitlist submission)
- `/assets/Perkfinity-Logo.png`
- `/assets/hero-photo.png` (cropped from Website-Member.png)

## Deploy
Upload these files to your GitHub repo (repo root).  
Visit: `https://YOURDOMAIN/indexformembers.html`

## Email capture
Currently tries to POST to `/api/subscribe-members`.
If not available yet, it falls back to localStorage (so the UX is still functional).
