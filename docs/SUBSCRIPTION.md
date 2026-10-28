# Suscripción ChatGPT/Codex: selección del estudio

Decisión del usuario, 28 de octubre de 2026: usar su suscripción y limitar el
modelo máximo a **GPT-6.1 Sol**. La fuente es `config/model-routing.json`, una
política propia del estudio. `model-routing.example.json` continúa como ejemplo
genérico. La oficina continúa en DEMO y los perfiles aún no están conectados.

| Agente | Modelo inicial | Razonamiento |
| --- | --- | --- |
| Atlas | gpt-6.1-sol | high |
| Pixel | gpt-6.1-sol | medium |
| Prisma | gpt-6.1-terra | medium |
| Vera (ux) | gpt-6.1-terra | medium |
| Nodo | gpt-6-luna | low |
| Lupa | gpt-6.1-sol | high |

Sol 6.1 es la única escalada prevista. Astra, modelos desconocidos, proveedores
de API de pago y cambios automáticos de proveedor quedan fuera de esta selección.
Ante falta de acceso o cuota, se detiene la tarea. La política inicial permite un
run simultáneo. Las identidades y memorias siguen separadas por proyecto × agente.

## Preparación implementada y límites

`scripts/prepare-hermes.ps1` carga esta política mediante
`scripts/resolve-model.mjs`. Permite omitir `Provider` y `Model`, valida también
los overrides explícitos y rechaza modelos o proveedores ajenos a la selección
antes de crear archivos. Copia perfiles a homes locales ignorados, con proveedor
`openai-codex`, razonamiento por rol, velocidad normal, `openai_runtime: auto`
y sin fallback de proveedor. Las seis rutas auxiliares configuradas se fijan
explícitamente al mismo proveedor y modelo del rol para evitar selección `auto`.

```powershell
.\scripts\prepare-hermes.ps1 -Project studio -Agent atlas -Workspace (Get-Location).Path
```

El preparador no instala Hermes, autentica, inicia procesos ni realiza inferencia.
La validación cubre la preparación de estos archivos, no impone una restricción
global sobre una instalación de Hermes o Codex lanzada fuera del estudio. El
adaptador real deberá reutilizar la validación en cada inicio, escalada y llamada
auxiliar, comprobar cuota/cancelación y rechazar cualquier ruta no autorizada.
La UI sólo podrá anunciar conexión después de verificarla.

## Conexión prevista

Se mantiene el loop nativo de Hermes para conservar memoria y delegación. La
ruta de suscripción `openai-codex` usa Responses; habilitar el runtime opcional
`codex_app_server` es una decisión distinta que cambia el ejecutor de herramientas.
Ese runtime no ofrece las herramientas nativas `delegate_task`, `memory`,
`session_search` y `todo` durante el turno.
[Documentación de Hermes](https://hermes-agent.nousresearch.com/docs/user-guide/features/codex-app-server-runtime).

El inventario local confirmó una sesión ChatGPT iniciada en Codex CLI y no
encontró un ejecutable Hermes en PATH o los launchers comprobados. La sesión de
Codex no autentica automáticamente los homes Hermes: no copiar ni versionar
tokens. Instalar/fijar Hermes, usar su flujo de autenticación soportado para la
suscripción y verificar una llamada acotada antes de conectar la oficina.

Los modelos y esfuerzos dependen del acceso real de la cuenta. Un catálogo no
acredita acceso; una inferencia completada lo comprueba para esa petición.
[Modelos de Codex](https://learn.chatgpt.com/docs/models),
[catálogo y comprobación](https://developers.openai.com/siwc/token-sharing-open-source/codex-app-server).

La autenticación ChatGPT utiliza los límites del plan. La autenticación por API
key se factura por separado y no forma parte de esta selección.
[Autenticación oficial](https://learn.chatgpt.com/docs/auth).
No habilitar generación de imágenes, voz ni proveedores de herramientas con
facturación adicional suponiendo que estén incluidos en el plan.
