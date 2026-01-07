# 🚀 Quick Deployment Checklist

Use this checklist to track your deployment progress.

## Phase 1: Pre-Deployment Setup

### MongoDB Atlas
- [ ] Create MongoDB Atlas account
- [ ] Create free cluster (M0)
- [ ] Create database user with password
- [ ] Add IP address (0.0.0.0/0 for all access)
- [ ] Copy connection string
- [ ] Replace `<password>` in connection string
- [ ] Add `/skillbridge` database name to connection string

**Your MongoDB URI:**
```
mongodb+srv://________:________@________.mongodb.net/skillbridge?retryWrites=true&w=majority
```

### Cloudinary (for file uploads)
- [ ] Create Cloudinary account at https://cloudinary.com
- [ ] Get Cloud Name from dashboard
- [ ] Get API Key from dashboard
- [ ] Get API Secret from dashboard

### Google OAuth (optional)
- [ ] Create project in Google Cloud Console
- [ ] Enable Google+ API
- [ ] Create OAuth credentials
- [ ] Add authorized JavaScript origins
- [ ] Copy Client ID

### Generate Secrets
Run this command to generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- [ ] Generate JWT_SECRET: `____________________`
- [ ] Generate RECOMMENDATION_SERVICE_API_KEY: `____________________`

---

## Phase 2: Backend Deployment (Render)

- [ ] Push code to GitHub
- [ ] Go to https://render.com/dashboard
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repository
- [ ] Configure:
  - Name: `skillbridge-backend`
  - Root Directory: `backend`
  - Build Command: `npm install`
  - Start Command: `npm start`
  - Instance: Free

### Environment Variables
- [ ] NODE_ENV=production
- [ ] PORT=5000
- [ ] MONGODB_URI=`<from above>`
- [ ] JWT_SECRET=`<generated>`
- [ ] RECOMMENDATION_SERVICE_API_KEY=`<generated>`
- [ ] CLOUDINARY_CLOUD_NAME=`<from cloudinary>`
- [ ] CLOUDINARY_API_KEY=`<from cloudinary>`
- [ ] CLOUDINARY_API_SECRET=`<from cloudinary>`
- [ ] EMAIL_HOST=`<your email host>`
- [ ] EMAIL_PORT=`<your email port>`
- [ ] EMAIL_USER=`<your email>`
- [ ] EMAIL_PASS=`<your email password>`

- [ ] Click "Create Web Service"
- [ ] Wait for deployment (3-5 min)
- [ ] Copy backend URL: `____________________`
- [ ] Test in browser: `https://your-backend.onrender.com/api`

---

## Phase 3: Recommendation Service Deployment (Render)

- [ ] In Render, click "New +" → "Web Service"
- [ ] Connect same GitHub repository
- [ ] Configure:
  - Name: `skillbridge-recommendation-service`
  - Root Directory: `recommendation-service`
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
  - Instance: Free

### Environment Variables
- [ ] MONGODB_URI=`<same as backend>`
- [ ] MONGODB_DB_NAME=skillbridge
- [ ] SERVICE_PORT=8001
- [ ] SERVICE_HOST=0.0.0.0
- [ ] ENVIRONMENT=production
- [ ] API_KEY=`<same as RECOMMENDATION_SERVICE_API_KEY>`
- [ ] ALLOWED_ORIGINS=`<will update later>`

- [ ] Click "Create Web Service"
- [ ] Wait for deployment (3-5 min)
- [ ] Copy recommendation URL: `____________________`
- [ ] Test: `https://your-recommendation.onrender.com/health`

### Update Backend
- [ ] Go back to backend service on Render
- [ ] Add environment variable: RECOMMENDATION_SERVICE_URL=`<recommendation URL>`
- [ ] Wait for auto-redeploy

---

## Phase 4: Frontend Deployment (Vercel)

- [ ] Go to https://vercel.com/dashboard
- [ ] Click "Add New..." → "Project"
- [ ] Import GitHub repository
- [ ] Configure:
  - Framework: Vite
  - Root Directory: `frontend`
  - Build Command: `npm run build`
  - Output Directory: `dist`

### Environment Variables
- [ ] VITE_API_BASE_URL=`<backend-url>/api`
- [ ] VITE_SOCKET_URL=`<backend-url>`
- [ ] VITE_GOOGLE_CLIENT_ID=`<google-client-id>`

