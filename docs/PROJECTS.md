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

## Preparación con Git local

El registro operativo de esta máquina vive en `.runtime/projects.local.json`,
ignorado por Git. Relaciona los IDs genéricos `juego-a` y `juego-b` con raíces
reales, y fija una raíz dedicada para worktrees. El campo `enabled: false`
mantiene deshabilitado el acceso desde la oficina DEMO; estos comandos son una
preparación manual explícita y no activan un despachador en la UI.

Primero inspecciona el plan sin modificar el repositorio:

```powershell
.\scripts\prepare-git-worktree.ps1 -Project juego-a -Task primera-tarea -Agent pixel
```

Comprueba `baseCommit` y `sourceUncommittedEntries`. El nuevo worktree toma sólo
el commit; los cambios sin confirmar del checkout original permanecen allí y no
se incluyen. Si una tarea los necesita, primero hay que conservarlos en un commit
revisado o trasladarlos mediante un procedimiento explícito; el preparador no
hace stash, reset ni limpieza.

Para crear la rama `codex/primera-tarea-pixel` y el worktree mostrado:

```powershell
$prepared = .\scripts\prepare-git-worktree.ps1 -Project juego-a -Task primera-tarea -Agent pixel -Create | ConvertFrom-Json
.\scripts\prepare-hermes.ps1 -Project juego-a -Agent pixel -Workspace $prepared.workspace -NativeProfile -LocalGit
.\scripts\use-hermes.ps1 -Action Check -Project juego-a -Agent pixel
.\scripts\use-hermes.ps1 -Action Chat -Project juego-a -Agent pixel
```

Repite con `juego-b` para el segundo repositorio. Cada ID corresponde a un juego
distinto; no intercambiar sus perfiles o memorias. El preparador rechaza ramas o
destinos existentes. El de Hermes también rechaza perfiles existentes: no
sobrescribe su configuración o memoria. Usa identificadores nuevos para otras
tareas y revisa el cambio de workspace del perfil antes de reutilizarlo.

`-NativeProfile` crea el home `<home-raíz>/profiles/<proyecto>-<agente>` a partir
del SOUL y las semillas públicas. Así Hermes puede compartir el OAuth del home
raíz mediante su mecanismo nativo, sin duplicar tokens. `-LocalGit` habilita
`terminal`, `file`, `todo` y `memory` en CLI y exige un worktree enlazado; rechaza
el checkout principal. Sin ese flag sólo están habilitadas conversación y memoria.
No se habilitan web, generación de imágenes, voz ni control de escritorio.

## Trabajo dentro del perfil

Antes de editar, el agente debe leer las instrucciones del repositorio del juego
y descubrir su motor y comandos allí. Pasa una tarea concreta que incluya
`projectId`, objetivo, archivos o alcance permitidos y criterios de aceptación.
El prompt y los detalles del juego permanecen en la sesión local de ese perfil.

En su worktree puede consultar:

```powershell
git status --short
git log -5 --oneline
git diff
```

Para entregar, revisar el diff, ejecutar las pruebas pertinentes y crear un commit
local sólo de los archivos de la tarea. Evitar `git add .` si hay cambios ajenos.
Lupa revisa el commit concreto en otro worktree y con su perfil del mismo juego;
no crear un segundo escritor sobre el home o worktree de Pixel. Atlas, Vera y
Prisma pueden usar perfiles y worktrees propios si la tarea requiere herramientas
de archivos. Nodo conserva su papel de coordinación y no modifica código.

Git local no requiere GitHub ni credenciales de red para estado, diff, ramas,
worktrees y commits. Push, merge y publicación no los inicia ningún preparador.
Se autorizan por tarea cuando correspondan.
[Documentación de Git worktree](https://git-scm.com/docs/git-worktree).

El perfil y `terminal.cwd` separan estado y directorio inicial, **no restringen
físicamente todo el sistema de archivos**. Con terminal local, Hermes tiene los
permisos de tu usuario de Windows. Esta preparación es para uso CLI supervisado;
la oficina sigue sin ejecutar herramientas. El puente y un sandbox verificado
siguen siendo necesarios antes de permitir trabajo autónomo desde la UI.
[Alcance de perfiles Hermes](https://hermes-agent.nousresearch.com/docs/user-guide/profiles).
