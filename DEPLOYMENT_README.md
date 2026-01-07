# 📚 Deployment Documentation Index

Complete guide for deploying SkillBridge MERN application to production.

---

## 📖 Documentation Overview

This project includes comprehensive deployment documentation:

### 1. [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) ⭐ **START HERE**
**Complete step-by-step deployment guide**
- MongoDB Atlas setup
- Backend deployment to Render
- Recommendation service deployment to Render
- Frontend deployment to Vercel
- Post-deployment configuration
- Success checklist

**Time to complete:** ~2-3 hours (first time)

---

### 2. [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) ✅
**Interactive checklist to track your progress**
- Phase-by-phase checklist
- Space to fill in your URLs
- Quick troubleshooting tips
- Cost summary

**Use this:** To track deployment progress and ensure nothing is missed

---

### 3. [ARCHITECTURE.md](ARCHITECTURE.md) 🏗️
**Visual architecture diagrams and system design**
- System architecture overview
- Data flow diagrams
- Deployment process flow
- Security layers
- Scaling strategy
- Cost breakdown

**Use this:** To understand how everything connects

---

### 4. [COMMANDS_REFERENCE.md](COMMANDS_REFERENCE.md) 🔧
**Quick reference for all deployment commands**
- Setup commands
- Testing commands
- Deployment commands
- Monitoring commands
- Debugging commands

**Use this:** When you need a specific command quickly

---

### 5. [TROUBLESHOOTING.md](TROUBLESHOOTING.md) 🔍
**Solutions to common deployment issues**
- Frontend issues (Vercel)
- Backend issues (Render)
- Database issues (MongoDB)
- Authentication issues
- Performance issues

**Use this:** When something goes wrong

---

## 🚀 Quick Start Guide

### First Time Deploying?

Follow this order:

