# Deploy backend to Fly.io (run from repo root after: flyctl auth login)
$ErrorActionPreference = "Stop"
$flyBin = "$env:USERPROFILE\.fly\bin"
if (-not (Test-Path "$flyBin\flyctl.exe")) { Write-Error "Fly CLI not found. Install: iwr https://fly.io/install.ps1 -useb | iex"; exit 1 }
$env:Path = "$flyBin;" + $env:Path

Set-Location $PSScriptRoot

# 1) Create app if not exists (use existing fly.toml)
Write-Host "Checking Fly app..."
flyctl apps list 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Host "Run: flyctl auth login (complete in browser), then run this script again."; exit 1 }

$appName = "smart-land-management-api"
$appExists = flyctl apps list 2>$null | Select-String -Pattern $appName -Quiet
if (-not $appExists) {
  Write-Host "Creating app: $appName"
  flyctl launch --no-deploy --copy-config --name $appName
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
  Write-Host "App $appName already exists."
}

# 2) Set secrets from backend\.env (skip comments and empty)
$envFile = "backend\.env"
if (Test-Path $envFile) {
  Write-Host "Setting secrets from $envFile ..."
  $lines = Get-Content $envFile -Raw
  $lines -split "`n" | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#")) {
      $idx = $line.IndexOf("=")
      if ($idx -gt 0) {
        $key = $line.Substring(0, $idx).Trim()
        $val = $line.Substring($idx + 1).Trim()
        if ($key -and $val) {
          # Skip HF_MODEL (optional) and empty values
          if ($key -eq "HF_MODEL") { return }
          Write-Host "  Setting $key"
          flyctl secrets set "${key}=$val" 2>$null
        }
      }
    }
  }
  # Force production settings
  flyctl secrets set "DEBUG=False"
  flyctl secrets set "CORS_ORIGINS=https://www.mashorifarm.com,https://mashorifarm.com"
  flyctl secrets set "CSRF_TRUSTED_ORIGINS=https://www.mashorifarm.com,https://mashorifarm.com"
} else {
  Write-Host "No backend\.env found. Set secrets manually: fly secrets set KEY=value"
}

# 3) Deploy
Write-Host "Deploying..."
flyctl deploy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Done. API: https://${appName}.fly.dev"
flyctl open
