# 🏗️ Deployment Architecture

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL (Frontend)                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         React App (Vite Build)                          │  │
│  │  - Static files served via Vercel CDN                   │  │
│  │  - Environment variables injected at build time         │  │
│  │  - Auto SSL certificate                                 │  │
│  │  - Global CDN distribution                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  URL: https://your-project.vercel.app                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ REST API + WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  RENDER (Backend Services)                      │
│                                                                 │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃          Node.js Backend (Express + Socket.IO)         ┃  │
│  ┃  ┌────────────────────────────────────────────────┐    ┃  │
│  ┃  │  API Routes:                                   │    ┃  │
│  ┃  │  - /api/auth (login, signup, 2FA)             │    ┃  │
│  ┃  │  - /api/user (profile, users)                 │    ┃  │
│  ┃  │  - /api/chat (conversations, messages)        │    ┃  │
│  ┃  │  - /api/meetings (scheduling)                 │    ┃  │
│  ┃  │  - /api/feedback                              │    ┃  │
│  ┃  │  - /api/credits                               │    ┃  │
│  ┃  │  - /api/recommendations (proxy to Python)     │    ┃  │
│  ┃  └────────────────────────────────────────────────┘    ┃  │
│  ┃                                                         ┃  │
│  ┃  Socket.IO Server:                                     ┃  │
│  ┃  - Real-time chat                                      ┃  │
│  ┃  - Live notifications                                  ┃  │
│  ┃                                                         ┃  │
│  ┃  URL: https://skillbridge-backend.onrender.com        ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                                 │
│                              │                                  │
│                              │ HTTP (Internal)                  │
│                              ▼                                  │
│                                                                 │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃    Python Recommendation Service (FastAPI + ML)        ┃  │
│  ┃  ┌────────────────────────────────────────────────┐    ┃  │
│  ┃  │  Endpoints:                                    │    ┃  │
│  ┃  │  - /health (health check)                     │    ┃  │
│  ┃  │  - /recommend/teachers (ML recommendations)   │    ┃  │
│  ┃  │  - /train (train models)                      │    ┃  │
│  ┃  └────────────────────────────────────────────────┘    ┃  │
│  ┃                                                         ┃  │
│  ┃  ML Models:                                            ┃  │
│  ┃  - Content-based filtering                            ┃  │
│  ┃  - TF-IDF vectorizer                                  ┃  │
│  ┃  - Teacher feature extraction                         ┃  │
│  ┃                                                         ┃  │
│  ┃  URL: https://skillbridge-recommendation.onrender.com ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ MongoDB Protocol
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              MONGODB ATLAS (Database - Cloud)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Collections:                                            │  │
│  │  - users (authentication, profiles)                      │  │
│  │  - conversations (chat data)                             │  │
│  │  - messages (chat messages)                              │  │
│  │  - meetings (scheduled meetings)                         │  │
│  │  - feedback (user feedback)                              │  │
│  │  - credits (user credits)                                │  │
│  │  - verificationcodes (2FA codes)                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Features:                                                      │
│  - Automatic backups                                            │
│  - Replica sets (high availability)                             │
│  - 512MB storage (free tier)                                   │
│  - Global deployment                                            │
│                                                                 │
│  URL: mongodb+srv://cluster.xxxxx.mongodb.net/skillbridge      │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│              CLOUDINARY (File Storage - Cloud)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Stores:                                                 │  │
│  │  - User profile pictures                                 │  │
│  │  - Uploaded documents                                    │  │
│  │  - Chat media files                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Features:                                                      │
│  - Image optimization                                           │
│  - CDN delivery                                                 │
│  - Automatic transformations                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### User Login Flow
```
User Browser
    │
    │ 1. POST /api/auth/login
    ▼
Vercel Frontend ──────────────────────┐
    │                                 │
    │ 2. Forward request              │
    ▼                                 │
Render Backend                        │
    │                                 │
    │ 3. Query user                   │
    ▼                                 │
MongoDB Atlas                         │
    │                                 │
    │ 4. Return user data             │
    ▼                                 │
Render Backend                        │
    │                                 │
    │ 5. Verify password              │
    │ 6. Generate JWT                 │
    │                                 │
    │ 7. Return token                 │
    ▼                                 │
Vercel Frontend ◄─────────────────────┘
    │
    │ 8. Store token in localStorage
    ▼
User Browser
```

