export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { template, params } = req.body;
  if (!template || !params) return res.status(400).json({ error: 'Missing template or params' });

  const templateId = template === 'welcome'
    ? process.env.EMAILJS_TEMPLATE_WELCOME
    : process.env.EMAILJS_TEMPLATE_STATUS;

  const resp = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: templateId,
      user_id: process.env.EMAILJS_USER_ID,
      template_params: params
    })
  });

  const text = await resp.text();
  res.status(resp.status).json({ result: text });
}
