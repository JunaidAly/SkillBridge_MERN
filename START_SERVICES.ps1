# ============================================
# SkillBridge AI Recommendation System
# Quick Start Commands
# ============================================

# ===== START ALL SERVICES =====

# 1. Start Python AI Service (Terminal 1)
cd D:\WEB` DEV\MERNSTACK\SkillBridge_MERN\recommendation-service
.\venv\Scripts\Activate.ps1
python main.py

# 2. Start Backend (Terminal 2)
cd D:\WEB` DEV\MERNSTACK\SkillBridge_MERN\backend
npm run dev

# 3. Start Frontend (Terminal 3)
cd D:\WEB` DEV\MERNSTACK\SkillBridge_MERN\frontend
npm run dev

# ===== SINGLE COMMAND TO START ALL =====
# Run this from project root to start everything at once:
# Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd recommendation-service; .\venv\Scripts\Activate.ps1; python main.py"; Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"; Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

# ===== CHECK IF SERVICES ARE RUNNING =====
# Python Service:
Invoke-RestMethod http://localhost:8001/health | ConvertTo-Json

# Backend:
Invoke-RestMethod http://localhost:5000/api/health

# Frontend:
# Open browser: http://localhost:5173

# ===== TRAIN MODELS (One-time or when data changes) =====
cd D:\WEB` DEV\MERNSTACK\SkillBridge_MERN\recommendation-service
.\venv\Scripts\Activate.ps1
python test_train.py

# ===== STOP ALL SERVICES =====
Stop-Process -Name "python","node" -Force -ErrorAction SilentlyContinue
