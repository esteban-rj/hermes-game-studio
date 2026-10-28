# Integración de Hermes: conversaciones reales en la oficina

Decisión posterior, 28 de octubre de 2026: **suscripción ChatGPT/Codex y Sol 6.1
como máximo**. Ver [rutas elegidas y límites](SUBSCRIPTION.md). El preparador ahora
usa `config/model-routing.json` y rechaza proveedores de API de pago y modelos
fuera de la lista. Hermes está instalado y autenticado. La oficina conecta conversaciones reales
mediante JSONL del CLI; las herramientas de código siguen pendientes.

Revisión: 28 de octubre de 2026. Instalación oficial de Windows en canal estable:
**Hermes v0.22.5**, commit `bf0203a794a07aac3ff764972ab9087baa4e4f4e`.
El comando informó Python 3.14.9 y OpenAI SDK 2.24.0. Fuente, dependencias y datos
están fuera del Git del estudio; `.runtime/hermes-install.local.json` guarda las
rutas locales. El instalador se ejecutó sin setup interactivo, navegador de
automatización, control del escritorio ni desktop adicional. La conversación
actual inicia el gateway nativo mediante el CLI. Una copia nueva necesita instalación
y registro locales propios.

```powershell
.\scripts\use-hermes.ps1 -Action Version
.\scripts\use-hermes.ps1 -Action Login
```

