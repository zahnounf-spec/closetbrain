const https = require('https');

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) { res.status(500).json({ error: { message: 'API key niet geconfigureerd op server.' } }); return; }

  const payload = Buffer.from(JSON.stringify(req.body));

  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length,
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01'
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', chunk => data += chunk);
    proxyRes.on('end', () => {
      res.status(proxyRes.statusCode).json(JSON.parse(data));
    });
  });

  proxyReq.on('error', (e) => {
    res.status(500).json({ error: { message: e.message } });
  });

  proxyReq.write(payload);
  proxyReq.end();
}
