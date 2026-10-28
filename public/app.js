import { drawAgentCharacter } from './characters.js';
import { drawStudioRoom } from './room.js';
import { drawPlayerAvatar } from './avatar.js';

const $ = (selector) => document.querySelector(selector);
const canvas = $('#office');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
function renderPlayerPortrait() {
  const portraitCanvas = document.querySelector('#player-portrait');
  const portraitContext = portraitCanvas.getContext('2d');
  portraitContext.clearRect(0, 0, portraitCanvas.width, portraitCanvas.height);
  portraitContext.imageSmoothingEnabled = false;
  drawPlayerAvatar(portraitContext, 20, 60, { scale: 2 });
}
renderPlayerPortrait();
const state = { agents: [], tasks: [], projects: [], requests: [], selected: null, project: 'studio', chats: new Map(), events: [], connected: false, tab: 'chat' };
const spots = { atlas: { x: 170, y: 223 }, pixel: { x: 355, y: 223 }, prisma: { x: 655, y: 223 }, nodo: { x: 170, y: 392 }, ux: { x: 416, y: 392 }, lupa: { x: 655, y: 392 } };
const desks = { atlas: { x: 102, y: 133, w: 134, h: 62 }, pixel: { x: 286, y: 133, w: 134, h: 62 }, prisma: { x: 588, y: 133, w: 134, h: 62 }, nodo: { x: 102, y: 304, w: 134, h: 62 }, ux: { x: 349, y: 304, w: 134, h: 62 }, lupa: { x: 588, y: 304, w: 134, h: 62 } };
const archetypes = { atlas: 'El cartógrafo · capa violeta', pixel: 'El constructor · chaqueta azul', prisma: 'La artista · boina coral', nodo: 'El anfitrión · chaleco verde', ux: 'La diseñadora · chaqueta turquesa', lupa: 'La exploradora · abrigo amarillo' };
const colors = { atlas: '#a99ad6', pixel: '#7dbccf', prisma: '#e69e91', nodo: '#a0c782', ux: '#6ed9d1', lupa: '#dfc47f' };
const labels = { proposed: 'En espera', assigned: 'Asignada', todo: 'Pendiente', pending: 'Pendiente', queued: 'En cola', running: 'En curso', in_progress: 'En curso', review: 'En revisión', awaiting_review: 'En revisión', blocked: 'Bloqueada', done: 'Completada', completed: 'Completada', idle: 'Disponible', ready: 'Disponible' };
const requestSteps = [{ name: 'UX', detail: 'Brief · Vera' }, { name: 'Atlas', detail: 'Plan' }, { name: 'Pixel', detail: 'Implementación' }, { name: 'Lupa', detail: 'QA' }, { name: 'UX', detail: 'Validación · Vera' }];
const player = { x: 460, y: 439, facing: 'down', walking: false };
const keys = new Set();
let nearest = null;
let lastFrame = 0;
let eventStream;
let refreshing = null;
let animationFrame = 0;
let voiceRun = null;
let voiceStage = 'disconnected';
let voiceDetail = 'Voz real desconectada. La prueba sólo muestra texto; no escucha ni reproduce audio.';
const obstacles = [
  { x: 102, y: 133, w: 134, h: 62 }, { x: 286, y: 133, w: 134, h: 62 }, { x: 588, y: 133, w: 134, h: 62 },
  { x: 102, y: 304, w: 134, h: 62 }, { x: 588, y: 304, w: 134, h: 62 },
  { x: 454, y: 94, w: 89, h: 35 }, { x: 52, y: 401, w: 40, h: 41 }, { x: 746, y: 401, w: 35, h: 41 },
  { x: 349, y: 304, w: 134, h: 62 },
];

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function agentColor(agent) { return colors[agent.id] || agent.color || '#b5d68a'; }
function agentSpot(agent, index = 0) { return spots[agent.id] || Object.values(spots)[index % 6]; }
function label(status) { return labels[status] || status || 'Disponible'; }
function setStatus(message) { $('#form-status').textContent = message; }
function setConnection(connected, message) {
  state.connected = connected;
  $('#connection-label').textContent = message;
  $('#connection-light').style.background = connected ? '#b5d68a' : '#dfb27f';
  $('#send-message').disabled = !connected;
}
async function api(path, body) {
  const response = await fetch(path, body === undefined ? { cache: 'no-store' } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : data.error?.message || 'No se pudo completar la acción.');
  return data;
}
async function refresh() {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const data = await api('/api/studio');
    state.agents = data.agents;
    state.tasks = data.tasks;
    state.projects = data.projects;
    state.requests = data.requests || [];
    if (!state.selected || !state.agents.some(agent => agent.id === state.selected)) state.selected = data.agents[0]?.id;
    renderPlayerPortrait();
    renderAgents();
    renderProjects();
    renderSelected();
    renderRequests();
  })();
  try { await refreshing; } finally { refreshing = null; }
}
function renderProjects() {
  const picker = $('#project');
  picker.replaceChildren(...state.projects.map(project => {
    const option = element('option', null, project.name);
    option.value = project.id;
    return option;
  }));
  picker.value = state.project;
}
function portrait(agent, large = false) {
  const sprite = document.createElement('canvas');
  sprite.width = 40;
  sprite.height = 64;
  sprite.setAttribute('aria-hidden', 'true');
  const context = sprite.getContext('2d');
  context.imageSmoothingEnabled = false;
  drawCharacter(context, 20, 60, agentColor(agent), agent.id, 'down', 0, 2);
  return sprite;
}
function renderAgents() {
  $('#agent-list').replaceChildren(...state.agents.map(agent => {
    const button = element('button', 'agent-button');
    button.type = 'button';
    button.dataset.agent = agent.id;
    button.style.setProperty('--agent-color', agentColor(agent));
    button.setAttribute('aria-pressed', String(agent.id === state.selected));
    const avatar = element('span', 'mini-portrait');
    avatar.setAttribute('aria-hidden', 'true');
    avatar.append(portrait(agent));
    const info = element('span');
    info.append(element('span', 'name', agent.name), element('span', 'role', agent.role));
    const status = element('span', 'state');
    status.append(element('b', null, 'Demo'));
    button.append(avatar, info, status);
    button.addEventListener('click', () => selectAgent(agent.id));
    return button;
  }));
}
function conversationKey() { return `${state.project}:${state.selected}`; }
function conversation() {
  const key = conversationKey();
  if (!state.chats.has(key)) {
    const agent = state.agents.find(a => a.id === state.selected);
    state.chats.set(key, [{ who: 'agent', message: `Hola, soy ${agent?.name || 'parte del equipo'}. ${agent?.description || 'Te ayudo a explorar este rol.'}\n\nEsta es una conversación de demostración. Cuéntame qué misión tienes en mente.` }]);
  }
  return state.chats.get(key);
}
function renderChat() {
  const thread = $('#chat-thread');
  thread.replaceChildren(...conversation().map(item => {
    const message = element('div', `chat-message${item.who === 'user' ? ' user' : ''}`);
    const name = state.agents.find(agent => agent.id === state.selected)?.name;
    message.append(element('small', null, item.who === 'user' ? 'TÚ' : `${name?.toUpperCase()} · DEMO`), document.createTextNode(item.message));
    return message;
  }));
  thread.scrollTop = thread.scrollHeight;
}
function renderSelected() {
  const agent = state.agents.find(a => a.id === state.selected);
  if (!agent) return;
  $('#selected-name').textContent = agent.name;
  $('#selected-role').textContent = agent.role.toUpperCase();
  $('#selected-status').textContent = `${label(agent.status)} · personaje demo`;
  $('#selected-portrait').replaceChildren(portrait(agent, true));
  $('#selected-portrait').style.borderColor = agentColor(agent) + '77';
  $('#selected-portrait').style.background = agentColor(agent) + '18';
  $('#profile-description').textContent = agent.description;
  $('#profile-archetype').textContent = archetypes[agent.id] || agent.role;
  $('#message').placeholder = `Comparte una idea con ${agent.name}…`;
  renderChat();
  renderTasks();
  renderVoice();
}
function selectAgent(id) {
  cancelVoice();
  state.selected = id;
  setStatus('');
  document.querySelectorAll('[data-agent]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.agent === id)));
  renderSelected();
}
function renderVoice() {
  const agent = state.agents.find(agent => agent.id === state.selected);
  $('#voice-agent').textContent = agent?.name || 'el agente';
  $('#voice-state').textContent = { disconnected: 'Desconectada', listening: 'Escucha · DEMO', responding: 'Respondiendo · DEMO' }[voiceStage];
  $('.voice-demo-card').dataset.stage = voiceStage;
  $('#voice-description').textContent = voiceDetail;
  $('#voice-demo').disabled = !!voiceRun || !agent;
  $('#voice-cancel').hidden = !voiceRun;
}
function cancelVoice(detail = 'Voz real desconectada. La prueba sólo muestra texto; no escucha ni reproduce audio.') {
  if (voiceRun) {
    clearTimeout(voiceRun.timer);
    voiceRun.resolve?.(false);
    voiceRun = null;
  }
  voiceStage = 'disconnected';
  voiceDetail = detail;
  renderVoice();
}
function voiceDelay(milliseconds, run) {
  return new Promise(resolve => {
    run.resolve = resolve;
    run.timer = setTimeout(() => { run.timer = null; run.resolve = null; resolve(voiceRun === run); }, milliseconds);
  });
}
async function startVoiceDemo() {
  const agent = state.agents.find(agent => agent.id === state.selected);
  if (!agent || voiceRun) return;
  const run = { agentId: agent.id, projectId: state.project, timer: null, resolve: null };
  voiceRun = run;
  const history = conversation();
  voiceStage = 'listening';
  voiceDetail = `Escucha simulada en la mesa de ${agent.name}. Texto de ejemplo: «¿Qué harías en la próxima misión?». No se está usando el micrófono.`;
  renderVoice();
  if (!await voiceDelay(1600, run)) return;
  voiceStage = 'responding';
  voiceDetail = `${agent.name} responde con texto simulado. No hay síntesis ni reproducción de audio.`;
  history.push({ who: 'user', message: 'VOZ DEMO · texto de ejemplo: ¿Qué harías en la próxima misión?' });
  history.push({ who: 'agent', message: `VOZ DEMO · guion local sin modelo ni audio. Soy ${agent.name}, ${agent.role}. Mi función propuesta es: ${agent.description}` });
  renderChat();
  renderVoice();
  if (!await voiceDelay(2200, run)) return;
  voiceRun = null;
  voiceStage = 'disconnected';
  voiceDetail = `Prueba terminada con ${agent.name}. El texto queda en esta conversación demo. La voz real sigue desconectada.`;
  renderVoice();
}
function renderTasks() {
  const tasks = state.tasks.filter(task => task.agentId === state.selected && task.projectId === state.project);
  $('#task-count').textContent = tasks.length;
  if (!tasks.length) {
    $('#task-list').replaceChildren(element('p', 'empty-state', 'Aún no hay misiones para este agente en este proyecto. Crea la primera misión de demostración.'));
    return;
  }
  const agent = state.agents.find(a => a.id === state.selected);
  $('#task-list').replaceChildren(...tasks.map(task => {
    const card = element('article', 'task');
    card.style.setProperty('--agent-color', agentColor(agent));
    const heading = element('div');
    heading.append(element('h3', null, task.title), element('span', 'task-status', label(task.status)));
    card.append(heading);
    if (task.summary) card.append(element('p', null, task.summary));
    if (task.requestId) {
      card.append(element('p', 'linked-request', 'Parte de un cambio de UX. Nodo controla el siguiente traspaso desde la solicitud.'));
    } else if (!['done', 'completed', 'cancelled'].includes(task.status)) {
      const advance = element('button', null, 'Avanzar estado demo →');
      advance.type = 'button';
      advance.addEventListener('click', async () => {
        advance.disabled = true;
        try { await api(`/api/tasks/${encodeURIComponent(task.id)}/advance`, {}); await refresh(); setStatus('Estado actualizado en la simulación.'); }
        catch (error) { setStatus(error.message); advance.disabled = false; }
      });
      card.append(advance);
    }
    return card;
  }));
}
function switchTab(tab, focus = false) {
  state.tab = tab;
  document.querySelectorAll('[data-tab]').forEach(button => {
    const selected = button.dataset.tab === tab;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
    if (selected && focus) button.focus();
  });
  ['chat', 'tasks', 'profile'].forEach(id => { $(`#panel-${id}`).hidden = id !== tab; });
  setStatus('');
}
function addEvent(event) {
  const agent = state.agents.find(a => a.id === event.agentId);
  const type = String(event.type || 'studio.updated');
  const descriptions = { 'studio.connected': 'El canal de eventos demo está conectado.', 'task.created': `Nueva misión demo para ${agent?.name || 'el equipo'}.`, 'task.updated': `Se actualizó una misión de ${agent?.name || 'el equipo'}.`, 'task.status_changed': `Una misión de ${agent?.name || 'el equipo'} avanzó de estado.`, 'message.created': `Mensaje demo enviado a ${agent?.name || 'un agente'}.`, 'message.received': `${agent?.name || 'Un agente'} respondió en la simulación.`, 'agent.message': `${agent?.name || 'Un agente'} respondió en la simulación.`, 'message.replied': `${agent?.name || 'Un agente'} respondió en la simulación.`, 'runtime.ready': 'La oficina de demostración está lista.' };
  if (type === 'request.created') descriptions[type] = 'Nuevo cambio de UX demo. Nodo conserva la petición y sus dependencias.';
  if (type === 'request.updated') descriptions[type] = 'El cambio de UX avanzó un traspaso simulado.';
  const message = descriptions[type] || `${agent?.name ? `${agent.name} · ` : ''}${type.replaceAll('.', ' / ').replaceAll('_', ' ')} · demo`;
  state.events.unshift({ message, timestamp: event.timestamp || new Date().toISOString() });
  state.events = state.events.slice(0, 4);
  renderEvents();
}
function renderEvents() {
  $('#event-list').replaceChildren(...state.events.map(event => {
    const item = element('li');
    const time = element('time');
    time.dateTime = event.timestamp;
    const date = new Date(event.timestamp);
    time.textContent = Number.isNaN(date.getTime()) ? 'ahora' : date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    item.append(element('span', 'event-dot'), element('span', null, event.message), time);
    return item;
  }));
}
function renderRequests() {
  $('#request-project').textContent = state.projects.find(project => project.id === state.project)?.name || 'este proyecto';
  const requests = state.requests.filter(request => request.projectId === state.project).toReversed();
  if (!requests.length) {
    $('#request-list').replaceChildren(element('p', 'empty-state', 'Todavía no hay cambios de UX en este proyecto. Una petición conserva su objetivo y criterios durante los cinco traspasos.'));
    return;
  }
  $('#request-list').replaceChildren(...requests.map((request, index) => {
    const card = element('article', 'request-card');
    const heading = element('div', 'request-heading');
    const number = requests.length - index;
    heading.append(element('h3', null, `Cambio de UX ${String(number).padStart(2, '0')}`), element('span', 'request-badge', request.status === 'done' ? 'CERRADA · DEMO' : 'ACTIVA · DEMO'));
    card.append(heading, element('p', 'request-description', request.description));
    const stages = element('ol', 'request-stages');
    stages.setAttribute('aria-label', 'Cadena de traspasos de la solicitud');
    requestSteps.forEach((step, stepIndex) => {
      const completed = request.status === 'done' || stepIndex < request.stageIndex;
      const active = request.status !== 'done' && stepIndex === request.stageIndex;
      const stage = element('li', completed ? 'complete' : active ? 'active' : 'waiting');
      stage.append(element('span', 'step-index', completed ? '✓' : String(stepIndex + 1)), element('strong', null, step.name), element('small', null, step.detail));
      if (active) stage.setAttribute('aria-current', 'step');
      stages.append(stage);
    });
    card.append(stages);
    const criteria = element('div', 'request-criteria');
    criteria.append(element('h4', null, 'Criterios que acompañan la petición'));
    const list = element('ul');
    (request.acceptanceCriteria || []).forEach(criterion => list.append(element('li', null, criterion)));
    criteria.append(list);
    card.append(criteria);
    if (request.evidence?.length) {
      const evidence = element('details', 'request-evidence');
      evidence.append(element('summary', null, `Evidencia simulada · ${request.evidence.length} registros`));
      const items = element('ul');
      request.evidence.forEach(item => items.append(element('li', null, typeof item === 'string' ? item : JSON.stringify(item))));
      evidence.append(items);
      card.append(evidence);
    }
    if (request.status !== 'done') {
      const advance = element('button', 'advance-request', 'Simular siguiente traspaso →');
      advance.type = 'button';
      advance.addEventListener('click', async () => {
        advance.disabled = true;
        try { await api(`/api/requests/${encodeURIComponent(request.id)}/advance`, {}); await refresh(); $('#request-status').textContent = 'Traspaso simulado por Nodo. No se ejecutó trabajo ni se verificó un resultado real.'; }
        catch (error) { $('#request-status').textContent = error.message; advance.disabled = false; }
      });
      card.append(advance);
    } else {
      card.append(element('p', 'request-complete', 'Cadena demo cerrada. Esta marca no acredita cambios de código ni validación real.'));
    }
    return card;
  }));
}
function connectEvents() {
  eventStream = new EventSource('/api/events');
  eventStream.onopen = () => {
    setConnection(true, 'Estudio conectado · simulación');
    refresh().catch(() => setStatus('No se pudo actualizar el estado del estudio al reconectar.'));
  };
  eventStream.onerror = () => setConnection(false, 'Reconectando eventos demo…');
  const handle = (message) => {
    try {
      const event = JSON.parse(message.data);
      addEvent(event);
      if (event.type?.startsWith('task.') || event.type?.startsWith('request.')) refresh().catch(() => setStatus('No se pudieron actualizar las misiones y solicitudes.'));
    } catch { setStatus('Se recibió un evento que no se pudo interpretar.'); }
  };
  eventStream.onmessage = handle;
  // Compatible con eventos SSE nombrados, además del formato estándar "data:".
  ['studio.connected', 'task.created', 'task.updated', 'task.status_changed', 'request.created', 'request.updated', 'message.created', 'message.replied', 'agent.message', 'runtime.ready'].forEach(type => eventStream.addEventListener(type, handle));
}

$('#project').addEventListener('change', event => {
  cancelVoice();
  state.project = event.target.value;
  setStatus('Contexto cambiado. Esta demo no abre ni modifica el repositorio del juego.');
  renderSelected();
  renderRequests();
  $('#request-status').textContent = '';
});
$('#request-form').addEventListener('submit', async event => {
  event.preventDefault();
  const description = $('#request-description').value.trim();
  if (!description) return;
  const projectId = state.project;
  const button = event.currentTarget.querySelector('button');
  button.disabled = true;
  $('#request-status').textContent = 'Creando la cadena demo…';
  try {
    await api('/api/requests', { projectId, description });
    $('#request-description').value = '';
    await refresh();
    $('#request-status').textContent = 'Petición conservada con cinco fases y dependencias. Vera recibe el brief demo; no se ha iniciado ningún agente real.';
  } catch (error) { $('#request-status').textContent = error.message; }
  finally { button.disabled = false; }
});
$('#voice-demo').addEventListener('click', startVoiceDemo);
$('#voice-cancel').addEventListener('click', () => cancelVoice('Prueba cancelada. No se ha capturado ni reproducido audio.'));
document.querySelectorAll('[data-tab]').forEach(button => {
  button.addEventListener('click', () => switchTab(button.dataset.tab));
  button.addEventListener('keydown', event => {
    const tabs = ['chat', 'tasks', 'profile'];
    if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (tabs.indexOf(state.tab) + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
      switchTab(tabs[index], true);
    }
  });
});
$('#chat-form').addEventListener('submit', async event => {
  event.preventDefault();
  const input = $('#message');
  const message = input.value.trim();
  if (!message || !state.selected) return;
  const agentId = state.selected;
  const projectId = state.project;
  const history = conversation();
  history.push({ who: 'user', message });
  input.value = '';
  renderChat();
  $('#send-message').disabled = true;
  setStatus('Preparando respuesta demo…');
  try {
    const response = await api('/api/messages', { agentId, projectId, message });
    history.push({ who: 'agent', message: typeof response.reply === 'string' ? response.reply : response.reply?.message || response.reply?.text || 'Respuesta de demostración recibida.' });
    if (agentId === state.selected && projectId === state.project) renderChat();
    setStatus('Respuesta fija de demostración. No se consultó un modelo.');
  } catch (error) { setStatus(`Mensaje sin respuesta: ${error.message}`); }
  finally { $('#send-message').disabled = !state.connected; }
});
$('#message').addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); if (!$('#send-message').disabled) $('#chat-form').requestSubmit(); }
});
$('#task-form').addEventListener('submit', async event => {
  event.preventDefault();
  const input = $('#task-title');
  const title = input.value.trim();
  if (!title || !state.selected) return;
  const button = event.currentTarget.querySelector('button');
  button.disabled = true;
  try { await api('/api/tasks', { agentId: state.selected, projectId: state.project, title }); input.value = ''; await refresh(); setStatus('Misión creada en memoria. Ningún agente real se ha iniciado.'); }
  catch (error) { setStatus(error.message); }
  finally { button.disabled = false; }
});

