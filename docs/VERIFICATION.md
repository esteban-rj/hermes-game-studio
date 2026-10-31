# Verificación del estudio

## v0.4 · noche, actividad real y TV de Codex · 28 de octubre de 2026

- Oficina con muebles oscuros, ventana nocturna, luna/estrellas y luz cálida.
- Seis agentes inactivos con ojos cerrados, cabeceo y ZZZ. El jugador conserva
  sus controles y animación independientes.
- Petición real a Atlas/Sol: se observaron `agent-figure selected working` y
  `vr-station is-working`, postura sentada, herramientas y luz encendidas.
  Tras la respuesta: `agent-figure selected sleeping` y escritorio sin actividad.
- TV secundaria y panel ampliado reciben métricas reales de Codex App Server:
  tokens acumulados, último día publicado y cuota con su propia ventana/reinicio.
  No se publican identificadores ni se confunde porcentaje con tokens.
- Panel comprobado a 1440 × 1000 y 390 × 844; cifras legibles y cierre por botón
  y Escape, sin mover al personaje detrás del diálogo.
- El protocolo ejecutado sólo inicializó y consultó `account/rateLimits/read`
  y `account/usage/read`. Sin threads, turns, modelos ni consumo de resets.
- 21/21 tests con fixtures; 25 archivos JSON/JS válidos. Incluyen normalización,
  privacidad, API no disponible, compatibilidad parcial, caché/deduplicación y
  rechazo de origen HTTP externo. Las pruebas automáticas no llaman modelos.

## v0.3 · oficina vectorial y sala de proyección · 28 de octubre de 2026

- SVG completo para habitación y siete personajes, con animaciones por rol y
  estados walking/working. Renderer Canvas anterior retirado.
- Viewports 390 × 844 y 1440 × 1000: selección, panel móvil, mapa, zoom y TV.
- Navegación móvil hasta la sala: personaje observado en x1320/y529 y cámara
  desplazada; el botón contextual pasó a «Ver la TV».
- Prisma, mediante Hermes/Terra real, produjo «Ideas en movimiento»; el servidor
  construyó su SVG y lo mostró en TV, galería y enlace dentro del chat.
- Subida desde selector de archivos comprobada. MP4 válido reproducido hasta
  0:05/0:05 en el visor móvil; un fixture WebM no reproducible mostró el fallo
  de códec. Se añadió explicación y descarga del original para estos casos.
- Clips temporales de QA retirados de la galería. El arte real de Prisma se conserva.
- 17/17 tests automáticos con fixtures, sin inferencia; 23 archivos JSON/JS válidos.
  Incluyen persistencia/atribución de gráficos, integración Hermes → historial →
  evento, deduplicación, rangos de vídeo, aislamiento y rutas sin colisiones.
- La emulación de viewport no acredita una prueba en hardware iOS/Android.

## v0.2 · conversaciones reales · 28 de octubre de 2026

- Inicio normal en modo real con Hermes v0.22.5 y OAuth de la suscripción.
- Nodo respondió mediante el CLI con `gpt-6-luna`.
- Atlas respondió desde la oficina web con `gpt-6.1-sol`; un segundo turno
  recordó el mensaje anterior usando la misma sesión nativa.
- Prisma respondió desde la oficina web con `gpt-6.1-terra` y su identidad visual.
- La UI mostró estado, respuesta y tokens reportados por Hermes. Las misiones y
  la voz simuladas no están disponibles en modo real.
- Tests sin inferencia: 12/12 PASS; sintaxis/JSON: 21 archivos PASS. Incluyen
  HTTP real con fixture, sesiones, persistencia, deduplicación, concurrencia,
  error sin sustitución y rechazo de operaciones simuladas.
- Historial y credenciales permanecen en rutas privadas ignoradas.
- Alcance: conversación, memoria y planificación. Sin terminal, Git, despacho
  de tareas de juegos ni voz desde la oficina. Una desconexión del CLI no
  acredita cancelación nativa; presupuesto de 90 s, sin reintento del backend.

Lo siguiente conserva el registro histórico de las entregas anteriores.

## Instalación Hermes y preparación Git local · 28 de octubre de 2026

- Instalador oficial Windows: PASS, canal estable v0.22.5, commit
  `bf0203a794a07aac3ff764972ab9087baa4e4f4e`.
- `scripts/use-hermes.ps1 -Action Version`: PASS, CLI inicia y reporta Hermes
  v0.22.5, Python 3.14.9 y OpenAI SDK 2.24.0.
- Seis perfiles nativos `studio-<agente>` creados desde las identidades del
  estudio, sin copiar credenciales. Configuración nativa validada con esquema 51.
- Login OpenAI por navegador/PKCE preparado. La finalización del OAuth y el acceso
  real al modelo son comprobaciones separadas. No se ejecutó inferencia.
- Preparador Git probado en repositorios fixture: dry-run sin escritura; creación
  desde commit; cambios fuente sin commit conservados; rechazo de destino existente
  y de checkout principal para habilitar herramientas locales.
