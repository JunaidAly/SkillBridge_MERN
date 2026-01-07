# 🔧 Troubleshooting Guide

Common deployment issues and their solutions.

---

## 1. Frontend Issues (Vercel)

### ❌ Build Fails on Vercel

**Symptoms:**
- Vercel build logs show errors
- Deployment fails to complete

**Common Causes & Solutions:**

**A) Missing Environment Variables**
```
Error: VITE_API_BASE_URL is not defined
```
Solution:
1. Go to Vercel Project → Settings → Environment Variables
2. Add all required variables from `frontend/.env.example`
3. Redeploy

**B) Dependency Issues**
```
Error: Cannot find module 'some-package'
```
Solution:
```powershell
# Update package.json with correct versions
cd frontend
npm install
git add package.json package-lock.json
git commit -m "Fix dependencies"
git push
```

**C) Build Command Wrong**
Solution:
1. Vercel → Settings → Build & Development Settings
2. Set Build Command: `npm run build`
3. Set Output Directory: `dist`
4. Redeploy

---

### ❌ Frontend Can't Connect to Backend

**Symptoms:**
- Network errors in browser console
- `ERR_CONNECTION_REFUSED` or CORS errors
- API calls timeout

**Solutions:**

**A) Wrong API URL**
```javascript
// Check browser console
console.log(import.meta.env.VITE_API_BASE_URL)
// Should be: https://your-backend.onrender.com/api
```
Fix:
1. Vercel → Settings → Environment Variables
2. Update `VITE_API_BASE_URL=https://your-backend.onrender.com/api`
3. Redeploy

**B) CORS Error**
```
Access to XMLHttpRequest has been blocked by CORS policy
```
Fix in `backend/server.js`:
```javascript
app.use(cors({
  origin: [
    'https://your-project.vercel.app',
    'http://localhost:5173'
  ],
  credentials: true
}));
```

**C) Backend is Sleeping (Render Free Tier)**
- First request after 15 min takes 30-60 seconds
- Solution: Set up UptimeRobot to ping every 10 minutes

---

### ❌ Page Shows White Screen

**Symptoms:**
- Blank page after deployment
- Console shows errors

**Solutions:**

**A) Check Browser Console (F12)**
```javascript
// Common errors:
// - "Failed to fetch"
// - "Unexpected token '<'"
// - Router errors
```

**B) Check Base URL in vite.config.js**
```javascript
export default defineConfig({
  plugins: [react()],
  base: '/', // Should be '/' for root domain
})
```

**C) Check Routes Configuration**
```javascript
// Ensure routes are properly configured in routes.jsx
// Ensure BrowserRouter is used, not HashRouter
```

---

### ❌ Environment Variables Not Working

**Symptoms:**
- `import.meta.env.VITE_API_BASE_URL` is undefined
- Using development URLs in production

**Solutions:**

**A) Prefix Variables with VITE_**
```env
# ❌ Wrong
API_BASE_URL=https://api.example.com

# ✓ Correct
VITE_API_BASE_URL=https://api.example.com
```

**B) Redeploy After Adding Variables**
- Adding environment variables in Vercel requires a redeploy
- Go to Deployments → Click latest → Redeploy

**C) Check Environment**
- Ensure variables are set for Production environment
- Vercel → Settings → Environment Variables → Production checked

---

## 2. Backend Issues (Render)

### ❌ Backend Fails to Start

**Symptoms:**
- Service status: "Deploy failed"
- Logs show error messages

**Common Causes & Solutions:**

**A) Port Configuration Wrong**
```javascript
// ❌ Wrong - hardcoded port
app.listen(5000)

// ✓ Correct - use PORT from environment
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0')
```

**B) Missing Environment Variables**
```
Error: MONGODB_URI is not defined
```
Solution:
1. Render → Service → Environment → Add Variable
2. Add all variables from `backend/.env.example`
3. Manual Deploy → Deploy Latest Commit

**C) Start Command Wrong**
Check Render settings:
- Build Command: `npm install`
- Start Command: `npm start` or `node server.js`

