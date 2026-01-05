@echo off
echo ============================================
echo SkillBridge AI Recommendation System
echo Starting All Services...
echo ============================================
echo.

REM Start Python AI Service
start "Python AI Service" cmd /k "cd recommendation-service && venv\Scripts\activate && python main.py"

timeout /t 3 /nobreak >nul

REM Start Backend
start "Backend Server" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

REM Start Frontend
start "Frontend Dev Server" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================
echo All services are starting...
echo ============================================
echo Python AI Service: http://localhost:8001
echo Backend API:       http://localhost:5000
echo Frontend:          http://localhost:5173
echo ============================================
echo.
echo Press any key to open browser...
pause >nul
start http://localhost:5173
