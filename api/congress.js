export default async function handler(req, res) {
  const url = `https://api.congress.gov/v3/bill?sort=updateDate+desc&limit=30&api_key=${process.env.CONGRESS_API_KEY}`;
  const resp = await fetch(url);
  const data = await resp.json();
  res.status(resp.status).json(data);
}
