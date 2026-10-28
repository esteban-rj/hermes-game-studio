# Hermes Game Studio

Oficina vectorial local para conversar con seis perfiles de **Hermes Agent**.

**v0.4 · turno nocturno.** Agentes animados, un mundo de 1660 × 1080,
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
edición, Git, voz ni navegador desde la UI. Las misiones
y traspasos simulados se ocultan y sus rutas se rechazan en modo real.

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
