[CmdletBinding()]
param([string]$Python='python',[string]$Destination=(Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Codex/hermes-voice'))
$ErrorActionPreference='Stop'
$studioRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$voiceRoot=[IO.Path]::GetFullPath($Destination)
if(-not(Test-Path -LiteralPath $voiceRoot)){New-Item -ItemType Directory -Path $voiceRoot|Out-Null}
$voicePython=Join-Path $voiceRoot 'venv/Scripts/python.exe'
if(-not(Test-Path -LiteralPath $voicePython)){& $Python -m venv (Join-Path $voiceRoot 'venv');if($LASTEXITCODE-ne 0){throw 'No se pudo preparar Python.'}}
& $voicePython -m pip install 'faster-whisper==1.2.1' 'piper-tts==1.8.0' 'av<19'
if($LASTEXITCODE-ne 0){throw 'No se pudo instalar el motor local.'}
& $voicePython (Join-Path $PSScriptRoot 'install-voice-models.py') (Join-Path $voiceRoot 'models') (Join-Path $studioRoot '.runtime/voice-install.local.json')
if($LASTEXITCODE-ne 0){throw 'No se completó la instalación de modelos.'}