- Planes de ambos proyectos locales comprobados en modo lectura. No se crearon
  worktrees, commits ni cambios en los repositorios de juegos durante la preparación.
- `node scripts/check.mjs`: PASS, 19 archivos JS/JSON. `node --test`: PASS, 8/8.
- Rutas reales y mapas de proyectos quedan en `.runtime/*.local.json`, ignorados.
  Los documentos y scripts versionados conservan IDs genéricos.
- La oficina permanece en DEMO. Instalar el CLI y preparar perfiles no implementa
  el adaptador, el sandbox ni el despacho autónomo desde la UI.

## Política de suscripción · 28 de octubre de 2026

- `node scripts/check.mjs`: PASS, 19 archivos JS/JSON.
- `node --test`: PASS, 8/8; incluye rechazo de Astra, modelos desconocidos y
  proveedores de API, y escalada autorizada a Sol 6.1.
- Preparación de los seis homes `studio`: PASS, proveedor `openai-codex`, modelos
  y razonamiento por rol, sin fallback, procesos ni copia de credenciales.
- `.runtime/hermes/studio/*` permanece ignorado por Git.
- Codex CLI 0.165.0-alpha.1.2 informó autenticación ChatGPT. No se imprimieron
  datos de cuenta ni tokens. Hermes no se encontró en PATH o launchers revisados.
- No hubo llamadas de inferencia ni comprobación de acceso efectivo a modelos.
  El servidor de la oficina continúa siendo DEMO.

## Evidencia anterior

Fecha local: 27 de octubre de 2026. Entorno observado: Windows, Node.js 24.22.1. Verificación sobre los archivos finales de esta entrega, sin instalar paquetes ni iniciar inferencia.

| Comprobación | Resultado observado |
| --- | --- |
| node scripts/check.mjs | PASS: sintaxis JS y JSON; frontend buildless |
| node --test | PASS: 5/5 pruebas, incluidas HTTP/SSE y cadena UX con dependencias |
| Navegador local | PASS: interfaz renderiza, seis personajes/mesas y sin errores/warnings de la aplicación |
| Proximidad | PASS: caminar desde entrada hasta mesa de Vera y pulsar E selecciona a su ocupante y muestra nombre/rol |
| Avatar personalizado | PASS: frente, espalda y ambos perfiles comprobados en la oficina; desplazamiento, colisión e interacción E conservados; los seis NPC mantienen su dibujo |
| Materiales cálidos | PASS: entorno renderizado con texturas deterministas y nombres legibles; recorrido hasta la mesa UX e interacción E comprobados, sin errores/warnings de la aplicación |
| Conversación | PASS: enviar mensaje a Pixel muestra respuesta predefinida marcada DEMO |
| Voz demo | PASS: entra en Escucha DEMO; cambiar a Pixel cancela y vuelve a Desconectada, sin micrófono/audio |
| Cadena UX | PASS: petición única conserva texto y criterios durante cinco traspasos; cierre y cinco registros marcados simulados |
| Separación UI | PASS: cambiar a Juego A oculta la solicitud del estudio y abre contexto de conversación propio |
| Preparación Hermes | PASS en fixture independiente: seis perfiles, materialización explícita, sintaxis PowerShell y rechazo de sobrescritura |
| Hermes instalado | No encontrado en PATH ni en los launchers comprobados. No se probó una conversación Hermes real |
| Codex App Server | CLI 0.164.0-alpha.11.1 encontrado; initialize confirmado en home de diagnóstico aislado, sin thread/start ni turn/start |
| Privacidad Git | .env, configuración local, .runtime, memorias y foto privada cubiertos por ignore; sin credenciales en fuentes |
| Generalización | Búsqueda sobre fuentes versionables: sin nombres, rutas, motores, versiones ni detalles copiados de los juegos inspeccionados |

Las primeras pruebas HTTP dentro del sandbox no podían conectar al loopback (EACCES); se repitieron con acceso al loopback y pasaron. El diagnóstico inicial de Codex no pudo usar su temporal global; el script usa ahora .runtime/codex-doctor y confirmó el handshake sin tocar la configuración global.

## Límites de esta verificación

La revisión visual cubrió el navegador de escritorio y la mesa UX. No es una matriz completa de navegadores, accesibilidad, dispositivos ni colisiones de todo el mapa. No hubo prueba de micrófono, audio, generación de assets, ejecución de aplicaciones, Kanban durable, tool calls Hermes, facturación ni trabajo real en repositorios de juegos. Los esquemas son documentación contractual y la demo tiene validación específica, no un motor JSON Schema genérico.

La evidencia demo nunca acredita código generado, pruebas del juego o aprobación UX real. Los homes preparados son fixtures; no se configuró proveedor/modelo operativo ni se copió autenticación. El handshake de Codex sólo comprueba el protocolo local y no demuestra acceso a modelos o saldo.

