# AI Teacher Recommendation Service

A hybrid recommendation system for SkillBridge that combines Collaborative Filtering (SVD) and Content-Based Filtering (TF-IDF) to recommend teachers to students.

## 🏗️ Architecture

```
┌─────────────────┐      HTTP Request      ┌──────────────────────┐
│                 │ ───────────────────────>│                      │
│  MERN Backend   │                         │  Python FastAPI      │
│  (Node.js)      │<─────────────────────── │  Recommendation      │
│                 │      JSON Response      │  Service (Port 8001) │
└─────────────────┘                         └──────────────────────┘
        │                                             │
        │                                             │
        ▼                                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MongoDB Database                          │
│  - users (students & teachers)                                  │
│  - ratings                                                       │
│  - teachers (optional)                                          │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Features

### Hybrid Recommendation Strategy

1. **Collaborative Filtering (Surprise SVD)**
   - Matrix factorization using Singular Value Decomposition
   - Predicts ratings based on similar students' preferences
   - Requires minimum 3 ratings per student

2. **Content-Based Filtering (TF-IDF + Cosine Similarity)**
   - Analyzes teacher profiles (subjects, expertise, bio, courses)
   - Matches with student interests
   - Handles cold-start problem for new students

3. **Hybrid Approach**
   - Weighted combination: 60% Collaborative + 40% Content-Based
   - Automatically falls back to content-based for new students
   - Provides personalized reasons for each recommendation

## 📋 Prerequisites

- Python 3.9 or higher
- pip (Python package manager)
- MongoDB running locally or remotely
- Node.js (for MERN backend)

## 🚀 Installation

### 1. Install Python Dependencies

```bash
cd recommendation-service
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate

# Install packages
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/skillbridge
MONGODB_DB_NAME=skillbridge

# Service Configuration
SERVICE_PORT=8001
SERVICE_HOST=0.0.0.0
ENVIRONMENT=development

# Model Configuration
MODEL_STORAGE_PATH=./models
COLLABORATIVE_WEIGHT=0.6
CONTENT_WEIGHT=0.4
MIN_RATINGS_FOR_COLLABORATIVE=3

# Security
API_KEY=your-secret-api-key-change-this-in-production
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 3. Update MERN Backend Environment

Add to `backend/.env`:

```env
# Recommendation Service
RECOMMENDATION_SERVICE_URL=http://localhost:8001
RECOMMENDATION_SERVICE_API_KEY=your-secret-api-key-change-this-in-production
```

### 4. Install Backend Dependencies

```bash
cd ../backend
npm install
```

## 🏃 Running the Services

### Terminal 1: Python Recommendation Service

```bash
cd recommendation-service
venv\Scripts\activate  # or source venv/bin/activate on macOS/Linux
python main.py
```

Service will start on `http://localhost:8001`

### Terminal 2: MERN Backend

```bash
cd backend
npm run dev
```

Backend will start on `http://localhost:5000`

### Terminal 3: React Frontend

```bash
cd frontend
npm run dev
```

Frontend will start on `http://localhost:5173`

## 📡 API Endpoints

### Python Service (Port 8001)

#### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "recommendation-service",
  "version": "1.0.0",
  "models_loaded": {
    "collaborative": true,
    "content_based": true
  },
  "database_connected": true
}
```

#### 2. Train Models
```http
POST /train
Headers: X-API-Key: your-secret-api-key
Content-Type: application/json

{
  "force_retrain": false
}
```

**Response:**
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
  },
  "trained_at": "2026-01-05T10:30:00"
}
```

#### 3. Get Recommendations
```http
POST /recommend
Headers: X-API-Key: your-secret-api-key
Content-Type: application/json

{
  "student_id": "507f1f77bcf86cd799439011",
  "limit": 10
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "teacher_id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "score": 85.5,
      "reason": "Excellent match based on your learning history and interests",
      "subjects": ["Python", "Machine Learning"],
      "expertise": ["AI", "Data Science"],
      "average_rating": 4.8,
      "years_of_experience": 5
    }
  ],
  "student_id": "507f1f77bcf86cd799439011",
  "method": "hybrid",
  "generated_at": "2026-01-05T10:35:00"
}
```

### MERN Backend (Port 5000)

#### 1. Get My Recommendations (Student)
```http
GET /api/recommendations/me?limit=10
Headers: Authorization: Bearer <jwt_token>
```

#### 2. Train Models (Admin)
```http
POST /api/recommendations/train
Headers: Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "force_retrain": false
}
```

#### 3. Check Service Health
```http
GET /api/recommendations/health
Headers: Authorization: Bearer <jwt_token>
```

## 🔄 Training Workflow

### Initial Training (Required)

1. **Ensure Data Exists:**
   - At least 10-20 ratings in the database
   - Multiple teachers with profiles filled out

2. **Train Models:**

**Option A: Using API (Postman/curl)**
```bash
curl -X POST http://localhost:8001/train \
  -H "X-API-Key: your-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{"force_retrain": true}'
```

**Option B: Via MERN Backend (Admin user)**
```bash
curl -X POST http://localhost:5000/api/recommendations/train \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"force_retrain": true}'
```

### Retraining Strategy

**When to retrain:**
- Daily/Weekly scheduled job (use cron)
- After significant new ratings (e.g., 50+ new ratings)
- After adding many new teachers
- Manually via admin panel

**Automated Retraining (Optional):**

Add to MERN backend (in a scheduler file):