**D) Wrong Node Version**
Add to `backend/package.json`:
```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

### ❌ Cannot Connect to MongoDB

**Symptoms:**
```
MongooseServerSelectionError: Could not connect to any servers
```

**Solutions:**

**A) Check Connection String Format**
```env
# ✓ Correct format
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skillbridge?retryWrites=true&w=majority

# ❌ Wrong - missing database name
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true

# ❌ Wrong - special characters not encoded
MONGODB_URI=mongodb+srv://user:p@ss!word@cluster.mongodb.net/skillbridge
```

**B) Encode Special Characters in Password**
If password contains special characters:
```javascript
const password = "p@ss!word#123";
const encoded = encodeURIComponent(password);
// Result: p%40ss%21word%23123
```

**C) Check MongoDB Atlas Network Access**
1. MongoDB Atlas → Network Access
2. Ensure `0.0.0.0/0` is added (allow from anywhere)
3. Or add Render's IP addresses

**D) Check Database User Exists**
1. MongoDB Atlas → Database Access
2. Verify username and password
3. Ensure user has "Read and write" privileges

---

### ❌ Service Keeps Spinning Down

**Symptoms:**
- First request after inactivity takes 30-60 seconds
- Service goes to sleep after 15 minutes

**Solutions:**

**A) Set Up UptimeRobot (Free)**
1. Sign up at https://uptimerobot.com
2. Add monitor for your backend
3. Set interval: 10 minutes
4. URL: `https://your-backend.onrender.com/api`

**B) Upgrade to Paid Plan**
- Render Standard plan ($7/month) = always-on

---

### ❌ Recommendation Service Not Responding

**Symptoms:**
```
Error: connect ETIMEDOUT
```

**Solutions:**

**A) Check Recommendation Service is Running**
1. Open: `https://your-recommendation.onrender.com/health`
2. Should return: `{"status":"healthy",...}`

**B) Check API Key Matches**
```env
# Backend
RECOMMENDATION_SERVICE_API_KEY=secret123

# Recommendation Service
API_KEY=secret123  # Must match!
```

**C) Check URL in Backend**
```env
# ❌ Wrong - missing https://
RECOMMENDATION_SERVICE_URL=your-recommendation.onrender.com

# ✓ Correct
RECOMMENDATION_SERVICE_URL=https://your-recommendation.onrender.com
```

---

## 3. Recommendation Service Issues (Render)

### ❌ Python Service Won't Start

**Symptoms:**
- Deploy fails with Python errors
- Import errors in logs

**Solutions:**

**A) Check requirements.txt**
```txt
# Ensure all dependencies are listed
fastapi==0.109.0
uvicorn[standard]==0.27.0
pymongo==4.6.1
pandas==2.1.4
scikit-learn==1.3.2
```

**B) Fix Start Command**
```bash
# ❌ Wrong
python main.py

# ✓ Correct
uvicorn main:app --host 0.0.0.0 --port $PORT
```

**C) Python Version**
Render uses Python 3.11 by default. If you need different version:
1. Create `.python-version` file in root:
```
3.11
```

---

### ❌ Model Files Not Persisting

**Symptoms:**
- Models need to be retrained after every deploy
- `/models` directory empty

**Solutions:**

**A) Use Render Disk (Paid Feature)**
Render Free tier doesn't support persistent storage. Options:

1. **Store models in MongoDB**
```python
# Save model to MongoDB GridFS
import gridfs
fs = gridfs.GridFS(db)
with open('model.joblib', 'rb') as f:
    fs.put(f, filename='model.joblib')
```

2. **Use external storage** (S3, Cloudinary, etc.)

3. **Train on startup** (if dataset is small)
```python
@app.on_event("startup")
async def startup_event():
    if not model_exists():
        train_models()
```

---

### ❌ Training Takes Too Long / Times Out

**Symptoms:**
- Training endpoint times out
- Process killed by Render

**Solutions:**

**A) Reduce Dataset Size**
```python
# Sample data for training
from sklearn.model_selection import train_test_split
X_train, X_test = train_test_split(X, train_size=0.1)
```

**B) Use Background Task**
```python
from fastapi import BackgroundTasks

@app.post("/train")
async def train(background_tasks: BackgroundTasks):
    background_tasks.add_task(train_models)
    return {"status": "Training started"}
```

