export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { source, title, id, desc } = req.body;
  if (!title) return res.status(400).json({ error: 'Missing title' });

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: 'You are a nonpartisan civic education assistant inside LawLens. Summarize legislation in clear, plain language for everyday citizens. No political slant. Format your response with these exact headers each on their own line:\nSummary:\nWho it affects:\nSupporters say:\nCritics say:\nCurrent status:\n\nKeep total response under 180 words.',
      messages: [{
        role: 'user',
        content: `${source === 'federal' ? 'Federal' : 'State'} Bill: "${title}" (${id})\n\nDetails: ${desc}\n\nPlease summarize.`
      }]
    })
  });

  const data = await resp.json();
  res.status(resp.status).json(data);
}
