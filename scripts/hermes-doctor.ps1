[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$studioRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$studioCommand = Get-Command hermes -ErrorAction SilentlyContinue
$studioCandidates = @()
if ($env:LOCALAPPDATA) { $studioCandidates += Join-Path $env:LOCALAPPDATA 'hermes\bin\hermes.exe' }
if ($env:USERPROFILE) {
  $studioCandidates += Join-Path $env:USERPROFILE 'AppData\Local\hermes\bin\hermes.exe'
  $studioCandidates += Join-Path $env:USERPROFILE '.local\bin\hermes'
}
$studioHomes = @()
$studioRuntimeRoot = Join-Path $studioRoot '.runtime\hermes'
if (Test-Path -LiteralPath $studioRuntimeRoot) {
  $studioHomes = @(Get-ChildItem -LiteralPath $studioRuntimeRoot -Filter config.yaml -Recurse -File | ForEach-Object {
    [pscustomobject]@{home=$_.DirectoryName; soul=(Test-Path -LiteralPath (Join-Path $_.DirectoryName 'SOUL.md'))}
  })
}
[pscustomobject]@{
  checkedAtUtc = [DateTime]::UtcNow.ToString('o')
  commandOnPath = if ($studioCommand) { $studioCommand.Source } else { $null }
  knownLaunchers = @($studioCandidates | Select-Object -Unique | ForEach-Object { [pscustomobject]@{path=$_;exists=(Test-Path -LiteralPath $_)} })
  preparedHomes = $studioHomes
  runtimeVerified = $false
  note = 'Sólo lectura. No ejecuta Hermes, no abre secretos, no comprueba modelos ni inicia inferencia. Una ruta encontrada no verifica la instalación.'
} | ConvertTo-Json -Depth 5
