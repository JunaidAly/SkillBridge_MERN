# 🚀 Deployment Guide

## Overview
This guide will help you deploy:
- **Frontend** → Vercel
- **Backend** → Render
- **Recommendation Service** → Render
- **Database** → MongoDB Atlas (cloud)

---

## Prerequisites

Before starting, ensure you have:
- ✅ GitHub account (code should be pushed to a repository)
- ✅ Vercel account (sign up at https://vercel.com)
- ✅ Render account (sign up at https://render.com)
- ✅ MongoDB Atlas account (sign up at https://www.mongodb.com/cloud/atlas)
- ✅ Cloudinary account (for file uploads)
- ✅ Email service credentials (for notifications)

---

## Part 1: Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign in and click **"Build a Database"**
3. Choose **FREE tier (M0)** 
4. Select your preferred cloud provider and region
5. Name your cluster (e.g., `skillbridge-cluster`)
6. Click **"Create Cluster"**

### Step 2: Configure Database Access

1. In Atlas dashboard, go to **Database Access**
2. Click **"Add New Database User"**
3. Create a username and strong password (save these!)
4. Set privileges to **"Read and write to any database"**
5. Click **"Add User"**

### Step 3: Configure Network Access

1. Go to **Network Access**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - *Note: For production, restrict to your Render IPs*
4. Click **"Confirm"**

### Step 4: Get Connection String

1. Click **"Connect"** on your cluster
2. Choose **"Connect your application"**
3. Copy the connection string (looks like):
   ```
   mongodb+srv://username:<password>@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your database password
5. Add database name before the `?`: 
   ```
   mongodb+srv://username:password@cluster.xxxxx.mongodb.net/skillbridge?retryWrites=true&w=majority
   ```

---

## Part 2: Backend Deployment (Render)

### Step 1: Prepare Backend

1. Ensure your code is pushed to GitHub
2. A `render.yaml` file has been created in the project root for easy deployment
3. Make sure `backend/package.json` has a start script:
   ```json
   "scripts": {
     "start": "node server.js"
   }
   ```

### Step 2: Create Web Service on Render

#### Option A: Using render.yaml Blueprint (Recommended - Deploys both services at once)

1. Go to https://dashboard.render.com/select-repo
2. Connect your GitHub repository
3. Render will detect the `render.yaml` file
4. Click **"Apply"** to create both backend and recommendation services
5. Manually set the required environment variables (see Step 3)

#### Option B: Manual Setup (Individual services)

1. Go to https://render.com/dashboard
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `skillbridge-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your deployment branch)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### Step 3: Set Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=<your-mongodb-atlas-connection-string>
JWT_SECRET=<generate-a-strong-random-string>
RECOMMENDATION_SERVICE_URL=<will-add-after-recommendation-service-deployed>
RECOMMENDATION_SERVICE_API_KEY=<generate-a-strong-random-string>
CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
EMAIL_HOST=<your-email-host>
EMAIL_PORT=<your-email-port>
EMAIL_USER=<your-email-user>
EMAIL_PASS=<your-email-password>
```

**How to generate secure secrets:**
```bash
# In PowerShell or terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment to complete (3-5 minutes)
3. Copy your backend URL (e.g., `https://skillbridge-backend.onrender.com`)
4. Test: Open `https://skillbridge-backend.onrender.com/api` in browser

---

## Part 3: Recommendation Service Deployment (Render)

### Step 1: Create Python Web Service

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `skillbridge-recommendation-service`
   - **Region**: Same as backend
   - **Branch**: `main`
   - **Root Directory**: `recommendation-service`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free

### Step 2: Set Environment Variables

Add these environment variables:

```env
MONGODB_URI=<your-mongodb-atlas-connection-string>
MONGODB_DB_NAME=skillbridge
SERVICE_PORT=8001
SERVICE_HOST=0.0.0.0
ENVIRONMENT=production
API_KEY=<same-as-RECOMMENDATION_SERVICE_API_KEY-in-backend>
ALLOWED_ORIGINS=<your-vercel-frontend-url>,<your-render-backend-url>
```

### Step 3: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (3-5 minutes)
3. Copy the URL (e.g., `https://skillbridge-recommendation-service.onrender.com`)

### Step 4: Update Backend Environment Variables

1. Go back to your backend service on Render
2. Update `RECOMMENDATION_SERVICE_URL` with the recommendation service URL
3. Service will auto-redeploy

---

## Part 4: Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

Create a `vercel.json` file in the `frontend` directory:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended for first time)

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

#### Option B: Using Vercel CLI

```powershell
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend folder
cd frontend

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Step 3: Set Environment Variables

In Vercel Project Settings → Environment Variables, add:

```env
VITE_API_BASE_URL=<your-render-backend-url>/api
VITE_SOCKET_URL=<your-render-backend-url>
VITE_GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
```

Example:
```env
VITE_API_BASE_URL=https://skillbridge-backend.onrender.com/api
VITE_SOCKET_URL=https://skillbridge-backend.onrender.com
```

### Step 4: Redeploy

After adding environment variables:
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **"Redeploy"** to apply environment variables

### Step 5: Get Your Frontend URL

Your app will be live at: `https://your-project-name.vercel.app`

---

## Part 5: Update Backend CORS Settings

Update your backend to allow requests from Vercel:

In `backend/server.js`, update CORS configuration:

```javascript
app.use(cors({
  origin: [
    'https://your-project-name.vercel.app',
    'http://localhost:5173' // Keep for local development
  ],
  credentials: true
}));
```

And update Socket.IO CORS:

```javascript
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      'https://your-project-name.vercel.app',
      'http://localhost:5173'
    ],
    credentials: true,
  },
});
```

Push changes to GitHub - Render will auto-redeploy.

---

## Part 6: Post-Deployment Checks

### 1. Test Backend
```bash
curl https://skillbridge-backend.onrender.com/api
# Should return: "SkillBridge API is running"
```

### 2. Test Recommendation Service
```bash
curl https://skillbridge-recommendation-service.onrender.com/health
# Should return: {"status":"healthy","timestamp":"..."}
```

### 3. Test Frontend
- Open your Vercel URL in browser
- Try signing up/logging in
- Check browser console for errors
- Test chat functionality

### 4. Check Logs
- **Render**: Go to service → Logs tab
- **Vercel**: Go to project → Deployments → Click deployment → Function Logs

---

## Part 7: Domain Setup (Optional)

### For Frontend (Vercel)

1. Go to Vercel Project → Settings → Domains
2. Add your custom domain (e.g., `skillbridge.com`)
3. Follow DNS configuration instructions
4. Vercel will auto-provision SSL certificate

### For Backend (Render)

1. Go to Render service → Settings
2. Scroll to **Custom Domain**
3. Add your domain (e.g., `api.skillbridge.com`)
4. Configure DNS as instructed
5. SSL is automatic

---

## Important Notes

### 🔴 Render Free Tier Limitations

- Services **spin down after 15 minutes** of inactivity
- First request after spin down takes **30-60 seconds**
- **Solution**: Use a service like [UptimeRobot](https://uptimerobot.com/) to ping your services every 10 minutes

### 💰 Cost Considerations

- **Vercel Free**: 100GB bandwidth/month
- **Render Free**: 750 hours/month (enough for 1 service always running)
- **MongoDB Atlas Free**: 512MB storage

### 🔒 Security Best Practices

1. **Never commit secrets** to GitHub
2. Use **strong, unique passwords** for database
3. Generate **random JWT secrets** (32+ characters)
4. Enable **two-factor authentication** on all platforms
5. Regularly **rotate API keys**

### 🐛 Troubleshooting

**Frontend can't connect to backend:**
- Check `VITE_API_BASE_URL` environment variable
- Verify backend CORS settings include Vercel URL
- Check browser console for CORS errors

**Backend can't connect to MongoDB:**
- Verify connection string format
- Check MongoDB Atlas network access (0.0.0.0/0)
- Ensure password doesn't contain special characters (URL encode if needed)

**Recommendation service not responding:**
- Check if service is running on Render
- Verify API key matches between services
- Check logs for Python errors

**Socket.IO not working:**
- Update Socket.IO CORS to include Vercel URL
- Check `VITE_SOCKET_URL` environment variable
- Ensure WebSocket connections are not blocked

---

## Quick Reference Commands

### Generate Secure Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test API Endpoint
```powershell
# PowerShell
Invoke-RestMethod -Uri "https://your-backend.onrender.com/api"
```

### View Local Environment Variables
```powershell
Get-Content .env
```

---

## Monitoring Your Deployment

### 1. Set Up Monitoring (Recommended)

**UptimeRobot** (Free):
1. Sign up at https://uptimerobot.com
2. Add monitors for:
   - Backend health endpoint: `https://your-backend.onrender.com/api`
   - Recommendation service: `https://your-recommendation.onrender.com/health`
3. Set interval to 10 minutes (keeps Render services awake)

### 2. Error Tracking (Optional)

Consider integrating:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **Google Analytics** for usage analytics

---

## Success Checklist

- [ ] MongoDB Atlas cluster created and accessible
- [ ] Backend deployed to Render and responding
- [ ] Recommendation service deployed to Render and responding
- [ ] Frontend deployed to Vercel and loading
- [ ] Environment variables set correctly on all platforms
- [ ] CORS configured to allow Vercel → Render communication
- [ ] Database connection working (test signup/login)
- [ ] Socket.IO working (test chat)
- [ ] File uploads working (test profile picture)
- [ ] Email notifications working (test 2FA)
- [ ] Recommendation engine accessible from backend
- [ ] UptimeRobot monitors configured (optional)

---

## Next Steps After Deployment

1. **Create admin user** using the backend API or database directly
2. **Train recommendation models** by calling the training endpoint
3. **Set up domain names** for professional URLs
4. **Configure monitoring** to track uptime and errors
5. **Set up CI/CD** for automatic deployments on git push
6. **Add environment-specific configurations** for staging/production

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com/

If you encounter issues, check the logs first:
- Render: Service → Logs tab
- Vercel: Project → Deployments → Function Logs
- MongoDB Atlas: Database → Metrics tab

Good luck with your deployment! 🚀
