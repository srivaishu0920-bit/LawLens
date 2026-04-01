export default async function handler(req, res) {
  const lat = req.query.lat;
  const lng = req.query.lng;
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Missing lat/lng parameters' });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_CIVIC_API_KEY}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Google Geocoding API error ' + resp.status);
    const data = await resp.json();

    if (data.status !== 'OK' || !data.results || !data.results.length) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const result = data.results[0];
    const components = result.address_components || [];

    let city = '';
    let stateAbbr = '';
    let stateFull = '';
    let zip = '';

    for (const c of components) {
      if (c.types.includes('locality')) {
        city = c.long_name;
      }
      if (!city && (c.types.includes('sublocality') || c.types.includes('neighborhood'))) {
        city = c.long_name;
      }
      if (c.types.includes('administrative_area_level_1')) {
        stateAbbr = c.short_name;
        stateFull = c.long_name;
      }
      if (c.types.includes('postal_code')) {
        zip = c.long_name;
      }
    }

    // If still no city, try the second result which is often more general
    if (!city && data.results.length > 1) {
      for (const r of data.results) {
        for (const c of (r.address_components || [])) {
          if (c.types.includes('locality')) {
            city = c.long_name;
            break;
          }
        }
        if (city) break;
      }
    }

    res.status(200).json({
      city: city,
      stateAbbr: stateAbbr,
      stateFull: stateFull,
      zip: zip,
      formattedAddress: result.formatted_address || ''
    });
  } catch (e) {
    res.status(500).json({ error: 'Reverse geocoding failed' });
  }
}
