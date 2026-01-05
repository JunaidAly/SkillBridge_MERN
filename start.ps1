# Quick Start Script for SkillBridge AI Recommendation System
# Run this script from the project root directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SkillBridge AI Recommendation System" -ForegroundColor Cyan
Write-Host "Quick Start Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found. Please install Python 3.9+" -ForegroundColor Red
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js 16+" -ForegroundColor Red
    exit 1
}

# Check MongoDB
try {
    mongosh --eval "db.version()" --quiet 2>&1 | Out-Null
    Write-Host "✓ MongoDB is running" -ForegroundColor Green
} catch {
    Write-Host "⚠ MongoDB not accessible. Make sure it's running." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Process" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Setup Python Service
Write-Host "1. Setting up Python Recommendation Service..." -ForegroundColor Yellow
Set-Location recommendation-service

if (-not (Test-Path "venv")) {
    Write-Host "   Creating virtual environment..." -ForegroundColor Gray
    python -m venv venv
}

Write-Host "   Activating virtual environment..." -ForegroundColor Gray
& ".\venv\Scripts\Activate.ps1"

Write-Host "   Installing Python dependencies..." -ForegroundColor Gray
pip install -q -r requirements.txt

if (-not (Test-Path ".env")) {
    Write-Host "   Creating .env file..." -ForegroundColor Gray
    Copy-Item .env.example .env
}

Write-Host "✓ Python service setup complete" -ForegroundColor Green
Set-Location ..

# Setup Backend
Write-Host ""
Write-Host "2. Setting up Backend..." -ForegroundColor Yellow
Set-Location backend

if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing backend dependencies..." -ForegroundColor Gray
    npm install --silent
} else {
    Write-Host "   Backend dependencies already installed" -ForegroundColor Gray
}

Write-Host "✓ Backend setup complete" -ForegroundColor Green
Set-Location ..

# Setup Frontend
Write-Host ""
Write-Host "3. Setting up Frontend..." -ForegroundColor Yellow
Set-Location frontend

if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing frontend dependencies..." -ForegroundColor Gray
    npm install --silent
} else {
    Write-Host "   Frontend dependencies already installed" -ForegroundColor Gray
}

Write-Host "✓ Frontend setup complete" -ForegroundColor Green
Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Opening 3 terminals to start services..." -ForegroundColor Yellow
Write-Host ""

# Start Python Service in new terminal
Write-Host "1. Starting Python Recommendation Service (Port 8001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\recommendation-service'; .\venv\Scripts\Activate.ps1; Write-Host '🚀 Starting Python Recommendation Service...' -ForegroundColor Cyan; python main.py"

Start-Sleep -Seconds 3

# Start Backend in new terminal
Write-Host "2. Starting Backend (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host '🚀 Starting Backend...' -ForegroundColor Cyan; npm run dev"

Start-Sleep -Seconds 3

# Start Frontend in new terminal
Write-Host "3. Starting Frontend (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host '🚀 Starting Frontend...' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Services Starting..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please wait 10-15 seconds for all services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "✓ All services should now be running!" -ForegroundColor Green
Write-Host ""
Write-Host "Access your application:" -ForegroundColor Cyan
Write-Host "  • Frontend:      http://localhost:5173" -ForegroundColor White
Write-Host "  • Backend:       http://localhost:5000" -ForegroundColor White
Write-Host "  • Python API:    http://localhost:8001/docs" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Important: Train Models First!" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Before using recommendations, train the AI models:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Using PowerShell" -ForegroundColor Cyan
Write-Host '  $headers = @{"X-API-Key" = "dev-secret-key-12345"; "Content-Type" = "application/json"}' -ForegroundColor Gray
Write-Host '  $body = @{force_retrain = $true} | ConvertTo-Json' -ForegroundColor Gray
Write-Host '  Invoke-RestMethod -Uri "http://localhost:8001/train" -Method POST -Headers $headers -Body $body' -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2: Using curl" -ForegroundColor Cyan
Write-Host '  curl -X POST http://localhost:8001/train \' -ForegroundColor Gray
Write-Host '    -H "X-API-Key: dev-secret-key-12345" \' -ForegroundColor Gray
Write-Host '    -H "Content-Type: application/json" \' -ForegroundColor Gray
Write-Host '    -d "{\"force_retrain\": true}"' -ForegroundColor Gray
Write-Host ""
Write-Host "See SETUP_GUIDE.md for detailed instructions." -ForegroundColor White
Write-Host ""