```javascript
import cron from 'node-cron';
import axios from 'axios';

// Retrain every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  try {
    console.log('Starting scheduled model retraining...');
    await axios.post(
      `${process.env.RECOMMENDATION_SERVICE_URL}/train`,
      { force_retrain: true },
      {
        headers: { 'X-API-Key': process.env.RECOMMENDATION_SERVICE_API_KEY }
      }
    );
    console.log('Model retraining completed successfully');
  } catch (error) {
    console.error('Scheduled retraining failed:', error.message);
  }
});
```

## 🎨 Frontend Integration

The AI recommendations are displayed in the Dashboard using the `AIRecommendations` component.

**Usage:**

```jsx
import AIRecommendations from '../components/Dashboard/AIRecommendations';

function DashboardPage() {
  return (
    <div>
      {/* Other dashboard content */}
      <AIRecommendations />
    </div>
  );
}
```

The component:
- Automatically fetches recommendations for logged-in students
- Shows loading, error, and empty states
- Displays match scores and reasons
- Allows direct messaging and profile viewing
- Auto-refreshes when needed

## 🧪 Testing

### 1. Test Health Check
```bash
curl http://localhost:8001/health
```

### 2. Test Training
```bash
curl -X POST http://localhost:8001/train \
  -H "X-API-Key: your-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{"force_retrain": true}'
```

### 3. Test Recommendations
```bash
curl -X POST http://localhost:8001/recommend \
  -H "X-API-Key: your-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{"student_id": "YOUR_STUDENT_ID", "limit": 5}'
```

## 📊 Model Persistence

Trained models are automatically saved to `recommendation-service/models/`:

- `collaborative_model.joblib` - Surprise SVD model
- `collaborative_metadata.joblib` - Student/teacher IDs
- `tfidf_vectorizer.joblib` - TF-IDF vectorizer
- `teacher_features.joblib` - Teacher feature matrix
- `content_metadata.joblib` - Teacher metadata

Models are loaded automatically on service startup if they exist.

## 🔒 Security Best Practices

1. **API Key Protection:**
   - Use strong, random API keys in production
   - Store in environment variables, never in code
   - Rotate keys regularly

2. **CORS Configuration:**
   - Limit allowed origins to your frontend domains
   - Update `ALLOWED_ORIGINS` in `.env`

3. **Rate Limiting (Optional):**
   ```python
   from slowapi import Limiter
   from slowapi.util import get_remote_address
   
   limiter = Limiter(key_func=get_remote_address)
   app.state.limiter = limiter
   
   @app.post("/recommend")
   @limiter.limit("10/minute")
   async def get_recommendations(...):
       ...
   ```

4. **Network Security:**
   - Run services behind a reverse proxy (nginx)
   - Use HTTPS in production
   - Firewall port 8001 from external access

## 🐛 Troubleshooting

### Service Won't Start

**Issue:** ModuleNotFoundError
```bash
# Ensure virtual environment is activated
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Reinstall dependencies
pip install -r requirements.txt
```

**Issue:** MongoDB Connection Error
```bash
# Check MongoDB is running
mongosh

# Verify connection string in .env
MONGODB_URI=mongodb://localhost:27017/skillbridge
```

### No Recommendations Returned

**Issue:** Models not trained
```bash
# Train models first
curl -X POST http://localhost:8001/train \
  -H "X-API-Key: your-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{"force_retrain": true}'
```

**Issue:** Insufficient data
- Need at least 10 ratings for collaborative filtering
- Need at least 5 teachers with profiles

### Backend Can't Connect to Python Service

**Issue:** ECONNREFUSED
```bash
# Check Python service is running
curl http://localhost:8001/health

# Verify URL in backend/.env
RECOMMENDATION_SERVICE_URL=http://localhost:8001
```

## 📈 Performance Optimization

### Caching with Redis (Optional)

```python
import redis
from config import settings

# Initialize Redis
redis_client = redis.Redis(
    host=settings.redis_host,
    port=settings.redis_port,
    db=settings.redis_db,
    password=settings.redis_password,
    decode_responses=True
)

# Cache recommendations
@app.post("/recommend")
async def get_recommendations(request: RecommendationRequest):
    cache_key = f"rec:{request.student_id}:{request.limit}"
    
    # Try cache first
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # Generate recommendations
    recommendations = await recommendation_engine.get_recommendations(...)
    
    # Cache for 1 hour
    redis_client.setex(cache_key, 3600, json.dumps(recommendations))
    
    return recommendations
```

## 📝 Logging

Logs are written to console with levels: DEBUG, INFO, WARNING, ERROR

**View logs:**
```bash
# Python service logs
python main.py 2>&1 | tee logs/service.log

# Backend logs
npm run dev 2>&1 | tee logs/backend.log
```

## 🎓 Algorithm Details

### Collaborative Filtering (SVD)
- **Algorithm:** Singular Value Decomposition
- **Library:** scikit-surprise
- **Hyperparameters:**
  - n_factors: 50
  - n_epochs: 20
  - learning_rate: 0.005
  - regularization: 0.02

### Content-Based Filtering
- **Algorithm:** TF-IDF + Cosine Similarity
- **Library:** scikit-learn
- **Features:** max 500, unigrams + bigrams
- **Weighted Fields:**
  - Subjects: 3x weight
  - Expertise: 2x weight
  - Bio: 1x weight
  - Course descriptions: 1x weight

### Hybrid Strategy
- Default: 60% collaborative + 40% content-based
- Falls back to 100% content-based if student has < 3 ratings
- Scores normalized to 0-100 scale

## 📚 References

- [Surprise Library Documentation](http://surpriselib.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Scikit-learn TF-IDF](https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.TfidfVectorizer.html)

## 🤝 Support

For issues or questions:
1. Check this documentation
2. Review logs for error messages
3. Ensure all services are running
4. Verify environment variables are set correctly
