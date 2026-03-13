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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    
    if(payload.email && !validateEmail(payload.email)){
      status.textContent = 'Please enter a valid email address.';
      status.style.color = '#ff4d4d';
      return;
    }

    status.textContent = 'Sending...';
    status.style.color = 'inherit';

    try {
      const response = await postJSON(form.action, payload);
      if(response.ok){
        status.textContent = 'Thank you! We\'ll be in touch soon.';
        status.style.color = '#6BC17A';
        form.reset();
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      console.error('Form submission failed:', err);
      // Fallback to localStorage
      const submissions = JSON.parse(localStorage.getItem('form_submissions') || '[]');
      submissions.push({formId, payload, timestamp: new Date().toISOString()});
      localStorage.setItem('form_submissions', JSON.stringify(submissions));
      
      status.textContent = 'Saved! We\'re having trouble connecting, but we\'ve saved your info.';
      status.style.color = '#6BC17A';
      form.reset();
    }
  });
}

/**
 * Hero Slider Logic for Homepage
 */
function initHeroSlider() {
  const slider = document.querySelector('.hero-slider');
  if (!slider) return;
  const imgs = slider.querySelectorAll('img');
  if (imgs.length < 2) return;
  
  let current = 0;
  setInterval(() => {
    imgs[current].classList.remove('active');
    current = (current + 1) % imgs.length;
    imgs[current].classList.add('active');
  }, 5000);
}


// Wire up forms on page load
document.addEventListener('DOMContentLoaded', () => {
  // Homepage forms & Hero
  wireForm('newsletterForm', 'newsletterStatus');
  initHeroSlider();
  
  // Sub-page forms
  wireForm('memberWaitlistForm', 'waitlistStatus');
  wireForm('merchantInterestForm', 'merchantStatus');
});
