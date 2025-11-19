# Update IP to 192.168.1.19

$envFile = "..\.env"
$ip = "192.168.1.19"

if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    $content = $content -replace 'CORS_ORIGIN\s*=\s*["'']?[^"'']+["'']?', "CORS_ORIGIN=`"http://$ip:3000`""
    $content = $content -replace 'S3_ENDPOINT\s*=\s*["'']?[^"'']+["'']?', "S3_ENDPOINT=`"http://$ip:9000`""
    $content | Set-Content $envFile -Encoding UTF8
    Write-Host "Updated to IP: $ip"
} else {
    Write-Host "File .env not found"
}

