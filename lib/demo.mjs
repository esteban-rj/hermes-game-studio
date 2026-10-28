import { randomUUID } from 'node:crypto';

export const agents = [
  { id: 'atlas', name: 'Atlas', role: 'Arquitecto', color: '#b49aff', status: 'idle', description: 'Transforma una idea en un plan pequeño, con decisiones y criterios de aceptación.' },
  { id: 'pixel', name: 'Pixel', role: 'Implementador', color: '#79baff', status: 'idle', description: 'Implementa tareas acotadas, explica el diff y aporta verificación reproducible.' },
  { id: 'prisma', name: 'Prisma', role: 'Artista visual', color: '#ff9b87', status: 'idle', description: 'Define personajes, mapas y assets coherentes con el estilo y las licencias.' },
  { id: 'ux', name: 'Vera', role: 'Diseñadora UX', color: '#6ed9d1', status: 'idle', description: 'Conserva la intención del usuario, define el flujo y valida la experiencia al final de la cadena.' },
  { id: 'nodo', name: 'Nodo', role: 'Coordinador', color: '#83d5ad', status: 'idle', description: 'Distribuye tareas, conserva el contexto de cada proyecto y controla dependencias.' },
  { id: 'lupa', name: 'Lupa', role: 'QA', color: '#f2ce7d', status: 'idle', description: 'Comprueba el resultado de forma independiente y registra evidencia y bloqueos.' }
];
export const projects = [
  { id: 'studio', name: 'Hermes Game Studio' },
  { id: 'juego-a', name: 'Juego A' },
  { id: 'juego-b', name: 'Juego B' }
];
export const transitions = Object.freeze({ assigned: 'running', running: 'review', review: 'done' });

