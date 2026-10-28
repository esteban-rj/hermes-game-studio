# Conectar proyectos sin acoplar el estudio

Las instrucciones permanentes describen roles y procedimientos reutilizables. El motor, las rutas, las convenciones, los comandos y la información interna de cada juego se descubren para su tarea concreta y se guardan en configuración local ignorada o contexto privado.

Los ejemplos Juego A y Juego B son placeholders; no habilitan acceso a ninguna carpeta. config/projects.example.json deja las raíces null y enabled=false. Copiar a projects.local.json y resolver cada raíz explícitamente antes de dar acceso a un runtime.

Antes de una tarea real:

1. Elegir proyecto y commit/worktree autorizado.
2. Leer sus instrucciones y descubrir el motor, su versión y los comandos documentados.
3. Acordar alcance, archivos permitidos, presupuesto y criterios de aceptación.
4. Usar memoria por proyecto × rol y un escritor por home.
5. Verificar con las herramientas reales del proyecto y revisión visual cuando corresponda.

No copiar documentación, código, rutas privadas ni diagnósticos de juegos a la personalidad permanente. Los resultados de una inspección previa no sustituyen la lectura del estado actual. El estudio conserva sólo principios generales: separación de contexto, memoria, permisos y evidencia.
