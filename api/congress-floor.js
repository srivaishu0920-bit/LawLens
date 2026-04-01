export default async function handler(req, res) {
  const chamber = req.query.chamber || 'house';
  let allActions = [];

  // Fetch recent bills sorted by latest action — 50 per chamber gives a rich feed
  const fetches = [];

  if (chamber === 'house' || chamber === 'all') {
    fetches.push(
      fetch(`https://api.congress.gov/v3/bill?sort=updateDate+desc&limit=50&api_key=${process.env.CONGRESS_API_KEY}`)
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(data => {
          (data.bills || []).forEach(b => {
            const bChamber = (b.originChamber || '').toLowerCase() === 'senate' ? 'senate' : 'house';
            if (chamber === 'all' || bChamber === chamber) {
              allActions.push({
                description: (b.title || '') + (b.latestAction ? ' — ' + b.latestAction.text : ''),
                actionDate: b.latestAction ? b.latestAction.actionDate : b.updateDate,
                updateDate: b.updateDate,
                _chamber: bChamber,
                _billId: (b.type || '') + ' ' + (b.number || ''),
                _billUrl: b.url || ''
              });
            }
          });
        })
        .catch(() => {})
    );
  }

  // If filtering by senate, also make a senate-specific call
  if (chamber === 'senate') {
    fetches.push(
      fetch(`https://api.congress.gov/v3/bill?sort=updateDate+desc&limit=50&api_key=${process.env.CONGRESS_API_KEY}`)
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(data => {
          (data.bills || []).forEach(b => {
            const bChamber = (b.originChamber || '').toLowerCase() === 'senate' ? 'senate' : 'house';
            if (bChamber === 'senate') {
              allActions.push({
                description: (b.title || '') + (b.latestAction ? ' — ' + b.latestAction.text : ''),
                actionDate: b.latestAction ? b.latestAction.actionDate : b.updateDate,
                updateDate: b.updateDate,
                _chamber: 'senate',
                _billId: (b.type || '') + ' ' + (b.number || ''),
                _billUrl: b.url || ''
              });
            }
          });
        })
        .catch(() => {})
    );
  }

  // Also try to fetch amendment activity for extra richness
  fetches.push(
    fetch(`https://api.congress.gov/v3/amendment?sort=updateDate+desc&limit=20&api_key=${process.env.CONGRESS_API_KEY}`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => {
        (data.amendments || []).forEach(a => {
          const aChamber = (a.chamber || '').toLowerCase() === 'senate' ? 'senate' : 'house';
          if (chamber === 'all' || aChamber === chamber) {
            allActions.push({
              description: (a.description || a.purpose || 'Amendment') + (a.latestAction ? ' — ' + a.latestAction.text : ''),
              actionDate: a.latestAction ? a.latestAction.actionDate : a.updateDate,
              updateDate: a.updateDate,
              _chamber: aChamber,
              _billId: (a.type || 'AMDT') + ' ' + (a.number || ''),
              _billUrl: a.url || '',
              _type: 'amendment'
            });
          }
        });
      })
      .catch(() => {})
  );

  await Promise.all(fetches);

  // Deduplicate by billId + description
  const seen = new Set();
  allActions = allActions.filter(a => {
    const key = (a._billId || '') + '|' + a.description;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by actionDate (actual legislative event), not updateDate (metadata refresh)
  allActions.sort((a, b) => new Date(b.actionDate || b.updateDate || 0) - new Date(a.actionDate || a.updateDate || 0));

  res.status(200).json({ floorActions: allActions.slice(0, 50) });
}
