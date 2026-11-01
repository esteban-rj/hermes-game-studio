import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createOfficeServer } from '../server.mjs';
import { findPath, walkable } from '../src/navigation.js';
import { AGENT_SPOTS, CABINET, OBSTACLES } from '../src/vector-room.js';

test('each agent, lounge, and cabinet are reachable without crossing furniture', () => {
  const start = { x: 500, y: 900 };
  const destinations = [...Object.values(AGENT_SPOTS), { x: 1320, y: 540 }, CABINET.approach];
  for (const destination of destinations) {
    const route = findPath(start, destination);
    assert.ok(route.length, `Unreachable: ${JSON.stringify(destination)}`);
    let previous = start;
    for (const next of route) {
      const distance = Math.hypot(next.x - previous.x, next.y - previous.y);
      for (let step = 0; step <= Math.ceil(distance / 4); step++) {
        const t = Math.min(1, step * 4 / (distance || 1));
        assert.ok(walkable(previous.x + (next.x - previous.x) * t, previous.y + (next.y - previous.y) * t), 'Route crossed furniture');
      }
      previous = next;
    }
  }
  for (const obstacle of OBSTACLES) assert.equal(findPath(start, { x: obstacle.x + obstacle.w / 2, y: obstacle.y + obstacle.h / 2 }).length, 0);
});

test('production server serves assets, proxies chat and streams events', async t => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'hermes-3d-test-'));
  await writeFile(path.join(directory, 'index.html'), '<title>Hermes 3D</title>');
  await writeFile(path.join(directory, 'app.js'), 'export const office = true;');
  const backend = http.createServer(async (req, res) => {
    if (req.url === '/api/events') {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.write('data: {"type":"run.started"}\n\n');
      setTimeout(() => res.end('data: {"type":"run.completed"}\n\n'), 25); return;
    }
    let body = ''; for await (const part of req) body += part;
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ method: req.method, path: req.url, body: body ? JSON.parse(body) : null }));
  });
  await new Promise(resolve => backend.listen(0, '127.0.0.1', resolve));
  const server = createOfficeServer({ directory, upstreamUrl: `http://127.0.0.1:${backend.address().port}` });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { server.closeAllConnections(); backend.closeAllConnections(); await Promise.all([new Promise(r => server.close(r)), new Promise(r => backend.close(r))]); assert.ok(path.resolve(directory).startsWith(path.resolve(os.tmpdir()) + path.sep)); await rm(directory, { recursive: true, force: true }); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(origin)).status, 200);
  assert.match(await (await fetch(origin + '/app.js')).text(), /export const office/);
  assert.equal((await fetch(origin + '/missing.js')).status, 404);
  assert.notEqual((await fetch(origin + '/..%5cpackage.json')).status, 200);
  const message = { agentId: 'atlas', projectId: 'studio', message: 'Test message' };
  const result = await (await fetch(origin + '/api/messages', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(message) })).json();
  assert.deepEqual(result, { method: 'POST', path: '/api/messages', body: message });
  assert.equal((await fetch(origin + '/api/messages', { method: 'POST', headers: { origin: 'https://unrelated.example' } })).status, 403);
  const events = await fetch(origin + '/api/events');
  assert.match(events.headers.get('content-type'), /text\/event-stream/);
  const reader = events.body.getReader();
  const first = await reader.read(); assert.match(new TextDecoder().decode(first.value), /run.started/);
  let rest = ''; for (;;) { const part = await reader.read(); if (part.done) break; rest += new TextDecoder().decode(part.value); }
  assert.match(rest, /run.completed/);
});

test('the proxy refuses remote backends', () => {
  assert.throws(() => createOfficeServer({ upstreamUrl: 'https://example.com' }), /local HTTP/);
});
