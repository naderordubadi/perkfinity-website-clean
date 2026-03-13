function validateEmail(email){
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(String(email).trim().toLowerCase());
}
async function postJSON(url, payload){
  return fetch(url, {
    method:'POST',
    headers:{'Content-Type':'application/json','Accept':'application/json'},
    body: JSON.stringify(payload)
  });
}
function wireForm(formId, statusId){
  const form
