# Auto-start all SkillBridge services in separate windows
Write-Host "Starting SkillBridge AI Recommendation System..." -ForegroundColor Cyan
Write-Host ""

$projectRoot = "D:\WEB DEV\MERNSTACK\SkillBridge_MERN"

# Start Python AI Service
Write-Host "1. Starting Python AI Service..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd '$projectRoot\recommendation-service'; .\venv\Scripts\Activate.ps1; python main.py"

Start-Sleep -Seconds 3

# Start Backend
Write-Host "2. Starting Backend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd '$projectRoot\backend'; npm run dev"

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "3. Starting Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd '$projectRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "All services are starting!" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "Python AI Service: http://localhost:8001" -ForegroundColor Cyan
Write-Host "Backend API:       http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend:          http://localhost:5173" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Waiting 10 seconds before opening browser..." -ForegroundColor Gray
Start-Sleep -Seconds 10
Start-Process "http://localhost:5173"
