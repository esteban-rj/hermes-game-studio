# Suscripción ChatGPT/Codex: selección del estudio

Decisión del usuario, 28 de octubre de 2026: usar su suscripción y limitar el
modelo máximo a **GPT-6.1 Sol**. La fuente es `config/model-routing.json`, una
política propia del estudio. `model-routing.example.json` continúa como ejemplo
genérico. La oficina v0.2 usa conversaciones reales mediante los perfiles nativos.

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
`-NativeProfile` usa la instalación local registrada y crea perfiles en su árbol
nativo. `scripts/use-hermes.ps1` ofrece Version, Check, Login y Chat. Login actúa
sobre el home raíz; Chat elige un perfil por proyecto/agente y fija proveedor y
modelo aprobados explícitamente. Chat es una acción CLI del usuario, separada de
la oficina. Ver [uso de repositorios y worktrees](PROJECTS.md).
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

Se instaló Hermes v0.22.5, commit `bf0203a794a07aac3ff764972ab9087baa4e4f4e`,
en Windows nativo y se prepararon seis perfiles `studio-<agente>`. El login de
OpenAI se inicia con `scripts/use-hermes.ps1 -Action Login` para que el titular
autorice en su navegador. No copiar tokens de Codex: los perfiles nativos pueden
usar el OAuth del home raíz mediante la gestión de credenciales de Hermes.
La configuración desactiva la adopción automática de logins externos.
Autenticación, acceso efectivo a un modelo y conexión de la oficina son estados
distintos; ninguno se acredita sólo por instalar el ejecutable.

Los modelos y esfuerzos dependen del acceso real de la cuenta. Un catálogo no
acredita acceso; una inferencia completada lo comprueba para esa petición.
[Modelos de Codex](https://learn.chatgpt.com/docs/models),
[catálogo y comprobación](https://developers.openai.com/siwc/token-sharing-open-source/codex-app-server).

La autenticación ChatGPT utiliza los límites del plan. La autenticación por API
key se factura por separado y no forma parte de esta selección.
[Autenticación oficial](https://learn.chatgpt.com/docs/auth).
No habilitar generación de imágenes, voz ni proveedores de herramientas con
facturación adicional suponiendo que estén incluidos en el plan.

## Oficina real v0.2

lib/hermes.mjs aplica la política antes de cada turno, fija proveedor OAuth,
modelo y razonamiento en el CLI, y comprueba las rutas auxiliares de los perfiles.
Rechaza configuraciones sin fallback vacío o sin límite nativo de 90 segundos.
El envío es serial y no hereda claves API ni overrides de modelo de la terminal.
Un fallo del runtime se muestra como error, sin sustitución simulada. Esta
política no restringe otras ejecuciones manuales fuera del estudio.
