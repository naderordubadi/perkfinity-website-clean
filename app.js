function validateEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim().toLowerCase());
}
async function postJSON(url, payload){
  return fetch(url, {
    method:'POST',
    headers:{'Content-Type':'application/json','Accept':'application/json'},
    body: JSON.stringify(payload)
  });
}
function wireForm(formId, statusId){
  const form = document.getElementById(formId);
  const status = document.getElementById(statusId);
  if(!form || !status) return;

  const input = form.querySelector('input[type="email"]');
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = (input?.value || '').trim();
    if(!validateEmail(email)){ status.textContent = 'Please enter a valid email.'; return; }
    status.textContent = 'Submitting...';

    try{
      const res = await postJSON('/api/subscribe', { email, source: formId });
      if(res.ok){
        status.textContent = "You're on the list. Thank you!";
        input.value = '';
        return;
      }
      throw new Error('API not ready');
    }catch(err){
      const k='perkfinity_emails';
      const arr = JSON.parse(localStorage.getItem(k) || '[]');
      arr.push({ email, source: formId, ts: Date.now() });
      localStorage.setItem(k, JSON.stringify(arr));
      status.textContent = "Saved (email capture not connected yet).";
      input.value = '';
    }
  });
}
wireForm('waitlistForm','waitlistStatus');
wireForm('signupForm','signupStatus');

// Smooth scroll for in-page links
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', (e)=>{
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if(el){
      e.preventDefault();
      el.scrollIntoView({behavior:'smooth', block:'start'});
    }
  });
});