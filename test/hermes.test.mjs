import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { makeHermes, runHermesProcess } from '../lib/hermes.mjs';
import { resolveModel } from '../scripts/resolve-model.mjs';
import { createStudioServer } from '../server.mjs';
import { once } from 'node:events';
import { makeMedia } from '../lib/media.mjs';

async function fixture(runProcess) {
  const root = await mkdtemp(path.join(tmpdir(), 'studio-hermes-'));
  const installation = { installationComplete: true, authenticationVerified: true, executable: process.execPath, home: path.join(root, 'home') };
  for (const agent of ['atlas','pixel','prisma','ux','nodo','lupa']) {
    const directory = path.join(installation.home, 'profiles', `studio-${agent}`);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, 'config.yaml'), `agent:\n  run_budget_seconds: 90\nmodel:\n  provider: openai-codex\n  default: ${resolveModel({ agent }).model}\nfallback_providers: []\n`);
  }
  return { root, installation, runProcess };
}
const input = (agentId, clientMessageId, message = 'Mensaje de prueba') => ({ agentId, clientMessageId, message, projectId: 'studio' });

test('el resultado gráfico de Hermes llega al historial, la galería y el evento sin duplicarse', async () => {
  const fence = String.fromCharCode(96).repeat(3);
  const options = await fixture(async () => ({ session_id:'graphic-session', text:'Composición lista.\n'+fence+'studio-media\n'+JSON.stringify({title:'Resultado vectorial',elements:[{type:'circle',cx:100,cy:100,r:40,fill:'#aacc99'}]})+'\n'+fence, tokens:{total:3} }));
  const media = await makeMedia({root:options.root});
  const runtime = await makeHermes({...options,media});
  const response = await runtime.message(input('prisma','graphic-message'));
  assert.equal(response.media.length,1);assert.equal(response.reply,'Composición lista.');
  assert.equal(runtime.snapshot().conversations.prisma.messages.at(-1).media[0].id,response.media[0].id);
  assert.equal(runtime.events.find(event=>event.type==='artifact.created').data.asset.id,response.media[0].id);
  await runtime.message(input('prisma','graphic-message'));
  assert.equal(media.list().length,1);
});

test('Hermes conserva sesiones y conversaciones por agente y reinicio', async () => {
  const calls = [];
  const options = await fixture(async call => {
    calls.push(call);
    return { session_id: call.sessionId || `session-${call.profile}`, text: 'Respuesta del runtime fixture', tokens: { total: 12 } };
  });
  const runtime = await makeHermes(options);
  await runtime.message(input('atlas','first-atlas'));
  await runtime.message(input('atlas','second-atlas'));
  await runtime.message(input('pixel','first-pixel'));
  assert.equal(calls[0].sessionId, null);
  assert.equal(calls[1].sessionId, 'session-studio-atlas');
  assert.equal(calls[2].sessionId, null);
  assert.equal(calls[0].route.model, 'gpt-6.1-sol');
  assert.match(calls[0].message, /projectId=studio/);
  const restored = await makeHermes(options);
  assert.equal(restored.snapshot().conversations.atlas.messages.length, 4);
  assert.equal(restored.snapshot().mode, 'real');
  assert.equal(restored.snapshot().tasks.length, 0);
  await assert.rejects(runtime.message({ ...input('pixel','wrong-project'), projectId: 'juego-a' }), /aún no/);
});

test('un solo turno, deduplicación y error sin respuesta simulada', async () => {
  let release;
  let count = 0;
  const options = await fixture(() => { count++; return new Promise(resolve => { release = resolve; }); });
  const runtime = await makeHermes(options);
  const first = runtime.message(input('nodo','duplicate-key'));
  const duplicate = runtime.message(input('nodo','duplicate-key'));
  await assert.rejects(runtime.message(input('pixel','concurrent-key')), /Otro agente/);
  await assert.rejects(runtime.message(input('nodo','duplicate-key','Distinto')), /otro mensaje/);
  while (!release) await new Promise(resolve => setTimeout(resolve, 1));
  release({ session_id: 'one-session', text: 'Única ejecución', tokens: {} });
  assert.equal((await first).reply, (await duplicate).reply);
  assert.equal(count, 1);
  const failed = await makeHermes({ ...options, runProcess: async () => { throw new Error('Cuota agotada'); } });
  await assert.rejects(failed.message(input('pixel','failure-key')), /Cuota agotada/);
  assert.equal(failed.snapshot().conversations.pixel.messages.at(-1).who, 'system');
  assert.equal(failed.snapshot().conversations.pixel.verified, false);
  assert.equal(failed.snapshot().busy, null);
});

test('protocolo oficial JSONL: stdin literal, modelo fijado y sesión retomada', async () => {
  const prompt = 'Texto con $(literal), comillas y `texto`';
  const route = resolveModel({ agent: 'nodo' });
  let actualInput = '';
  const frames = [];
  const result = await runHermesProcess({ executable: 'fixture', home: 'private-home', profile: 'studio-nodo', cwd: '.', route, message: prompt, sessionId: 'existing-session', onFrame: frame => frames.push(frame),
    spawnProcess(executable, args, options) {
      assert.equal(options.shell, false);
      assert.equal(options.windowsHide, true);
      assert.ok(args.includes('gpt-6-luna'));
      assert.ok(args.includes('existing-session'));
      assert.ok(!args.includes(prompt));
      assert.equal(options.env.OPENAI_API_KEY, undefined);
      const child = new EventEmitter();
      child.stdin = new PassThrough(); child.stdout = new PassThrough(); child.stderr = new PassThrough(); child.kill = () => {};
      child.stdin.on('data', data => { actualInput += data; });
      child.stdin.on('finish', () => {
        child.stdout.write('Diagnóstico humano ignorado\n');
        child.stdout.write(JSON.stringify({ type: 'text', text: 'Respuesta' }) + '\n');
        child.stdout.end(JSON.stringify({ type: 'result', session_id: 'existing-session', exit_code: 0, text: 'Respuesta', tokens: { total: 9 } }) + '\n');
        setImmediate(() => child.emit('close', 0));
      });
      return child;
    }
  });
  assert.equal(actualInput, prompt);
  assert.equal(result.text, 'Respuesta');
  assert.equal(frames[0].type, 'text');
});

test('HTTP real espera el resultado del runtime y rechaza controles simulados', async () => {
  assert.throws(() => createStudioServer(), /runtime explícito/);
  const options = await fixture(async () => ({ session_id: 'http-session', text: 'Resultado fixture del runtime', tokens: { total: 3 } }));
  const runtime = await makeHermes(options);
  const { server } = createStudioServer({ port: 0, runtime });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const post = (route, value) => fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
    assert.equal((await (await fetch(base + '/api/health')).json()).mode, 'real');
    const response = await post('/api/messages', input('atlas','http-message'));
    const result = await response.json();
    assert.equal(result.mode, 'real');
    assert.equal(result.reply, 'Resultado fixture del runtime');
    assert.equal(result.model, 'gpt-6.1-sol');
    assert.equal((await post('/api/tasks', { agentId: 'atlas', projectId: 'studio', title: 'Sin simulación' })).status, 409);
    assert.equal((await post('/api/requests', { description: 'Sin simulación' })).status, 409);
    const snapshot = await (await fetch(base + '/api/studio')).json();
    assert.equal(snapshot.agents[0].accessVerified, true);
    assert.ok(!JSON.stringify(snapshot).includes(options.installation.executable));
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
