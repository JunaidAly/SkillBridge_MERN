# SkillBridge MERN - AI-Powered Learning Platform

A full-stack online learning platform with **AI-powered teacher recommendations** built with MERN stack (MongoDB, Express.js, React, Node.js) and Python FastAPI for machine learning.

## 🌟 Key Features

### Core Platform
- 👥 User authentication (Students & Teachers)
- 💬 Real-time chat with Socket.IO
- 📅 Meeting scheduling and management
- ⭐ Rating and feedback system
- 💳 Credits-based system
- 🎓 Teacher profiles with skills and expertise
- 📊 Dashboard with analytics

### 🤖 AI Recommendation System (NEW!)
- **Hybrid Recommendation Engine:**
  - Collaborative Filtering (SVD) - Based on similar students' choices
  - Content-Based Filtering (TF-IDF) - Based on student interests and teacher expertise
  - Smart fallback for cold-start scenarios
- **Personalized Matching:**
  - AI-calculated match scores
  - Contextual reasons for recommendations
  - Real-time updates as you interact
- **Production-Ready:**
  - Microservice architecture with FastAPI
  - Model persistence and caching
  - Automated retraining support

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│                     Port: 5173                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Backend (Node.js + Express)                   │
│                     Port: 5000                               │
│  • REST API                                                  │
│  • Socket.IO                                                 │
│  • JWT Authentication                                        │
└──────────────┬─────────────────────────┬────────────────────┘
               │                         │
               ▼                         ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│  MongoDB Database        │  │  Python Recommendation API   │
│  Port: 27017            │  │  Port: 8001                  │
│                          │  │  • FastAPI                   │
│  • users                 │  │  • Collaborative Filtering   │
│  • teachers              │  │  • Content-Based Filtering   │
│  • ratings               │  │  • Hybrid Algorithm          │
│  • messages              │  │                              │
│  • meetings              │  │                              │
└──────────────────────────┘  └──────────────────────────────┘
```

## 📦 Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Socket.IO Client** - Real-time communication

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB + Mongoose** - Database
- **JWT** - Authentication
- **Socket.IO** - WebSocket
- **Axios** - HTTP client
- **Cloudinary** - File uploads
- **Nodemailer** - Email service

### AI/ML Service
- **Python 3.11** - Runtime
- **FastAPI** - Web framework
- **Motor** - Async MongoDB driver
- **scikit-surprise** - Collaborative filtering
- **scikit-learn** - Content-based filtering (TF-IDF)
- **Pandas & NumPy** - Data processing
- **Pydantic v2** - Data validation

### DevOps
- **Docker & Docker Compose** - Containerization
- **Redis** - Caching (optional)
- **Nginx** - Reverse proxy

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- Python 3.9+
- MongoDB 5.0+
- Git

### Option 1: Automated Setup (Recommended - Windows)

```powershell
# Run the automated setup script
.\start.ps1
```

This will:
1. Check prerequisites
2. Set up Python virtual environment
3. Install all dependencies
4. Start all services in separate terminals

### Option 2: Manual Setup

See **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** for detailed step-by-step instructions.

### Option 3: Docker Deployment

```bash
# Copy and configure production environment
cp .env.production.example .env.production

# Build and start all services
docker-compose up -d

# Train models
curl -X POST http://localhost:8001/train \
  -H "X-API-Key: your-api-key" \
  -d '{"force_retrain": true}'
```

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React application |
| Backend API | http://localhost:5000 | REST API |
| Python AI API | http://localhost:8001/docs | FastAPI with Swagger UI |
| MongoDB | mongodb://localhost:27017 | Database |

## 📚 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup instructions
- **[recommendation-service/README.md](./recommendation-service/README.md)** - AI service documentation
- **API Docs:** http://localhost:8001/docs (when service is running)

## 🎯 Initial Model Training (Required)

After starting all services, train the AI models:

```powershell
# Using PowerShell
$headers = @{"X-API-Key" = "dev-secret-key-12345"; "Content-Type" = "application/json"}
$body = @{force_retrain = $true} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8001/train" -Method POST -Headers $headers -Body $body
```

**Requirements:**
- At least 10 ratings in the database
- At least 5 teachers with filled profiles

## 🔧 Troubleshooting

Common issues and solutions in [SETUP_GUIDE.md](./SETUP_GUIDE.md#troubleshooting)

Quick fixes:
- **Models not trained:** Run training endpoint
- **MongoDB not connected:** Start MongoDB service
- **Port in use:** Kill process or change port
- **No recommendations:** Train models and ensure data exists

## 📞 Support

For issues and questions:
- Check [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- Review service logs
- Open an issue on GitHub

---

**Built with ❤️ using MERN Stack + AI**