# Oficina pixel art · prototipo 0.1

La UI usa HTML, CSS y Canvas 2D sin bibliotecas, fuentes remotas ni assets descargados. El servidor local entrega `public/`. Los píxeles del mapa y de los personajes se dibujan con código propio: todavía no son un pipeline de producción de sprites.

La oficina usa madera cálida, superficies con vetas, herrajes, tejidos y vegetación. La dirección de materiales y su referencia están documentadas en [TEXTURES.md](TEXTURES.md); el entorno y los personajes se dibujan por separado.

El estudio es independiente de los juegos existentes del usuario. **Juego A** y **Juego B** son proyectos ficticios de demostración recibidos del backend; no se configuran rutas a repositorios reales ni se presupone un motor de juego.

## Recorrido

1. Abre el servidor local y haz clic en la oficina. Usa WASD o flechas para caminar; el avatar tiene colisión con mesas, muebles y límites del mapa.
2. Cada uno de los seis agentes tiene una mesa individual con su nombre en una placa y su especialidad sobre ella. Acércate a la mesa hasta que aparezca `E · Mesa de [nombre · rol]`; pulsa E para abrir la conversación de su ocupante. La proximidad se calcula contra la mesa, no contra el centro del personaje. Vera ocupa la mesa central inferior, dedicada a UX y separada del arte visual de Prisma.
3. Como alternativa accesible, selecciona un agente con los botones de **Tu equipo**. También puedes hacer clic sobre su mesa o personaje del mapa.
4. Envía un mensaje. La respuesta fija del backend está rotulada DEMO.
5. En **Misiones**, crea una tarea y avanza manualmente sus estados. Revisa los eventos en **Pulso del estudio**.
6. Cambia el proyecto con **Espacio de trabajo**. Los chats se separan en memoria por agente y proyecto; las misiones se filtran por ambos. La UI no abre ni modifica los repositorios de juegos.
7. En **Conversar**, pulsa **Probar voz · DEMO**. El panel identifica al agente seleccionado y recorre **Escucha · DEMO → Respondiendo · DEMO → Desconectada**, con un guion de texto local en la conversación. Es una prueba de interfaz: no pide permiso de micrófono, reconoce voz, genera audio ni llama a un modelo.
8. En **Cambio de UX**, describe una mejora una sola vez (máximo 2000 caracteres) y crea la petición demo. Conserva descripción y criterios durante **UX (Vera) → Atlas → Pixel → Lupa → UX (Vera)**. Nodo controla las dependencias simuladas: sólo está asignada la fase actual. **Simular siguiente traspaso** completa manualmente esa fase y habilita la siguiente; al final cierra la cadena demo. Los criterios y registros de evidencia simulada siguen visibles en la solicitud. Las tareas vinculadas no tienen botón individual para saltarse la cadena.

Puedes cancelar la prueba con **Cancelar prueba**. Cambiar de agente o proyecto también la cancela y elimina su temporizador pendiente. Una prueba cancelada durante la escucha no añade texto; si ya mostró la respuesta, ese guion permanece únicamente en la conversación original. No hay respuestas tardías que aparezcan en otro proyecto o agente.

En pantallas de menos de 820 px se muestran controles táctiles. Los tabs admiten flechas izquierda/derecha, Home y End. Los formularios, proyectos y selección de agentes usan controles HTML. Enter envía mensajes; Shift+Enter introduce una nueva línea. No se interpreta HTML enviado en mensajes o títulos.

## Identidades propuestas

| Personaje | Diseño | Rol |
| --- | --- | --- |
| Atlas | Capa violeta y lentes | Arquitectura y planificación |
| Pixel | Chaqueta azul y auriculares | Implementación |
| Prisma | Boina coral y pelo largo | Personajes, mapas y assets |
| Vera | Chaqueta turquesa, diadema y tableta | Diseño UX, brief y validación de experiencia |
| Nodo | Chaleco verde | Coordinación y aislamiento de contexto |
| Lupa | Abrigo amarillo y lupa | Verificación independiente |
| Tú | Avatar pixel personalizado | Cuatro orientaciones y animación de pasos, derivado de una referencia autorizada |

El avatar personal y los seis agentes usan un motor de sprites compartido; cada identidad conserva su propia paleta, atuendo y accesorios. La referencia original no se distribuye ni se versiona. Las partes no visibles en la referencia son decisiones de diseño para completar el personaje; no se presentan como datos observados.

## Estado real

El canal SSE conecta al backend demo. Las conversaciones del navegador y las tareas y solicitudes del servidor viven sólo en memoria. No hay inferencia, acceso a herramientas, micrófono, síntesis de voz ni conexión Hermes/Codex. El ciclo de voz demo usa texto local y dos esperas cancelables, sin APIs de audio. La voz real está rotulada desconectada en todo momento. Todos los agentes están marcados como personajes demo aunque su tarjeta diga «Disponible». Los handoffs de UX se accionan manualmente; los textos de evidencia son simulados. La finalización manual de una misión o solicitud no acredita cambios ni verificación reales.

## Verificación

`node --check public/app.js` comprueba la sintaxis. El responsable del repositorio verifica el flujo completo en el navegador: movimiento, colisiones, interacción por proximidad a las seis mesas y lista, mensajes, misiones, eventos, aislamiento visual de proyectos, diseño responsive y ciclo de voz demo. Para este último, probar el recorrido completo, la cancelación manual y cambiar agente/proyecto durante la escucha; confirmar que no se solicita micrófono ni se añade una respuesta al nuevo contexto. Para UX, crear una petición, conservar su descripción/criterios, recorrer los cinco traspasos, comprobar las dependencias y la separación por proyecto, y confirmar que no se pueden avanzar tareas vinculadas individualmente. Esta guía no afirma que esas pruebas hayan pasado; la evidencia se recoge en la validación del proyecto.
