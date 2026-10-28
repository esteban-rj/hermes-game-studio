# Verificación de la base v0.1

Fecha local: 27 de octubre de 2026. Entorno observado: Windows, Node.js 24.22.1. Verificación sobre los archivos finales de esta entrega, sin instalar paquetes ni iniciar inferencia.

| Comprobación | Resultado observado |
| --- | --- |
| node scripts/check.mjs | PASS: sintaxis JS y JSON; frontend buildless |
| node --test | PASS: 5/5 pruebas, incluidas HTTP/SSE y cadena UX con dependencias |
| Navegador local | PASS: interfaz renderiza, seis personajes/mesas y sin errores/warnings de la aplicación |
| Proximidad | PASS: caminar desde entrada hasta mesa de Vera y pulsar E selecciona a su ocupante y muestra nombre/rol |
| Avatar personalizado | PASS: frente, espalda y ambos perfiles comprobados en la oficina; desplazamiento, colisión e interacción E conservados; los seis NPC mantienen su dibujo |
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
