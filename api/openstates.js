export default async function handler(req, res) {
  const state = req.query.state;
  if (!state) return res.status(400).json({ error: 'Missing state parameter' });

  const apiKey = process.env.OPENSTATES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenStates API key not configured', results: [] });
  }

  try {
    // First try: bills with recent activity (last 180 days) — these are actively moving
    const recentDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const url1 = `https://v3.openstates.org/bills?jurisdiction=${state.toLowerCase()}&action_since=${recentDate}&sort=latest_action_desc&per_page=20&include=actions`;
    const resp1 = await fetch(url1, { headers: { 'X-API-KEY': apiKey } });

    if (resp1.ok) {
      const data1 = await resp1.json();
      if (data1.results && data1.results.length >= 5) {
        return res.status(200).json(data1);
      }
    }

    // Fallback: if not enough recent bills (session may have ended),
    // fetch most recently updated bills without date filter
    const url2 = `https://v3.openstates.org/bills?jurisdiction=${state.toLowerCase()}&sort=latest_action_desc&per_page=20&include=actions`;
    const resp2 = await fetch(url2, { headers: { 'X-API-KEY': apiKey } });

    if (!resp2.ok) {
      const errBody = await resp2.text();
      return res.status(resp2.status).json({ error: 'OpenStates API returned ' + resp2.status + ': ' + errBody.slice(0, 200), results: [] });
    }

    const data2 = await resp2.json();
    res.status(200).json(data2);
  } catch (e) {
    res.status(500).json({ error: 'Failed to reach OpenStates: ' + e.message, results: [] });
  }
}
