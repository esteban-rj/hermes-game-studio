[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][ValidateSet('juego-a','juego-b')][string]$Project,
  [Parameter(Mandatory=$true)][ValidatePattern('^[a-z][a-z0-9-]{0,47}$')][string]$Task,
  [ValidateSet('atlas','pixel','prisma','nodo','lupa','ux')][string]$Agent='pixel',
  [string]$BaseRef='HEAD',
  [string]$Registry,
  [switch]$Create
)
$ErrorActionPreference='Stop'
$studioRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if (-not $Registry) { $Registry=Join-Path $studioRoot '.runtime/projects.local.json' }
$studioRegistry=Get-Content -LiteralPath $Registry -Raw | ConvertFrom-Json
$studioEntries=@($studioRegistry.projects | Where-Object { $_.id -eq $Project })
if ($studioEntries.Count -ne 1) { throw 'El proyecto debe aparecer una sola vez en el registro local.' }
$studioSource=(Resolve-Path -LiteralPath $studioEntries[0].root).Path
$studioActualRoot=& git -C $studioSource rev-parse --show-toplevel 2>$null
if ($LASTEXITCODE -ne 0 -or [IO.Path]::GetFullPath($studioActualRoot.Trim()) -ne [IO.Path]::GetFullPath($studioSource)) { throw 'La ruta registrada no es una raíz Git exacta.' }
$studioBase=& git -C $studioSource rev-parse --verify --end-of-options "${BaseRef}^{commit}" 2>$null
if ($LASTEXITCODE -ne 0) { throw 'No existe el commit base solicitado.' }
$studioBranch="codex/$Task-$Agent"
$studioWorkspaceRoot=[IO.Path]::GetFullPath($studioRegistry.worktreesRoot)
$studioTarget=[IO.Path]::GetFullPath((Join-Path (Join-Path $studioWorkspaceRoot $Project) "$Task-$Agent"))
if (-not $studioTarget.StartsWith($studioWorkspaceRoot.TrimEnd([IO.Path]::DirectorySeparatorChar)+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw 'Worktree fuera de la raíz configurada.' }
if (Test-Path -LiteralPath $studioTarget) { throw 'El destino ya existe; no se sobrescribe.' }
$studioParent=[IO.DirectoryInfo]::new($studioTarget).Parent
while ($studioParent) {
  if ($studioParent.Exists -and ($studioParent.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Un ancestro del destino es un enlace; revisar la ruta.' }
  $studioParent=$studioParent.Parent
}
& git -C $studioSource show-ref --verify --quiet "refs/heads/$studioBranch"
if ($LASTEXITCODE -eq 0) { throw 'La rama ya existe; usa otro identificador de tarea.' }
if ($LASTEXITCODE -ne 1) { throw 'No se pudo consultar la rama.' }
$studioChanges=@(& git -C $studioSource status --porcelain=v1)
if ($LASTEXITCODE -ne 0) { throw 'No se pudo consultar el estado del repositorio.' }
if ($Create) {
  New-Item -ItemType Directory -Path (Split-Path -Parent $studioTarget) -Force | Out-Null
  $studioGitResult=& git -C $studioSource worktree add -b $studioBranch $studioTarget $studioBase.Trim() 2>&1
  if ($LASTEXITCODE -ne 0) { throw ('Git no pudo crear el worktree: '+($studioGitResult | Out-String)) }
}
[pscustomobject]@{
  project=$Project;agent=$Agent;source=$studioSource;workspace=$studioTarget
  branch=$studioBranch;baseCommit=$studioBase.Trim();created=[bool]$Create
  sourceUncommittedEntries=$studioChanges.Count;uncommittedChangesIncluded=$false
  note='Sólo Git local. El worktree comienza en el commit base; no copia cambios sin commit ni hace push, merge, stash o reset.'
} | ConvertTo-Json