**C) Train Locally, Upload Models**
1. Train models on your local machine
2. Upload to MongoDB or cloud storage
3. Download on service startup

---

## 4. Database Issues (MongoDB Atlas)

### ❌ Connection Refused

**Symptoms:**
```
Error: connect ECONNREFUSED
```

**Solutions:**

**A) Check Network Access**
1. MongoDB Atlas → Network Access
2. Add IP: `0.0.0.0/0` (allow all)

**B) Check Database User**
1. MongoDB Atlas → Database Access
2. Verify username and password are correct

**C) Use Correct Connection String**
```
mongodb+srv://USER:PASS@CLUSTER.mongodb.net/DATABASE_NAME
         ^^^^  ^^^^       ^^^^^^^          ^^^^^^^^^^^^^
         Must match Atlas settings         Your app database
```

---

### ❌ Database Queries Slow

**Symptoms:**
- API requests take 2-5 seconds
- Timeout errors

**Solutions:**

**A) Add Indexes**
```javascript
// In your model file
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
```

**B) Optimize Queries**
```javascript
// ❌ Bad - fetches all fields
const users = await User.find();

// ✓ Good - select only needed fields
const users = await User.find().select('name email role');
```

**C) Use Pagination**
```javascript
const page = req.query.page || 1;
const limit = 10;
const users = await User.find()
  .limit(limit)
  .skip((page - 1) * limit);
```

---

### ❌ Storage Limit Reached (Free Tier)

**Symptoms:**
```
Error: storage quota exceeded
```

**Solutions:**

**A) Clean Up Old Data**
```javascript
// Delete old verification codes
await VerificationCode.deleteMany({
  createdAt: { $lt: new Date(Date.now() - 24*60*60*1000) }
});
```

**B) Upgrade to Paid Tier**
- M10: 10GB storage ($57/month)

**C) Archive Old Data**
- Export old data to JSON
- Delete from database
- Keep backups locally

---

## 5. Authentication Issues

### ❌ JWT Token Invalid

**Symptoms:**
```
Error: invalid signature
Error: jwt expired
```

**Solutions:**

**A) Check JWT_SECRET Matches**
```env
# Must be the same everywhere
JWT_SECRET=your-secret-key-32-characters-min
```

**B) Token Expiration**
```javascript
// Check token expiry in backend
const token = jwt.sign(
  { userId: user._id },
  process.env.JWT_SECRET,
  { expiresIn: '7d' } // Adjust as needed
);
```

**C) Clock Skew**
- If server time is wrong, JWT validation fails
- Render servers use UTC time

---

### ❌ Google OAuth Not Working

**Symptoms:**
- "Redirect URI mismatch" error
- OAuth popup closes immediately

**Solutions:**

**A) Update Google Console Authorized URIs**
1. Go to Google Cloud Console
2. APIs & Services → Credentials
3. Add to Authorized JavaScript origins:
   ```
   https://your-project.vercel.app
   ```
4. Add to Authorized redirect URIs:
   ```
   https://your-project.vercel.app/auth/callback
   ```

**B) Check Client ID**
```env
# Frontend .env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

---

## 6. WebSocket / Socket.IO Issues

### ❌ Socket Connection Failed

**Symptoms:**
```
WebSocket connection to 'wss://...' failed
```

**Solutions:**

**A) Update Socket.IO CORS**
```javascript
// backend/server.js
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      'https://your-project.vercel.app',
      'http://localhost:5173'
    ],
    credentials: true,
  },
});
```

**B) Check Socket URL**
```javascript
// frontend/src/socket.js
const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
  autoConnect: true,
  transports: ['websocket', 'polling']
});
```

**C) Add 'polling' Transport**
Some networks block WebSocket. Allow fallback:
```javascript
const socket = io(url, {
  transports: ['polling', 'websocket'] // Try polling first
});
```

---

## 7. File Upload Issues (Cloudinary)

### ❌ Upload Fails

**Symptoms:**
```
Error: Upload failed
Status: 401 Unauthorized
```

**Solutions:**

**A) Check Cloudinary Credentials**
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name  # Not full URL!
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-secret-key
```

**B) Check File Size**
```javascript
// Add file size limit
const upload = multer({
  storage: cloudinaryStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});
```

