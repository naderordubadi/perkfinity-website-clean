export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { email, source } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase())) {
    return res.status(400).send('Invalid email');
  }
  const formspree = process.env.FORMSPREE_ENDPOINT;
  if (!formspree) return res.status(200).json({ ok: true, stored: false });
  const r = await fetch(formspree, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ email, source: source || 'landing' })
  });
  if (!r.ok) return res.status(502).send('Upstream form service error');
  return res.status(200).json({ ok: true, stored: true });
}