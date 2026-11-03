# Builds cloudflare/.env.deploy with ONLY the secret the Worker needs, without printing it:
#   NVIDIA_API_KEY - copied from the workspace .env (A:\Usami Site\.env)
# Nothing else from .env goes up (Gemini, ElevenLabs, N8N, USAMI_API_TOKEN stay on this machine).
# Upload with:  cd cloudflare; npx wrangler secret bulk .env.deploy ; then delete the file.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path (Split-Path -Parent $root) ".env"
if (-not (Test-Path $source)) { throw "Workspace .env not found at $source" }

$line = Get-Content $source | Where-Object { $_ -match '^\s*NVIDIA_API_KEY\s*=' } | Select-Object -First 1
if (-not $line) { throw "NVIDIA_API_KEY is not set in $source" }
$nvidia = ($line -replace '^\s*NVIDIA_API_KEY\s*=\s*', '').Trim().Trim('"').Trim("'")
if (-not $nvidia) { throw "NVIDIA_API_KEY is empty" }

$content = "NVIDIA_API_KEY=$nvidia`n"
$names = "NVIDIA_API_KEY"
# RESEND_API_KEY sends the quote-form emails; without it the form tells visitors to write to the email address.
$mail = Get-Content $source | Where-Object { $_ -match '^\s*RESEND_API_KEY\s*=' } | Select-Object -First 1
if ($mail) {
  $resend = ($mail -replace '^\s*RESEND_API_KEY\s*=\s*', '').Trim().Trim('"').Trim("'")
  if ($resend) { $content += "RESEND_API_KEY=$resend`n"; $names += ", RESEND_API_KEY" }
}

$target = Join-Path $root "cloudflare\.env.deploy"
[IO.File]::WriteAllText($target, $content, (New-Object Text.UTF8Encoding($false)))
Write-Host "Wrote $target with: $names (values not shown)."
Write-Host "Next: cd cloudflare; npx wrangler secret bulk .env.deploy; then delete .env.deploy"