// merchant-modals.js
// Shared UI logic for rendering merchant popups (both small Carousel popups and large VIP Business Cards)
// Requires QRCode.js to be loaded on the page window (https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js)

window.closeFullPageTakeover = function() {
  const modal = document.getElementById('fullpage-takeover-overlay');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
};

window.openFullPageTakeover = function(merchant) {
  let modal = document.getElementById('fullpage-takeover-overlay');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'fullpage-takeover-overlay';
    modal.style.cssText = `
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.85); z-index: 999999;
      display: flex; justify-content: center; align-items: center; padding: 20px;
      backdrop-filter: blur(8px); overflow-y: auto;
    `;
    modal.onclick = (e) => { if (e.target === modal) closeFullPageTakeover(); };
    document.body.appendChild(modal);
  }

  const isHybrid = merchant.business_presence === 'hybrid';
  
  const getReviewSocialBtnLabel = window.getReviewSocialBtnLabel || function(url, ratingPlatform, ratingScore, isCompact = false) {
    if (!url && !ratingPlatform) return isCompact ? '⭐ Reviews' : '⭐ View Reviews';
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
    if (u.includes('tripadvisor.com')) return isCompact ? '⭐ TripAdvisor Reviews' : '⭐ View TripAdvisor Reviews';
    if (u.includes('trustpilot.com')) return isCompact ? '⭐ Trustpilot Reviews' : '⭐ View Trustpilot Reviews';
    if (u.includes('yelp.com') || ratingPlatform === 'Yelp') return isCompact ? '⭐ Yelp Reviews' : '⭐ View Yelp Reviews';
    if (u.includes('google.com') || u.includes('g.page') || u.includes('maps.app.goo.gl') || ratingPlatform === 'Google') return isCompact ? '⭐ Google Reviews' : '⭐ View Google Reviews';
    if (ratingPlatform && ratingScore) return `⭐ View ${ratingPlatform} Reviews`;
    return isCompact ? '🔗 Visit Social Page' : '🔗 View Reviews / Social Page';
  };
  window.getReviewSocialBtnLabel = getReviewSocialBtnLabel;

  const reviewBtnLabel = getReviewSocialBtnLabel(merchant.review_url, merchant.rating_platform, merchant.rating_score, false);
  const orderBtn = merchant.order_url ? `<a href="${merchant.order_url}" target="_blank" style="background:#16A34A; color:#fff; padding:12px 20px; border-radius:10px; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:8px; width:100%; box-sizing:border-box;">🛒 Order / Book Now</a>` : '';
  const reviewBtn = merchant.review_url ? `<a href="${merchant.review_url}" target="_blank" style="background:#3B82F6; color:#fff; padding:12px 20px; border-radius:10px; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:8px; width:100%; box-sizing:border-box;">${reviewBtnLabel}</a>` : '';
  const websiteBtn = merchant.website ? `<a href="${merchant.website.startsWith('http') ? merchant.website : 'https://' + merchant.website}" target="_blank" style="background:#64748B; color:#fff; padding:12px 20px; border-radius:10px; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:8px; width:100%; box-sizing:border-box;">🌐 Official Website</a>` : '';
  const phoneBtn = merchant.public_phone ? `<a href="tel:${merchant.public_phone}" style="background:#0D9488; color:#fff; padding:12px 20px; border-radius:10px; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:8px; width:100%; box-sizing:border-box;">📞 Call Business</a>` : '';
  const emailBtn = merchant.public_email ? `<a href="mailto:${merchant.public_email}" style="background:#4F46E5; color:#fff; padding:12px 20px; border-radius:10px; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:8px; width:100%; box-sizing:border-box;">✉️ Email Business</a>` : '';

  const fullAddr = [merchant.address_line1 || merchant.address, merchant.city, merchant.state, merchant.zip_code].filter(Boolean).join(', ');
  const mapHtml = fullAddr ? `
    <div style="border-radius:12px; overflow:hidden; border:1px solid #E2E8F0; height:180px; margin-top:8px;">
      <iframe width="100%" height="180" frameborder="0" style="border:0" src="https://maps.google.com/maps?q=${encodeURIComponent(fullAddr)}&t=&z=14&ie=UTF8&iwloc=&output=embed" allowfullscreen></iframe>
    </div>
    <div style="font-size:12px; color:#64748B; margin-top:6px; font-weight:600;">📍 ${fullAddr}</div>
  ` : (merchant.business_presence === 'online' ? `<div style="background:#F1F5F9; border-radius:12px; padding:16px; text-align:center; color:#64748B; font-weight:600; font-size:13px;">🌐 Online Store — Available Nationwide</div>` : `<div style="background:#F1F5F9; border-radius:12px; padding:16px; text-align:center; color:#64748B; font-weight:600; font-size:13px;">📍 Contact business for location details</div>`);

  const businessName = merchant.business_name || merchant.merchant_name || 'Brand';
  const logoUrl = merchant.logo_url || 'https://perkfinity-backend.vercel.app/uploads/placeholder.jpg';
  
  modal.innerHTML = `
    <div style="background:#fff; border-radius:20px; max-width:960px; width:100%; max-height:90vh; overflow-y:auto; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); position:relative; display:grid; grid-template-columns: 1fr 340px; gap:0;">
      
          <button onclick="closeFullPageTakeover()" style="position:absolute; top:16px; right:16px; background:rgba(15,23,42,0.7); color:#fff; border:none; width:36px; height:36px; border-radius:50%; font-size:18px; cursor:pointer; z-index:10; display:flex; align-items:center; justify-content:center;">✕</button>

          <!-- Left Main Column -->
          <div style="padding:32px; border-right:1px solid #F1F5F9;">
            ${merchant.promo_banner_url || merchant.cover_photo_url ? `<img src="${merchant.promo_banner_url || merchant.cover_photo_url}" style="width:100%; height:260px; object-fit:cover; border-radius:14px; margin-bottom:20px;" alt="Banner" onerror="this.style.display='none';">` : `<div style="width:100%; height:200px; background:linear-gradient(135deg, #311C87 0%, #1E1B4B 100%); border-radius:14px; margin-bottom:20px; display:flex; align-items:center; justify-content:center; padding:16px;">${merchant.logo_url ? `<img src="${merchant.logo_url}" style="max-height:80px; max-width:80%; object-fit:contain;" alt="">` : `<span style="font-size:24px; font-weight:800; color:#FFFFFF; text-align:center;">${merchant.business_name || merchant.merchant_name || 'Brand'}</span>`}</div>`}
            
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px; flex-wrap:wrap;">
              <h2 style="margin:0; font-size:24px; font-weight:800; color:#1E293B;">${(merchant.business_name || merchant.merchant_name || 'Brand')}</h2>
              ${(merchant.rating_platform && merchant.rating_score) ? `<div style="background:#FFF7ED; color:#EA580C; font-weight:800; font-size:13px; padding:6px 12px; border-radius:20px; display:inline-flex; align-items:center; gap:6px;">⭐ ${merchant.rating_score} ${merchant.rating_platform}</div>` : ''}
            </div>

            ${merchant.promo_description ? `
              <div style="background:#F8FAFC; border-left:4px solid #8B5CF6; border-radius:8px; padding:16px; margin:20px 0; font-size:14px; color:#334155; line-height:1.6; max-height:350px; overflow-y:auto; word-break:break-word;">
                <strong style="color:#311C87; display:block; margin-bottom:6px; font-size:14.5px;">📝 About this Business & Promotion:</strong>
                ${merchant.promo_description.replace(/\n/g, '<br>')}
              </div>
            ` : ''}

            <div style="margin-top:24px; background:#F8F6FF; border:1.5px solid #E9D5FF; border-radius:14px; padding:20px;">
              <div style="font-size:12px; font-weight:800; color:#8B5CF6; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">🏷️ Exclusive Member Perk</div>
              <h3 style="margin:0 0 8px; font-size:18px; font-weight:800; color:#311C87;">${merchant.welcome_offer_text || merchant.latest_offer_title || 'Exclusive member perk'}</h3>
              <p style="margin:0; font-size:13.5px; color:#64748B;">Scan the QR code to open/download Perkfinity and claim this offer!</p>
            </div>
          </div>

          <!-- Right Sidebar Column -->
          <div style="padding:32px; background:#FAFAFA; border-top-right-radius:20px; border-bottom-right-radius:20px; display:flex; flex-direction:column; gap:20px;">
            <!-- Standard QR Code Section -->
            <div style="background:#fff; border:1px solid #E2E8F0; border-radius:16px; padding:18px; text-align:center; box-shadow:0 2px 8px rgba(0,0,0,0.03);">
              <div id="fullpage-qr" style="width:180px; height:180px; margin:0 auto;"></div>
              <a href="https://perkfinity.net/join/${merchant.qr_public_code}" target="_blank" style="display:block; margin-top:8px; font-size:11px; color:#3B82F6; font-weight:700; word-break:break-all; margin-bottom:14px;">https://perkfinity.net/join/${merchant.qr_public_code}</a>
              
              <div style="display:flex; flex-direction:column; gap:10px; text-align:left; margin-bottom:12px;">
                <div style="background:#FFFBEB; border:1.5px solid #FDE68A; border-radius:10px; padding:10px 12px;">
                  <div style="font-size:11px; font-weight:900; color:#B45309; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px;">📱 DON'T HAVE THE APP?</div>
                  <p style="margin:0; font-size:11.5px; font-weight:700; color:#78350F; line-height:1.4;">Open your phone's camera → Scan the QR code → Download Perkfinity → Join the merchant → Visit the store to activate your perk.</p>
                </div>
                <div style="background:#F0FDF4; border:1.5px solid #BBF7D0; border-radius:10px; padding:10px 12px;">
                  <div style="font-size:11px; font-weight:900; color:#15803D; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px;">✅ ALREADY HAVE THE APP?</div>
                  <p style="margin:0; font-size:11.5px; font-weight:700; color:#166534; line-height:1.4;">Open Perkfinity → Tap <strong>Scan</strong> → Scan this QR code → Join the merchant → Visit the store and scan again to activate.</p>
                </div>
              </div>

              <p style="font-size:11px; color:#94A3B8; font-weight:700; text-align:center; line-height:1.4; margin:0; border-top:1px solid #F1F5F9; padding-top:10px;">
                Unlock your perk inside the app to redeem in person or online.<br>
                By joining, you agree to our <a href="terms-of-use.html" target="_blank" style="color:#5B3FA5;">Terms of Use</a> &amp;
                <a href="privacy-policy.html" target="_blank" style="color:#5B3FA5;">Privacy Policy</a>.
              </p>
            </div>

            <!-- Action Links -->
            <div style="display:flex; flex-direction:column; gap:10px;">
              ${orderBtn}
              ${reviewBtn}
              ${websiteBtn}
              ${phoneBtn}
              ${emailBtn}
            </div>

            <!-- Location Map Embed -->
            <div>
              <div style="font-weight:700; font-size:13.5px; color:#1E293B; margin-bottom:6px;">📍 Where To Redeem</div>
              ${mapHtml}
              
            </div>
          </div>
        </div>

  `;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  const joinUrl = `https://perkfinity.net/join/${merchant.qr_public_code}`;
  const qrEl = modal.querySelector('#fullpage-qr');
  if (typeof QRCode !== 'undefined') {
    QRCode.toCanvas(document.createElement('canvas'), joinUrl, { width: 180, margin: 0 }, (err, canvas) => {
      if (!err) { qrEl.innerHTML = ''; qrEl.appendChild(canvas); }
    });
  }
};

