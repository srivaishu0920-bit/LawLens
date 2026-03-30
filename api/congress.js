export default async function handler(req, res) {
  try {
    const url = `https://api.congress.gov/v3/bill?sort=updateDate+desc&limit=30&api_key=${process.env.CONGRESS_API_KEY}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      return res.status(resp.status).json({ error: 'Congress.gov API returned ' + resp.status, bills: [] });
    }
    const data = await resp.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to reach Congress.gov', bills: [] });
  }
}
