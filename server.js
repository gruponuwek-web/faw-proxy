const https = require('https');

const API_KEY = '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';
const PORT = process.env.PORT || 3000;

const http = require('http');

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/chat') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);

        const data = JSON.stringify({
          model: payload.model || 'claude-haiku-4-5-20251001',
          max_tokens: payload.max_tokens || 400,
          system: payload.system || '',
          messages: payload.messages || []
        });

        const options = {
          hostname: 'api.anthropic.com',
          path: '/v1/messages',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Length': Buffer.byteLength(data)
          }
        };

        const apiReq = https.request(options, apiRes => {
          let responseData = '';
          apiRes.on('data', chunk => responseData += chunk);
          apiRes.on('end', () => {
            res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(responseData);
          });
        });

        apiReq.on('error', err => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        });

        apiReq.write(data);
        apiReq.end();

      } catch(e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => console.log(`Proxy FAW corriendo en puerto ${PORT}`));
