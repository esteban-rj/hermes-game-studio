# Hermes Game Studio

Oficina pixel art local para conversar con seis perfiles de **Hermes Agent**.

**v0.2 · conversaciones reales.** El backend ejecuta Hermes con tu suscripción
ChatGPT/Codex y muestra su respuesta en streaming. Los errores se muestran sin
sustituirlos por respuestas predefinidas. Cada agente conserva su sesión e historial.

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

Muévete con WASD/flechas y pulsa E cerca de una mesa, o elige un agente en la lista.
Escribe un mensaje; Enter envía y Shift+Enter añade una línea. Sólo se admite un
turno a la vez. El perfil muestra modelo, runtime y herramientas disponibles.

## Equipo

| Agente | Función | Modelo | Razonamiento |
| --- | --- | --- | --- |
| Atlas | Arquitectura y planificación | gpt-6.1-sol | high |
| Pixel | Implementación | gpt-6.1-sol | medium |
| Prisma | Dirección visual | gpt-6.1-terra | medium |
| Vera | Diseño UX | gpt-6.1-terra | medium |
| Nodo | Coordinación | gpt-6-luna | low |
| Lupa | QA | gpt-6.1-sol | high |

El máximo es **Sol 6.1**. No hay escalada a Astra ni fallback a API de pago.
La autenticación no garantiza acceso a todos los modelos; cada perfil se verifica
con su primera respuesta real. [Política de modelos](docs/SUBSCRIPTION.md).

## Alcance

La oficina conecta conversación, memoria y planificación mediante perfiles
`studio-<agente>`. El CLI recibe sólo `todo,memory`. No se ofrecen terminal,
edición, Git, voz, navegador o generación de imágenes desde la UI. Las misiones
y traspasos simulados se ocultan y sus rutas se rechazan en modo real.

Para código con Git local en un juego, usa perfiles y worktrees explícitos según
[PROJECTS.md](docs/PROJECTS.md). Sus nombres y rutas reales permanecen en
configuración privada. El despacho automático del flujo UX sigue pendiente.

El adaptador usa el protocolo JSONL oficial de Hermes: `chat --query-file -
--oneshot --format stream-json`. Envía el prompt por stdin, fija perfil, proveedor,
modelo y razonamiento, y reanuda por ID de sesión. No interpreta logs humanos
como respuestas. Los eventos del estudio muestran inicio, fragmentos y resultado.

Máximo cuatro iteraciones y 90 segundos de presupuesto nativo por turno. El
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
