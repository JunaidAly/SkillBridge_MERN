# 🚀 SkillBridge AI Recommendation System - Complete Setup Guide

This guide provides step-by-step instructions for setting up and running the AI-powered teacher recommendation system.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Local Development Setup](#local-development-setup)
3. [Docker Deployment](#docker-deployment)
4. [Initial Model Training](#initial-model-training)
5. [Usage Examples](#usage-examples)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Quick Start

### Prerequisites Check

```powershell
# Check Node.js (should be v16+)
node --version

# Check Python (should be 3.9+)
python --version

# Check MongoDB (should be running)
mongosh --eval "db.version()"
```

---

## 💻 Local Development Setup

### Step 1: Clone and Navigate

```powershell
cd "d:\WEB DEV\MERNSTACK\SkillBridge_MERN"
```

### Step 2: Setup Python Recommendation Service

```powershell
# Navigate to recommendation service
cd recommendation-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
copy .env.example .env

# Edit .env with your settings (use notepad or VSCode)
notepad .env
```

**Update `.env` with:**
```env
MONGODB_URI=mongodb://localhost:27017/skillbridge
MONGODB_DB_NAME=skillbridge
SERVICE_PORT=8001
API_KEY=dev-secret-key-12345
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Step 3: Setup Backend

```powershell
# Navigate to backend (from root)
cd ..\backend

# Install dependencies
npm install

# Update .env file
```

**Add to `backend/.env`:**
```env
RECOMMENDATION_SERVICE_URL=http://localhost:8001
RECOMMENDATION_SERVICE_API_KEY=dev-secret-key-12345
```

### Step 4: Setup Frontend

```powershell
# Navigate to frontend (from root)
cd ..\frontend

# Dependencies should already be installed
# If not: npm install
```

### Step 5: Start All Services

**Terminal 1: Python Service**
```powershell
cd recommendation-service
.\venv\Scripts\activate
python main.py
```

Expected output:
```
🚀 Starting AI Recommendation Service...
✅ Connected to MongoDB successfully
⚠️  No pre-trained models found. Please call /train endpoint first.
✅ Service ready on port 8001
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
```

**Terminal 2: Backend**
```powershell
cd backend
npm run dev
```

Expected output:
```
Server is running on port 5000
Database connected successfully
```

**Terminal 3: Frontend**
```powershell
cd frontend
npm run dev
```

Expected output:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

## 🐳 Docker Deployment

### Step 1: Create Production Environment File

```powershell
# Copy example file
copy .env.production.example .env.production

# Edit with your production values
notepad .env.production
```

### Step 2: Build and Start All Services

```powershell
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Step 3: Verify Services

```powershell
# Check all services are running
docker-compose ps

# Expected output:
# recommendation-service   running   8001/tcp
# backend                  running   5000/tcp
# frontend                 running   80/tcp
# mongodb                  running   27017/tcp
# redis                    running   6379/tcp
```

### Step 4: Access Services

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Recommendation Service: http://localhost:8001/docs (Swagger UI)
- MongoDB: mongodb://localhost:27017

### Docker Management Commands

```powershell
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# View service logs
docker-compose logs recommendation-service
docker-compose logs backend
docker-compose logs frontend

# Restart a specific service
docker-compose restart recommendation-service

# Rebuild after code changes
docker-compose up -d --build
```

---

## 🎓 Initial Model Training

### Method 1: Using API Directly (Recommended for First Time)

```powershell
# Ensure Python service is running
# Use curl or Postman

curl -X POST http://localhost:8001/train `
  -H "X-API-Key: dev-secret-key-12345" `
  -H "Content-Type: application/json" `
  -d '{\"force_retrain\": true}'
```

**Or using PowerShell:**
```powershell
$headers = @{
    "X-API-Key" = "dev-secret-key-12345"
    "Content-Type" = "application/json"
}
$body = @{
    force_retrain = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8001/train" -Method POST -Headers $headers -Body $body
```

### Method 2: Using Backend API (As Admin User)

1. Login to your application as admin
2. Get your JWT token from browser DevTools (Application > Local Storage)
3. Use the token:

```powershell
$token = "YOUR_JWT_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
$body = @{
    force_retrain = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/recommendations/train" -Method POST -Headers $headers -Body $body
```

### Expected Training Output

```json
{
  "success": true,
  "message": "Successfully trained 2 model(s)",
  "models_trained": ["collaborative", "content_based"],
  "training_stats": {
    "ratings_count": 150,
    "teachers_count": 45,
    "collaborative_trained": true,
    "content_based_trained": true
  }
}
```

### Training Requirements

**Minimum Data Needed:**
- ✅ At least 10 ratings in database
- ✅ At least 5 teachers with profiles
- ✅ Teachers should have subjects/expertise filled

**Check Your Data:**
```powershell
# Connect to MongoDB
mongosh

# Switch to your database
use skillbridge

# Count ratings
db.ratings.countDocuments()

# Count teachers
db.teachers.countDocuments()
# or
db.users.countDocuments({role: "teacher"})

# View sample rating
db.ratings.findOne()

# View sample teacher
db.teachers.findOne()
```

---

## 📝 Usage Examples

### 1. Get Recommendations (Student)

**Frontend:** The `AIRecommendations` component automatically fetches when a student logs in.

**API Call:**
```javascript
// In your React component
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchRecommendations } from '../store/recommendationsSlice';

function MyComponent() {
  const dispatch = useDispatch();
  
  useEffect(() => {
    dispatch(fetchRecommendations({ limit: 10 }));
  }, []);
}
```

### 2. Check Service Health

```powershell
# Python service
curl http://localhost:8001/health

# Backend
curl http://localhost:5000/api/health
```

### 3. View API Documentation

Open in browser:
- **Swagger UI:** http://localhost:8001/docs
- **ReDoc:** http://localhost:8001/redoc

### 4. Schedule Automatic Retraining

Add to `backend/scheduler.js`:

```javascript
import cron from 'node-cron';
import axios from 'axios';

// Retrain daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Starting scheduled model retraining...');
  try {
    await axios.post(
      `${process.env.RECOMMENDATION_SERVICE_URL}/train`,
      { force_retrain: true },
      {
        headers: { 
          'X-API-Key': process.env.RECOMMENDATION_SERVICE_API_KEY 
        }
      }
    );
    console.log('✅ Retraining completed');
  } catch (error) {
    console.error('❌ Retraining failed:', error.message);
  }
});
```

Then in `server.js`:
```javascript
import './scheduler.js';
```

---

## 🔧 Troubleshooting

### Issue: Python service won't start

**Error:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**
```powershell
cd recommendation-service
.\venv\Scripts\activate
pip install -r requirements.txt
```

---

### Issue: MongoDB connection failed

**Error:** `Failed to connect to MongoDB`

**Solution:**
```powershell
# Check MongoDB is running
mongosh

# If not running, start MongoDB service
# Windows: Start MongoDB service from Services app
# Or start manually:
mongod --dbpath "C:\data\db"
```

---

### Issue: No recommendations returned

**Error:** `Models not trained yet`

**Solution:**
```powershell
# Train models first
curl -X POST http://localhost:8001/train `
  -H "X-API-Key: dev-secret-key-12345" `
  -H "Content-Type: application/json" `
  -d '{\"force_retrain\": true}'
```

---

### Issue: Backend can't connect to Python service

**Error:** `ECONNREFUSED`

**Solution:**
```powershell
# 1. Verify Python service is running
curl http://localhost:8001/health

# 2. Check backend .env
# Ensure: RECOMMENDATION_SERVICE_URL=http://localhost:8001

# 3. Check firewall isn't blocking port 8001
```

---

### Issue: Insufficient training data

**Error:** `Insufficient data for collaborative filtering`

**Solution:**
```javascript
// Add sample ratings to your database
// Example script: seedRatings.js

import mongoose from 'mongoose';
import Rating from './models/Rating.js';

const seedRatings = async () => {
  // Connect to MongoDB
  await mongoose.connect('mongodb://localhost:27017/skillbridge');
  
  // Add sample ratings
  const sampleRatings = [
    { studentId: 'student1_id', teacherId: 'teacher1_id', rating: 5 },
    { studentId: 'student1_id', teacherId: 'teacher2_id', rating: 4 },
    { studentId: 'student2_id', teacherId: 'teacher1_id', rating: 4 },
    // Add at least 20-30 ratings
  ];
  
  await Rating.insertMany(sampleRatings);
  console.log('✅ Sample ratings added');
  process.exit(0);
};

seedRatings();
```

---

### Issue: Port already in use

**Error:** `Port 8001 is already in use`

**Solution:**
```powershell
# Find process using port
netstat -ano | findstr :8001

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change port in .env
SERVICE_PORT=8002
```

---

### Issue: Docker containers won't start

**Solution:**
```powershell
# Check Docker is running
docker --version

# View container logs
docker-compose logs recommendation-service

# Restart containers
docker-compose down
docker-compose up -d --build

# Remove all containers and start fresh
docker-compose down -v
docker-compose up -d --build
```

---

## 🎉 Success Checklist

- [ ] Python service running on http://localhost:8001
- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:5173
- [ ] MongoDB connected successfully
- [ ] Models trained successfully
- [ ] Health checks passing
- [ ] Can view Swagger docs at http://localhost:8001/docs
- [ ] Students can see AI recommendations in dashboard

---

## 📚 Next Steps

1. **Customize Algorithm:**
   - Adjust weights in `recommendation-service/.env`
   - Modify `COLLABORATIVE_WEIGHT` and `CONTENT_WEIGHT`

2. **Add Caching:**
   - Set up Redis for faster recommendations
   - Update configuration in `recommendation_engine.py`

3. **Set Up Monitoring:**
   - Add logging to file
   - Set up alerts for training failures

4. **Production Deployment:**
   - Use Docker Compose with production config
   - Set up reverse proxy (nginx)
   - Configure SSL certificates
   - Set up automated backups

5. **Schedule Retraining:**
   - Implement cron job for daily retraining
   - Monitor training metrics
   - Set up failure notifications

---

## 🆘 Need Help?

1. Check service logs for error messages
2. Verify all environment variables are set
3. Ensure MongoDB has sufficient data
4. Review the main README.md for detailed API docs
5. Check that all services are running and healthy

---

**Happy Coding! 🚀**
