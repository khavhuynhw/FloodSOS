# PowerShell script to setup MinIO bucket for image storage
# Run this after starting MinIO with docker-compose

$MC_ENDPOINT = "http://localhost:9000"
$MC_ACCESS_KEY = "minioadmin"
$MC_SECRET_KEY = "minioadmin"
$BUCKET_NAME = "floodrelief-images"

Write-Host "`n=== Setting up MinIO bucket ===" -ForegroundColor Cyan

# Check if MinIO is accessible
try {
    $response = Invoke-WebRequest -Uri "$MC_ENDPOINT/minio/health/live" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ MinIO is running" -ForegroundColor Green
} catch {
    Write-Host "❌ MinIO is not accessible at $MC_ENDPOINT" -ForegroundColor Red
    Write-Host "   Please make sure MinIO is running: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

# Create bucket using MinIO REST API
Write-Host "`nCreating bucket '$BUCKET_NAME'..." -ForegroundColor Yellow

try {
    # Create bucket using MinIO API
    $uri = "$MC_ENDPOINT/$BUCKET_NAME"
    $headers = @{
        "Authorization" = "AWS $MC_ACCESS_KEY`:$MC_SECRET_KEY"
    }
    
    # Use PUT request to create bucket
    $response = Invoke-WebRequest -Uri $uri -Method PUT -Headers $headers -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ Bucket '$BUCKET_NAME' created successfully!" -ForegroundColor Green
} catch {
    # Bucket might already exist, which is fine
    if ($_.Exception.Response.StatusCode -eq 409 -or $_.Exception.Response.StatusCode -eq "BucketAlreadyOwnedByYou") {
        Write-Host "✅ Bucket '$BUCKET_NAME' already exists" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Could not create bucket via API: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "`nPlease create bucket manually:" -ForegroundColor Yellow
        Write-Host "1. Open browser: http://localhost:9001" -ForegroundColor White
        Write-Host "2. Login: minioadmin / minioadmin" -ForegroundColor White
        Write-Host "3. Click 'Create Bucket'" -ForegroundColor White
        Write-Host "4. Name: $BUCKET_NAME" -ForegroundColor White
        Write-Host "5. Click 'Create Bucket'`n" -ForegroundColor White
    }
}

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "   MinIO Console: http://localhost:9001" -ForegroundColor Cyan
Write-Host "   Bucket name: $BUCKET_NAME`n" -ForegroundColor Cyan
