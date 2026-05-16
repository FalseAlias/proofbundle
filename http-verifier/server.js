/**
 * ProofBundle HTTP Verifier v1.0.0
 * Stateless POST /verify endpoint wrapping the npm core.
 */

const http = require('http');
const { verify } = require('@proofbundle/core');

const PORT = process.env.PORT || 8080;
const MAX_BODY_BYTES = 1024 * 1024; // 1 MiB

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/verify') {
    return handleVerify(req, res);
  }
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', version: '1.0.0' }));
    return;
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

function handleVerify(req, res) {
  const chunks = [];
  let size = 0;

  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      res.writeHead(413, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Payload too large' }));
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });

  req.on('end', () => {
    try {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const result = verify(body.bundle, body.publicKey, body.context);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        valid: result.valid,
        canonical: result.canonical,
        signatureValid: result.signatureValid,
        timestamp: result.timestamp || null,
      }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });

  req.on('error', (err) => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  });
}

server.listen(PORT, () => {
  console.error(`[proofbundle-verifier] listening on :${PORT}`);
});
