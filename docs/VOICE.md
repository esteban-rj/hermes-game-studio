# Codex y voz: propuesta de integración

## Codex como herramienta de código

Proponemos que Hermes solicite trabajo de código al backend y éste use Codex App Server. El protocolo documentado permite iniciar un proceso local por stdio, hacer `initialize`/`initialized` y gestionar threads/turns y sus eventos. La versión instalada determina el esquema: verificarlo antes de implementar el adaptador. No se debe interpretar la UI de Codex como una API. [Documentación oficial](https://learn.chatgpt.com/docs/app-server).

En v0.1 sólo hay un diagnóstico opcional de handshake local, sin crear conversación ni llamar al modelo. No existen herramientas de Codex dentro de Hermes todavía. El adaptador futuro debe fijar cwd, sandbox, aprobaciones y cancelación; el backend conservará la relación taskId/runId/threadId. La disponibilidad del ejecutable o un login de la aplicación no prueba acceso a modelos o saldo.

## Dos rutas para voz

1. **STT → Hermes → TTS:** mantiene una conversación textual canónica y facilita asociar cada orden a agente/proyecto. Es la primera ruta propuesta para el estudio.
2. **Realtime/WebRTC:** puede dar conversación más fluida. La aplicación backend emite credenciales efímeras; una clave API estándar permanece en el servidor. Las herramientas de voz deben enviar las tareas al backend/Hermes con el mismo alcance y aprobaciones. [Guía oficial WebRTC](https://developers.openai.com/api/docs/guides/voice-webrtc?voice-api=realtime).

La voz integrada en la aplicación Codex puede servir para conversar con el usuario durante el desarrollo. No se presupone que esa sesión se pueda capturar o incrustar en una oficina propia. Proveedor, modelos de audio, permisos del micrófono y coste se configurarán por separado.

Cada agente ocupa una mesa. La proximidad ofrece interacción; pulsar E abre a ese ocupante y el panel conserva el nombre del agente activo. La voz real se iniciará con pulsar-para-hablar, nunca sólo por caminar cerca. Estados previstos: listening → thinking → speaking, además de desconectada/error. Cambiar de mesa, agente o proyecto debe cancelar la captura/reproducción y dar foco al nuevo interlocutor; una respuesta antigua no puede enviarse al siguiente agente.

En esta demo voz=false. «Probar voz · DEMO» representa escucha/respuesta con texto y temporizadores cancelables, sin micrófono ni audio real. No sube audio ni sintetiza respuestas. Al implementar voz, establecer retención, reproducción/cancelación, transcripción visible y tratamiento de órdenes ambiguas antes de permitir efectos sobre archivos o aplicaciones.
