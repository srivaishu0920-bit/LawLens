export default async function handler(req, res) {
  const zip = req.query.zip;
  if (!zip || !/^\d{5}$/.test(zip)) {
    return res.status(400).json({ error: 'Missing or invalid ZIP code' });
  }

  try {
    // Use Google Geocoding API for accurate city names
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${zip}&components=country:US&key=${process.env.GOOGLE_CIVIC_API_KEY}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Google Geocoding API error ' + resp.status);
    const data = await resp.json();

    if (data.status !== 'OK' || !data.results || !data.results.length) {
      return res.status(404).json({ error: 'ZIP code not found' });
    }

    const result = data.results[0];
    const components = result.address_components || [];

    // Extract city (locality), state, and coordinates
    let city = '';
    let stateAbbr = '';
    let stateFull = '';

    for (const c of components) {
      if (c.types.includes('locality')) {
        city = c.long_name;
      }
      // Some ZIPs don't have locality — fall back to sublocality or neighborhood
      if (!city && (c.types.includes('sublocality') || c.types.includes('neighborhood'))) {
        city = c.long_name;
      }
      if (c.types.includes('administrative_area_level_1')) {
        stateAbbr = c.short_name;
        stateFull = c.long_name;
      }
    }

    // If still no city, try the formatted address
    if (!city && result.formatted_address) {
      // "Apex, NC 27523, USA" → "Apex"
      city = result.formatted_address.split(',')[0] || '';
    }

    const loc = result.geometry && result.geometry.location;

    res.status(200).json({
      city: city,
      stateAbbr: stateAbbr,
      stateFull: stateFull,
      lat: loc ? loc.lat : null,
      lng: loc ? loc.lng : null,
      formattedAddress: result.formatted_address || ''
    });
  } catch (e) {
    res.status(500).json({ error: 'Geocoding failed' });
  }
}
