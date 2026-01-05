# 🚀 Quick Reference - AI Recommendation System

## ⚡ Start Services (Development)

### Windows PowerShell (Automated)
```powershell
.\start.ps1
```

### Manual Start
```powershell
# Terminal 1: Python Service
cd recommendation-service
.\venv\Scripts\activate
python main.py

# Terminal 2: Backend
cd backend
npm run dev

# Terminal 3: Frontend
cd frontend
npm run dev
```

## 🎓 Train Models (First Time - Required!)

```powershell
# Using PowerShell
$headers = @{"X-API-Key" = "dev-secret-key-12345"; "Content-Type" = "application/json"}
$body = @{force_retrain = $true} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8001/train" -Method POST -Headers $headers -Body $body
```

## 🌐 Access URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:5000 |
| Python API Docs | http://localhost:8001/docs |
| MongoDB | mongodb://localhost:27017 |

## 🔍 Health Checks

```powershell
# Backend
curl http://localhost:5000/api/health

# Python Service
curl http://localhost:8001/health
```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Train models in Docker
curl -X POST http://localhost:8001/train \
  -H "X-API-Key: your-api-key" \
  -d '{"force_retrain": true}'
```

## 🔑 Environment Variables

### recommendation-service/.env
```env
MONGODB_URI=mongodb://localhost:27017/skillbridge
SERVICE_PORT=8001
API_KEY=dev-secret-key-12345
COLLABORATIVE_WEIGHT=0.6
CONTENT_WEIGHT=0.4
MIN_RATINGS_FOR_COLLABORATIVE=3
```

### backend/.env
```env
RECOMMENDATION_SERVICE_URL=http://localhost:8001
RECOMMENDATION_SERVICE_API_KEY=dev-secret-key-12345
```

## 📡 API Endpoints

### Backend (Requires JWT)
```http
GET /api/recommendations/me?limit=10
POST /api/recommendations/train
GET /api/recommendations/health
```

### Python Service (Requires API Key)
```http
GET /health
POST /train
POST /recommend
GET /docs  (Swagger UI)
```

## 🔧 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Models not trained | Run training endpoint |
| MongoDB not connected | Start MongoDB service |
| Port 8001 in use | Kill process: `taskkill /PID <PID> /F` |
| No recommendations | Ensure ≥10 ratings exist |
| Backend can't reach Python | Check both services running |

## 📊 Minimum Data Requirements

- ✅ 10+ ratings in database
- ✅ 5+ teachers with profiles
- ✅ Teachers have subjects/expertise filled

## 🧪 Test Recommendations

1. Login as student
2. Go to Dashboard
3. View AI Recommendations section
4. Should see personalized matches

## 📚 Documentation

- **Setup:** [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **API Docs:** [recommendation-service/README.md](./recommendation-service/README.md)
- **Summary:** [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

## 💡 Pro Tips

1. **Retrain regularly:** Set up cron job for daily retraining
2. **Monitor logs:** Check for errors in Python service
3. **Optimize weights:** Adjust COLLABORATIVE_WEIGHT and CONTENT_WEIGHT
4. **Use caching:** Add Redis for faster responses
5. **Scale horizontally:** Run multiple Python service instances

## 🆘 Need Help?

1. Check service logs for errors
2. Verify environment variables
3. Ensure MongoDB has data
4. Review SETUP_GUIDE.md
5. Check Swagger UI for API testing

---

**Quick Commands Cheat Sheet:**

```powershell
# Setup
cd recommendation-service && python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Start
python main.py  # Python service
npm run dev     # Backend/Frontend

# Train
Invoke-RestMethod -Uri http://localhost:8001/train -Method POST -Headers @{"X-API-Key"="dev-secret-key-12345"} -Body (@{force_retrain=$true}|ConvertTo-Json)

# Test
curl http://localhost:8001/health
curl http://localhost:5000/api/health

# Docker
docker-compose up -d
docker-compose logs -f
docker-compose down
```

---

**Made with ❤️ using MERN Stack + AI**
