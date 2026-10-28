[CmdletBinding()]
param(
  [ValidateSet('Version','Check','Login','Chat')][string]$Action='Version',
  [ValidateSet('studio','juego-a','juego-b')][string]$Project='studio',
  [ValidateSet('atlas','pixel','prisma','nodo','lupa','ux')][string]$Agent='atlas'
)
$ErrorActionPreference='Stop'
$studioRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$studioInstall=Get-Content -LiteralPath (Join-Path $studioRoot '.runtime/hermes-install.local.json') -Raw | ConvertFrom-Json
if ($studioInstall.installationComplete -ne $true) { throw 'La instalación de Hermes no está confirmada.' }
if (-not (Test-Path -LiteralPath $studioInstall.executable -PathType Leaf)) { throw 'No se encuentra el ejecutable Hermes registrado.' }
$studioProfile="$Project-$Agent"
$studioProfileHome=Join-Path (Join-Path $studioInstall.home 'profiles') $studioProfile
$studioPreviousHermesHome=$env:HERMES_HOME
$studioPreviousLocation=Get-Location
try {
  $env:HERMES_HOME=$studioInstall.home
  switch ($Action) {
    'Version' { & $studioInstall.executable --version }
    'Login' { & $studioInstall.executable auth add openai-codex --browser --timeout 900 }
    'Check' {
      if (-not (Test-Path -LiteralPath (Join-Path $studioProfileHome 'config.yaml'))) { throw 'Primero prepara el perfil con -NativeProfile.' }
      & $studioInstall.executable -p $studioProfile config check
    }
    'Chat' {
      $studioScope=Get-Content -LiteralPath (Join-Path $studioProfileHome '.studio-scope.json') -Raw | ConvertFrom-Json
      if ($studioScope.project -ne $Project -or $studioScope.agent -ne $Agent) { throw 'El alcance guardado no coincide con el perfil.' }
      $studioSelectionJson=@{agent=$Agent;provider=$studioScope.provider;model=$studioScope.model} | ConvertTo-Json -Compress
      $studioRouteJson=$studioSelectionJson | & node (Join-Path $PSScriptRoot 'resolve-model.mjs')
      if ($LASTEXITCODE -ne 0) { throw 'La selección no cumple la política de suscripción.' }
      $studioRoute=$studioRouteJson | ConvertFrom-Json
      if (-not (Test-Path -LiteralPath $studioScope.workspace -PathType Container)) { throw 'No existe el workspace autorizado.' }
      if ($studioScope.localGit) {
        $studioActualRoot=& git -C $studioScope.workspace rev-parse --show-toplevel 2>$null
        if ($LASTEXITCODE -ne 0 -or [IO.Path]::GetFullPath($studioActualRoot.Trim()) -ne [IO.Path]::GetFullPath($studioScope.workspace)) { throw 'La raíz del worktree cambió.' }
      }
      Set-Location -LiteralPath $studioScope.workspace
      & $studioInstall.executable -p $studioProfile chat --provider openai-codex --model $studioRoute.model
    }
  }
  if ($LASTEXITCODE -ne 0) { throw "Hermes terminó con código $LASTEXITCODE." }
} finally {
  Set-Location -LiteralPath $studioPreviousLocation.Path
  if ($null -eq $studioPreviousHermesHome) { Remove-Item Env:HERMES_HOME -ErrorAction SilentlyContinue }
  else { $env:HERMES_HOME=$studioPreviousHermesHome }
}
