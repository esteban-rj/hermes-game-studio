# Hermes Game Studio

Oficina vectorial local para conversar con seis perfiles de **Hermes Agent**.

**v0.6 · Lina, central de voz local.** Agentes animados, un mundo de 1660 × 1080,
cámara con seguimiento y zoom, y una sala con sofá y TV para resultados reales.
El backend ejecuta Hermes con tu suscripción
ChatGPT/Codex y muestra su respuesta en streaming. Los errores se muestran sin
sustituirlos por respuestas predefinidas. Cada agente conserva su sesión e historial.

La oficina usa colores oscuros, cielo nocturno y lámparas cálidas. Un agente
inactivo duerme con ZZZ; mientras Hermes procesa su petición, se sienta en la
mesa, mueve sus herramientas y enciende monitor y luz de trabajo. Al terminar
o fallar vuelve a descansar. El estado procede del runtime, sin actividad fingida.

Una segunda TV muestra actividad real de tokens de Codex y cuota disponible.
Se amplía tocándola o con «Codex» en la barra. Usa el CLI Codex autenticado que
ya exista en PATH, mediante consultas oficiales de sólo lectura: no crea turns,
no solicita modelos ni consume resets. Es opcional; sin CLI o datos disponibles
se indica la ausencia. Tokens acumulados y último día publicado son métricas de
la cuenta, separadas de los porcentajes de cuota. La lectura se refresca cada
minuto con la página visible; muestra hora y antigüedad si falla la actualización.

## Iniciar

Requiere Node.js >=22, Hermes v0.22.5 instalado y autenticado, y el registro privado
`.runtime/hermes-install.local.json`. Una copia nueva necesita su instalación y
registro propios; no se distribuyen credenciales ni binarios.

```powershell
.\scripts\use-hermes.ps1 -Action Version
.\scripts\use-hermes.ps1 -Action Login
node server.mjs
```

También puedes ejecutar `Launch.ps1`. Abre **http://127.0.0.1:4317**. El inicio
normal usa Hermes real. Si falta instalación o autenticación, falla con una
explicación y no vuelve a una simulación. `STUDIO_PORT` permite cambiar el puerto.

Muévete con WASD/flechas, la cruceta táctil o tocando el suelo. Pulsa E cerca de
una mesa, o elige un agente en la lista. En móvil, el chat abre un panel inferior.
Arrastra para explorar; pellizca o usa +/− para acercar. El botón de ubicación
recupera el seguimiento y el de mapa muestra toda la oficina. «Sala TV» lleva al
personaje hasta el sofá siguiendo una ruta que evita muebles.
Escribe un mensaje; Enter envía y Shift+Enter añade una línea. Sólo se admite un
turno a la vez. El perfil muestra modelo, runtime y herramientas disponibles.

## Equipo

| Agente | Función | Modelo | Razonamiento |
| --- | --- | --- | --- |
| Camilo | Arquitectura y planificación | gpt-6.1-sol | high |
| Santi | Implementación | gpt-6.1-sol | medium |
| Cata | Dirección visual | gpt-6.1-terra | medium |
| Vale | Diseño UX | gpt-6.1-terra | medium |
| Nico | Coordinación | gpt-6-luna | low |
| Pipe | QA | gpt-6.1-sol | high |

Los nombres visibles son Camilo, Santi, Cata, Vale, Nico y Pipe. Los IDs técnicos
`atlas`, `pixel`, `prisma`, `ux`, `nodo` y `lupa` se conservan para mantener
compatibilidad con perfiles CLI, sesiones, memoria y resultados existentes.

El máximo es **Sol 6.1**. No hay escalada a Astra ni fallback a API de pago.
La autenticación no garantiza acceso a todos los modelos; cada perfil se verifica
con su primera respuesta real. [Política de modelos](docs/SUBSCRIPTION.md).

## Alcance

La oficina conecta conversación, memoria y planificación con Hermes real.
El archivador de la escena y el botón bajo la oficina muestran proyectos,
carpetas originales, worktrees y agentes autorizados. Elige «Trabajar en este
proyecto» antes de conversar. Cada proyecto × agente tiene memoria, sesión e
historial propios. La conversación general conserva sus mensajes anteriores.

El MCP local del estudio permite listar, leer y editar texto UTF-8 de hasta
512 KB, además de consultar status y diff de Git local. Valida rutas finales y
rechaza rutas externas, enlaces, credenciales y metadatos Git. Para editar exige
el sha256 de la lectura anterior y guarda copia privada del original. No hay
terminal, builds, borrado, commits, push o navegador desde la oficina.
Los errores se muestran y no se sustituyen por respuestas simuladas.

