[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][ValidateSet('studio','juego-a','juego-b')][string]$Project,
  [Parameter(Mandatory=$true)][ValidateSet('atlas','pixel','prisma','nodo','lupa','ux')][string]$Agent,
  [Parameter(Mandatory=$true)][ValidateNotNullOrEmpty()][string]$Workspace,
  [string]$Provider,
  [string]$Model
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
$studioRuntimeRoot = [IO.Path]::GetFullPath((Join-Path $studioRoot '.runtime\hermes'))
$studioTarget = [IO.Path]::GetFullPath((Join-Path (Join-Path $studioRuntimeRoot $Project) $Agent))
if (-not $studioTarget.StartsWith($studioRuntimeRoot + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw 'Destino fuera de .runtime/hermes.' }
if (Test-Path -LiteralPath $studioTarget) { throw "El home ya existe; se conserva sin cambios: $studioTarget" }
# Los ancestros existentes tampoco pueden redirigir la escritura por junction/symlink.
$studioParent = [IO.DirectoryInfo]::new($studioTarget).Parent
while ($studioParent -and $studioParent.FullName.StartsWith($studioRoot,[StringComparison]::OrdinalIgnoreCase)) {
  if ($studioParent.Exists -and ($studioParent.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Un ancestro del destino es un enlace; se rechaza.' }
  if ($studioParent.FullName -eq $studioRoot) { break }
  $studioParent = $studioParent.Parent
}
$studioSoulSource = Join-Path $studioRoot "hermes\profiles\$Agent\SOUL.md"
$studioConfigSource = Join-Path $studioRoot 'hermes\config.base.yaml'
if (-not (Test-Path -LiteralPath $studioSoulSource)) { throw 'Falta SOUL.md fuente.' }
$studioConfig = Get-Content -LiteralPath $studioConfigSource -Raw -Encoding utf8
$studioConfig = $studioConfig.Replace('  max_turns: 20',("  max_turns: 20`n  reasoning_effort: " + $studioSelection.reasoningEffort + "`n  service_tier: normal"))
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
[pscustomobject]@{
  home=$studioTarget;project=$Project;agent=$Agent;workspace=$studioWorkspace
  prepared=$true;runtimeStarted=$false;credentialsCopied=$false
  provider=$Provider;model=$Model;billingMode=$studioSelection.billingMode;accessVerified=$false
  next='Revisar config.yaml, autenticar Hermes con ChatGPT/Codex dentro de este home y comprobar acceso. Al agotar la suscripción, detenerse; nunca cambiar a API ni a un modelo fuera de la lista.'
} | ConvertTo-Json
