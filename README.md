# Hermes Game Studio

Una oficina pixel art para conversar con un equipo de agentes de **Hermes Agent (Nous Research)** y desarrollar videojuegos con tareas, memoria y evidencia separadas por proyecto.

La oficina combina madera cálida, tejido y vegetación con texturas originales dibujadas en Canvas. Ver [dirección de materiales](docs/TEXTURES.md).

**v0.1 · base inicial, modo DEMO.** La oficina, el servidor HTTP, los eventos SSE y el tablero de tareas funcionan localmente. Las respuestas son predefinidas y las transiciones de tareas son manuales. Hermes, Codex y voz todavía no están conectados a la oficina. No se ejecutan modelos ni aplicaciones desde la interfaz.

## Abrir la oficina

Requiere Node.js 22 o posterior. No necesita npm, instalación de paquetes, cuenta ni claves.

```powershell
cd RUTA\hermes-game-studio
node server.mjs
```

Abre **http://127.0.0.1:4317**. También puedes ejecutar `./Launch.ps1` desde PowerShell. Si el puerto está ocupado, usa `$env:STUDIO_PORT = '4318'` antes de iniciar. Detén el servidor con Ctrl+C. `.env.example` es documentación: la demo no carga archivos .env automáticamente.

Camina con WASD o flechas, acércate a un personaje y pulsa E. La lista del equipo ofrece la misma interacción sin caminar. El avatar del jugador está personalizado a partir de una referencia autorizada, con cuatro orientaciones y animación al caminar. La referencia original queda fuera de Git.

Cada agente tiene su propia mesa rotulada. Acércate a la mesa y pulsa E para abrir a su ocupante. El panel muestra el agente activo. «Probar voz · DEMO» ilustra estados de escucha y respuesta sólo con texto, sin micrófono ni audio real; cambiar de agente o proyecto cancela esa prueba.

Selecciona proyecto y agente, envía un mensaje o crea una tarea demo. Avanza sus estados para comprobar la UI. La demo conserva los datos sólo en memoria; al reiniciar vuelve al ejemplo inicial. No modifica Juego A ni Juego B.

## Equipo propuesto

| Personaje | Función | Modelo seleccionado, conexión pendiente |
| --- | --- | --- |
| Atlas · violeta | Arquitectura, alcance, planes y criterios de aceptación | GPT-6.1 Sol · high |
| Pixel · azul | Implementación acotada y evidencia del diff | GPT-6.1 Sol · medium |
| Prisma · coral | Personajes, mapas, assets y coherencia visual | GPT-6.1 Terra · medium |
| Vera · turquesa | Diseño UX, intención del usuario y validación final de la experiencia | GPT-6.1 Terra · medium |
| Nodo · verde | Coordinación, dependencias, presupuesto y traspasos | GPT-6 Luna · low |
| Lupa · amarillo | QA independiente y pruebas reproducibles | GPT-6.1 Sol · high |

Vera define la experiencia y Prisma produce la dirección y los paquetes visuales. Nodo conserva contexto y controla dependencias; Lupa verifica de forma independiente. Son seis perfiles, no seis procesos de pago siempre activos. Ningún identificador de modelo ni acceso a proveedor se da por hecho. Ver [perfiles y contratos de trabajo](docs/AGENTS.md).

Selección autorizada: **suscripción ChatGPT/Codex, con GPT-6.1 Sol como máximo**.
El preparador rechaza Astra, modelos desconocidos y proveedores de API de pago;
no arranca inferencia. Ver [política y conexión pendiente](docs/SUBSCRIPTION.md).

En «Cambio de UX» basta una petición: **Vera → Atlas → Pixel → Lupa → Vera**, con Nodo coordinando. El prototipo conserva solicitud, proyecto, criterios y referencias entre cinco tareas dependientes. Cada clic simula un traspaso; no representa código ni pruebas ejecutadas. La fase real evaluará [Kanban nativo de Hermes](https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban) como registro durable por juego.

## Decisión inicial: Windows local, híbrido después

Recomendamos **Windows nativo para la oficina, Hermes y un futuro puente de aplicaciones**. Es la opción más directa si los agentes deben abrir el motor del proyecto o herramientas gráficas en el escritorio del usuario. Hermes documenta soporte Windows nativo. Docker queda como opción para builds y comandos aislados; un contenedor Linux no controla automáticamente las ventanas de Windows. No se instaló Docker, WSL ni Hermes durante esta entrega. [Soporte oficial de Windows](https://hermes-agent.nousresearch.com/docs/user-guide/windows-native).

El aislamiento real requiere permisos del sistema, directorios autorizados y un puente con operaciones limitadas. Un perfil y su SOUL.md orientan al agente, pero no constituyen un sandbox. Ver [arquitectura, alternativas y límites](docs/ARCHITECTURE.md).

## Qué hay en este repositorio

| Ruta | Contenido |
| --- | --- |
| public/ | Oficina canvas, interacción accesible y panel del equipo |
| server.mjs + lib/ | Servidor loopback y adaptador demo sin dependencias |
| hermes/ | Plantillas de identidad y configuración documentada de Hermes |
| config/ | Políticas propias del estudio, proyectos y selección de modelos por suscripción |
| contracts/ | API del estudio y esquemas de tareas/eventos |
| scripts/ | Comprobación local y preparación/diagnóstico de Hermes |
| docs/ | Plan, integración, voz, perfiles y registro de verificación |

Memoria, conversaciones, sesiones, claves y fotos privadas quedan fuera de Git. Las plantillas versionadas son la fuente de las instrucciones; los homes operativos viven en `.runtime/` ignorado, separados por proyecto y agente. No reutilizar memorias entre juegos.

## Plan de construcción

1. **Base entregada:** oficina demo, API, contratos, perfiles y plan. Revisar el flujo antes de pagar por inferencia.
2. **Una conexión real:** instalar/configurar Hermes en un entorno elegido, seleccionar proveedor/modelos y presupuesto, crear homes aislados y conectar un agente de sólo lectura. La UI deberá mostrar `real` únicamente con evidencia del runtime.
3. **Primer trabajo de código:** tarea pequeña en un worktree dedicado, descubriendo el motor y las convenciones del proyecto; Hermes orquesta y Codex puede ser una herramienta de código. Diff, pruebas, cancelación, permisos y aprobación antes de acciones externas sensibles.
4. **Equipo y arte:** añadir traspasos, QA independiente, generación de assets con procedencia y revisión visual; limitar concurrencia y reintentos.
5. **Voz y experiencia:** STT → Hermes → TTS o Realtime como capa de conversación, control de interrupciones y confirmación de órdenes de voz con efectos. El avatar personal ya está integrado; la voz sigue pendiente.

El alcance y los criterios para cada fase están en [ROADMAP.md](docs/ROADMAP.md). La arquitectura conserva a Hermes como runtime de agentes; la UI y Codex son capas separadas.

## Verificación

```powershell
node scripts/check.mjs
node --test
```

No hay compilación de frontend: HTML/CSS/JS se sirven directamente. Las pruebas cubren validación, transición demo, HTTP y SSE. Consulta [VERIFICATION.md](docs/VERIFICATION.md) para la evidencia observada y sus límites. La integración se documenta contra fuentes oficiales; no está validada con una tarea real de Hermes.

Antes de habilitar inferencia: revisar [HERMES.md](docs/HERMES.md), configurar presupuesto y permisos, y elegir un único juego piloto. [PROJECTS.md](docs/PROJECTS.md) explica cómo conectar proyectos manteniendo instrucciones reutilizables. [VOICE.md](docs/VOICE.md) explica la conexión futura de voz y Codex.
