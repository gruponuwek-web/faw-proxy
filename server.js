const https = require('https');
const http = require('http');

const API_KEY = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
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

        // Convert Anthropic format to OpenAI format
        const messages = [];
        if (payload.system) {
          messages.push({ role: 'system', content: payload.system });
        }
        (payload.messages || []).forEach(m => {
          messages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content });
        });

        const data = JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: payload.max_tokens || 400,
          messages: messages
        });

        const options = {
          hostname: 'api.openai.com',
          path: '/v1/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Length': Buffer.byteLength(data)
          }
        };

        const apiReq = https.request(options, apiRes => {
          let responseData = '';
          apiRes.on('data', chunk => responseData += chunk);
          apiRes.on('end', () => {
            try {
              const openaiResponse = JSON.parse(responseData);
              // Convert OpenAI response to Anthropic format
              const anthropicFormat = {
                content: [{
                  type: 'text',
                  text: openaiResponse.choices?.[0]?.message?.content || '...'
                }]
              };
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(anthropicFormat));
            } catch(e) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Parse error' }));
            }
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

server.listen(PORT, () => console.log(`Proxy FAW (OpenAI) corriendo en puerto ${PORT}`));
