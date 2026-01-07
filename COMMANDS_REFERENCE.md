# 🔧 Deployment Commands Reference

Quick reference for common deployment tasks.

---

## 1. Initial Setup

### Generate Secure Secrets
```bash
# Generate JWT Secret (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate multiple secrets at once
node -e "for(let i=0; i<3; i++) console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Clone and Setup
```powershell
# Clone repository
git clone https://github.com/yourusername/SkillBridge_MERN.git
cd SkillBridge_MERN

# Setup backend
cd backend
npm install
copy .env.example .env
# Edit .env with your values
cd ..

# Setup frontend
cd frontend
npm install
copy .env.example .env
# Edit .env with your values
cd ..

# Setup recommendation service
cd recommendation-service
pip install -r requirements.txt
copy .env.example .env
# Edit .env with your values
cd ..
```

---

## 2. Local Development

### Start All Services (Docker)
```powershell
# Using PowerShell script
.\start-all.ps1

# Or using Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Start Individual Services (Development)

**Backend:**
```powershell
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Frontend:**
```powershell
cd frontend
npm run dev
# Runs on http://localhost:5173
```

**Recommendation Service:**
```powershell
cd recommendation-service
uvicorn main:app --reload --port 8001
# Runs on http://localhost:8001
```

---

## 3. Testing API Endpoints

### Backend Health Check
```powershell
# PowerShell
Invoke-RestMethod -Uri "http://localhost:5000/api"

# Or using curl
curl http://localhost:5000/api
```

### Recommendation Service Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:8001/health"
```

### Test with Authentication
```powershell
# Login and get token
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com","password":"password123"}'

$token = $response.token

# Use token in authenticated request
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/user/profile" `
  -Headers $headers
```

---

## 4. Database Operations

### MongoDB Atlas Connection Test
```bash
# Using mongosh (MongoDB Shell)
mongosh "mongodb+srv://username:password@cluster.xxxxx.mongodb.net/skillbridge"

# View databases
show dbs

# Use skillbridge database
use skillbridge

# View collections
show collections

# View users
db.users.find().limit(5)

# Count documents
db.users.countDocuments()
```

### Create Admin User (Backend)
```powershell
cd backend
node make-admin.mjs <email> <password> "<fullName>"

# Example:
node make-admin.mjs admin@skillbridge.com Admin123! "Admin User"
```

---

## 5. Git Operations

### Commit and Push Changes
```powershell
# Check status
git status

# Add all changes
git add .

# Commit with message
git commit -m "Update deployment configuration"

# Push to GitHub
git push origin main
```

### Create New Branch for Deployment
```powershell
# Create and switch to new branch
git checkout -b production

# Push new branch
git push -u origin production
```

---

## 6. Vercel Deployment

### Using Vercel CLI
```powershell
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview
cd frontend
vercel

# Deploy to production
vercel --prod

# Set environment variable
vercel env add VITE_API_BASE_URL production
```

### Using Git Integration
```powershell
# Just push to GitHub - Vercel auto-deploys
git push origin main
```

---

## 7. Render Deployment

### Force Redeploy
```bash
# Render auto-deploys on git push
# To force redeploy:
# 1. Go to Render Dashboard
# 2. Select service
# 3. Click "Manual Deploy" → "Deploy Latest Commit"

# Or trigger via webhook
curl -X POST https://api.render.com/deploy/srv-xxxxx?key=xxxxx
```

### View Logs
```bash
# Via Render CLI (if installed)
render logs <service-id>

# Or view in browser:
# Dashboard → Service → Logs tab
```

---

## 8. Environment Management

### View Environment Variables

**PowerShell:**
```powershell
# Backend
Get-Content backend\.env

# Frontend
Get-Content frontend\.env
```

**Render (via CLI):**
```bash
# List environment variables
render env list -s <service-id>
```

**Vercel (via CLI):**
```bash
# Pull environment variables
vercel env pull

# Add environment variable
vercel env add VARIABLE_NAME production
```

---

## 9. Build & Production Commands

### Build Frontend for Production
```powershell
cd frontend
npm run build
# Output: frontend/dist

# Preview production build locally
npm run preview
```

### Build Backend (if needed)
```powershell
cd backend
npm install --production
```

### Test Production Build Locally
```powershell
# Build frontend
cd frontend
npm run build

# Serve with Node.js static server
npx serve -s dist -p 3000
```

---

## 10. Monitoring & Debugging

### Check Service Health
```powershell
# Create a health check script
$services = @(
    "https://your-backend.onrender.com/api",
    "https://your-recommendation.onrender.com/health",
    "https://your-frontend.vercel.app"
)