window.closePopup = function() {
  const modal = document.getElementById('reveal-popup-dynamic');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
};

window.openPopup = function(merchant) {
  if (merchant.is_fullpage_sponsored && (!merchant.fullpage_sponsored_until || new Date(merchant.fullpage_sponsored_until) >= new Date())) {
    openFullPageTakeover(merchant);
    return;
  }

  let modal = document.getElementById('reveal-popup-dynamic');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'reveal-popup-dynamic';
    modal.className = 'popup-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.style.cssText = `
      position: fixed; inset: 0; background: rgba(15,23,42,0.6); z-index: 9999;
      display: none; align-items: center; padding: 20px; justify-content: center; backdrop-filter: blur(5px);
    `;
    modal.onclick = (e) => { if (e.target === modal) closePopup(); };
    document.body.appendChild(modal);
  }

  const businessName = merchant.business_name || merchant.merchant_name || 'Brand';
  const offerText = merchant.welcome_offer_text || 'Exclusive member perk';
  const initials = businessName.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
  
  let contactParts = [];
  if (merchant.public_phone) contactParts.push(`<a href="tel:${merchant.public_phone}" style="color:var(--purple);font-weight:700;text-decoration:none;">📞 Call Business</a>`);
  if (merchant.public_email) contactParts.push(`<a href="mailto:${merchant.public_email}" style="color:var(--purple);font-weight:700;text-decoration:none;">✉️ Email Business</a>`);
  const contactHtml = contactParts.length > 0 ? `<div style="margin-top:6px;font-size:12.5px;display:flex;gap:10px;flex-wrap:wrap;">${contactParts.join('<span style="color:var(--muted)">•</span>')}</div>` : '';

  const logoHtml = merchant.logo_url
    ? `<img src="${merchant.logo_url}" alt="${businessName} logo" style="width:100%; height:100%; object-fit:contain;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><div style="display:none; width:100%; height:100%; align-items:center; justify-content:center; font-size:20px; font-weight:900; color:var(--purple); background:rgba(91,63,165,.1);">${initials}</div>`
    : `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:900; color:var(--purple); background:rgba(91,63,165,.1);">${initials}</div>`;
    
  modal.innerHTML = `
    <div class="popup-box" style="width: 100%; max-width: 500px; background: #fff; border-radius: 24px; padding: 24px; position: relative; animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
      <button class="popup-close" onclick="closePopup()" aria-label="Close" style="position: absolute; top: 16px; right: 16px; background: rgba(15,23,42,0.05); border: none; width: 32px; height: 32px; border-radius: 50%; font-size: 14px; font-weight: 700; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s;">✕</button>
      <div class="popup-brand-row" style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
        <div id="popup-logo-wrap" style="width: 56px; height: 56px; border-radius: 14px; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.05); display: grid; place-items: center;">
          ${logoHtml}
        </div>
        <div>
          <div class="popup-brand-name" style="font-size: 18px; font-weight: 800; color: #0F172A; margin-bottom: 4px;">${businessName}</div>
          <p class="popup-offer-text" style="font-size: 13.5px; color: #8B5CF6; font-weight: 700; margin: 0;">${offerText}</p>
          ${contactHtml}
        </div>
      </div>
      <div class="popup-qr-wrap" style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <div id="popup-qr" style="width:160px;height:160px;margin:0 auto 12px;background:#fff;padding:8px;border-radius:12px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);"></div>
        <p class="popup-qr-url" style="font-size: 12px; color: #64748B; margin: 0; font-weight: 600; word-break: break-all;"></p>
      </div>
      <div class="popup-paths" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
        <div class="popup-path" style="background: #FFFBF1; border: 1px solid #FDE68A; border-radius: 12px; padding: 16px;">
          <div class="popup-path-title" style="font-size: 12px; font-weight: 800; color: #92400E; margin-bottom: 6px;">📱 Don't have the app?</div>
          <p style="margin: 0; font-size: 12px; color: #92400E; font-weight: 500; line-height: 1.5;">Open your phone's camera → Scan the QR code → Download Perkfinity → Join the store → Your promo code is revealed in the app.</p>
        </div>
        <div class="popup-path" style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 16px;">
          <div class="popup-path-title" style="font-size: 12px; font-weight: 800; color: #166534; margin-bottom: 6px;">✅ Already have the app?</div>
          <p style="margin: 0; font-size: 12px; color: #166534; font-weight: 500; line-height: 1.5;">Open Perkfinity → Tap <strong>Scan</strong> → Scan this QR code → Join the store → View your exclusive promo code.</p>
        </div>
      </div>
      <p class="popup-disclaimer" style="font-size: 11px; color: #94A3B8; text-align: center; line-height: 1.5; margin: 0;">
        Unlock your perk inside the app to redeem in person or online.<br>
        By joining, you agree to our <a href="terms-of-use.html" target="_blank" style="color:#64748B;font-weight:700;">Terms of Use</a> &amp;
        <a href="privacy-policy.html" target="_blank" style="color:#64748B;font-weight:700;">Privacy Policy</a>.
      </p>
    </div>
  `;
  
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  const joinUrl = `https://perkfinity.net/join/${merchant.qr_public_code}`;
  modal.querySelector('.popup-qr-url').textContent = joinUrl;
  const qrEl = modal.querySelector('#popup-qr');
  if (typeof QRCode !== 'undefined') {
    QRCode.toCanvas(document.createElement('canvas'), joinUrl, { width: 144, margin: 0 }, (err, canvas) => {
      if (!err) { qrEl.innerHTML = ''; qrEl.appendChild(canvas); }
    });
  }
};

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (typeof window.closePopup === 'function') window.closePopup();
    if (typeof window.closeFullPageTakeover === 'function') window.closeFullPageTakeover();
  }
});
