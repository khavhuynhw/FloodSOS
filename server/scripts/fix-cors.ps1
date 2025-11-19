# Fix CORS_ORIGIN in server/.env

$envFile = Join-Path $PSScriptRoot "..\.env"
$correctOrigin = "http://localhost:3000"

Write-Host ""
Write-Host "=== Fixing CORS_ORIGIN ===" -ForegroundColor Cyan

if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    
    # Check current CORS_ORIGIN
    if ($content -match 'CORS_ORIGIN\s*=\s*["'']?([^"'']+)["'']?') {
        $currentOrigin = $matches[1]
        Write-Host "Current CORS_ORIGIN: $currentOrigin" -ForegroundColor Yellow
        
        # Validate format - must have http:// or https:// followed by host and port
        if (-not ($currentOrigin -match '^https?://[^/]+:\d+')) {
            Write-Host "CORS_ORIGIN format invalid (current: '$currentOrigin')! Fixing..." -ForegroundColor Red
            $content = $content -replace 'CORS_ORIGIN\s*=\s*["'']?[^"'']+["'']?', "CORS_ORIGIN=`"$correctOrigin`""
            $content | Set-Content $envFile -Encoding UTF8
            Write-Host "Fixed CORS_ORIGIN to: $correctOrigin" -ForegroundColor Green
        } else {
            Write-Host "CORS_ORIGIN format is valid" -ForegroundColor Green
        }
    } else {
        Write-Host "CORS_ORIGIN not found, adding..." -ForegroundColor Yellow
        $content += "`nCORS_ORIGIN=`"$correctOrigin`""
        $content | Set-Content $envFile -Encoding UTF8
        Write-Host "Added CORS_ORIGIN: $correctOrigin" -ForegroundColor Green
    }
} else {
    Write-Host "File .env not found" -ForegroundColor Red
}

Write-Host ""