function rect(context, x, y, w, h, color) { context.fillStyle = color; context.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function pixelText(text, x, y, color = '#e9e6cf', size = 8, align = 'center') {
  ctx.font = `${size}px "Courier New", monospace`;
  ctx.textAlign = align;
  ctx.fillStyle = '#24312b';
  ctx.fillText(text, Math.round(x) + 1, Math.round(y) + 1);
  ctx.fillStyle = color;
  ctx.fillText(text, Math.round(x), Math.round(y));
}
function drawRoom() {
  drawStudioRoom(ctx, { agents: state.agents, selected: state.selected, colors });
}
function drawCharacter(context, x, y, color, kind, facing = 'down', step = 0, scale = 2) {
  drawAgentCharacter(context, x, y, { id: kind, tint: color, facing, step, scale });
}
function canMove(x, y) {
  if (x < 57 || x > 775 || y < 118 || y > 450) return false;
  const margin = 9;
  return !obstacles.some(o => x + margin > o.x && x - margin < o.x + o.w && y > o.y - 2 && y - 15 < o.y + o.h);
}
function updatePlayer(dt, now) {
  let dx = (keys.has('arrowright') || keys.has('d') ? 1 : 0) - (keys.has('arrowleft') || keys.has('a') ? 1 : 0);
  let dy = (keys.has('arrowdown') || keys.has('s') ? 1 : 0) - (keys.has('arrowup') || keys.has('w') ? 1 : 0);
  player.walking = !!(dx || dy);
  if (dx || dy) {
    const length = Math.hypot(dx, dy); const distance = Math.min(dt, .05) * 137;
    dx = dx / length * distance; dy = dy / length * distance;
    if (canMove(player.x + dx, player.y)) player.x += dx;
    if (canMove(player.x, player.y + dy)) player.y += dy;
    player.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  }
  let closest = null; let distance = 57;
  state.agents.forEach((agent, i) => {
    const table = desks[agent.id];
    if (!table) return;
    const dx = Math.max(table.x - player.x, 0, player.x - (table.x + table.w));
    const dy = Math.max(table.y - player.y, 0, player.y - (table.y + table.h));
    const d = Math.hypot(dx, dy);
    if (d < distance) { closest = agent; distance = d; }
  });
  if (nearest?.id !== closest?.id) {
    nearest = closest;
    $('#interaction-hint').hidden = !nearest;
    $('#nearby-name').textContent = nearest ? `${nearest.name} · ${nearest.role}` : '';
  }
}
function draw(now) {
  const dt = (now - lastFrame) / 1000; lastFrame = now;
  updatePlayer(dt, now);
  drawRoom();
  const characters = state.agents.map((agent, index) => ({ agent, ...agentSpot(agent, index) }));
  characters.push({ isPlayer: true, x: player.x, y: player.y });
  characters.sort((a, b) => a.y - b.y).forEach(character => {
    if (character.isPlayer) {
      drawPlayerAvatar(ctx, player.x, player.y, { facing: player.facing, step: player.walking ? now / 95 : 0, scale: 2 });
      pixelText('TÚ', player.x, player.y - 67, '#eef3d5', 8);
    } else {
      const { agent, x, y } = character;
      if (agent.id === state.selected) {
        ctx.strokeStyle = agentColor(agent); ctx.lineWidth = 1;
        ctx.strokeRect(x - 17, y - 4, 35, 9);
      }
      drawCharacter(ctx, x, y, agentColor(agent), agent.id, 'down', 0, 2);
      const close = nearest?.id === agent.id;
      rect(ctx, x - 29, y + 9, 58, 14, '#314b3ee6');
      pixelText(agent.name.toUpperCase(), x, y + 19, close ? '#f1f3d7' : '#d5dfbb', 8);
      if (close) { rect(ctx, x - 7, y - 76, 15, 14, '#e0e9b8'); pixelText('E', x + .5, y - 66, '#35573d', 9); }
    }
  });
  animationFrame = requestAnimationFrame(draw);
}
function interact() {
  if (!nearest) { setStatus('Acércate a una mesa rotulada o selecciona su agente en la lista del equipo.'); return; }
  selectAgent(nearest.id); switchTab('chat');
  setStatus(`Mesa de ${nearest.name} · ${nearest.role}. Puedes escribirle o pulsar «Probar voz · DEMO», sin audio real.`);
  if (window.matchMedia('(max-width:820px)').matches) $('.agent-panel').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' });
}
const movementKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
window.addEventListener('keydown', event => {
  if (event.target.closest('input,textarea,select,[contenteditable=true]') || event.altKey || event.ctrlKey || event.metaKey) return;
  const key = event.key.toLowerCase();
  if (movementKeys.includes(key) && !event.target.closest('[role=tablist]')) { event.preventDefault(); keys.add(key); }
  if (key === 'e' && !event.repeat) { event.preventDefault(); interact(); }
});
window.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());
document.addEventListener('visibilitychange', () => { if (document.hidden) keys.clear(); });
$('#reset-position').addEventListener('click', () => { player.x = 460; player.y = 439; keys.clear(); canvas.focus(); });
$('#touch-interact').addEventListener('click', interact);
document.querySelectorAll('[data-direction]').forEach(button => {
  const key = `arrow${button.dataset.direction}`;
  button.addEventListener('pointerdown', event => { event.preventDefault(); button.setPointerCapture(event.pointerId); keys.add(key); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => button.addEventListener(type, () => keys.delete(key)));
});
canvas.addEventListener('click', event => {
  const bounds = canvas.getBoundingClientRect(); const x = (event.clientX - bounds.left) / bounds.width * 832; const y = (event.clientY - bounds.top) / bounds.height * 512;
  const agent = state.agents.find((agent, index) => { const point = agentSpot(agent, index); const table = desks[agent.id]; return Math.abs(x - point.x) < 28 && Math.abs(y - (point.y - 15)) < 43 || table && x >= table.x && x <= table.x + table.w && y >= table.y && y <= table.y + table.h; });
  if (agent) { selectAgent(agent.id); switchTab('chat'); }
  canvas.focus();
});
switchTab('chat');
animationFrame = requestAnimationFrame(draw);
try {
  await refresh();
  setConnection(true, 'Estudio conectado · simulación');
  addEvent({ type: 'runtime.ready' });
  connectEvents();
} catch (error) {
  setConnection(false, 'Servidor local no disponible');
  $('#agent-list').replaceChildren(element('p', 'loading', 'No se pudo cargar el equipo. Abre esta página desde el servidor local del proyecto.'));
  setStatus(`No se cargó la demo: ${error.message}`);
}
window.addEventListener('pagehide', () => { cancelVoice(); eventStream?.close(); cancelAnimationFrame(animationFrame); });
