[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][ValidateSet('studio','juego-a','juego-b')][string]$Project,
  [Parameter(Mandatory=$true)][ValidateSet('atlas','pixel','prisma','nodo','lupa','ux')][string]$Agent,
  [Parameter(Mandatory=$true)][ValidateNotNullOrEmpty()][string]$Workspace,
  [Parameter(Mandatory=$true)][ValidateNotNullOrEmpty()][string]$Provider,
  [Parameter(Mandatory=$true)][ValidateNotNullOrEmpty()][string]$Model
)
$ErrorActionPreference = 'Stop'
$studioRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
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
$studioConfig += "`nmodel:`n  provider: " + (ConvertTo-Json -InputObject $Provider -Compress) + "`n  default: " + (ConvertTo-Json -InputObject $Model -Compress)
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
  next='Revisar config.yaml, configurar credenciales en este HERMES_HOME fuera de Git y validar Hermes antes de cualquier llamada.'
} | ConvertTo-Json