Pide a un agente un gráfico para la TV: su composición declarativa se valida y
renderiza como SVG, y aparece en la pantalla, galería y conversación. También
puedes adjuntar PNG/JPG/WebP/GIF o MP4/WebM de hasta 25 MB. Los adjuntos se
identifican como tales; no se atribuyen a generación de Hermes. El reproductor
incluye controles, vista ampliada y rangos HTTP para buscar dentro del vídeo.
La compatibilidad de códecs depende del navegador; se ofrece descarga si falla.
Esta conexión no sintetiza vídeos ni usa un servicio de imágenes de pago.

Los gráficos se construyen con primitivas permitidas; no se ejecuta HTML/SVG
arbitrario del modelo. Los archivos y el índice quedan bajo `.runtime`, fuera
de Git. Ver [contrato de medios](contracts/README.md).

Para registrar carpetas y preparar worktrees explícitos, consulta
[PROJECTS.md](docs/PROJECTS.md). Sus nombres y rutas reales permanecen en
configuración privada. El despacho automático del flujo UX sigue pendiente.

El adaptador usa el protocolo JSONL oficial de Hermes: `chat --query-file -
--oneshot --format stream-json`. Envía el prompt por stdin, fija perfil, proveedor,
modelo y razonamiento, y reanuda por ID de sesión. No interpreta logs humanos
como respuestas. Los eventos del estudio muestran inicio, fragmentos y resultado.

Máximo cuatro iteraciones en conversación general y ocho con archivos de proyecto,
con 90 segundos de presupuesto nativo por turno. El
cliente espera hasta 180 segundos por arranque/transporte. Una desconexión no
acredita cancelación del turno nativo: no hay reintentos automáticos ni botón de
cancelación. La deduplicación por ID dura la ejecución del servidor; no cubre un
reinicio durante una petición. [Integración y límites](docs/HERMES.md).

El historial de la oficina vive en `.runtime/hermes-office/`, ignorado por Git.
Hermes conserva memoria y sesiones en su home privado. Credenciales, fotos
originales, conversaciones y datos de videojuegos no se versionan.

## Verificación

```powershell
node scripts/check.mjs
node --test
```

Las pruebas automáticas usan fixtures sin inferencia. La prueba manual pedida por
el usuario usa su suscripción y se registra en [VERIFICATION.md](docs/VERIFICATION.md).
La simulación antigua se conserva para regresión y exige `STUDIO_MODE=demo` explícito.


## Conversar por voz

Lina enruta la voz a los seis agentes; no añade otro LLM. Activa el micrófono y
di «Camilo, ayúdame con…» o «Lina, llama a Cata». La primera forma envía la
consulta; la segunda abre la llamada y espera tu siguiente frase. Durante la
llamada puedes seguir sin repetir el nombre. «Lina, apaga el micrófono» detiene
la captura. Los botones Interrumpir audio y Colgar están en la central.

El audio se reconoce en este equipo con Whisper base y se reproduce con Piper.
No se envía a una API de audio, no se graba en disco y no hay fallback a la nube.
Sólo el texto dirigido a un agente llega a Hermes con la suscripción existente.
El micrófono arranca apagado, se pausa mientras procesa/responde y se apaga al
salir de la pestaña. Es diálogo por turnos, sin escucha durante la respuesta.

La conexión hablada a proyectos es sólo lectura: su MCP no ofrece write_file.
Usa otro perfil/sesión nativo para fijar estos permisos, con el mismo historial
visible y contexto reciente del mismo agente/proyecto. Las ediciones se solicitan
por texto. Cambiar de agente o proyecto descarta capturas/respuestas de voz viejas.

«Voces» permite escuchar muestras y elegir voz y ritmo por personaje. Davefx es
masculina (España); Daniela es femenina (Argentina). Los valores por defecto
se pueden intercambiar libremente. Las preferencias permanecen en el navegador.

Instalación explícita opcional (Python >=3.11; CPU):

```powershell
.\scripts\setup-voice.ps1
```

Los modelos y paquetes van en una carpeta local de Codex, fuera de Git. Se fija
PyAV <19 por su compatibilidad con Faster Whisper 1.2.1. Requiere reiniciar el
servidor después de instalar. Sin motor instalado la oficina textual sigue
funcionando y la UI explica que la voz está deshabilitada. Ver [VOICE.md](docs/VOICE.md).
