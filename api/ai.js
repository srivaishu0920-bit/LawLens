export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { source, title, id, desc } = req.body;
  if (!title) return res.status(400).json({ error: 'Missing title' });

  try {
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
        system: `You are a nonpartisan civic education assistant for LawLens, a civic engagement app. Your job is to summarize legislation in clear, plain language for everyday citizens.

IMPORTANT RULES:
- NEVER say you don't have access to the bill, can't find it, or need more information.
- NEVER tell the user to go check another website.
- ALWAYS provide a complete summary using the bill title, ID, description, and your general knowledge of the topic and legislative context.
- If the bill title and description make the subject clear (e.g. "Freedom to Carry" is about gun carry laws, "Educational Choice" is about school vouchers), summarize based on what such legislation typically contains and does.
- Be specific and informative, not vague.
- No political slant — present both sides fairly.

Format your response with these exact headers each on their own line:
Summary:
Who it affects:
Supporters say:
Critics say:
Current status:

Keep total response under 180 words.`,
        messages: [{
          role: 'user',
          content: `${source === 'federal' ? 'Federal' : 'State'} Bill: "${title}" (${id})\n\nDescription/Latest Action: ${desc}\n\nProvide a clear, informative summary.`
        }]
      })
    });

    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(500).json({ error: { message: 'AI service error: ' + e.message } });
  }
}
