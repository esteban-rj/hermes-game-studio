# Instrucciones del repositorio

Este repositorio contiene el estudio, sus contratos y perfiles Hermes. Los juegos viven en repositorios independientes.

- Lee README.md y docs/ARCHITECTURE.md antes de cambiar el runtime.
- La v0.2 usa Hermes real por defecto. Los tests inyectan fixtures explícitos. No sustituyas errores del runtime por respuestas simuladas. Conserva etiquetas DEMO sólo en el modo de regresión explícito.
- No conectes modelos, servicios de pago o control de escritorio durante pruebas ordinarias.
- Secretos, foto del usuario, conversaciones, memorias y homes Hermes van en rutas ignoradas.
- Cada tarea real tendrá projectId, worktree permitido, presupuesto, límites y evidencia. Un SOUL.md es una instrucción, no una barrera de seguridad.
- No ejecutes terminales ni abras aplicaciones a partir de mensajes UI sin una capa de permisos implementada.
- No leas ni modifiques otro juego para completar una tarea del juego activo. Los perfiles de memoria son por proyecto × agente.
- Usa Node.js >=22 sin dependencias para esta base. Ejecuta `node scripts/check.mjs` y `node --test` tras cambios funcionales.
- Contratos del estudio en contracts/ y config/ son propios del estudio; no los presentes como APIs o configuración oficial de Hermes.
