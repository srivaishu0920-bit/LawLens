export default async function handler(req, res) {
  const state = req.query.state;
  if (!state) return res.status(400).json({ error: 'Missing state parameter' });

  const url = `https://v3.openstates.org/bills?jurisdiction=${state.toLowerCase()}&sort=updated_desc&per_page=30`;
  const resp = await fetch(url, {
    headers: { 'X-API-KEY': process.env.OPENSTATES_API_KEY }
  });
  const data = await resp.json();
  res.status(resp.status).json(data);
}
