export default async function handler(req, res) {
  const zip = req.query.zip;
  if (!zip || !/^\d{5}$/.test(zip)) {
    return res.status(400).json({ error: 'Missing or invalid ZIP code' });
  }

  try {
    // Use OpenDataSoft USPS ZIP code dataset — returns the official USPS city name
    const url = `https://data.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-united-states-of-america-zc-point@public/records?where=zip_code%3D%22${zip}%22&limit=1`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('OpenDataSoft API error ' + resp.status);
    const data = await resp.json();

    if (!data.results || !data.results.length) {
      return res.status(404).json({ error: 'ZIP code not found' });
    }

    const r = data.results[0];
    res.status(200).json({
      city: r.usps_city || '',
      stateAbbr: r.stusps_code || '',
      stateFull: r.ste_name || '',
      county: r.primary_coty_name || '',
      zip: zip
    });
  } catch (e) {
    res.status(500).json({ error: 'Geocoding failed' });
  }
}
