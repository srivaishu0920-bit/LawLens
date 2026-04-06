export default async function handler(req, res) {
  const state = req.query.state;
  if (!state) return res.status(400).json({ error: 'Missing state parameter' });

  const apiKey = process.env.OPENSTATES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenStates API key not configured', results: [] });
  }

  try {
    // include=actions gives us latest action date/description for each bill
    const url = `https://v3.openstates.org/bills?jurisdiction=${state.toLowerCase()}&sort=updated_desc&per_page=20&include=actions`;
    const resp = await fetch(url, {
      headers: { 'X-API-KEY': apiKey }
    });
    if (!resp.ok) {
      const errBody = await resp.text();
      return res.status(resp.status).json({ error: 'OpenStates API returned ' + resp.status + ': ' + errBody.slice(0, 200), results: [] });
    }
    const data = await resp.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to reach OpenStates: ' + e.message, results: [] });
  }
}
