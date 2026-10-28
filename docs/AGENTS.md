# Equipo propuesto y contrato de trabajo

Los nombres son personajes del estudio, no modelos ni proveedores. Las
identidades completas, entradas/salidas, disciplina de contexto, aceptación y
escalamiento están versionadas en `hermes/profiles/<id>/SOUL.md` y
`hermes/agents.json`. Ningún rol tiene un runtime activo en este prototipo.

La selección actual usa la suscripción ChatGPT/Codex, con **Sol 6.1 como máximo**:
Atlas, Pixel y Lupa con Sol 6.1; Prisma y Vera con Terra 6.1; Nodo con Luna.
Ver [política aplicada al preparador y conexión pendiente](SUBSCRIPTION.md).

| ID | Personaje | Trabajo | Criterio de selección |
| --- | --- | --- | --- |
| ux | Vera, diseñadora turquesa | Flujos, interacción, accesibilidad y aceptación UX | Razonamiento de diseño; validar contra intención y criterios |
| atlas | Cartógrafo violeta | Arquitectura, planes y decisiones | Razonamiento fuerte; probar calidad con decisiones del motor |
| pixel | Mecánico azul | Implementación acotada y pruebas | Código económico; escalar a Atlas si requiere rediseño |
| prisma | Artista coral | Personajes, mapas, assets y coherencia | Modelo multimodal y herramientas visuales compatibles |
| nodo | Anfitrión verde | Despacho, dependencias y estado | Enrutamiento económico; no reinterpreta permisos |
| lupa | Explorador amarillo | Aceptación y defectos reproducibles | Verificación suficiente para el motor y herramientas reales |

Nodo reduce conflictos de asignación y conserva el vínculo entre petición y
resultado. Lupa aporta una revisión independiente de Pixel y Prisma. Inicialmente
pueden correr por turnos; no necesitan seis modelos activos permanentemente.
La elección final depende de acceso, latencia, coste y una pequeña evaluación del
juego. No suponemos acceso a un modelo por verlo en un catálogo de la app.

El estudio es agnóstico al juego y al motor. Cada tarea debe descubrir y confirmar
el motor, sus comandos y convenciones en el proyecto autorizado. Rutas reales,
repositorios, versiones del juego, escenas y mecánicas se guardan sólo en estado
local ignorado o se pasan como contexto de esa tarea; no pertenecen al catálogo
global de identidades ni a las plantillas versionadas.

## Un paquete por tarea

Cada asignación debe incluir `projectId`, `taskId`, agente responsable, objetivo,
criterios observables, entradas con rutas/revisión, workspace autorizado,
dependencias, presupuesto y permiso de herramientas. Cada entrega debe incluir
resultado, artefactos, evidencia de validación, límites y siguiente paso.

La cadena principal es **UX (Vera) → Atlas → Pixel → Lupa → UX (Vera)**.
Vera abre el flujo y cierra la validación de intención; Prisma recibe los paquetes
de arte y assets. UX es un rol distinto del trabajo visual de Prisma.
Nodo fija el proyecto y coordina dependencias y conflictos. Si hay cambios sobre
los mismos archivos, se serializan o se integran en worktrees separados.

Cada paso conserva `requestId`, petición original y criterios numerados, y añade
revisión Git, artefactos y evidencia. Una síntesis no puede cambiar la aceptación.
El retorno final a UX compara la implementación con esos criterios originales;
un rechazo concreto crea una corrección acotada o escala la decisión de producto.

## Comunicación finita y útil

El canal entre agentes es una tarea, una respuesta de aceptación, una evidencia o
un bloqueo que cambie una decisión. No hay sala de charla autónoma continua.
Como propuesta inicial: dos ciclos de revisión y dos tarjetas de seguimiento por
tarea; si no bastan, Nodo conserva evidencia y escala al usuario. El handoff debe
caber en 1200 palabras más enlaces a fuentes. El catálogo distingue estos límites
del estudio de la configuración nativa de Hermes.

La plantilla fija 20 iteraciones por turno, una repetición de API y profundidad
de delegación 1; no habilita el toolset de delegación ni el dispatcher Kanban.
Cada petición real necesita además un presupuesto monetario explícito con reserva
para herramientas y auxiliares. Su control corresponde al adaptador por construir:
las 20 iteraciones no son un límite de gasto ni una garantía de finalización.

## Reglas que deberá imponer el backend

- Un home por proyecto/agente y un escritor por home. No compartir bases de datos
  ni memoria entre `juego-a` y `juego-b`.
- Un worktree autorizado por tarea de edición. Ninguna identidad decide por sí
  misma ampliar rutas, montar discos o publicar resultados.
- Límites verificables de coste, tiempo y acciones; los límites escritos en la
  personalidad son pautas para el modelo, no un mecanismo de seguridad.
- Sólo las evidencias permiten pasar de revisión a completado. Un error,
  cancelación, presupuesto agotado o entorno ausente debe producir un bloqueo
  legible y conservar el trabajo recuperable.

El backend demo implementa el contrato visual de tareas, no estas garantías de
ejecución de agentes. Activar el runtime queda condicionado a verificarlas.
