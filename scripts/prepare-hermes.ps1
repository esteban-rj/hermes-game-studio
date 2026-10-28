[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][ValidateSet('studio','juego-a','juego-b')][string]$Project,
  [Parameter(Mandatory=$true)][ValidateSet('atlas','pixel','prisma','nodo','lupa','ux')][string]$Agent,
  [Parameter(Mandatory=$true)][ValidateNotNullOrEmpty()][string]$Workspace,
  [string]$Provider,
  [string]$Model,
  [switch]$NativeProfile,
  [switch]$LocalGit
)
$ErrorActionPreference = 'Stop'
$studioRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$studioSelectionJson = @{ agent=$Agent; provider=$Provider; model=$Model } | ConvertTo-Json -Compress
$studioResolvedJson = $studioSelectionJson | & node (Join-Path $PSScriptRoot 'resolve-model.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Selección rechazada por la política de suscripción del estudio.' }
$studioSelection = $studioResolvedJson | ConvertFrom-Json
$Provider = $studioSelection.provider
$Model = $studioSelection.model
$studioWorkspace = (Resolve-Path -LiteralPath $Workspace).Path
if (-not (Test-Path -LiteralPath $studioWorkspace -PathType Container)) { throw 'Workspace debe ser un directorio existente.' }
foreach ($studioValue in @($Provider,$Model)) {
  if ($studioValue -match '[\r\n\x00]') { throw 'Proveedor y modelo deben ocupar una sola línea.' }
}
$studioProfileName = "$Project-$Agent"
$studioWriteBoundary = $studioRoot
if ($LocalGit -and -not $NativeProfile) { throw 'LocalGit requiere un perfil nativo y un worktree explícito.' }
if ($LocalGit) {
  $studioGitRoot = & git -C $studioWorkspace rev-parse --show-toplevel 2>$null
  if ($LASTEXITCODE -ne 0 -or [IO.Path]::GetFullPath($studioGitRoot.Trim()) -ne [IO.Path]::GetFullPath($studioWorkspace)) { throw 'Workspace debe ser la raíz exacta del worktree Git autorizado.' }
  $studioGitDir = & git -C $studioWorkspace rev-parse --path-format=absolute --git-dir
  $studioCommonDir = & git -C $studioWorkspace rev-parse --path-format=absolute --git-common-dir
  if ($LASTEXITCODE -ne 0 -or $studioGitDir.Trim() -eq $studioCommonDir.Trim()) { throw 'LocalGit requiere un worktree enlazado, no el checkout principal.' }
}
if ($NativeProfile) {
  $studioInstall = Get-Content -LiteralPath (Join-Path $studioRoot '.runtime\hermes-install.local.json') -Raw | ConvertFrom-Json
  if ($studioInstall.installationComplete -ne $true) { throw 'La instalación de Hermes no está confirmada.' }
  if (-not (Test-Path -LiteralPath $studioInstall.executable -PathType Leaf)) { throw 'No se encuentra la instalación Hermes registrada.' }
  $studioWriteBoundary = [IO.Path]::GetFullPath($studioInstall.home)
  if (-not (Test-Path -LiteralPath (Join-Path $studioWriteBoundary 'config.yaml') -PathType Leaf)) { throw 'Falta el home raíz de Hermes.' }
  $studioRuntimeRoot = [IO.Path]::GetFullPath((Join-Path $studioWriteBoundary 'profiles'))
  $studioTarget = [IO.Path]::GetFullPath((Join-Path $studioRuntimeRoot $studioProfileName))
} else {
  $studioRuntimeRoot = [IO.Path]::GetFullPath((Join-Path $studioRoot '.runtime\hermes'))
  $studioTarget = [IO.Path]::GetFullPath((Join-Path (Join-Path $studioRuntimeRoot $Project) $Agent))
}
if (-not $studioTarget.StartsWith($studioRuntimeRoot + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw 'Destino fuera del árbol de perfiles autorizado.' }
if (Test-Path -LiteralPath $studioTarget) { throw "El home ya existe; se conserva sin cambios: $studioTarget" }
# Los ancestros existentes tampoco pueden redirigir la escritura por junction/symlink.
$studioParent = [IO.DirectoryInfo]::new($studioTarget).Parent
while ($studioParent -and $studioParent.FullName.StartsWith($studioWriteBoundary,[StringComparison]::OrdinalIgnoreCase)) {
  if ($studioParent.Exists -and ($studioParent.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Un ancestro del destino es un enlace; se rechaza.' }
  if ($studioParent.FullName -eq $studioWriteBoundary) { break }
  $studioParent = $studioParent.Parent
}
$studioSoulSource = Join-Path $studioRoot "hermes\profiles\$Agent\SOUL.md"
$studioConfigSource = Join-Path $studioRoot 'hermes\config.base.yaml'
if (-not (Test-Path -LiteralPath $studioSoulSource)) { throw 'Falta SOUL.md fuente.' }
$studioConfig = Get-Content -LiteralPath $studioConfigSource -Raw -Encoding utf8
$studioConfig = $studioConfig.Replace('  max_turns: 20',("  max_turns: 20`n  reasoning_effort: " + $studioSelection.reasoningEffort + "`n  service_tier: normal"))
if ($LocalGit) { $studioConfig = $studioConfig.Replace('cli: [todo, memory]','cli: [terminal, file, todo, memory]') }
$studioConfig += "`nmodel:`n  provider: " + (ConvertTo-Json -InputObject $Provider -Compress) + "`n  default: " + (ConvertTo-Json -InputObject $Model -Compress)
$studioConfig += "`n  openai_runtime: auto`nfallback_providers: []`n"
# Las llamadas auxiliares también usan la suscripción y un modelo autorizado.
$studioConfig += "`nauxiliary:`n"
foreach ($studioAuxiliary in @('title_generation','compression','vision','goal_judge','background_review','curator')) {
  $studioConfig += "  ${studioAuxiliary}:`n    provider: openai-codex`n    model: " + (ConvertTo-Json -InputObject $Model -Compress) + "`n"
}
$studioConfig += "`nterminal:`n  backend: local`n  cwd: " + (ConvertTo-Json -InputObject $studioWorkspace -Compress) + "`n"
New-Item -ItemType Directory -Path $studioTarget | Out-Null
New-Item -ItemType Directory -Path (Join-Path $studioTarget 'memories') | Out-Null
Copy-Item -LiteralPath $studioSoulSource -Destination (Join-Path $studioTarget 'SOUL.md')
foreach ($studioSeed in @('MEMORY.md','USER.md')) {
  Copy-Item -LiteralPath (Join-Path $studioRoot "hermes\memory-seeds\$studioSeed") -Destination (Join-Path $studioTarget "memories\$studioSeed")
}
[IO.File]::WriteAllText((Join-Path $studioTarget 'config.yaml'),$studioConfig,[Text.UTF8Encoding]::new($false))
$studioScope = @{schemaVersion=1;project=$Project;agent=$Agent;workspace=$studioWorkspace;localGit=[bool]$LocalGit;model=$Model;provider=$Provider} | ConvertTo-Json
[IO.File]::WriteAllText((Join-Path $studioTarget '.studio-scope.json'),$studioScope,[Text.UTF8Encoding]::new($false))
[pscustomobject]@{
  home=$studioTarget;project=$Project;agent=$Agent;workspace=$studioWorkspace
  nativeProfile=[bool]$NativeProfile;profileName=$studioProfileName;localGit=[bool]$LocalGit
  prepared=$true;runtimeStarted=$false;credentialsCopied=$false
  provider=$Provider;model=$Model;billingMode=$studioSelection.billingMode;accessVerified=$false
  next='Revisar config.yaml, autenticar Hermes con ChatGPT/Codex dentro de este home y comprobar acceso. Al agotar la suscripción, detenerse; nunca cambiar a API ni a un modelo fuera de la lista.'
} | ConvertTo-Json
