$ErrorActionPreference = 'Stop'
$studioRoot = $PSScriptRoot
$studioNode = Get-Command node -ErrorAction SilentlyContinue
if (-not $studioNode) { throw 'Instala Node.js 22 o posterior, o agrega una instalación existente al PATH.' }
Push-Location -LiteralPath $studioRoot
try { & $studioNode.Source (Join-Path $studioRoot 'server.mjs') } finally { Pop-Location }