1. **Read:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Full instructions
2. **Use:** [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Track progress
3. **Reference:** [COMMANDS_REFERENCE.md](COMMANDS_REFERENCE.md) - When needed
4. **Understand:** [ARCHITECTURE.md](ARCHITECTURE.md) - How it works
5. **Fix:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - If issues arise

### Already Deployed?

**For updates:**
```powershell
git add .
git commit -m "Your changes"
git push origin main
# Render and Vercel auto-deploy!
```

**For issues:**
1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Check service logs (Render/Vercel)
3. Verify environment variables

---

## 📋 Pre-Deployment Requirements

Before you start, ensure you have:

### Accounts Needed
- ✅ GitHub account (free)
- ✅ Vercel account (free) - https://vercel.com
- ✅ Render account (free) - https://render.com
- ✅ MongoDB Atlas account (free) - https://mongodb.com/cloud/atlas
- ✅ Cloudinary account (free) - https://cloudinary.com
- ✅ Email service (Gmail with App Password works)

### Optional but Recommended
- ✅ UptimeRobot account (free) - https://uptimerobot.com
- ✅ Google Cloud Console (for OAuth) - https://console.cloud.google.com

### Technical Requirements
- ✅ Git installed on your machine
- ✅ Node.js v18+ installed
- ✅ Basic knowledge of environment variables
- ✅ Access to terminal/command line

---

## ⚡ Quick Deployment (TL;DR)

### 1. Database (5 minutes)
```
MongoDB Atlas → Create Cluster → Get Connection String
```

### 2. Backend (10 minutes)
```
Render → New Web Service → Connect GitHub → 
Root: backend → Start: npm start → Add Env Vars → Deploy
```

### 3. Recommendation Service (10 minutes)
```
Render → New Web Service → Connect GitHub → 
Root: recommendation-service → Start: uvicorn main:app --host 0.0.0.0 --port $PORT → 
Add Env Vars → Deploy
```

### 4. Frontend (10 minutes)
```
Vercel → New Project → Connect GitHub → 
Root: frontend → Framework: Vite → Add Env Vars → Deploy
```

### 5. Configure (5 minutes)
```
Update CORS in backend → Push to GitHub → Auto-redeploy
```

**Total time:** ~40 minutes

---

## 🎯 Deployment Targets

### Production URLs Format

After deployment, you'll have:

- **Frontend:** `https://your-project.vercel.app`
- **Backend:** `https://your-backend.onrender.com`
- **Recommendation:** `https://your-recommendation.onrender.com`
- **Database:** `mongodb+srv://cluster.xxxxx.mongodb.net/skillbridge`

---

## 💰 Cost Overview

### Free Tier (Good for Development & Small Projects)
```
Monthly Cost: $0
Users: Up to ~1,000 active users
Bandwidth: 100GB
Storage: 512MB database
Limitations: 
  - Backend sleeps after 15 min inactivity
  - 750 hours/month on Render
```

### Paid Tier (Good for Production)
```
Monthly Cost: ~$91
Users: 10,000+ active users
Bandwidth: Unlimited
Storage: 10GB database
Benefits:
  - Always-on services
  - Better performance
  - More storage
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed cost breakdown.

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] Change all default secrets
- [ ] Use strong passwords (32+ characters)
- [ ] Enable 2FA on all platforms
- [ ] Never commit `.env` files to Git
- [ ] Use HTTPS everywhere (automatic on Vercel/Render)
- [ ] Configure CORS properly
- [ ] Validate all user inputs
- [ ] Rate limit API endpoints
- [ ] Keep dependencies updated

---

## 📊 Monitoring Your Application

### Health Check URLs

After deployment, bookmark these:

```
Frontend:       https://your-project.vercel.app
Backend API:    https://your-backend.onrender.com/api
Recommendation: https://your-recommendation.onrender.com/health
```

### Recommended Monitoring

1. **UptimeRobot** (Free)
   - Monitors every 10 minutes
   - Keeps services awake on free tier
   - Email alerts when down

2. **Render Logs**
   - Real-time application logs
   - Error tracking

3. **MongoDB Atlas Metrics**
   - Query performance
   - Storage usage
   - Connection stats

---

## 🛠️ Development Workflow

### Local Development
```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Recommendation Service
cd recommendation-service
uvicorn main:app --reload
```

### Testing Before Deploy
```powershell
# Test all API endpoints
.\test-api.ps1

# Run linter
npm run lint

# Build frontend
cd frontend
npm run build
```

### Deploying Changes
```powershell
git add .
git commit -m "Description of changes"
git push origin main
# Services auto-deploy!
```

---

## 🎓 Learning Resources

### Vercel
- Docs: https://vercel.com/docs
- Examples: https://vercel.com/templates
- Status: https://www.vercel-status.com

### Render
- Docs: https://render.com/docs
- Blog: https://render.com/blog
- Status: https://status.render.com

### MongoDB Atlas
- Docs: https://docs.atlas.mongodb.com
- University: https://university.mongodb.com
- Status: https://status.mongodb.com

### Deployment Best Practices
- 12 Factor App: https://12factor.net
- DevOps Handbook: https://itrevolution.com/the-devops-handbook

---

## 🐛 Common Issues & Quick Fixes

| Issue | Quick Fix | Details |
|-------|-----------|---------|
| CORS Error | Update backend CORS origins | [Troubleshooting #1](#) |
| Service sleeping | Set up UptimeRobot | [Deployment Guide](#) |
| MongoDB connection failed | Check connection string | [Troubleshooting #4](#) |
| Build fails on Vercel | Check environment variables | [Troubleshooting #1](#) |
| 502 Bad Gateway | Backend not responding | Check Render logs |
| JWT Invalid | Check JWT_SECRET matches | [Troubleshooting #5](#) |

Full solutions in [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## 📝 Environment Variables Reference

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-32-chars-min
RECOMMENDATION_SERVICE_URL=https://...
RECOMMENDATION_SERVICE_API_KEY=your-api-key
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
EMAIL_HOST=...
EMAIL_PORT=...
EMAIL_USER=...
EMAIL_PASS=...
```

### Frontend (.env)
```env
VITE_API_BASE_URL=https://your-backend.onrender.com/api
VITE_SOCKET_URL=https://your-backend.onrender.com
VITE_GOOGLE_CLIENT_ID=...
```

### Recommendation Service (.env)
```env
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=skillbridge
SERVICE_PORT=8001
ENVIRONMENT=production
API_KEY=same-as-backend-api-key
ALLOWED_ORIGINS=https://frontend,https://backend
```

---

## 🎬 Deployment Video Guide (Coming Soon)

We're working on video tutorials:
- [ ] MongoDB Atlas Setup
- [ ] Render Deployment
- [ ] Vercel Deployment
- [ ] Environment Variables
- [ ] Troubleshooting Common Issues

---

## 🤝 Getting Help

If you get stuck:

1. **Check Documentation**
   - Read [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
   - Search this repository

2. **Check Logs**
   - Render: Dashboard → Service → Logs
   - Vercel: Project → Deployments → Logs
   - Browser: F12 → Console

3. **Check Status Pages**
   - Is the platform having issues?
   - Check status pages (links above)

4. **Common Error Messages**
   - Google the exact error message
   - Check Stack Overflow
   - Check platform documentation

5. **Ask for Help**
   - Create GitHub Issue
   - Include error messages
   - Include what you've tried

---

## ✅ Deployment Success Checklist

Your deployment is successful when:

- [ ] Frontend loads without errors
- [ ] User can sign up
- [ ] User can log in
- [ ] Chat functionality works
- [ ] File uploads work (profile picture)
- [ ] Email notifications work (2FA)
- [ ] Recommendations API responds
- [ ] No CORS errors in browser console
- [ ] All services health checks pass
- [ ] Socket.IO connects successfully

---

## 🚀 Next Steps After Deployment

1. **Create Admin Account**
   ```powershell
   cd backend
   node make-admin.mjs admin@example.com Password123! "Admin User"
   ```

2. **Train Recommendation Models**
   ```powershell
   curl -X POST https://your-recommendation.onrender.com/train \
     -H "X-API-Key: your-api-key"
   ```

3. **Set Up Monitoring**
   - Configure UptimeRobot
   - Set up email alerts
   - Monitor usage metrics

4. **Configure Custom Domain** (Optional)
   - Add domain to Vercel
   - Add domain to Render
   - Update OAuth redirect URIs

5. **Performance Optimization**
   - Enable Redis caching
   - Optimize database queries
   - Add CDN for static assets

6. **Security Hardening**
   - Review CORS settings
   - Set up rate limiting
   - Enable security headers
   - Regular dependency updates

---

## 📦 Project Structure

```
SkillBridge_MERN/
├── backend/                 # Node.js/Express API
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/                # React/Vite Frontend
│   ├── src/
│   ├── package.json
│   ├── .env.example
│   ├── vercel.json         # ← Created by this guide
│   └── Dockerfile
│
├── recommendation-service/  # Python/FastAPI ML Service
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
│
├── DEPLOYMENT_GUIDE.md     # ← Main deployment guide
├── DEPLOYMENT_CHECKLIST.md # ← Track your progress
├── ARCHITECTURE.md         # ← System architecture
├── COMMANDS_REFERENCE.md   # ← Command reference
├── TROUBLESHOOTING.md      # ← Fix issues
└── README.md               # ← This file
```

---

## 🎉 Congratulations!

You now have everything you need to deploy your SkillBridge application!

**Start with:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

**Track progress:** [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

**Need help?** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## 📄 License & Credits

- Project: SkillBridge MERN
- Deployment guides created for easy cloud deployment
- Free tier deployment = $0/month 🎉

---

*Last Updated: January 2026*

**Good luck with your deployment! 🚀**