foreach ($url in $services) {
    try {
        $response = Invoke-RestMethod -Uri $url -TimeoutSec 10
        Write-Host "✓ $url - OK" -ForegroundColor Green
    } catch {
        Write-Host "✗ $url - FAILED" -ForegroundColor Red
    }
}
```

### View Application Logs

**Render:**
```bash
# Go to: Dashboard → Service → Logs
# Or use API:
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.render.com/v1/services/YOUR_SERVICE_ID/logs
```

**Vercel:**
```bash
# Using Vercel CLI
vercel logs <deployment-url>
```

**MongoDB Atlas:**
```bash
# Go to: Cluster → Metrics → Query Profiler
```

---

## 11. Backup & Restore

### Backup MongoDB Database
```bash
# Using mongodump
mongodump --uri="mongodb+srv://username:password@cluster.xxxxx.mongodb.net/skillbridge" --out=./backup

# Restore
mongorestore --uri="mongodb+srv://username:password@cluster.xxxxx.mongodb.net/skillbridge" ./backup/skillbridge
```

### Backup Environment Variables
```powershell
# Save all .env files
$date = Get-Date -Format "yyyy-MM-dd"
Compress-Archive -Path "*\.env" -DestinationPath "backup-env-$date.zip"
```

---

## 12. Troubleshooting Commands

### Clear Cache and Reinstall

**Frontend:**
```powershell
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

**Backend:**
```powershell
cd backend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Fix Python Dependencies
```powershell
cd recommendation-service
pip uninstall -r requirements.txt -y
pip install -r requirements.txt
```

### Check Node/npm/Python Versions
```powershell
node --version    # Should be v18+ or v20+
npm --version     # Should be 9+ or 10+
python --version  # Should be 3.9+
```

### Test Port Availability
```powershell
# Check if port is in use
Test-NetConnection -ComputerName localhost -Port 5000
Test-NetConnection -ComputerName localhost -Port 5173
Test-NetConnection -ComputerName localhost -Port 8001
```

### Kill Process on Port (Windows)
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

---

## 13. Performance Testing

### Load Test Backend
```powershell
# Using Apache Bench (install separately)
ab -n 1000 -c 10 https://your-backend.onrender.com/api

# Using PowerShell
$url = "https://your-backend.onrender.com/api"
Measure-Command {
    1..100 | ForEach-Object -Parallel {
        Invoke-RestMethod -Uri $using:url
    }
}
```

### Test Database Connection Speed
```javascript
// test-db-speed.js
import mongoose from 'mongoose';

const start = Date.now();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    const duration = Date.now() - start;
    console.log(`Connected in ${duration}ms`);
    process.exit(0);
  });
```

---

## 14. Security Checks

### Check for Exposed Secrets
```powershell
# Search for potential secrets in code
Select-String -Path "**\*.js","**\*.jsx" -Pattern "(password|secret|key|token).*=.*['\"]" -Exclude "node_modules"
```

### Update Dependencies
```powershell
# Check for outdated packages
cd frontend
npm outdated

cd ..\backend
npm outdated

# Update all packages
npm update

# Check for security vulnerabilities
npm audit
npm audit fix
```

---

## 15. Maintenance Tasks

### Clean Docker System
```powershell
# Remove unused containers, networks, images
docker system prune -a

# Remove volumes
docker volume prune
```

### Update Models (Recommendation Service)
```powershell
# Trigger model training
Invoke-RestMethod -Uri "http://localhost:8001/train" `
  -Method POST `
  -Headers @{"X-API-Key" = "your-api-key"} `
  -ContentType "application/json" `
  -Body '{}'
```

---

## Quick Copy-Paste Commands

### Full Local Setup (New Machine)
```powershell
git clone <repo-url>
cd SkillBridge_MERN
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd recommendation-service && pip install -r requirements.txt && cd ..
# Copy .env files and configure
.\start-all.ps1
```

### Deploy All Changes
```powershell
git add .
git commit -m "Update: [description]"
git push origin main
# Render and Vercel auto-deploy
```

### Health Check All Services
```powershell
@(
  "https://your-backend.onrender.com/api",
  "https://your-recommendation.onrender.com/health",
  "https://your-frontend.vercel.app"
) | ForEach-Object { 
  Write-Host "Checking: $_"
  Invoke-RestMethod -Uri $_ 
}
```

---

## Useful URLs

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Render Dashboard**: https://dashboard.render.com
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Cloudinary**: https://cloudinary.com/console
- **Google Cloud Console**: https://console.cloud.google.com
- **UptimeRobot**: https://uptimerobot.com

---

## Support Resources

- **Vercel Status**: https://www.vercel-status.com
- **Render Status**: https://status.render.com
- **MongoDB Atlas Status**: https://status.mongodb.com

---

*Save this file for quick reference during development and deployment!*
