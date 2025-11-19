# Script to fix DATABASE_URL in .env file

$envFile = Join-Path $PSScriptRoot "..\.env"
$correctUrl = 'postgresql://postgres:postgres@localhost:5432/floodrelief?schema=public'

Write-Host ""
Write-Host "=== Fixing DATABASE_URL in .env ===" -ForegroundColor Cyan

if (-not (Test-Path $envFile)) {
    Write-Host "File .env khong ton tai. Tao file moi..." -ForegroundColor Yellow
    
    $envContent = @"
DATABASE_URL="$correctUrl"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars-123456789012"
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="floodrelief-images"
S3_REGION="us-east-1"
PORT=3001
CORS_ORIGIN="http://localhost:3000"
"@
    
    $envContent | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host "Da tao file .env moi" -ForegroundColor Green
} else {
    Write-Host "File .env ton tai" -ForegroundColor Green
    
    # Read current content
    $content = Get-Content $envFile -Raw
    
    # Check if DATABASE_URL exists
    if ($content -match 'DATABASE_URL\s*=\s*["'']?([^"'']+)["'']?') {
        $currentUrl = $matches[1]
        Write-Host ""
        Write-Host "Current DATABASE_URL: $currentUrl" -ForegroundColor Yellow
        
        if ($currentUrl -ne $correctUrl) {
            Write-Host "Sua thanh: $correctUrl" -ForegroundColor Green
            $content = $content -replace 'DATABASE_URL\s*=\s*["'']?[^"'']+["'']?', "DATABASE_URL=`"$correctUrl`""
            $content | Set-Content $envFile -Encoding UTF8
            Write-Host "Da sua DATABASE_URL" -ForegroundColor Green
        } else {
            Write-Host "DATABASE_URL da dung" -ForegroundColor Green
        }
    } else {
        Write-Host "Them DATABASE_URL vao file..." -ForegroundColor Yellow
        $content += "`nDATABASE_URL=`"$correctUrl`""
        $content | Set-Content $envFile -Encoding UTF8
        Write-Host "Da them DATABASE_URL" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Hoan tat! Bay gio chay lai:" -ForegroundColor Green
Write-Host "npx prisma migrate dev" -ForegroundColor Cyan
Write-Host ""