export class InputError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
function textField(value, name, max) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new InputError(`${name}: texto requerido, máximo ${max} caracteres.`);
  return value.trim();
}
export function validateTarget(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new InputError('Se esperaba un objeto JSON.');
  if (!agents.some(a => a.id === input.agentId)) throw new InputError('Agente desconocido.');
  if (!projects.some(p => p.id === input.projectId)) throw new InputError('Proyecto desconocido.');
}
export function makeDemo() {
  const tasks = [
    { id: 'demo-plan', title: 'Bosquejar el próximo prototipo', agentId: 'atlas', projectId: 'studio', status: 'assigned', summary: 'Ejemplo simulado: criterios, alcance y dependencias.' },
    { id: 'demo-art', title: 'Explorar la identidad de la oficina', agentId: 'prisma', projectId: 'studio', status: 'review', summary: 'Ejemplo simulado: paleta, siluetas y mapa.' }
  ];
  const events = [];
  const requests = [];
  const listeners = new Set();
  let sequence = 0;
  function emit(type, data, extra = {}) {
    const event = { schemaVersion: 1, id: String(++sequence), timestamp: new Date().toISOString(), type, mode: 'demo', data, ...extra };
    events.push(event);
    if (events.length > 100) events.shift();
    for (const listener of listeners) listener(event);
    return event;
  }
  function snapshot() {
    return { schemaVersion: 1, mode: 'demo', notice: 'Simulación local. Sin inferencia, sin ejecución de herramientas. Se reinicia al cerrar el servidor.', agents, projects, tasks: structuredClone(tasks), requests: structuredClone(requests), capabilities: { hermes: false, codex: false, voice: false } };
  }
  function createTask(input) {
    validateTarget(input);
    const title = textField(input.title, 'title', 160);
    if (tasks.length >= 500) throw new InputError('Límite de la demo: 500 tareas. Reinicia el servidor.', 409);
    const task = { id: randomUUID(), title, agentId: input.agentId, projectId: input.projectId, status: 'assigned', summary: 'Tarea simulada; no se ha enviado a Hermes.' };
    tasks.push(task);
    emit('task.created', { task: structuredClone(task) }, { taskId: task.id, agentId: task.agentId, projectId: task.projectId });
    return structuredClone(task);
  }
  function advanceTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) throw new InputError('Tarea no encontrada.', 404);
    if (task.requestId) throw new InputError('Avanza esta tarea desde su cadena UX para respetar las dependencias.', 409);
    const next = transitions[task.status];
    if (!next) throw new InputError('La tarea ya terminó; no hay transición disponible.', 409);
    const previousStatus = task.status;
    task.status = next;
    task.summary = next === 'done' ? 'Finalización DEMO manual; no representa trabajo ejecutado ni verificación real.' : `Estado ${next} simulado manualmente.`;
    emit('task.updated', { task: structuredClone(task), previousStatus }, { taskId: task.id, agentId: task.agentId, projectId: task.projectId });
    return structuredClone(task);
  }
  function message(input) {
    validateTarget(input);
    textField(input.message, 'message', 4000);
    const templates = {
      atlas: 'Como arquitecto propondría definir el objetivo jugable, dividirlo en una entrega pequeña y acordar cómo probarla.',
      pixel: 'Como implementador necesitaría una tarea con archivos permitidos, criterios de aceptación y un comando de prueba.',
      prisma: 'Como artista empezaría con referencias autorizadas, paleta, dimensiones y una hoja de assets. Revisaría la coherencia, escala y legibilidad del avatar y los personajes dentro de la oficina.',
      ux: 'Como UX registraría tu petición una sola vez, definiría criterios y la pasaría a Atlas, Pixel y Lupa, para validar después la experiencia contigo. Usa Cambio de UX para ver esa cadena DEMO.',
      nodo: 'Como coordinador separaría contexto, memoria y permisos por proyecto y asignaría un único responsable por tarea.',
      lupa: 'Como QA pediría una ruta reproducible, el resultado esperado y evidencia de la versión que se está probando.'
    };
    const reply = `DEMO · respuesta predefinida, no generada por un modelo. ${templates[input.agentId]}`;
    emit('message.received', { reply }, { agentId: input.agentId, projectId: input.projectId });
    return { reply, mode: 'demo' };
  }
  function createRequest(input) {
    if (!input || typeof input !== 'object' || !projects.some(p => p.id === input.projectId)) throw new InputError('Proyecto desconocido.');
    const description = textField(input.description, 'description', 2000);
    if (tasks.length > 495 || requests.length >= 50) throw new InputError('Límite de solicitudes demo alcanzado.', 409);
    let acceptanceCriteria = ['Conservar la intención y el proyecto de la solicitud original en cada traspaso.', 'Proponer un flujo comprensible y registrar verificación de código, QA y validación UX.'];
    if (input.acceptanceCriteria !== undefined) {
      if (!Array.isArray(input.acceptanceCriteria) || input.acceptanceCriteria.length < 1 || input.acceptanceCriteria.length > 10) throw new InputError('acceptanceCriteria requiere de 1 a 10 criterios.');
      acceptanceCriteria = input.acceptanceCriteria.map(c => textField(c, 'criterio', 300));
    }
    const request = { id: randomUUID(), projectId: input.projectId, description, acceptanceCriteria, status: 'active', stageIndex: 0, taskIds: [], evidence: [], createdAt: new Date().toISOString() };
    const stages = [
      ['ux', 'ux.brief', 'UX: interpretar petición y flujo'],
      ['atlas', 'plan', 'Atlas: planificar el cambio de código'],
      ['pixel', 'implement', 'Pixel: implementar la tarea'],
      ['lupa', 'qa', 'Lupa: verificar criterios y evidencia'],
      ['ux', 'ux.validate', 'UX: validar experiencia y devolver resultado']
    ];
    let previousId;
    for (const [agentId, stage, title] of stages) {
      const task = { id: randomUUID(), title, agentId, projectId: input.projectId, status: previousId ? 'proposed' : 'assigned', summary: 'Cadena DEMO coordinada por Nodo. No ejecuta agentes.', requestId: request.id, dependsOn: previousId ? [previousId] : [], stage, acceptanceCriteria: [...acceptanceCriteria], evidence: [] };
      tasks.push(task);
      request.taskIds.push(task.id);
      previousId = task.id;
      emit('task.created', { task: structuredClone(task) }, { taskId: task.id, agentId, projectId: input.projectId });
    }
    requests.push(request);
    emit('request.created', { request: structuredClone(request), coordinator: 'nodo' }, { agentId: 'nodo', projectId: input.projectId });
    return { request: structuredClone(request), tasks: tasks.filter(t => t.requestId === request.id).map(t => structuredClone(t)), mode: 'demo' };
  }
  function advanceRequest(id) {
    const request = requests.find(r => r.id === id);
    if (!request) throw new InputError('Solicitud no encontrada.', 404);
    if (request.status === 'done') throw new InputError('La cadena demo ya terminó.', 409);
    const current = tasks.find(t => t.id === request.taskIds[request.stageIndex]);
    if (current.dependsOn.some(dep => tasks.find(t => t.id === dep)?.status !== 'done')) throw new InputError('Dependencias sin terminar.', 409);
    const evidence = `DEMO · fase ${request.stageIndex + 1}: traspaso manual ${current.stage}. No hay código, prueba ni validación UX real ejecutada.`;
    current.status = 'done';
    current.summary = evidence;
    current.evidence.push(evidence);
    request.evidence.push(evidence);
    emit('task.updated', { task: structuredClone(current), previousStatus: 'assigned' }, { taskId: current.id, agentId: current.agentId, projectId: request.projectId });
    if (request.stageIndex === request.taskIds.length - 1) request.status = 'done';
    else {
      request.stageIndex++;
      const next = tasks.find(t => t.id === request.taskIds[request.stageIndex]);
      next.status = 'assigned';
      emit('task.updated', { task: structuredClone(next), previousStatus: 'proposed' }, { taskId: next.id, agentId: next.agentId, projectId: request.projectId });
    }
    emit('request.updated', { request: structuredClone(request), coordinator: 'nodo' }, { agentId: 'nodo', projectId: request.projectId });
    return { request: structuredClone(request), tasks: tasks.filter(t => t.requestId === id).map(t => structuredClone(t)), mode: 'demo' };
  }
  return { snapshot, createTask, advanceTask, createRequest, advanceRequest, message, events, listeners };
}
