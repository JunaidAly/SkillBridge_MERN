# Create a test admin user with password
$email = "skillbridgeadmin@gmail.com"
$password = "Admin123!@#"
$name = "SkillBridge Admin"

$registerBody = @{
    email = $email
    password = $password
    name = $name
} | ConvertTo-Json

try {
    Write-Host "Creating test admin user..." -ForegroundColor Cyan
    
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerBody
    
    Write-Host "✅ User created successfully!" -ForegroundColor Green
    Write-Host "Email: $email" -ForegroundColor Yellow
    Write-Host "Password: $password" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Now update train-via-backend.ps1 with these credentials and run it." -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message
    }
}
