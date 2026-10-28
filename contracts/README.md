# Contrato HTTP del estudio, v1

Es una API propia; no implica que Hermes tenga estas rutas. El adaptador de
conversación real traduce el protocolo JSONL oficial a estos eventos.

## Conversación real en v0.2

`POST /api/messages` requiere `agentId`, `projectId: "studio"`, `message` y un
`clientMessageId` único de 8–100 caracteres alfanuméricos, guion o guion bajo.
Espera el resultado de Hermes y devuelve `mode: "real"`, `reply`, `runId`,
`sessionId`, `model` y `tokens`. No reintenta. Un mismo ID y payload reutiliza
el resultado durante el proceso; reutilizarlo para otro payload devuelve 409.
Sólo se admite un turno concurrente; un segundo devuelve 409.

`GET /api/studio` incluye historiales locales por agente y el turno activo.
SSE emite `run.started`, `message.delta`, `agent.status`, `run.completed` y
`run.failed`. Los deltas de conversación se envían sólo al navegador local;
el registro de actividad muestra estados, sin copiar el texto a sus entradas.
El historial se persiste, pero los IDs SSE y la deduplicación son del proceso.
Una desconexión requiere refrescar el snapshot; no volver a enviar el mensaje
automáticamente. Los endpoints de tareas y solicitudes devuelven 409.

## Medios privados en v0.3

- `GET /api/media`: `{items}` con ID, título, agente, tipo, procedencia y URL local.
- `POST /api/media?agentId=prisma&title=...`: cuerpo binario, hasta 25 MB;
  PNG/JPEG/WebP/GIF/MP4/WebM identificados por firma. Devuelve `{asset}`, HTTP 201.
  El modo real es obligatorio. Host y Origin se validan igual que en el chat.
- `GET|HEAD /api/media/:id/content`: contenido con tipo explícito, CSP aislada y
  `Accept-Ranges: bytes`. Un rango válido devuelve 206; inválido, 416.
- `source: hermes`: imagen creada a partir de primitivas validadas de un bloque
  `studio-media` del resultado del modelo. `source: upload`: adjunto del usuario.
- `artifact.created`: `data.asset`, agente y proyecto `studio`; la UI selecciona
  ese resultado en la TV. La conversación incluye los assets aceptados.

El bloque declara `title`, `width`, `height`, `background`, `elements`. Se admiten
rect, circle, ellipse, line, path y text; no HTML/SVG libre, scripts ni URLs.
Máximo 120 elementos, dimensiones 128–1920, título 140 caracteres. La galería
conserva hasta 200 entradas en `.runtime/hermes-office/media/`, sin rutas privadas
en la respuesta HTTP. Los vídeos requieren un códec que reproduzca el navegador;
el servidor no convierte ni sintetiza vídeo.

## Uso de Codex en v0.4

`GET /api/codex-usage` requiere modo real y conserva las restricciones Host/Origin.
Devuelve `status`, `source`, `fetchedAt`, `tokens.lifetime`, `tokens.latestDay`
(date/tokens), y `buckets` con ventanas de porcentaje utilizado/disponible,
duración y reinicio. Un dato ausente es `null`, no cero. No se convierte cuota
en un conteo de tokens. `stale: true` identifica una lectura anterior tras fallo.
`?refresh=1` solicita refresco, limitado a uno cada 15 s; caché normal de 60 s.
No admite comandos, modelos, perfiles ni métodos RPC proporcionados por el cliente.

## Modo de regresión explícito (contrato histórico)

La tabla y las simulaciones siguientes documentan únicamente `STUDIO_MODE=demo`.

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
