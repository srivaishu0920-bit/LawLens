export default async function handler(req, res) {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Congress API key not configured', bills: [] });
  }

  try {
    // Only fetch bills from the current 119th Congress (2025-2026)
    const url = `https://api.congress.gov/v3/bill/119?sort=updateDate+desc&limit=30&format=json&api_key=${apiKey}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const errBody = await resp.text();
      return res.status(resp.status).json({ error: 'Congress.gov API returned ' + resp.status + ': ' + errBody.slice(0, 200), bills: [] });
    }
    const data = await resp.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to reach Congress.gov: ' + e.message, bills: [] });
  }
}