`Login` abre el flujo oficial de navegador de OpenAI con PKCE. El titular completa
el login y la autorización en el navegador. El home raíz guarda el OAuth; los
perfiles nativos del mismo árbol usan la lectura compartida de Hermes, sin
copiar tokens. La plantilla desactiva la adopción automática del login de otros
CLIs. No introducir claves ni tokens en el repositorio o en prompts.
[Proveedor oficial](https://hermes-agent.nousresearch.com/docs/integrations/providers).

## Qué existe

- Seis identidades reales en `hermes/profiles/*/SOUL.md` y un catálogo propio del
  estudio en `hermes/agents.json`.
- Una plantilla parcial `hermes/config.base.yaml` con claves contrastadas con el
  [ejemplo de configuración del código oficial](https://github.com/NousResearch/hermes-agent/blob/main/cli-config.yaml.example).
- Semillas de memoria revisables, sin historial privado.
- `scripts/hermes-doctor.ps1`: inventario de sólo lectura, sin lanzar Hermes.
- `scripts/prepare-hermes.ps1`: copia una identidad a un home nuevo y local,
  exige workspace, toma proveedor/modelo de la política elegida y rechaza
  sobrescrituras y overrides fuera de la lista autorizada.

Hay seis perfiles nativos `studio-<agente>` conectados a conversación, sin
herramientas de terminal desde la UI. `lib/hermes.mjs` inicia el CLI oficial, recibe
JSONL, reanuda sesiones y conserva mensajes bajo `.runtime`. Los tests usan fixtures.

## Compatibilidad contrastada

Hermes carga la identidad de `SOUL.md` desde `HERMES_HOME`; la política de voz y
carácter pertenece allí. Instrucciones temporales del juego deben viajar con cada
tarea y sus fuentes del repositorio. [Identidad oficial](https://hermes-agent.nousresearch.com/docs/user-guide/features/personality).

Los homes separan configuración, memorias y sesiones. Un home por combinación
proyecto/agente evita que Camilo de un juego recuerde decisiones del otro.
El CLI oficial también admite `hermes -p nombre chat` y
`hermes --profile=nombre doctor` para perfiles registrados. Los homes que prepara
este repositorio se seleccionan mediante `HERMES_HOME`, sin registrarlos en la
instalación del usuario. Con `-NativeProfile`, el preparador crea en cambio
`<home-raíz>/profiles/<proyecto>-<agente>`, reconocible con `-p` y compatible con
el OAuth compartido del home raíz. Ningún perfil constituye un sandbox y `terminal.cwd`
sólo fija el directorio inicial. Un único proceso escritor debe poseer cada home.
[Perfiles oficiales](https://hermes-agent.nousresearch.com/docs/user-guide/profiles).

La configuración nativa es `config.yaml`; claves y tokens pertenecen a `.env`
u otro almacén privado soportado. El catálogo `agents.json`, los presupuestos y
los permisos del estudio son **nuestros contratos**, no claves inventadas dentro
del YAML de Hermes. La política fija los modelos elegidos; hace falta comprobar
acceso y límites de la suscripción antes de habilitarlos.
[Configuración oficial](https://hermes-agent.nousresearch.com/docs/user-guide/configuration).

## Preparar un home sin instalar ni ejecutar inferencia

Desde la raíz del repositorio, en PowerShell:

```powershell
.\scripts\hermes-doctor.ps1

# Usa la selección por suscripción de config/model-routing.json.
.\scripts\prepare-hermes.ps1 -Project studio -Agent atlas `
  -Workspace (Get-Location).Path
```

El destino es `.runtime/hermes/studio/atlas/`. El script no escribe en el
workspace ni modifica variables persistentes, perfiles globales o credenciales.
No instala Hermes, no valida que el modelo exista y no arranca servicios.
Repetir con otro agente y proyecto genera un home independiente; repetir sobre
el mismo destino falla sin tocarlo.

Cuando Hermes ya esté instalado y verificado, revisar el YAML preparado y usar
el home sólo durante los comandos de ese perfil. Ejemplo de selección temporal
para una comprobación de configuración, **sin chat**:

```powershell
$previousHermesHome = $env:HERMES_HOME
try {
  $env:HERMES_HOME = (Resolve-Path '.runtime/hermes/studio/atlas').Path
  hermes config check
} finally {
  if ($null -eq $previousHermesHome) { Remove-Item Env:HERMES_HOME -ErrorAction SilentlyContinue }
  else { $env:HERMES_HOME = $previousHermesHome }
}
```

La primera conversación real requiere credenciales resueltas para ese perfil
(OAuth del home raíz en perfiles nativos), cuota y límites elegidos, y herramientas
revisadas. `agent.max_turns` limita
iteraciones, **no es un límite monetario**. Compresión y herramientas auxiliares
tienen que entrar en el presupuesto del proveedor. El preset inicial sólo ofrece
`todo` y `memory` al CLI. Herramientas de terminal, edición, visuales y Codex
siguen pendientes del puente que haga cumplir permisos.
[Herramientas y backends oficiales](https://hermes-agent.nousresearch.com/docs/user-guide/features/tools).

## Windows, WSL y Docker

Propuesta inicial: servicio del estudio y acceso a aplicaciones en Windows;
Hermes local en Windows si sus herramientas concretas pasan la prueba de la
máquina. La documentación actual incluye CLI, TUI, gateway, navegador y MCP
nativos. WSL2 queda como alternativa para herramientas que dependan de Linux.
Se instaló la variante Windows nativa en esta entrega; WSL no se instaló.
[Windows nativo](https://hermes-agent.nousresearch.com/docs/user-guide/windows-native),
[WSL2](https://hermes-agent.nousresearch.com/docs/user-guide/windows-wsl-quickstart).

Docker encaja en builds reproducibles por juego y tareas sin escritorio. Para
operar un editor gráfico de Windows, proponemos un puente host explícito con
alcance por aplicación, serialización de acciones y evidencia; un contenedor no
recibe ese control por montarle archivos. Nunca dar al runtime acceso amplio al
disco o al socket Docker para resolverlo.

Ejecutar todo Hermes dentro de Docker y elegir `terminal.backend: docker` son
decisiones distintas. La segunda mantiene Hermes fuera y cambia dónde ejecuta
herramientas. Si se adopta, limitar montajes, secretos y estado por juego y
verificar en la versión elegida si hay contenedores compartidos.
[Docker oficial](https://hermes-agent.nousresearch.com/docs/user-guide/docker).

## Secuencia para reemplazar la simulación

1. Fijar versión de Hermes y proveedor/modelo real por rol. Elegir primero un
   proyecto de prueba y una sola identidad; no arrancar seis loops autónomos.
2. Validar una conversación sin herramientas en home aislado y registrar el
   resultado y coste. Probar cancelación y error de autenticación.
3. Implementar el adaptador que convierte eventos del runtime elegido al contrato
   del estudio. Elegir entre las superficies oficiales descritas abajo y comprobar
   capacidades de la versión instalada; no parsear logs como protocolo estable.
4. Añadir cola y bloqueo por home/worktree, idempotencia de mensajes, cancelación,
   límites de tiempo/coste y auditoría privada. Restaurar estado tras reinicio.
5. Permitir herramientas de un solo juego a través del backend. Probar rechazo
   cruzado con rutas y enlaces, no sólo por instrucciones de personalidad.
6. Incorporar a Santi con Codex como herramienta y a Cata con herramientas
   visuales disponibles; activar Pipe antes de permitir integración automática.
7. Añadir voz como transporte independiente. La UI nunca obtiene claves maestras.

Bot Mode es una superficie oficial para presentar perfiles como bots; no convierte
esta oficina en una extensión del escritorio Hermes ni sustituye el adaptador del
estudio. Puede ayudar a explorar las identidades antes de conectar la UI.
[Bot Mode](https://hermes-agent.nousresearch.com/docs/user-guide/bot-mode).

## Transporte real candidato: descubrir antes de conectar

Hermes documenta un API server HTTP/SSE para clientes web y un gateway TUI
JSON-RPC por stdio o WebSocket para controlar sesiones, streaming y aprobaciones.
También ofrece ACP para clientes de editor. El método `gateway.capabilities` forma
parte del catálogo TUI; el adaptador deberá consultar capacidades, comprobar el
perfil y rechazar funciones ausentes antes de aceptar trabajo.
[Integración programática oficial](https://hermes-agent.nousresearch.com/docs/developer-guide/programmatic-integration).

La conexión v0.2 usa JSONL del CLI (`chat --query-file - --oneshot --format
stream-json`), que actúa como cliente del gateway nativo. El backend fija perfil,
modelo y proveedor, envía texto por stdin y reanuda por session_id. HTTP/SSE y
JSON-RPC quedan como alternativas para un control de permisos y cancelación mayor.

## Kanban nativo durable: propuesta por juego

La documentación y el código actuales ofrecen Kanban con SQLite, tareas,
dependencias, comentarios y handoffs, además de boards separados por proyecto.
Los workers usan perfiles con identidad propia y las herramientas `kanban_*`.
Encaja mejor que delegación efímera para el trabajo que deba sobrevivir a un
reinicio. [Kanban oficial](https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban),
[código del CLI](https://github.com/NousResearch/hermes-agent/blob/main/hermes_cli/kanban.py).

Proponemos boards de ejemplo `juego-a` y `juego-b`, más uno `studio` para el
propio sistema. La cadena será **UX → Camilo → Santi → Pipe → UX**; Nico
coordina dependencias y conflictos, Cata aporta los paquetes de arte. Cada
handoff conserva petición original, criterios, identificador y evidencia. Los
estados del estudio se mapearán de forma explícita al ciclo nativo, incluyendo
revisión y bloqueo, sin tratarlos como enums idénticos.

Los homes standalone preparados aquí **no comparten automáticamente un board**.
Antes del piloto, registrar perfiles con nombres por juego y rol dentro de una
raíz Hermes controlada, y asociar cada board a esos perfiles; validar descubrimiento
de perfiles y despacho con una tarea sin herramientas. El código nativo dispone
de selección explícita de board y pin de base de datos mediante
`HERMES_KANBAN_DB`; no basta con copiar un SQLite entre homes independientes.
[Resolución de board en código](https://github.com/NousResearch/hermes-agent/blob/main/hermes_cli/kanban_db.py).

No se creó ni inició ningún board nativo. `kanban.dispatch_in_gateway: false`
queda en la plantilla para evitar workers accidentales. Los pasos demo de la
oficina siguen siendo una simulación del contrato. La futura activación exige
probar reinicio, doble entrega, revisión rechazada, fallo de proveedor y permisos
cruzados; una cola durable no impone por sí sola aislamiento del sistema operativo.

## Modelos por rol y límites de delegación

`delegation.model` fija una ruta global o se hereda del padre; no proporciona por
sí solo seis roles con modelos distintos. El plugin oficial `advanced-delegation`
añade `model_map` y `profile_routes` y requiere Hermes **0.22.5 o posterior**.
Debe verificarse en la versión instalada antes de recomendarlo. No se instaló.
Para nuestro flujo durable preferimos perfiles por rol y tareas Kanban; evaluar
ese plugin sólo para consultas hijas acotadas que lo necesiten.
[Plugin oficial](https://hermes-agent.nousresearch.com/docs/plugins/advanced-delegation).

La plantilla mantiene `max_turns: 4`, `run_budget_seconds: 90`, `api_max_retries: 1`, profundidad 1 y un
máximo de dos hijos; el toolset de delegación no está habilitado. La política
propuesta del estudio permite dos ciclos de revisión y dos seguimientos por
tarea. Esos límites y el presupuesto monetario deberán imponerse en el adaptador,
contando llamadas auxiliares y herramientas; no equivalen a una charla libre ni
garantizan que veinte iteraciones terminen el trabajo.

Los worktrees de subagentes Hermes son una opción local y Git. En Docker, SSH o
Modal pueden volver al workspace compartido; comprobar directorio y montaje
efectivos antes de permitir edición paralela.
[Alcance oficial de worktree isolation](https://hermes-agent.nousresearch.com/docs/user-guide/features/delegation#worktree-isolation).

## Codex como herramienta y runtime opcional

La recomendación conserva el loop de Hermes y añade Codex como herramienta de
programación mediante el backend. La opción oficial de Hermes que usa Codex
App Server como runtime cambia quién ejecuta el loop: no es la misma integración.
En ese modo no deben darse por disponibles `delegate_task`, `memory`,
`session_search` y `todo` nativos; la revisión de memoria/skills en segundo plano
es un mecanismo distinto. Mantener esta alternativa desactivada hasta probar
capacidades, autenticación, aislamiento y el impacto sobre coordinación.
[Runtime Codex opcional](https://hermes-agent.nousresearch.com/docs/user-guide/features/codex-app-server-runtime).

## Memoria y fuentes

Las semillas son texto público revisable; las memorias aprendidas, sesiones,
credenciales y artefactos privados permanecen bajo `.runtime/` ignorado. La
memoria ayuda a recordar; las decisiones revisadas y commits del juego siguen
siendo la fuente para actuar. La memoria local de Hermes usa `memories/MEMORY.md`
y `memories/USER.md`. No se activó ningún proveedor externo.
[Memoria oficial](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory).
