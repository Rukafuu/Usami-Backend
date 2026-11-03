# Builds the static site into cloudflare/site: production front-end build + a render of every page.
# Usage: powershell -File script\build_static.ps1 [-SiteUrl https://usami.<your-subdomain>.workers.dev] [-AnalyticsToken <Cloudflare Web Analytics token>]
param([string]$SiteUrl = "http://localhost:8787", [string]$AnalyticsToken = "")
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
if (-not ($env:Path -like "*Ruby34-x64*")) { $env:Path = "C:\Ruby34-x64\bin;" + $env:Path }

$env:RAILS_ENV = "production"
$env:SECRET_KEY_BASE = "build-only-" + ("x" * 64)   # never used to serve anything; the files are public
$env:RAILS_LOG_LEVEL = "warn"
$env:SITE_URL = $SiteUrl
if (-not $AnalyticsToken) { $file = Join-Path $root "cloudflare\analytics-token.txt"; if (Test-Path $file) { $AnalyticsToken = (Get-Content $file -Raw).Trim() } }
if ($AnalyticsToken) { $env:CF_ANALYTICS_TOKEN = $AnalyticsToken }   # Cloudflare Web Analytics site token (public by design)
try {
  Remove-Item -Recurse -Force public\vite -ErrorAction SilentlyContinue
  ruby bin/rails assets:precompile
  if ($LASTEXITCODE -ne 0) { throw "assets:precompile failed" }
  ruby bin/rails static:export
  if ($LASTEXITCODE -ne 0) { throw "static:export failed" }
} finally {
  Remove-Item -Recurse -Force public\vite -ErrorAction SilentlyContinue   # build output is copied into cloudflare/site
  Remove-Item Env:RAILS_ENV, Env:SECRET_KEY_BASE, Env:RAILS_LOG_LEVEL, Env:SITE_URL, Env:CF_ANALYTICS_TOKEN -ErrorAction SilentlyContinue
}