# Train AI Models via Backend
# Usage: Update email/password, then run: .\train-via-backend.ps1

$email = "skillbridgeadmin@gmail.com"
$password = "Admin123!@#"

Write-Host "Step 1: Logging in..." -ForegroundColor Cyan

# Login to get token
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody
    
    if ($loginResponse.requiresVerification) {
        Write-Host "⚠️  2FA verification required!" -ForegroundColor Yellow
        Write-Host "Check your email for the verification code." -ForegroundColor Yellow
        
        $code = Read-Host "Enter the 6-digit verification code"
        
        Write-Host ""
        Write-Host "Verifying code..." -ForegroundColor Cyan
        
        $verifyBody = @{
            email = $email
            code = $code
        } | ConvertTo-Json
        
        $verifyResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/verify" `
            -Method POST `
            -ContentType "application/json" `
            -Body $verifyBody
        
        $token = $verifyResponse.token
    } else {
        $token = $loginResponse.token
    }
    
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Step 2: Training models..." -ForegroundColor Cyan
    
    # Call training endpoint
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $trainResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/recommendations/train" `
        -Method POST `
        -Headers $headers
    
    Write-Host "✅ Training completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Results:" -ForegroundColor Yellow
    $trainResponse | ConvertTo-Json -Depth 5 | Write-Host
    
} catch {
    Write-Host "❌ Error occurred!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message
    }
}
