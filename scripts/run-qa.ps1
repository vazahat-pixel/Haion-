# Haion ERP — Full QA Runner (Windows)
# Runs backend API QA + frontend build + Playwright E2E

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Write-Host "`n=== Haion ERP QA Suite ===`n" -ForegroundColor Cyan

# 1. Backend tests
Write-Host "[1/4] Backend API tests..." -ForegroundColor Yellow
Push-Location "$Root\backend"
$env:NODE_ENV = "test"
$env:JWT_ACCESS_SECRET = "test-access-secret-key-minimum-32-chars"
$env:JWT_REFRESH_SECRET = "test-refresh-secret-key-minimum-32-chars"
npm test
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

# 2. Backend panel QA
Write-Host "`n[2/4] Backend panel-wise QA..." -ForegroundColor Yellow
Push-Location "$Root\backend"
npm run test:qa
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

# 3. Frontend build
Write-Host "`n[3/4] Frontend production build..." -ForegroundColor Yellow
Push-Location "$Root\frontend"
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

# 4. Playwright E2E (requires playwright install once)
Write-Host "`n[4/4] Playwright E2E (ensure backend+frontend running or auto-start)..." -ForegroundColor Yellow
Push-Location "$Root\frontend"
if (-not (Test-Path "node_modules\@playwright\test")) {
  Write-Host "Installing Playwright..." -ForegroundColor Gray
  npm install
  npx playwright install chromium
}
npm run test:e2e
$e2eExit = $LASTEXITCODE
Pop-Location

if ($e2eExit -ne 0) { exit $e2eExit }

Write-Host "`n=== All QA checks passed ===`n" -ForegroundColor Green
