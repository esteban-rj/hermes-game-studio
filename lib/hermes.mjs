import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { access, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { agents, InputError, validateTarget } from './demo.mjs';
import { resolveModel } from '../scripts/resolve-model.mjs';
import { TV_INSTRUCTIONS } from './media.mjs';

const sessionPattern = /^[a-zA-Z0-9_-]{1,160}$/;
function safeError(value) {
  return String(value || 'Hermes no devolvió una respuesta completa.')
    .replace(/(?:sk-[\w-]+|eyJ[\w.-]+|Bearer\s+\S+)/gi, '[credencial omitida]')
    .replace(/[A-Z]:[\\/][^\r\n]+/gi, '[ruta local]')
    .slice(0, 500);
}

// Protocolo JSONL oficial de Hermes, no análisis de logs humanos.
export function runHermesProcess({ executable, home, profile, cwd, route, message, sessionId, onFrame, timeoutMs = 180000, spawnProcess = spawn }) {
  return new Promise((resolve, reject) => {
    const args = ['-p', profile, 'chat', '--query-file', '-', '--oneshot', '--format', 'stream-json',
      '--provider', route.provider, '--model', route.model, '--reasoning', route.reasoningEffort,
      '--toolsets', 'todo,memory', '--max-turns', '4'];
    if (sessionId) {
      if (!sessionPattern.test(sessionId)) return reject(new InputError('Sesión Hermes inválida.', 409));
      args.push('--resume', sessionId);
    }
    const env = { ...process.env, HERMES_HOME: home, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' };
    // La ruta se fija a OAuth; no heredamos llaves API ni overrides de otros clientes.
    for (const key of ['OPENAI_API_KEY','CODEX_API_KEY','OPENAI_BASE_URL','HERMES_INFERENCE_MODEL','HERMES_YOLO_MODE','HERMES_IGNORE_RULES','HERMES_IGNORE_USER_CONFIG','HERMES_TUI_GATEWAY_URL']) delete env[key];
    let result;
    let settled = false;
    let bytes = 0;
    const child = spawnProcess(executable, args, { cwd, env, windowsHide: true, shell: false, stdio: ['pipe','pipe','pipe'] });
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      lines.close();
      if (error) reject(error); else resolve(value);
    };
    const timer = setTimeout(() => {
      child.kill();
      finish(new InputError('Se perdió la espera de Hermes. No se reintentó la petición. El turno nativo puede seguir hasta su límite de 90 segundos.', 504));
    }, timeoutMs);
    const lines = createInterface({ input: child.stdout });
    child.stderr.on('data', () => {}); // Diagnósticos privados: nunca se reenvían al navegador.
    child.on('error', () => finish(new InputError('No se pudo iniciar el ejecutable local de Hermes.', 503)));
    child.stdin.on('error', () => {});
    lines.on('line', line => {
      bytes += Buffer.byteLength(line);
      if (bytes > 2 * 1024 * 1024) { child.kill(); finish(new InputError('La salida de Hermes superó el límite de esta conversación.', 502)); return; }
      let frame;
      try { frame = JSON.parse(line); } catch { return; }
      if (frame.type === 'system' && frame.model && frame.model !== route.model) {
        child.kill(); finish(new InputError('Hermes anunció un modelo distinto del autorizado.', 502)); return;
      }
      if (['text','tool_use','tool_result','system'].includes(frame.type)) onFrame?.(frame);
      if (frame.type === 'result') result = frame;
    });
    child.on('close', code => {
      if (code !== 0 || !result || result.exit_code !== 0 || !result.text?.trim()) {
        const error = new InputError(safeError(result?.error || 'Hermes no completó el turno. Comprueba la autenticación, cuota y disponibilidad del modelo. No se generó una respuesta de sustitución.'), 502);
        if (sessionPattern.test(result?.session_id || '')) error.sessionId = result.session_id;
        finish(error);
      } else if (!sessionPattern.test(result.session_id || '')) {
        finish(new InputError('Hermes respondió sin identificador de sesión válido.', 502));
      } else finish(null, result);
    });
    child.stdin.end(message, 'utf8');
  });
}

export async function makeHermes({ root, runProcess = runHermesProcess, installation, storePath, media } = {}) {
  const install = installation || JSON.parse(await readFile(path.join(root, '.runtime/hermes-install.local.json'), 'utf8'));
  if (!install.installationComplete || !install.authenticationVerified) throw new Error('Instala y autentica Hermes antes de iniciar la oficina real.');
  await access(install.executable);
  const storeFile = storePath || path.join(root, '.runtime/hermes-office/conversations.local.json');
  let conversations = {};
  try { conversations = JSON.parse(await readFile(storeFile, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw new Error('No se pudo leer el historial local; se conserva sin sobrescribirlo.'); }
  const listeners = new Set();
  const events = [];
  const requests = new Map();
  const statuses = new Map();
  let sequence = 0;
  let busy = null;
  async function persist() {
    await mkdir(path.dirname(storeFile), { recursive: true });
    const temporary = `${storeFile}.${randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify(conversations), { mode: 0o600 });
    await rename(temporary, storeFile);
  }
  function emit(type, data, extra = {}) {
    const event = { schemaVersion: 1, id: String(++sequence), timestamp: new Date().toISOString(), type, mode: 'real', data, ...extra };
    events.push(event);
    if (events.length > 100) events.shift();
    for (const listener of listeners) listener(event);
    return event;
  }
  for (const agent of agents) {
    const config = await readFile(path.join(install.home, 'profiles', `studio-${agent.id}`, 'config.yaml'), 'utf8');
    const approved = new Set(['gpt-6-luna','gpt-6.1-terra','gpt-6.1-sol']);
    for (const match of config.matchAll(/^\s*(?:default|model):\s*["']?([^\s"'#]+)["']?\s*$/gm)) {
      if (!approved.has(match[1])) throw new Error(`Modelo no autorizado en el perfil ${agent.id}.`);
    }
    if (!/^fallback_providers:\s*\[\]\s*$/m.test(config) || !/run_budget_seconds:\s*90\b/.test(config)) throw new Error(`Revisa límites y fallback del perfil ${agent.id}.`);
    for (const match of config.matchAll(/^\s*provider:\s*["']?([^\s"'#]+)["']?\s*$/gm)) {
      if (match[1] !== 'openai-codex') throw new Error(`Proveedor no autorizado en ${agent.id}.`);
    }
  }
  function snapshot() {
    return { schemaVersion: 1, mode: 'real', notice: 'Conversaciones reales con Hermes y tu suscripción. Historial local por agente. Voz y ejecución de código pendientes.',
      agents: agents.map(agent => ({ ...agent, ...resolveModel({ agent: agent.id }), status: statuses.get(agent.id) || 'idle', accessVerified: Boolean(conversations[agent.id]?.verified), verified: Boolean(conversations[agent.id]?.verified) })),
      projects: [{ id: 'studio', name: 'El estudio · Hermes' }], tasks: [], requests: [], conversations: structuredClone(conversations), busy, media: media?.list() || [],
      capabilities: { hermes: true, codex: false, voice: false, conversations: true, tasks: false, media: Boolean(media) } };
  }
  async function message(input) {
    validateTarget(input);
    if (input.projectId !== 'studio') throw new InputError('Este proyecto aún no tiene un perfil conectado a la oficina.', 409);
    if (typeof input.message !== 'string' || !input.message.trim() || input.message.length > 4000) throw new InputError('El mensaje debe contener entre 1 y 4000 caracteres.');
    if (typeof input.clientMessageId !== 'string' || !/^[a-zA-Z0-9_-]{8,100}$/.test(input.clientMessageId)) throw new InputError('Se requiere un identificador de mensaje válido.');
    const identity = JSON.stringify([input.agentId,input.projectId,input.message]);
    const previous = requests.get(input.clientMessageId);
    if (previous) {
      if (previous.identity !== identity) throw new InputError('El identificador ya pertenece a otro mensaje.', 409);
      return previous.promise;
    }
    if (busy) throw new InputError('Otro agente está respondiendo. Espera a que termine para usar la misma suscripción.', 409);
    if (requests.size >= 1000) throw new InputError('Límite de peticiones de esta ejecución alcanzado. Reinicia el servidor.', 409);
    const runId = randomUUID();
    const route = resolveModel({ agent: input.agentId });
    const agentName = agents.find(agent => agent.id === input.agentId).name;
    const extra = { agentId: input.agentId, projectId: 'studio', runId };
    busy = { ...extra, model: route.model };
    statuses.set(input.agentId, 'running');
    const promise = (async () => {
      const chat = conversations[input.agentId] ||= { messages: [], sessionId: null, verified: false };
      chat.messages.push({ who: 'user', message: input.message, timestamp: new Date().toISOString(), runId });
      try {
        await persist();
        emit('run.started', { model: route.model }, extra);
        const result = await runProcess({ executable: install.executable, home: install.home, profile: `studio-${input.agentId}`, cwd: root, route,
          message: `Contexto autorizado de la oficina: projectId=studio; taskId=${runId}. Tu nombre actual en el estudio es ${agentName}: el usuario ha renombrado al equipo. Usa este nombre al presentarte, aunque el historial contenga un nombre anterior; conserva tu función y memoria. Conversación real con el usuario. Responde en español. El alcance de esta petición es conversar, planificar, explicar o preparar gráficos para la TV local; no ejecutar código, acceder a repositorios, publicar fuera de esta oficina ni afirmar acciones sin evidencia.\n${media ? TV_INSTRUCTIONS : ''}\n\nMensaje original del usuario:\n${input.message}`, sessionId: chat.sessionId,
          onFrame: frame => {
            if (frame.type === 'text') emit('message.delta', { text: frame.text }, extra);
            if (frame.type === 'tool_use') emit('agent.status', { tool: frame.name }, extra);
          } });
        chat.sessionId = result.session_id;
        chat.verified = true;
        const rendered = media ? await media.fromReply(result.text, { agentId: input.agentId, runId }) : { reply: result.text, assets: [], warnings: [] };
        chat.messages.push({ who: 'agent', message: rendered.reply, media: rendered.assets, model: route.model, timestamp: new Date().toISOString(), runId });
        for (const warning of rendered.warnings) chat.messages.push({ who: 'system', message: warning, timestamp: new Date().toISOString(), runId });
        await persist();
        for (const asset of rendered.assets) emit('artifact.created', { asset }, extra);
        emit('run.completed', { model: route.model, tokens: result.tokens }, extra);
        return { mode: 'real', reply: rendered.reply, media: rendered.assets, runId, sessionId: result.session_id, model: route.model, tokens: result.tokens };
      } catch (error) {
        if (error.sessionId) chat.sessionId = error.sessionId;
        chat.messages.push({ who: 'system', message: safeError(error.message), timestamp: new Date().toISOString(), runId });
        await persist();
        emit('run.failed', { error: safeError(error.message) }, extra);
        throw error;
      } finally {
        statuses.set(input.agentId, 'idle');
        busy = null;
        emit('agent.status', { status: 'idle' }, extra);
      }
    })();
    requests.set(input.clientMessageId, { identity, promise });
    return promise;
  }
  return { snapshot, message, events, listeners, notifyArtifact: asset => emit('artifact.created', { asset }, { agentId: asset.agentId, projectId: 'studio' }) };
}
