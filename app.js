
function scrollToId(id){
  const el = document.getElementById(id);
  if(el){ el.scrollIntoView({behavior:'smooth', block:'start'}); }
}
document.querySelectorAll('[data-scroll]').forEach(a=>{
  a.addEventListener('click', (e)=>{
    const target = a.getAttribute('data-scroll');
    if(target){
      e.preventDefault();
      scrollToId(target);
    }
  });
});

function validateEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
}

async function postJSON(url, payload){
  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type':'application/json','Accept':'application/json'},
    body: JSON.stringify(payload)
  });
  return res;
}

function wireForm(formId, statusId){
  const form = document.getElementById(formId);
  const status = document.getElementById(statusId);
  if(!form || !status) return;

  const input = form.querySelector('input[type="email"]');
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = (input?.value || '').trim();

    if(!validateEmail(email)){
      status.textContent = 'Please enter a valid email.';
      return;
    }

    const endpoint = form.dataset.endpoint;

    if(endpoint){
      status.textContent = 'Submitting...';
      try{
        const res = await postJSON(endpoint, { email, source: formId });
        if(res.ok){
          status.textContent = 'You’re on the list. Thank you!';
          input.value = '';
        }else{
          const txt = await res.text();
          status.textContent = txt || 'Could not submit right now. Please try again.';
        }
      }catch(err){
        status.textContent = 'Network error. Please try again later.';
      }
      return;
    }

    // UI fallback (if endpoint not configured)
    status.textContent = 'Thanks! (Email capture not connected yet.)';
    input.value = '';
  });
}

wireForm('waitlistForm', 'waitlistStatus');
wireForm('signupForm', 'signupStatus');
