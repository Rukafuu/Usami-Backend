# Takes the third-party 3D model (白一 (shiro) by @Sweet_nya) off the site in one step, then rebuilds and redeploys.
# Use it if the author says the use is not allowed. Needs `npx wrangler login` to be valid.
#   powershell -File script\remove_usami_model.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$utf8 = New-Object Text.UTF8Encoding($false)

# 1) gallery items (every block that starts with "- id: usami-companion" or "- id: usami-conversation")
$gallery = Join-Path $root "config\content\gallery.yml"
$text = [IO.File]::ReadAllText($gallery)
$blocks = [regex]::Split($text, '(?m)^(?=- id: )')
$kept = $blocks | Where-Object { $_ -notmatch '^- id: usami-(companion|conversation)\b' }
[IO.File]::WriteAllText($gallery, ($kept -join ""), $utf8)

# 2) the credit link on the project page
$entry = Join-Path $root "config\content\entries\usami.yml"
$lines = [IO.File]::ReadAllLines($entry, $utf8) | Where-Object { $_ -notmatch 'sweetnya\.booth\.pm' }
[IO.File]::WriteAllLines($entry, $lines, $utf8)

# 3) the images
Remove-Item -Force (Join-Path $root "public\media\usami-companion*.jpg"), (Join-Path $root "public\media\usami-conversation*.jpg") -ErrorAction SilentlyContinue

# 4) rebuild and publish
powershell -NoProfile -File (Join-Path $root "script\build_static.ps1") -SiteUrl https://usami.usami-cloudflare.workers.dev
Set-Location (Join-Path $root "cloudflare")
npx wrangler deploy
Write-Host "Done: the model images and credit are off the live site. Also check the app itself (A:\Usami Project) if it ships the model."
