export default async function handler(req, res) {
  const address = req.query.address;
  if (!address) return res.status(400).json({ error: 'Missing address parameter' });

  const url = `https://www.googleapis.com/civicinfo/v2/representatives?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_CIVIC_API_KEY}`;
  const resp = await fetch(url);
  const data = await resp.json();
  res.status(resp.status).json(data);
}