**C) Check Cloudinary Settings**
1. Cloudinary Console → Settings → Security
2. Ensure "Unsigned uploading" is disabled (more secure)

---

## 8. Performance Issues

### ❌ Slow Response Times

**Symptoms:**
- API calls take 3-5 seconds
- Page loads slowly

**Solutions:**

**A) Add Redis Caching**
```javascript
import redis from 'redis';
const client = redis.createClient({ url: process.env.REDIS_URL });

// Cache example
app.get('/api/users', async (req, res) => {
  const cached = await client.get('users');
  if (cached) return res.json(JSON.parse(cached));
  
  const users = await User.find();
  await client.setEx('users', 300, JSON.stringify(users));
  res.json(users);
});
```

**B) Optimize Database Queries**
```javascript
// Use lean() for read-only data
const users = await User.find().lean();

// Use select() to fetch only needed fields
const users = await User.find().select('name email');

// Use indexes
userSchema.index({ email: 1 });
```

**C) Enable Compression**
```javascript
import compression from 'compression';
app.use(compression());
```

---

## 9. Debugging Tools

### Check All Services Health

```powershell
# PowerShell script to check all services
$services = @{
    "Frontend" = "https://your-project.vercel.app"
    "Backend" = "https://your-backend.onrender.com/api"
    "Recommendation" = "https://your-recommendation.onrender.com/health"
}

foreach ($service in $services.GetEnumerator()) {
    Write-Host "`nChecking $($service.Key)..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri $service.Value -TimeoutSec 10
        Write-Host "✓ $($service.Key) is UP" -ForegroundColor Green
    } catch {
        Write-Host "✗ $($service.Key) is DOWN" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)"
    }
}
```

### View Service Logs

**Render:**
```
1. Go to dashboard.render.com
2. Click on service
3. Click "Logs" tab
4. Use search/filter
```

**Vercel:**
```
1. Go to vercel.com/dashboard
2. Click project → Deployments
3. Click latest deployment
4. View Function Logs or Build Logs
```

### Test API Locally vs Production

```powershell
# Test local
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"test@test.com","password":"test123"}'

# Test production
Invoke-RestMethod -Uri "https://your-backend.onrender.com/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"test@test.com","password":"test123"}'
```

---

## 10. Emergency Rollback

### Vercel - Rollback to Previous Deployment

1. Go to Vercel → Project → Deployments
2. Find working deployment
3. Click "..." menu → Promote to Production

### Render - Rollback

1. Go to Render → Service
2. Click "Manual Deploy"
3. Deploy a specific commit (select from dropdown)

### MongoDB - Restore from Backup

1. MongoDB Atlas → Clusters → Click cluster
2. Click "..." → Restore
3. Select snapshot to restore
4. Choose restore options

---

## Quick Diagnosis Checklist

When something doesn't work:

1. **Check Service Status**
   - [ ] Vercel deployment successful?
   - [ ] Render services running?
   - [ ] MongoDB Atlas accessible?

2. **Check Environment Variables**
   - [ ] All variables set correctly?
   - [ ] No typos in variable names?
   - [ ] Values match between services?

3. **Check Logs**
   - [ ] Any errors in Render logs?
   - [ ] Any errors in Vercel logs?
   - [ ] Any errors in browser console?

4. **Check Network**
   - [ ] CORS configured correctly?
   - [ ] URLs correct (https, not http)?
   - [ ] Firewall not blocking?

5. **Check Database**
   - [ ] MongoDB connection string correct?
   - [ ] Network access configured?
   - [ ] Database user has permissions?

---

## Getting Help

If you're still stuck:

1. **Check Render/Vercel Status Pages**
   - https://www.vercel-status.com
   - https://status.render.com

2. **Search Documentation**
   - https://vercel.com/docs
   - https://render.com/docs
   - https://docs.mongodb.com/atlas

3. **Check Logs Carefully**
   - Error messages usually point to the issue
   - Search the exact error message online

4. **Test Locally First**
   - If it works locally, it's a deployment config issue
   - If it doesn't work locally, it's a code issue

---

*Remember: Most deployment issues are related to environment variables or CORS configuration!* 🔧
