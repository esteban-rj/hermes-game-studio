# Oficina con conversaciones reales

La v0.2 conserva la oficina Canvas y los personajes originales. La interfaz normal
se conecta a Hermes mediante el backend local del estudio.

1. Inicia `node server.mjs` o `Launch.ps1` y abre http://127.0.0.1:4317.
2. Comprueba el indicador HERMES CONECTADO y el espacio del estudio.
3. Selecciona un agente en la lista, o camina con WASD/flechas hasta su mesa y pulsa E.
4. Escribe un mensaje. La tarjeta cambia a Pensando y muestra la respuesta en streaming.
5. Cambia de agente: cada uno tiene su conversación. Al recargar, se recupera el
   historial local y el próximo turno reanuda la sesión nativa por ID.
6. En Perfil, consulta modelo, runtime y herramientas disponibles.

Sólo se admite un turno a la vez. Puedes cambiar de personaje mientras otro
responde; el envío queda deshabilitado hasta terminar. Los errores de Hermes se
muestran como mensajes del estudio, no como respuestas inventadas del personaje.

El cliente muestra texto sin interpretar HTML de mensajes o respuestas. Tiene
selección por botones, controles táctiles y foco visible. Enter envía mensajes;
Shift+Enter añade una línea. El mapa conserva colisiones y las seis mesas.

La voz, las misiones simuladas y la cadena UX simulada se ocultan en modo real.
Desde esta oficina están disponibles conversación, memoria y planificación.
La programación de juegos utiliza el flujo CLI separado de PROJECTS.md.

El avatar y los agentes comparten el motor de sprites de Canvas, con paletas y
accesorios propios. La foto original no se incluye en el proyecto.

QA debe comprobar respuesta real, continuidad de sesión, cambio entre agentes,
recuperación tras recarga, estado durante un turno y errores del runtime. Los
tests automáticos usan fixtures; VERIFICATION.md registra la evidencia observada.
