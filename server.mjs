import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeDemo, InputError } from './lib/demo.mjs';
import { makeHermes } from './lib/hermes.mjs';
import { makeMedia, MAX_MEDIA_BYTES, byteRange } from './lib/media.mjs';
import { makeCodexUsage } from './lib/codex-usage.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.join(root, 'public');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };
export function createStudioServer({ port = 4317, runtime, media, usage } = {}) {
  if (!runtime) throw new Error('Se requiere un runtime explícito. El inicio normal usa Hermes real.');
  const demo = runtime;
  const streams = new Set();
  const server = http.createServer(async (req, res) => {
    const host = req.headers.host;
    const addressPort = server.address()?.port || port;
    if (![ `127.0.0.1:${addressPort}`, `localhost:${addressPort}` ].includes(host)) { res.writeHead(403); res.end('Host rechazado'); return; }
    const origin = req.headers.origin;
    if (origin && origin !== `http://${host}`) { res.writeHead(403); res.end('Origen rechazado'); return; }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    function json(status, data) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); }
    try {
      const url = new URL(req.url, `http://${host}`);
      if (req.method === 'GET' && url.pathname === '/api/health') return json(200, { ok: true, mode: demo.snapshot().mode, version: '0.4.0' });
      if (req.method === 'GET' && url.pathname === '/api/studio') return json(200, demo.snapshot());
      if (req.method === 'GET' && url.pathname === '/api/codex-usage') {
        if (!usage || demo.snapshot().mode !== 'real') return json(503, {error:'Uso de Codex no disponible.'});
        return json(200, await usage.get({force:url.searchParams.get('refresh')==='1'}));
      }
      if (req.method === 'GET' && url.pathname === '/api/media') return json(200, { items: media?.list() || [] });
      const mediaContent = url.pathname.match(/^\/api\/media\/([a-f0-9-]{36})\/content$/);
      if (mediaContent && ['GET','HEAD'].includes(req.method) && media) {
        const { item, bytes } = await media.content(mediaContent[1]);
        let range;
        try { range = byteRange(req.headers.range, bytes.length); }
        catch (error) { res.setHeader('Content-Range', `bytes */${bytes.length}`); throw error; }
        res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
        res.setHeader('Content-Type', item.mime);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Disposition', 'inline');
        if (range) {
          res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${bytes.length}`);
          res.setHeader('Content-Length', range.end - range.start + 1);
          res.writeHead(206);
          res.end(req.method === 'HEAD' ? undefined : bytes.subarray(range.start, range.end + 1));
        } else {
          res.setHeader('Content-Length', bytes.length);
          res.writeHead(200);
          res.end(req.method === 'HEAD' ? undefined : bytes);
        }
        return;
      }
      if (req.method === 'POST' && url.pathname === '/api/media' && media) {
        if (demo.snapshot().mode !== 'real') throw new InputError('La galería requiere Hermes real.', 409);
        if (Number(req.headers['content-length']) > MAX_MEDIA_BYTES) throw new InputError('El archivo supera 25 MB.', 413);
        const chunks = []; let size = 0;
        for await (const chunk of req) { size += chunk.length; if (size > MAX_MEDIA_BYTES) throw new InputError('El archivo supera 25 MB.', 413); chunks.push(chunk); }
        const asset = await media.upload({ bytes: Buffer.concat(chunks), agentId: url.searchParams.get('agentId'), title: url.searchParams.get('title') });
        demo.notifyArtifact?.(asset);
        return json(201, { asset });
      }
      if (req.method === 'GET' && url.pathname === '/api/events') {
        if (streams.size >= 20) return json(503, { error: 'Demasiadas conexiones al estudio.' });
        res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
        res.write('retry: 2000\n\n');
        const send = event => res.write(`id: ${event.id}\ndata: ${JSON.stringify(event)}\n\n`);
        const lastId = Number(req.headers['last-event-id']);
        if (Number.isSafeInteger(lastId) && lastId > 0) for (const event of demo.events) if (Number(event.id) > lastId) send(event);
        const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 15000);
        demo.listeners.add(send);
        streams.add(res);
        req.on('close', () => { clearInterval(heartbeat); demo.listeners.delete(send); streams.delete(res); });
        return;
      }
      if (req.method === 'POST' && url.pathname.startsWith('/api/')) {
        if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) throw new InputError('Usa Content-Type application/json.', 415);
        let body = '';
        for await (const chunk of req) {
          body += chunk;
          if (Buffer.byteLength(body) > 16384) throw new InputError('Cuerpo demasiado grande.', 413);
        }
        let input;
        try { input = JSON.parse(body); } catch { throw new InputError('JSON inválido.'); }
        if (url.pathname === '/api/messages') return json(200, await demo.message(input));
        if (demo.snapshot().mode === 'real') throw new InputError('Esta operación aún no está conectada a Hermes.', 409);
        if (url.pathname === '/api/tasks') return json(201, { task: demo.createTask(input), mode: 'demo' });
        if (url.pathname === '/api/requests') return json(201, demo.createRequest(input));
        const handoff = url.pathname.match(/^\/api\/requests\/([a-zA-Z0-9-]+)\/advance$/);
        if (handoff) return json(200, demo.advanceRequest(handoff[1]));
        const advance = url.pathname.match(/^\/api\/tasks\/([a-zA-Z0-9-]+)\/advance$/);
        if (advance) return json(200, { task: demo.advanceTask(advance[1]), mode: 'demo' });
        return json(404, { error: 'Ruta API no encontrada.' });
      }
      if (url.pathname.startsWith('/api/')) return json(404, { error: 'Ruta API no encontrada.' });
      if (!['GET', 'HEAD'].includes(req.method)) return json(405, { error: 'Método no permitido.' });
      const pathname = decodeURIComponent(url.pathname);
      const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
      const target = path.resolve(publicRoot, relative);
      // Restricción de archivos independiente de la normalización de URL, también en Windows.
      if (path.relative(publicRoot, target).startsWith('..') || path.isAbsolute(path.relative(publicRoot, target)) || relative.includes('\\') || relative.includes(':')) return json(403, { error: 'Ruta rechazada.' });
      const bytes = await readFile(target);
      res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream' });
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch (error) {
      const status = error instanceof InputError ? error.status : error.code === 'ENOENT' || error.code === 'EISDIR' ? 404 : error instanceof URIError ? 400 : 500;
      json(status, { error: status === 500 ? 'Error interno del estudio.' : error.message });
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.on('close', () => { for (const stream of streams) stream.end(); });
  return { server, demo, closeStreams: () => { for (const stream of streams) stream.end(); } };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.STUDIO_PORT || 4317);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('STUDIO_PORT debe estar entre 1024 y 65535.');
  const mode = process.env.STUDIO_MODE || 'real';
  if (!['real','demo'].includes(mode)) throw new Error('STUDIO_MODE debe ser real o demo.');
  const media = mode === 'real' ? await makeMedia({ root }) : null;
  const runtime = mode === 'real' ? await makeHermes({ root, media }) : makeDemo();
  const usage = mode === 'real' ? makeCodexUsage() : null;
  const { server, closeStreams } = createStudioServer({ port, runtime, media, usage });
  server.listen(port, '127.0.0.1', () => console.log(`Hermes Game Studio ${mode.toUpperCase()} · http://127.0.0.1:${port}\n${runtime.snapshot().notice}`));
  function stop() { closeStreams(); server.close(); }
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
}
