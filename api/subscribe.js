
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { email, source } = req.body || {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase())) {
      res.status(400).send('Invalid email');
      return;
    }

    const formspree = process.env.FORMSPREE_ENDPOINT; // e.g. https://formspree.io/f/xxxxxxx
    if (!formspree) {
      res.status(501).send('Email capture not connected yet. Set FORMSPREE_ENDPOINT env var in Vercel.');
      return;
    }

    const r = await fetch(formspree, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email, source: source || 'landing' })
    });

    if (!r.ok) {
      res.status(502).send('Upstream form service error');
      return;
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).send('Server error');
  }
}
