export default async function handler(req, res) {
  const state = req.query.state;
  if (!state) return res.status(400).json({ error: 'Missing state parameter' });

  try {
    const url = `https://v3.openstates.org/bills?jurisdiction=${state.toLowerCase()}&sort=updated_desc&per_page=30`;
    const resp = await fetch(url, {
      headers: { 'X-API-KEY': process.env.OPENSTATES_API_KEY }
    });
    if (!resp.ok) {
      return res.status(resp.status).json({ error: 'OpenStates API returned ' + resp.status, results: [] });
    }
    const data = await resp.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to reach OpenStates', results: [] });
  }
}
