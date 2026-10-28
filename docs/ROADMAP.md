# Plan y criterios de aceptación

## Fase 0: base revisable de esta entrega

Oficina con seis mesas/agentes, movimiento por proximidad, estados de voz demo, tareas demo y respuestas fijas claramente señaladas. Cadena UX → planeación → implementación → QA → validación UX conserva una sola solicitud. Servidor local, contrato HTTP/SSE y perfiles Hermes versionables. Pruebas locales sin inferencia. Repositorio nuevo separado de los juegos.

Aceptación: se puede abrir sin paquetes externos, seleccionar cualquier agente, crear una tarea en un proyecto, verla por SSE y avanzar hasta done con etiqueta demo. Un mensaje no inicia procesos. Claves y datos operativos no aparecen en Git.

## Fase 1: un agente real, lectura solamente

Elegir Windows nativo o un entorno ya preparado; instalar Hermes con su guía oficial y fijar la revisión. El diagnóstico de esta entrega no instala nada. Elegir proveedor/modelo realmente disponible y un techo de gasto. Preparar un home Atlas por proyecto, sin memoria ni credenciales compartidas. Implementar adaptador y tarea: resumir arquitectura de un único repositorio de juego sin editarlo.

Aceptación: run con ID, proyecto y perfil, estado real, resultado con referencias verificables, coste o uso observado, timeout y cancelación probados. Sin clave/presupuesto, el run se rechaza. La demo continúa disponible y distinguible. Revisar el modelo económico frente al fuerte con 3–5 tareas representativas antes de decidir rutas permanentes.

## Fase 2: primera implementación en un juego

Elegir una mejora pequeña en Juego A o Juego B. Atlas entrega plan y criterios; Pixel trabaja en un worktree del juego; Lupa verifica el diff y la escena. Integrar Codex App Server como herramienta si ofrece valor para código. No añadir todos los roles al primer run.

Aceptación: sólo cambia el worktree autorizado; motor y versión identificados; importación/build/pruebas documentadas más inspección visual cuando corresponda; artefactos y limitaciones registrados; se puede cancelar; ninguna tarea termina únicamente porque el implementador afirma que funcionó. Publicar o fusionar según la autorización del usuario para ese juego.

## Fase 3: coordinación, arte y workers

Nodo coordina dependencias, locks y traspasos sobre un tablero Kanban nativo por juego, previa validación de versión y capacidades. Evitar duplicar su registro durable; el backend adapta sus eventos y añade permisos. Prisma añade guía visual, especificación de assets, procedencia y control de tamaño/licencia; no genera arte definitivo de la persona sin foto. Introducir workers Docker para builds sólo si aportan aislamiento/reproducibilidad. Escritorio con un lock por sesión.

Aceptación: dos tareas en juegos distintos no comparten memoria ni permisos; fallo/reintento conserva trazabilidad; límites de coste y concurrencia se aplican en código; asset importado y revisado en el motor del proyecto; QA independiente con evidencia.

## Fase 4: voz, avatar y experiencia

El avatar personal y sus cuatro orientaciones ya están integrados en Canvas. Para voz: primero transcripción sobre el agente textual y síntesis; evaluar Realtime si la latencia exige conversación continua. La voz identifica agente/proyecto, puede interrumpir y pide aclaración para órdenes ambiguas. Las confirmaciones de acciones con efectos deben mostrar el texto entendido y su alcance.

Aceptación: micrófono sólo con acción del usuario, claves sólo backend, interrupción cancela audio y run correspondiente, no se ejecuta dos veces una orden, presupuesto y retención configurados. No asumir que la sesión de voz de Codex sea una API embebible.

## Decisiones pendientes

Proveedor/modelos y techo de gasto; versión/instalación de Hermes; primer juego piloto y tarea; aplicaciones/herramientas que el puente puede abrir; política de aprobación para commits/push de los juegos; dirección visual final; STT/TTS o Realtime. Ninguna impide revisar la demo actual.
