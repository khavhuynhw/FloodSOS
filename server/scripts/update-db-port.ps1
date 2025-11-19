# Update DATABASE_URL to use port 5433

$envFile = Join-Path $PSScriptRoot "..\.env"
$correctUrl = 'postgresql://postgres:postgres@localhost:5433/floodrelief?schema=public'

Write-Host ""
Write-Host "=== Updating DATABASE_URL to port 5433 ===" -ForegroundColor Cyan

if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    $content = $content -replace 'DATABASE_URL\s*=\s*["'']?[^"'']+["'']?', "DATABASE_URL=`"$correctUrl`""
    $content | Set-Content $envFile -Encoding UTF8
    Write-Host "Da cap nhat DATABASE_URL sang port 5433" -ForegroundColor Green
    Write-Host "DATABASE_URL: $correctUrl" -ForegroundColor Cyan
} else {
    Write-Host "File .env khong ton tai" -ForegroundColor Red
}

Write-Host ""

