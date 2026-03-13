function validateEmail(email){
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(String(email).trim().toLowerCase());
}
async function postJSON(url