### Get Teacher Recommendations Flow
```
User Browser
    │
    │ 1. GET /api/recommendations/teachers?subject=Math
    ▼
Vercel Frontend
    │
    │ 2. Forward with auth token
    ▼
Render Backend
    │
    │ 3. Verify JWT token
    │ 4. Extract user ID
    │
    │ 5. POST to recommendation service
    ▼
Render Recommendation Service
    │
    │ 6. Load ML models
    │ 7. Query MongoDB for teachers
    ▼
MongoDB Atlas
    │
    │ 8. Return teacher data
    ▼
Render Recommendation Service
    │
    │ 9. Run ML algorithms
    │ 10. Generate recommendations
    │
    │ 11. Return ranked results
    ▼
Render Backend
    │
    │ 12. Format response
    │
    │ 13. Return to frontend
    ▼
Vercel Frontend
    │
    │ 14. Display recommendations
    ▼
User Browser
```

### Real-time Chat Flow
```
User A Browser
    │
    │ 1. WebSocket connect
    ▼
Vercel Frontend A
    │
    │ 2. Socket.IO handshake
    ▼
Render Backend ◄────────────────────┐
    │                               │
    │ 3. Authenticate socket        │
    │                               │
    │ 4. User A sends message       │
    │                               │
    │ 5. Save to database           │
    ▼                               │
MongoDB Atlas                       │
    │                               │
    │ 6. Message saved              │
    ▼                               │
Render Backend                      │
    │                               │
    │ 7. Emit message to User B     │
    │                               │
    │ 8. Real-time message          │
    ▼                               │
Vercel Frontend B ──────────────────┘
    │
    │ 9. Display message
    ▼
User B Browser
```

---

## Deployment Process Flow

```
┌──────────────┐
│   Developer  │
│  Local Code  │
└──────┬───────┘
       │
       │ git push
       ▼
┌──────────────┐
│   GitHub     │
│  Repository  │
└──┬────────┬──┘
   │        │
   │        └────────────────────┐
   │                             │
   │ Webhook                     │ Webhook
   │ (auto-deploy)               │ (auto-deploy)
   │                             │
   ▼                             ▼
┌──────────────┐         ┌──────────────┐
│   Vercel     │         │    Render    │
│              │         │              │
│ 1. Detect    │         │ 1. Detect    │
│    changes   │         │    changes   │
│              │         │              │
│ 2. Install   │         │ 2. Install   │
│    deps      │         │    deps      │
│              │         │              │
│ 3. Build     │         │ 3. Build     │
│    (vite)    │         │    (none)    │
│              │         │              │
│ 4. Deploy to │         │ 4. Deploy to │
│    CDN       │         │    container │
│              │         │              │
│ 5. Update    │         │ 5. Restart   │
│    preview   │         │    service   │
└──────────────┘         └──────────────┘
       │                         │
       │                         │
       ▼                         ▼
   LIVE URL                  LIVE URL
```

---

## Network Security & Communication

```
┌─────────────────────────────────────────────────────┐
│                 Security Layers                     │
└─────────────────────────────────────────────────────┘

Frontend (Vercel)
    │
    │ ✓ HTTPS (TLS 1.3)
    │ ✓ CORS headers
    │ ✓ CSP (Content Security Policy)
    │ ✓ XSS protection
    │
    ▼
Backend (Render)
    │
    │ ✓ JWT authentication
    │ ✓ Rate limiting
    │ ✓ Input validation
    │ ✓ API key verification
    │ ✓ Helmet.js security headers
    │
    ▼
Recommendation Service (Render)
    │
    │ ✓ API key required
    │ ✓ CORS validation
    │ ✓ Rate limiting
    │
    ▼
Database (MongoDB Atlas)
    │
    │ ✓ Encrypted connection (TLS)
    │ ✓ IP whitelist (optional)
    │ ✓ Database user authentication
    │ ✓ Network encryption
```