La ampliación del avatar usa dibujo Canvas nativo en un módulo exclusivo del jugador y en su mini retrato. Se revisó la interfaz sin errores/warnings y se repitieron las cinco pruebas y el check estático. La referencia original no se incorporó a los archivos del repositorio. La personalización visual está integrada; voz y Hermes continúan en modo demo/desconectados.

La revisión de materiales separa el entorno en public/room.js y conserva la lógica de movimiento, los obstáculos y los personajes. Se repitieron el check estático y las cinco pruebas después de integrarlo. La revisión visual detectó que los nombres centrados quedaban parcialmente ocultos por los ocupantes; se movieron al extremo del canto y se comprobó su legibilidad en la escena final. Las vistas previas anteriores se conservan con nombres distintos.

La revisión de personajes y objetos introduce un motor compartido de sprites con cuatro orientaciones, pasos y paletas por identidad. Los retratos se ampliaron para evitar recortes, y el punto de entrada se desplazó ligeramente para que el jugador no se solape con el agente UX. Se comprobaron desplazamiento cardinal, colisión con la mesa, interacción E y render de objetos/retratos en el navegador. Las cinco pruebas y el check estático pasaron. La renovación conserva el estado demo de Hermes y voz.


## v0.5 · Anime y archivador · 2026-10-30

Historia: abrir el archivador, elegir un proyecto local, conversar con un agente
con perfil propio y leer el worktree mediante MCP, mostrando la respuesta real.

| Límite del flujo | Evidencia |
| --- | --- |
| UI | SVG anime, archivador físico y botón accesibles; clic del mueble verificado después de excluirlo de la captura de arrastre de cámara |
| Selección → API | Proyecto activo y carpeta visibles; GET /api/studio con projectId devuelve sólo sus conversaciones |
| API → permisos | Dos worktrees autorizados, seis agentes por proyecto; doce accesos comprobados |
| Hermes → MCP | Nico usó project_info, list_files y read_file reales; respuesta final confirmó lectura del README del proyecto elegido |
| Respuesta → UI | Mensaje real visible en el chat y estado de agente inactivo al terminar |
| Móvil | 390 × 844: archivador, rutas envueltas y seis retratos; ancho de página 390, sin desborde horizontal |
| Regresión | 25 pruebas: permisos, rutas externas, enlaces, hash, respaldo, conflictos, sólo lectura, aislamiento de sesiones y geometría del mueble |

La primera lectura llegó a las herramientas pero alcanzó cuatro iteraciones:
el descubrimiento de herramientas también consume turnos. Los proyectos usan
ocho iteraciones y conservan 90 segundos. Hermes fija la política al crear la
sesión; cuando cambia ese límite, el adaptador conserva el ID previo y el
historial UI y crea otra sesión nativa, sin borrar memoria. La repetición real
terminó con respuesta de texto tras cuatro de ocho llamadas permitidas.

Las ediciones se verificaron en archivos temporales con fixtures; no se editó
código de los juegos durante esta prueba. No se verificaron builds ni terminal,
que no se ofrecen en este puente. Nombres/rutas reales, registros de herramientas
y conversaciones quedan en configuración y evidencia privadas ignoradas por Git.


## v0.6 · Lina y voz local · 2026-10-30

Historia verificada: audio en español → transcripción local → nombre del agente
→ mensaje real a Hermes → respuesta textual → síntesis local y reproducción.

| Límite del flujo | Evidencia |
| --- | --- |
| Audio → texto | Piper produjo una muestra con «Camilo»; Whisper transcribió la consulta real y el router identificó atlas |
| Texto → Hermes | POST /api/messages con source=voice; Camilo respondió con gpt-6.1-sol usando la suscripción existente |
| Hermes → audio | La respuesta se sintetizó en WAV válido sin API de audio; evidencia y muestras fuera de Git |
| UI → reproducción | Escuchar pasó por «Reproduciendo la voz sintética» a «Muestra finalizada», sin errores en consola |
| Permisos | Pruebas de conexión hablada con perfil/sesión distintos, historial visible compartido y escritura rechazada incluso con proyecto read-write |
| Móvil | Vista de 390 × 844; ancho útil y contenido de 375 px por scrollbar, sin desbordamiento horizontal |
| Regresión | 28 pruebas y check estático de 35 archivos JSON/JS |

La primera instalación detectó una incompatibilidad conocida de Faster Whisper
1.2.1 con PyAV 19. Se fijó av<19 y se verificó con PyAV 18.1.0; no se modificó
la instalación Python de Hermes ni se usó un proveedor cloud como sustitución.

No se activó ni escuchó el micrófono del usuario. El recorrido real usó una
muestra sintética en español. Queda al usuario conceder el permiso de micrófono
y comprobar su dispositivo/acústica. La escucha es por turnos, con silencio para
cerrar frases; no es una llamada de voz con interrupción simultánea. Las muestras
de verificación se guardaron explícitamente; el runtime descarta el audio del
micrófono y conserva sólo los mensajes textuales dirigidos a un agente.
