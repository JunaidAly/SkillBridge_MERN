# Train models by calling Python service directly
$uri = "http://localhost:8001/train"
$headers = @{
    "X-API-Key" = "your-secret-api-key-here"
    "Content-Type" = "application/json"
}
$body = '{"force_retrain": false}'

try {
    Write-Host "Training models directly via Python service..." -ForegroundColor Cyan
    
    $response = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $body
    
    Write-Host "✅ Training successful!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
    
} catch {
    Write-Host "❌ Training failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message
    }
}
