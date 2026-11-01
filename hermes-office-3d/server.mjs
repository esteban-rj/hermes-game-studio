import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export function createOfficeServer({ directory = fileURLToPath(new URL('./dist/', import.meta.url)), upstreamUrl = process.env.HERMES_STUDIO_URL || 'http://127.0.0.1:4317' } = {}) {
const root = path.resolve(directory);
const upstream = new URL(upstreamUrl);
if (upstream.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(upstream.hostname)) {
  throw new Error('HERMES_STUDIO_URL must use a local HTTP address.');
}
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.map': 'application/json' };
const server = http.createServer(async (req, res) => {
  // Keep the existing backend as the only owner of conversations, files and voice.
  if (req.url.startsWith('/api/')) {
    const origin = req.headers.origin;
    const port = server.address().port;
    if (origin && ![`http://127.0.0.1:${port}`, `http://localhost:${port}`].includes(origin)) {
      res.writeHead(403).end('Origin not allowed'); return;
    }
    const headers = { ...req.headers, host: upstream.host };
    if (origin) headers.origin = upstream.origin;
    const request = http.request(new URL(req.url, upstream), { method: req.method, headers }, response => {
      res.writeHead(response.statusCode, { ...response.headers, 'cache-control': 'no-store' });
      res.flushHeaders(); response.pipe(res);
    });
    request.on('error', () => {
      if (!res.headersSent) res.writeHead(503, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'El estudio Hermes no está disponible en ' + upstream.origin }));
    });
    res.on('close', () => request.destroy());
    req.pipe(request); return;
  }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const filename = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!filename.startsWith(root + path.sep) && filename !== path.join(root, 'index.html')) {
      res.writeHead(403).end(); return;
    }
    const info = await stat(filename);
    if (!info.isFile()) throw new Error('Not a file');
    res.writeHead(200, { 'content-type': types[path.extname(filename)] || 'application/octet-stream', 'content-length': info.size, 'x-content-type-options': 'nosniff' });
    createReadStream(filename).pipe(res);
  } catch { res.writeHead(404).end('Not found'); }
});
return server;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createOfficeServer();
  server.listen(Number(process.env.PORT || 4318), '127.0.0.1', () => console.log(`Hermes 3D: http://127.0.0.1:${server.address().port}/`));
}