- [ ] Click "Deploy"
- [ ] Wait for deployment (2-3 min)
- [ ] Copy Vercel URL: `____________________`

---

## Phase 5: Update CORS & Final Configuration

### Update Recommendation Service
- [ ] Go to recommendation service on Render
- [ ] Update ALLOWED_ORIGINS env var: `<vercel-url>,<backend-url>`
- [ ] Save and redeploy

### Update Backend Code
Update `backend/server.js` - CORS origins:
- [ ] Add Vercel URL to CORS origins array
- [ ] Add Vercel URL to Socket.IO CORS origins
- [ ] Commit and push to GitHub
- [ ] Wait for Render auto-deploy

---

## Phase 6: Testing

### Test Backend
- [ ] Open: `https://your-backend.onrender.com/api`
- [ ] Should show: "SkillBridge API is running"

### Test Recommendation Service
- [ ] Open: `https://your-recommendation.onrender.com/health`
- [ ] Should show: `{"status":"healthy",...}`

### Test Frontend
- [ ] Open: `https://your-project.vercel.app`
- [ ] Page loads without errors
- [ ] Check browser console (F12) - no CORS errors
- [ ] Try sign up
- [ ] Try login
- [ ] Test chat feature
- [ ] Test file upload (profile picture)

---

## Phase 7: Keep Services Awake (Optional but Recommended)

Free tier Render services sleep after 15 minutes of inactivity.

### Option A: UptimeRobot (Recommended)
- [ ] Sign up at https://uptimerobot.com
- [ ] Add monitor: `https://your-backend.onrender.com/api`
- [ ] Set interval: 10 minutes
- [ ] Add monitor: `https://your-recommendation.onrender.com/health`
- [ ] Set interval: 10 minutes

### Option B: Cron-job.org
- [ ] Sign up at https://cron-job.org
- [ ] Create job for backend (every 10 minutes)
- [ ] Create job for recommendation service (every 10 minutes)

---

## Phase 8: Post-Deployment Tasks

- [ ] Create admin user (use backend API or database)
- [ ] Train recommendation models
- [ ] Set up domain names (optional)
- [ ] Configure Google OAuth redirect URIs with production URLs
- [ ] Update Google OAuth authorized JavaScript origins
- [ ] Enable 2FA on all platforms (GitHub, Vercel, Render, MongoDB)
- [ ] Document your URLs in project README
- [ ] Share with team/users

---

## Your Deployed URLs

**Frontend:** `____________________`
**Backend:** `____________________`
**Recommendation Service:** `____________________`
**MongoDB:** `____________________`

---

## Troubleshooting Quick Fixes

### Frontend can't reach backend
1. Check VITE_API_BASE_URL environment variable
2. Verify backend CORS includes Vercel URL
3. Check browser console for errors

### Backend can't reach database
1. Verify MongoDB connection string
2. Check MongoDB Atlas network access (0.0.0.0/0)
3. Check Render logs for connection errors

### Services spinning down
1. Set up UptimeRobot to ping every 10 minutes
2. Consider upgrading to paid tier for always-on services

### Socket.IO not connecting
1. Update Socket.IO CORS with Vercel URL
2. Check VITE_SOCKET_URL environment variable
3. Verify WebSocket connections aren't blocked

---

## Important Commands

### Generate Secret Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test API (PowerShell)
```powershell
Invoke-RestMethod -Uri "https://your-backend.onrender.com/api"
```

### Check Render Logs
```
Go to service → Logs tab
```

### Force Redeploy
```
Go to service → Manual Deploy → Deploy Latest Commit
```

---

## Cost Summary (Free Tier)

- ✅ **Vercel**: FREE (100GB bandwidth/month)
- ✅ **Render**: FREE (750 hours/month per service)
- ✅ **MongoDB Atlas**: FREE (512MB storage)
- ✅ **Cloudinary**: FREE (25GB storage, 25GB bandwidth)
- ✅ **UptimeRobot**: FREE (50 monitors, 5-min intervals)

**Total Cost: $0/month** 🎉

---

## Upgrade Recommendations

When your app grows:

1. **Render**: Upgrade to $7/month per service for always-on
2. **MongoDB Atlas**: Upgrade to M10 ($0.08/hour) for better performance
3. **Vercel**: Pro plan $20/month for better bandwidth
4. **Cloudinary**: Plus plan $99/month for more storage

---

Good luck with your deployment! 🚀
