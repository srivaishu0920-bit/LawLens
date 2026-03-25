export default async function handler(req, res) {
  const chamber = req.query.chamber || 'house';
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  // Try today first, then yesterday if no results
  const dates = [dateStr];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  dates.push(yesterday.toISOString().split('T')[0]);

  // Also try the most recent weekdays (Congress doesn't usually meet on weekends)
  for (let i = 2; i <= 5; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  let allActions = [];

  for (const date of dates) {
    if (allActions.length >= 30) break;
    try {
      const url = `https://api.congress.gov/v3/daily-congressional-record/${date}?api_key=${process.env.CONGRESS_API_KEY}`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        if (data.dailyCongressionalRecord) {
          const sections = data.dailyCongressionalRecord;
          // Extract items
          if (Array.isArray(sections)) {
            sections.forEach(s => {
              if (s.fullIssue || s.articles) {
                allActions.push({
                  description: s.title || s.description || 'Congressional Record entry',
                  actionDate: date,
                  updateDate: date,
                  _chamber: chamber
                });
              }
            });
          }
        }
      }
    } catch (e) { /* continue */ }

    // Also try the bill actions endpoint for recent activity
    try {
      const url = `https://api.congress.gov/v3/bill?sort=updateDate+desc&limit=15&api_key=${process.env.CONGRESS_API_KEY}`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        const bills = data.bills || [];
        bills.forEach(b => {
          const bChamber = (b.originChamber || '').toLowerCase() === 'senate' ? 'senate' : 'house';
          if (chamber === bChamber || chamber === 'all') {
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
      }
    } catch (e) { /* continue */ }

    break; // Only need one pass for bills
  }

  // Deduplicate by description
  const seen = new Set();
  allActions = allActions.filter(a => {
    const key = a.description;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by date descending
  allActions.sort((a, b) => new Date(b.updateDate || b.actionDate || 0) - new Date(a.updateDate || a.actionDate || 0));

  res.status(200).json({ floorActions: allActions.slice(0, 30) });
}
