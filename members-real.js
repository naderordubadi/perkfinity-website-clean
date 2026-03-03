(() => {
  const burger = document.querySelector('.burger');
  const menu = document.querySelector('.mobilemenu');

  if (burger && menu) {
    burger.addEventListener('click', () => {
      const expanded = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!expanded));
      menu.hidden = expanded;
    });
  }

  const toastEl = document.getElementById('toast');
  const toast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => toastEl.hidden = true, 3200);
  };

  async function submitEmail(form, listName) {
    const email = form.querySelector('input[type="email"]').value.trim();
    if (!email) return;

    // Try real API first (when you add it)
    try {
      const res = await fetch('/api/subscribe-members', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email, list: listName, source: 'for-members' })
      });

      if (res.ok) {
        toast('Thanks! You are on the waitlist.');
        form.reset();
        return;
      }
    } catch (_) {
      // ignore network errors; fall back below
    }

    // Fallback: store locally so UX works immediately
    const key = 'perkfinity_waitlist_members';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    if (!existing.includes(email)) existing.push(email);
    localStorage.setItem(key, JSON.stringify(existing));
    toast('Saved! (Local preview mode — will sync once API is live)');
    form.reset();
  }

  const membersForm = document.getElementById('membersWaitlistForm');
  if (membersForm) {
    membersForm.addEventListener('submit', (e) => {
      e.preventDefault();
      submitEmail(membersForm, 'members_waitlist');
    });
  }
})();