---

## Monitoring & Logging

```
┌──────────────────────────────────────────────────┐
│           Monitoring Architecture                │
└──────────────────────────────────────────────────┘

UptimeRobot
    │
    │ Pings every 10 minutes
    │
    ├─► Backend Health Check
    │   └─► /api endpoint
    │
    └─► Recommendation Service Health Check
        └─► /health endpoint


Render Logs
    │
    ├─► Backend Logs
    │   ├─► Request logs
    │   ├─► Error logs
    │   └─► Application logs
    │
    └─► Recommendation Service Logs
        ├─► Request logs
        ├─► ML operation logs
        └─► Error logs


Vercel Logs
    │
    ├─► Build logs
    ├─► Function logs
    └─► Edge logs


MongoDB Atlas Metrics
    │
    ├─► Query performance
    ├─► Connection stats
    ├─► Storage usage
    └─► Network traffic
```

---

## Scaling Strategy

### Current Setup (Free Tier)
```
Frontend:  1 CDN edge location
Backend:   1 instance (512MB RAM)
Rec Svc:   1 instance (512MB RAM)
Database:  M0 cluster (512MB storage)
```

### Growth Path (When Scaling)
```
Stage 1: More Users (10,000+ users)
├─► Vercel: Upgrade to Pro ($20/month)
├─► Render: Upgrade backend to Standard ($7/month)
├─► Render: Keep recommendation service on Free
└─► MongoDB: Upgrade to M10 ($0.08/hour)

Stage 2: High Traffic (100,000+ users)
├─► Vercel: Pro plan
├─► Render: Upgrade both services to Standard+
├─► MongoDB: Upgrade to M20
└─► Add Redis for caching

Stage 3: Enterprise (1M+ users)
├─► Vercel: Enterprise plan
├─► Render: Professional plan with autoscaling
├─► MongoDB: M40 with replica sets
├─► Redis: Dedicated instance
└─► CDN for static assets
```

---

## Backup & Disaster Recovery

```
┌─────────────────────────────────────────┐
│         Backup Strategy                 │
└─────────────────────────────────────────┘

MongoDB Atlas
├─► Automatic daily snapshots
├─► Point-in-time recovery (paid tier)
└─► Manual export via mongodump

Render Services
├─► Code in GitHub (version control)
├─► Environment variables exported
└─► Quick redeploy from GitHub

Vercel
├─► Build cache in Vercel
├─► Code in GitHub
└─► Instant rollback to previous deployment

Cloudinary
├─► Permanent file storage
└─► Backup to external storage (optional)
```

---

## Cost Breakdown (Monthly)

### Free Tier Setup
```
Vercel:        $0  (100GB bandwidth)
Render:        $0  (750 hours/month)
MongoDB Atlas: $0  (512MB storage)
Cloudinary:    $0  (25GB storage + bandwidth)
UptimeRobot:   $0  (50 monitors)
─────────────────
Total:         $0/month
```

### Small Business Setup
```
Vercel Pro:         $20
Render Standard:    $14  ($7 × 2 services)
MongoDB M10:        $57  (~720 hours)
Cloudinary Plus:    $99  (optional)
─────────────────────────
Total:             $91-$190/month
```

---

## Best Practices Summary

### Security ✓
- Use strong, unique secrets (32+ chars)
- Enable 2FA on all platforms
- Rotate API keys regularly
- Keep dependencies updated
- Never commit .env files

### Performance ✓
- Use CDN for static assets
- Implement caching (Redis)
- Optimize database queries
- Compress responses (gzip)
- Use connection pooling

### Reliability ✓
- Monitor with UptimeRobot
- Set up error tracking (Sentry)
- Regular database backups
- Test disaster recovery
- Document deployment process

### Development ✓
- Use environment variables
- Keep staging/production separate
- Test locally before deploy
- Use Git branches
- Review before merging

---

*This architecture provides a solid foundation that can scale from 0 to 100,000+ users!* 🚀
