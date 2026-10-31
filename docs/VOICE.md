# Codex y voz: propuesta de integración

## Codex como herramienta de código

Proponemos que Hermes solicite trabajo de código al backend y éste use Codex App Server. El protocolo documentado permite iniciar un proceso local por stdio, hacer `initialize`/`initialized` y gestionar threads/turns y sus eventos. La versión instalada determina el esquema: verificarlo antes de implementar el adaptador. No se debe interpretar la UI de Codex como una API. [Documentación oficial](https://learn.chatgpt.com/docs/app-server).

En v0.1 sólo hay un diagnóstico opcional de handshake local, sin crear conversación ni llamar al modelo. No existen herramientas de Codex dentro de Hermes todavía. El adaptador futuro debe fijar cwd, sandbox, aprobaciones y cancelación; el backend conservará la relación taskId/runId/threadId. La disponibilidad del ejecutable o un login de la aplicación no prueba acceso a modelos o saldo.

## Central local implementada (v0.6)

Lina es una interlocutora de voz y un enrutador de nombres; no añade un LLM. El
texto dirigido a Camilo, Santi, Cata, Vale, Nico o Pipe usa el mismo backend de
Hermes y la misma política de suscripción. El audio se procesa en CPU con
[Faster Whisper](https://github.com/SYSTRAN/faster-whisper) y
[Piper](https://github.com/OHF-Voice/piper1-gpl), sin API de audio ni fallback.

Activa el micrófono y di «Camilo, ayúdame con…» o «Lina, llama a Cata». Una
llamada sin consulta abre al interlocutor y confirma la conexión con la voz de
Lina; la respuesta del agente sólo se reproduce cuando llega de Hermes. Puedes
continuar sin repetir el nombre. Las menciones dentro de una consulta no cambian
el interlocutor; dos destinatarios al inicio generan una aclaración. «Lina,
apaga el micrófono» detiene la captura. Colgar vuelve a esperar un nombre.

El navegador solicita getUserMedia sólo al pulsar Activar. MediaRecorder captura
segmentos de hasta 16 segundos con detección de silencio. El audio va al servidor
loopback, se procesa en memoria y se descarta. Sólo los mensajes dirigidos se
envían a Hermes y conservan el historial textual. La escucha se pausa durante
transcripción, respuesta y reproducción; no se ofrece interrupción verbal. El
botón Interrumpir audio detiene reproducción, sin cancelar un turno de Hermes.
Salir de la pestaña apaga el micrófono. Las respuestas/capturas viejas se descartan
al cambiar agente/proyecto o desactivar voz.

## Voces instaladas y preferencias

| Personaje | Voz inicial | Ritmo |
| --- | --- | --- |
| Lina | Daniela · femenina · es-AR | 1× |
| Camilo | Davefx · masculina · es-ES | 0.94× |
| Santi | Davefx · masculina · es-ES | 1.08× |
| Cata | Daniela · femenina · es-AR | 1.03× |
| Vale | Daniela · femenina · es-AR | 0.96× |
| Nico | Davefx · masculina · es-ES | 1× |
| Pipe | Davefx · masculina · es-ES | 0.98× |

El selector permite cambiar voz y ritmo libremente por personaje; el timbre no
limita su función o identidad. Muestras y respuestas son voz sintética, sin
clonación. Estas voces no tienen acento colombiano. El catálogo, los modelos y
MODEL_CARD originales se conservan junto a la instalación local; no se distribuyen
en el repositorio. Davefx usa dataset CC0 y Daniela OpenSLR 61 (CC BY-SA 4.0),
según sus fichas publicadas en el repositorio Piper Voices.

## Permisos y persistencia

Los mensajes hablados llevan source=voice. En proyectos usan perfiles
`office-voice-<proyecto>-<agente>`, sesiones separadas y un MCP restringido a
lectura, incluido Git status/diff. No se publica write_file y el ejecutor rechaza
la llamada aunque se invoque por nombre. El diálogo mantiene el mismo historial
visible y recibe contexto reciente sólo del mismo agente/proyecto. Los mensajes
por texto mantienen sus permisos de edición. No hay ejecución por comandos.

`lib/voice.mjs` inicia sólo el Python registrado y el worker fijo, sin shell ni
rutas del cliente. Limita audio a 3 MB, texto TTS a 1800 caracteres, voces permitidas,
una operación por proceso y 90 s. Whisper/Piper se ejecutan offline; no heredan
claves API. El proceso se descarga tras dos minutos sin uso. Las rutas HTTP
conservan las comprobaciones de Host/Origin y no guardan audio en disco.

Instala con `scripts/setup-voice.ps1`; el registro privado es
`.runtime/voice-install.local.json`. Se fija PyAV <19 para evitar la
[incompatibilidad de Faster Whisper 1.2.1](https://github.com/SYSTRAN/faster-whisper/issues/1589).

## Alternativas de voz

- Web Speech / voces del sistema: depende del navegador y de los paquetes instalados;
  localService distingue voces locales/remotas. En este equipo sólo se detectaron
  voces SAPI en inglés, por eso no son la opción inicial.
- Piper: añadir otros modelos publicados en español permite ampliar los timbres;
  revisar su ficha/licencia antes de distribuirlos. No se clonan voces del usuario.
- OpenAI Realtime / GPT-Live: otra integración para voz más fluida, pendiente y
  desactivada. Requiere configuración de API y presupuesto. Los
  [créditos de API para suscriptores elegibles](https://developers.openai.com/api/docs/guides/chatgpt-api-credits)
  deben vincularse/activarse; este estudio no presupone que estén disponibles ni
  inicia consumo de audio API. Ver [Audio y voz](https://developers.openai.com/api/docs/guides/audio).
