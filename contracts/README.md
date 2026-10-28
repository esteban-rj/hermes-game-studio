# Contrato HTTP del estudio, v1

Es una API propia. No implica que Hermes tenga estas rutas. El adaptador real futuro deberá traducir su resultado a estos eventos.

| Ruta | Entrada | Salida |
| --- | --- | --- |
| GET /api/health | — | ok, mode, version |
| GET /api/studio | — | mode, agents, projects, tasks, capabilities |
| GET /api/events | Last-Event-ID opcional | SSE; un evento JSON por `data:` |
| POST /api/messages | agentId, projectId, message (1–4000 caracteres) | reply, mode |
| POST /api/tasks | agentId, projectId, title (1–160 caracteres) | task, mode; HTTP 201 |
| POST /api/tasks/:id/advance | `{}` | task, mode; sólo demo manual |
| POST /api/requests | projectId, description (1–2000); acceptanceCriteria opcional (1–10 criterios, cada uno 1–300) | request, tasks, mode; HTTP 201 |
| POST /api/requests/:id/advance | `{}` | request, tasks, mode; simula un traspaso UX |

POST requiere JSON. Entrada inválida devuelve 400, tipo incorrecto 415, desconocido 404, transición terminada 409. Sólo escucha 127.0.0.1; rechaza Host ajeno y Origin distinto. No tiene autenticación multiusuario: no exponer por red ni proxy.

Transición demo: `assigned → running → review → done`. `done` significa que el usuario avanzó una simulación, sin evidencia de trabajo. El runtime real requerirá evidencia y revisión para finalizar, además de estados blocked/cancelled/proposed. El endpoint advance será exclusivo de demo; el adaptador real derivará los estados de ejecuciones verificadas.

La cadena UX crea cinco tareas enlazadas por requestId y dependsOn: ux.brief → plan → implement → qa → ux.validate. Conserva una descripción inmutable y los mismos criterios, projectId y taskIds. Nodo simula la coordinación: termina la fase actual y asigna la siguiente sólo cuando se cumplieron las dependencias. Las tareas vinculadas rechazan el avance individual. La evidencia de esta demo es un texto que declara que no se ejecutaron código/pruebas; no debe convertirse en evidencia real. GET /api/studio incluye requests y SSE emite request.created/request.updated.

SSE conserva los últimos 100 eventos y secuencias sólo durante este proceso. No es una cola durable. Si se reconecta o faltan eventos, refrescar GET /api/studio. Un reinicio borra datos demo e IDs de eventos; no reanudar un run real usando esta implementación. No emitir prompts completos, secretos ni conversaciones en el canal de actividad global.

Los JSON Schema documentan el sobre y las tareas. La demo valida entradas y estados en lib/demo.mjs; no incluye un validador genérico JSON Schema. El check local valida sintaxis y referencias; los tests verifican payloads y flujo. Al conectar un runtime se añadirá validación completa, versiones y migraciones.

Ejemplo de evento real futuro, sin afirmar implementación:

```json
{
  "schemaVersion": 1,
  "id": "event-uuid",
  "timestamp": "2026-10-27T20:00:00Z",
  "type": "run.completed",
  "mode": "real",
  "projectId": "juego-b",
  "agentId": "pixel",
  "taskId": "task-uuid",
  "runId": "run-uuid",
  "data": { "summary": "Resultado revisable", "evidence": ["worktree-relative-path"] }
}
```
