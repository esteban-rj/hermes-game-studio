const $ = (selector) => document.querySelector(selector);
const canvas = $('#office');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const state = { agents: [], tasks: [], projects: [], requests: [], selected: null, project: 'studio', chats: new Map(), events: [], connected: false, tab: 'chat' };
const spots = { atlas: { x: 170, y: 223 }, pixel: { x: 355, y: 223 }, prisma: { x: 655, y: 223 }, nodo: { x: 170, y: 392 }, ux: { x: 416, y: 392 }, lupa: { x: 655, y: 392 } };
const desks = { atlas: { x: 102, y: 133, w: 134, h: 62 }, pixel: { x: 286, y: 133, w: 134, h: 62 }, prisma: { x: 588, y: 133, w: 134, h: 62 }, nodo: { x: 102, y: 304, w: 134, h: 62 }, ux: { x: 349, y: 304, w: 134, h: 62 }, lupa: { x: 588, y: 304, w: 134, h: 62 } };
const archetypes = { atlas: 'El cartógrafo · capa violeta', pixel: 'El constructor · chaqueta azul', prisma: 'La artista · boina coral', nodo: 'El anfitrión · chaleco verde', ux: 'La diseñadora · chaqueta turquesa', lupa: 'La exploradora · abrigo amarillo' };
const colors = { atlas: '#a99ad6', pixel: '#7dbccf', prisma: '#e69e91', nodo: '#a0c782', ux: '#6ed9d1', lupa: '#dfc47f' };
const labels = { proposed: 'En espera', assigned: 'Asignada', todo: 'Pendiente', pending: 'Pendiente', queued: 'En cola', running: 'En curso', in_progress: 'En curso', review: 'En revisión', awaiting_review: 'En revisión', blocked: 'Bloqueada', done: 'Completada', completed: 'Completada', idle: 'Disponible', ready: 'Disponible' };
const requestSteps = [{ name: 'UX', detail: 'Brief · Vera' }, { name: 'Atlas', detail: 'Plan' }, { name: 'Pixel', detail: 'Implementación' }, { name: 'Lupa', detail: 'QA' }, { name: 'UX', detail: 'Validación · Vera' }];
const player = { x: 416, y: 423, facing: 'down', walking: false };
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
  sprite.width = 32;
  sprite.height = 38;
  sprite.setAttribute('aria-hidden', 'true');
  const context = sprite.getContext('2d');
  context.imageSmoothingEnabled = false;
  drawCharacter(context, 16, 35, agentColor(agent), agent.id, 'down', 0, 1.8);
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
function plant(x, y, big = false) {
  const s = big ? 1.5 : 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rect(ctx, -8, -2, 16, 4, '#314438');
  rect(ctx, -6, -13, 12, 12, '#b99576'); rect(ctx, -7, -14, 14, 4, '#d2af81');
  rect(ctx, -1, -34, 3, 22, '#668150'); rect(ctx, -10, -29, 10, 8, '#54754e'); rect(ctx, -13, -33, 10, 7, '#759252');
  rect(ctx, 2, -34, 11, 8, '#61864e'); rect(ctx, 5, -39, 7, 7, '#91a969'); rect(ctx, -5, -44, 8, 16, '#7e9b5f');
  ctx.restore();
}
function desk(x, y, variant) {
  rect(ctx, x + 5, y + 8, 130, 62, '#606b4e66');
  rect(ctx, x + 3, y + 45, 8, 23, '#6d684c'); rect(ctx, x + 119, y + 45, 8, 23, '#6d684c');
  rect(ctx, x, y, 134, 56, '#c1a67c'); rect(ctx, x, y + 48, 134, 8, '#9c805d'); rect(ctx, x + 3, y + 3, 128, 3, '#dac093');
  rect(ctx, x + 44, y + 9, 43, 30, '#303d39'); rect(ctx, x + 47, y + 12, 37, 23, '#4d7472');
  rect(ctx, x + 50, y + 15, 22, 2, '#9bb9a2'); rect(ctx, x + 50, y + 20, 30, 2, '#80a494'); rect(ctx, x + 50, y + 25, 15, 2, '#b8c78f');
  if (variant === 'prisma') { rect(ctx, x + 50, y + 15, 11, 14, '#d99b8a'); rect(ctx, x + 65, y + 16, 14, 9, '#b4a0d5'); }
  rect(ctx, x + 61, y + 39, 8, 4, '#3a4840'); rect(ctx, x + 51, y + 43, 30, 3, '#37473d');
  rect(ctx, x + 45, y + 48, 45, 4, '#6d7d69'); rect(ctx, x + 48, y + 49, 38, 1, '#b1b99a');
  rect(ctx, x + 104, y + 32, 10, 12, '#dfd3ae'); rect(ctx, x + 106, y + 30, 6, 4, '#66543f'); rect(ctx, x + 114, y + 35, 3, 6, '#dfd3ae');
  if (variant === 'prisma') { rect(ctx, x + 13, y + 20, 21, 27, '#e4ddba'); rect(ctx, x + 16, y + 24, 15, 10, '#c5988e'); rect(ctx, x + 19, y + 37, 10, 3, '#91ad80'); }
  else { rect(ctx, x + 14, y + 30, 20, 16, '#a4b087'); rect(ctx, x + 17, y + 33, 14, 1, '#d6d6ad'); rect(ctx, x + 17, y + 37, 11, 1, '#d6d6ad'); }
  const owner = state.agents.find(agent => agent.id === variant);
  rect(ctx, x + 39, y + 52, 57, 12, '#334b3e');
  pixelText((owner?.name || variant).toUpperCase(), x + 67, y + 61, colors[variant] || '#d9e3be', 8);
  if (owner?.id === state.selected) { rect(ctx, x + 34, y + 55, 3, 3, colors[variant] || '#d9e3be'); }
}
function chair(x, y, color = '#637664') {
  rect(ctx, x - 13, y - 6, 27, 14, '#495f4b'); rect(ctx, x - 12, y - 20, 25, 19, color); rect(ctx, x - 9, y - 18, 19, 3, '#a4b28b44');
  rect(ctx, x - 2, y + 7, 4, 10, '#56634c'); rect(ctx, x - 10, y + 16, 21, 3, '#56634c');
}
function drawRoom() {
  rect(ctx, 0, 0, 832, 512, '#243331');
  rect(ctx, 24, 45, 784, 444, '#172725');
  rect(ctx, 34, 54, 764, 421, '#546b5a');
  // Wood floor: aligned pixels and subtle grain, never random per frame.
  for (let y = 105; y < 465; y += 24) {
    for (let x = 44; x < 790; x += 64) {
      const offset = (Math.floor(y / 24) % 2) * 32;
      const px = x - offset;
      rect(ctx, Math.max(44, px), y, Math.min(64, 790 - Math.max(44, px)), 23, ['#a59d75', '#aea77e', '#aaa078'][(Math.floor(x / 64) + Math.floor(y / 24)) % 3]);
      if (px > 44) rect(ctx, px + 7, y + 14, 22, 1, '#817f5b33');
      if (px + 63 < 790 && px + 63 > 44) rect(ctx, px + 63, y + 1, 1, 22, '#7e805d');
    }
  }
  rect(ctx, 34, 54, 764, 51, '#b9c8a8'); rect(ctx, 34, 54, 764, 8, '#879d80'); rect(ctx, 34, 97, 764, 8, '#6f8769');
  rect(ctx, 34, 105, 10, 362, '#7a8f6e'); rect(ctx, 788, 105, 10, 362, '#7a8f6e');
  rect(ctx, 34, 466, 764, 9, '#6d7f5d'); rect(ctx, 34, 475, 764, 6, '#405644');
  // Windows and outside skyline.
  [84, 289, 588].forEach(x => {
    rect(ctx, x - 5, 56, 124, 42, '#718f7b'); rect(ctx, x, 58, 114, 34, '#89b9aa');
    rect(ctx, x, 79, 114, 13, '#6e9e91');
    for (let k = 0; k < 6; k++) rect(ctx, x + 3 + k * 19, 70 + k % 3 * 3, 13, 22 - k % 3 * 3, '#779c8c');
    rect(ctx, x + 55, 58, 4, 35, '#d8debb'); rect(ctx, x, 73, 114, 3, '#c1d2b4'); rect(ctx, x - 4, 92, 122, 6, '#dfdfb7');
  });
  rect(ctx, 457, 61, 79, 30, '#465f4f'); rect(ctx, 461, 65, 71, 22, '#e1dfb9'); pixelText('MAKE / PLAY', 496, 79, '#5e7858', 8);
  // Shelves, books and coffee station.
  rect(ctx, 449, 100, 96, 31, '#8a8966'); rect(ctx, 449, 97, 96, 7, '#c0b687');
  [0, 1, 2, 3].forEach(i => { rect(ctx, 456 + i * 6, 111, 4, 15, ['#a5bb8d', '#d1b783', '#8dafa2', '#b1a0bb'][i]); });
  rect(ctx, 509, 102, 22, 23, '#4c5f4f'); rect(ctx, 512, 104, 15, 12, '#a2ab85'); rect(ctx, 517, 118, 8, 6, '#d5c29b');
  // A sixth individual desk for UX, on a quiet central carpet.
  rect(ctx, 321, 266, 189, 99, '#758f7966'); rect(ctx, 327, 272, 177, 87, '#83987b');
  rect(ctx, 333, 278, 165, 75, '#9cad8b'); rect(ctx, 338, 283, 155, 65, '#8fa280');
  desk(102, 133, 'atlas'); desk(286, 133, 'pixel'); desk(588, 133, 'prisma'); desk(102, 304, 'nodo'); desk(349, 304, 'ux'); desk(588, 304, 'lupa');
  [170, 355, 655].forEach(x => chair(x, 216)); chair(170, 386); chair(416, 386, '#658d81'); chair(655, 386);
  // Focus alcoves and wall decor.
  rect(ctx, 250, 124, 4, 102, '#7f946c'); rect(ctx, 548, 124, 4, 102, '#7f946c');
  plant(67, 161, 1); plant(765, 165, true); plant(69, 442, true); plant(763, 442, true);
  rect(ctx, 54, 281, 25, 28, '#567c62'); rect(ctx, 58, 285, 17, 20, '#d4c999'); rect(ctx, 62, 290, 10, 7, '#a5b77c');
  rect(ctx, 751, 267, 25, 33, '#7b8e6b'); rect(ctx, 755, 271, 17, 25, '#d4cf9e'); rect(ctx, 758, 274, 11, 12, '#99b296');
  // Entrance and floor signs.
  rect(ctx, 366, 455, 100, 20, '#344e40'); rect(ctx, 373, 456, 86, 15, '#7d926b');
  pixelText('ENTRADA', 416, 466, '#d9e0b8', 7);
  pixelText('ARQUITECTURA', 169, 121, '#e8e7ca', 7); pixelText('DESARROLLO', 354, 121, '#e8e7ca', 7); pixelText('ARTE / MUNDOS', 655, 121, '#e8e7ca', 7);
  pixelText('COORDINACIÓN', 169, 290, '#e8e7ca', 7); pixelText('DISEÑO UX', 416, 290, '#e8e7ca', 7); pixelText('CONTROL DE CALIDAD', 655, 290, '#e8e7ca', 7);
  // Quiet environmental details: papers, pathway and plants.
  rect(ctx, 269, 388, 13, 4, '#767f5c44'); rect(ctx, 523, 237, 13, 4, '#767f5c44');
  pixelText('HERMES', 416, 242, '#647f61', 16); pixelText('GAME STUDIO', 416, 254, '#6a8360', 7);
}
function drawCharacter(context, x, y, color, kind, facing = 'down', step = 0, scale = 2) {
  context.save(); context.translate(Math.round(x), Math.round(y)); context.scale(scale, scale);
  rect(context, -6, -1, 13, 3, '#31483655');
  const sway = step ? Math.round(Math.sin(step) * 1.3) : 0;
  rect(context, -4, -5, 3, 5 + (sway > 0 ? 1 : 0), '#354e4a'); rect(context, 2, -5, 3, 5 + (sway < 0 ? 1 : 0), '#354e4a');
  rect(context, -5, -2 + (sway > 0 ? 1 : 0), 4, 2, '#253b35'); rect(context, 2, -2 + (sway < 0 ? 1 : 0), 4, 2, '#253b35');
  rect(context, -5, -12, 11, 9, color); rect(context, -7, -11, 2, 7, color); rect(context, 6, -11, 2, 7, color);
  rect(context, -7, -5, 2, 2, '#dcb78a'); rect(context, 6, -5, 2, 2, '#dcb78a');
  rect(context, -4, -19, 9, 8, '#dfba8c'); rect(context, -5, -18, 1, 5, '#bd946e');
  const hair = kind === 'prisma' ? '#8b5844' : kind === 'lupa' ? '#6c5943' : kind === 'pixel' ? '#4a5953' : kind === 'nodo' ? '#735d43' : '#5b504b';
  rect(context, -5, -20, 10, 4, hair); rect(context, -5, -18, 2, 5, hair);
  if (facing !== 'up') {
    rect(context, -2, -15, 1, 2, '#35433a'); rect(context, 3, -15, 1, 2, '#35433a'); rect(context, 0, -12, 2, 1, '#b17c62');
  } else { rect(context, -4, -18, 8, 6, hair); }
  if (kind === 'atlas') { rect(context, -6, -11, 3, 9, '#7866a7'); rect(context, -2, -15, 3, 2, '#b8ccd4'); rect(context, 2, -15, 3, 2, '#b8ccd4'); }
  if (kind === 'prisma') { rect(context, -6, -22, 12, 4, '#d98a7a'); rect(context, -4, -23, 8, 2, '#e4a28d'); rect(context, 2, -24, 1, 2, '#6c7855'); rect(context, -5, -18, 2, 9, hair); }
  if (kind === 'pixel') { rect(context, -6, -17, 2, 5, '#789a99'); rect(context, 5, -17, 2, 5, '#789a99'); rect(context, -4, -12, 2, 7, '#528fa4'); }
  if (kind === 'nodo') { rect(context, -2, -11, 4, 7, '#d1d0a0'); rect(context, -1, -11, 2, 4, '#657b52'); }
  if (kind === 'lupa') { rect(context, 3, -15, 4, 4, '#5d7059'); rect(context, 4, -14, 2, 2, '#b2d5c5'); rect(context, 6, -11, 2, 3, '#5d7059'); }
  if (kind === 'ux') { rect(context, -5, -19, 2, 10, '#70504d'); rect(context, 4, -19, 2, 10, '#70504d'); rect(context, -4, -19, 9, 1, '#6ed9d1'); rect(context, 3, -8, 5, 6, '#344f4d'); rect(context, 4, -7, 3, 3, '#c6dfc0'); }
  if (kind === 'player') { rect(context, -2, -11, 4, 2, '#e0e4b4'); rect(context, 3, -8, 2, 2, '#648c60'); }
  context.restore();
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
      drawCharacter(ctx, player.x, player.y, '#c1d393', 'player', player.facing, player.walking ? now / 95 : 0, 2);
      pixelText('TÚ', player.x, player.y - 48, '#eef3d5', 8);
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
      if (close) { rect(ctx, x - 7, y - 62, 15, 14, '#e0e9b8'); pixelText('E', x + .5, y - 52, '#35573d', 9); }
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
$('#reset-position').addEventListener('click', () => { player.x = 416; player.y = 423; keys.clear(); canvas.focus(); });
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
