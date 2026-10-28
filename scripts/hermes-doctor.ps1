[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$studioRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$studioCommand = Get-Command hermes -ErrorAction SilentlyContinue
$studioCandidates = @()
$studioRecordedInstall = $null
$studioInstallRecord = Join-Path $studioRoot '.runtime\hermes-install.local.json'
if (Test-Path -LiteralPath $studioInstallRecord) {
  $studioInstall = Get-Content -LiteralPath $studioInstallRecord -Raw | ConvertFrom-Json
  $studioCandidates += $studioInstall.executable
  $studioRecordedInstall = [pscustomobject]@{
    home=$studioInstall.home;source=$studioInstall.source;version=$studioInstall.version
    revision=$studioInstall.revision;installationComplete=$studioInstall.installationComplete
  }
}
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
if ($studioRecordedInstall) {
  $studioNativeProfiles = Join-Path $studioRecordedInstall.home 'profiles'
  if (Test-Path -LiteralPath $studioNativeProfiles) {
    $studioHomes += @(Get-ChildItem -LiteralPath $studioNativeProfiles -Filter config.yaml -Recurse -File | ForEach-Object {
      [pscustomobject]@{home=$_.DirectoryName;soul=(Test-Path -LiteralPath (Join-Path $_.DirectoryName 'SOUL.md'))}
    })
  }
}
[pscustomobject]@{
  checkedAtUtc = [DateTime]::UtcNow.ToString('o')
  commandOnPath = if ($studioCommand) { $studioCommand.Source } else { $null }
  knownLaunchers = @($studioCandidates | Select-Object -Unique | ForEach-Object { [pscustomobject]@{path=$_;exists=(Test-Path -LiteralPath $_)} })
  recordedInstallation = $studioRecordedInstall
  preparedHomes = $studioHomes
  runtimeVerified = $false
  note = 'Sólo lectura. No ejecuta Hermes, no abre secretos, no comprueba modelos ni inicia inferencia. Una ruta encontrada no verifica la instalación.'
} | ConvertTo-Json -Depth 5
