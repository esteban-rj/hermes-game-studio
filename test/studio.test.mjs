import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import http from 'node:http';
import { makeDemo } from '../lib/demo.mjs';
import { createStudioServer } from '../server.mjs';

test('las tareas conservan proyecto, autor y estados; no completan trabajo real', () => {
  const demo = makeDemo();
  const task = demo.createTask({ agentId: 'pixel', projectId: 'juego-b', title: 'Revisar criterio' });
  assert.equal(task.status, 'assigned');
  assert.equal(demo.advanceTask(task.id).status, 'running');
  assert.equal(demo.advanceTask(task.id).status, 'review');
  assert.equal(demo.advanceTask(task.id).status, 'done');
  assert.throws(() => demo.advanceTask(task.id), /terminó/);
  const event = demo.events.at(-1);
  assert.equal(event.mode, 'demo');
  assert.equal(event.projectId, 'juego-b');
  assert.equal(event.agentId, 'pixel');
  assert.match(event.data.task.summary, /no representa trabajo ejecutado/);
});
test('entradas inválidas no crean tareas ni eventos', () => {
  const demo = makeDemo();
  const count = demo.snapshot().tasks.length;
  for (const input of [null, [], {}, { agentId: 'pixel', projectId: '../otro', title: 'x' }, { agentId: 'pixel', projectId: 'studio', title: '' }, { agentId: 'pixel', projectId: 'studio', title: 'x'.repeat(161) }]) assert.throws(() => demo.createTask(input));
  assert.equal(demo.snapshot().tasks.length, count);
  assert.equal(demo.events.length, 0);
});
test('conversación demo explícita, acotada y sin almacenar el prompt', () => {
  const demo = makeDemo();
  const result = demo.message({ agentId: 'prisma', projectId: 'juego-a', message: 'mensaje privado de prueba' });
  assert.equal(result.mode, 'demo');
  assert.match(result.reply, /predefinida/);
  assert.equal(JSON.stringify(demo.events).includes('mensaje privado de prueba'), false);
  assert.throws(() => demo.message({ agentId: 'prisma', projectId: 'studio', message: 'x'.repeat(4001) }));
});
test('UX conserva una petición y sus criterios a través de cinco traspasos dependientes', () => {
  const demo = makeDemo();
  const original = { projectId: 'juego-b', description: 'Mejorar la claridad del botón de continuar', acceptanceCriteria: ['El botón explica qué partida continúa.'] };
  const chain = demo.createRequest(original);
  assert.deepEqual(chain.tasks.map(t => t.agentId), ['ux', 'atlas', 'pixel', 'lupa', 'ux']);
  assert.deepEqual(chain.tasks.map(t => t.status), ['assigned', 'proposed', 'proposed', 'proposed', 'proposed']);
  assert.throws(() => demo.advanceTask(chain.tasks[2].id), /cadena UX/);
  for (let i = 0; i < 5; i++) {
    const result = demo.advanceRequest(chain.request.id);
    assert.equal(result.request.description, original.description);
    assert.deepEqual(result.request.acceptanceCriteria, original.acceptanceCriteria);
    assert.equal(result.tasks[i].status, 'done');
    assert.match(result.tasks[i].evidence[0], /No hay código/);
    assert.equal(result.tasks[i].projectId, 'juego-b');
    if (i < 4) assert.equal(result.tasks[i + 1].status, 'assigned');
  }
  assert.equal(demo.snapshot().requests[0].status, 'done');
  assert.throws(() => demo.advanceRequest(chain.request.id), /terminó/);
  assert.equal(demo.events.at(-1).agentId, 'nodo');
});
test('HTTP: UI, seguridad local, errores, tareas y eventos SSE', async () => {
  const { server, closeStreams } = createStudioServer({ port: 0 });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  const controller = new AbortController();
  try {
    assert.equal((await fetch(base)).status, 200);
    const studio = await (await fetch(`${base}/api/studio`)).json();
    assert.equal(studio.mode, 'demo');
    assert.deepEqual(studio.capabilities, { hermes: false, codex: false, voice: false });
    assert.equal((await fetch(`${base}/api/studio`, { headers: { Origin: 'https://example.invalid' } })).status, 403);
    const badHost = await new Promise((resolve, reject) => {
      const request = http.get(`${base}/api/studio`, { headers: { Host: 'attacker.invalid' } }, response => { response.resume(); resolve(response.statusCode); });
      request.on('error', reject);
    });
    assert.equal(badHost, 403);
    assert.equal((await fetch(`${base}/config/projects.example.json`)).status, 404);
    assert.equal((await fetch(`${base}/%2e%2e%5cserver.mjs`)).status, 403);
    assert.equal((await fetch(`${base}/api/tasks`, { method: 'POST', body: '{}' })).status, 415);
    const post = (route, value) => fetch(`${base}${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
    assert.equal((await post('/api/tasks', {})).status, 400);
    const stream = await fetch(`${base}/api/events`, { signal: controller.signal });
    const reader = stream.body.getReader();
    await reader.read();
    const created = await post('/api/tasks', { agentId: 'pixel', projectId: 'studio', title: 'Flujo integrado' });
    assert.equal(created.status, 201);
    const { task } = await created.json();
    const packet = new TextDecoder().decode((await reader.read()).value);
    assert.match(packet, /task.created/);
    assert.match(packet, new RegExp(task.id));
    const updated = await (await post(`/api/tasks/${task.id}/advance`, {})).json();
    assert.equal(updated.task.status, 'running');
    assert.equal((await post('/api/tasks/missing/advance', {})).status, 404);
    const message = await (await post('/api/messages', { agentId: 'atlas', projectId: 'studio', message: 'Hola' })).json();
    assert.match(message.reply, /DEMO/);
  } finally {
    controller.abort();
    closeStreams();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
