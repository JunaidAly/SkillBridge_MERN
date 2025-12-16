# SkillBridge Backend API

Backend API server for SkillBridge MERN application built with Node.js, Express, and MongoDB.

## Features

- RESTful API architecture
- MongoDB database integration
- JWT authentication ready
- CORS enabled
- Environment-based configuration
- Error handling middleware

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the backend directory (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update the `.env` file with your MongoDB connection string and other configuration.

4. Start the development server:
```bash
npm run dev
```

5. Start the production server:
```bash
npm start
```

## Environment Variables

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRE` - JWT token expiration time
- `FRONTEND_URL` - Frontend URL for CORS

### Email Configuration (for 2FA verification codes)

To send verification emails, add these variables to your `.env` file:

- `SMTP_HOST` - SMTP server host (e.g., `smtp.gmail.com` for Gmail)
- `SMTP_PORT` - SMTP server port (default: 587, use 465 for SSL)
- `SMTP_USER` - SMTP username/email
- `SMTP_PASS` - SMTP password or app password
- `SMTP_FROM` - From email address (optional, defaults to SMTP_USER)
- `SMTP_SECURE` - Use secure connection (true/false, default: false for port 587)

**Example for Gmail:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
SMTP_SECURE=false
```

**Note:** For Gmail, you need to:
1. Enable 2-Step Verification
2. Generate an App Password (not your regular password)
3. Use the App Password as `SMTP_PASS`

**If SMTP is not configured**, verification codes will be logged to the console instead of being sent via email.

## Project Structure

```
backend/
├── config/          # Configuration files
│   └── database.js  # MongoDB connection
├── controllers/     # Route controllers
├── models/          # MongoDB models
├── routes/          # API routes
├── middleware/      # Custom middleware
├── utils/           # Utility functions
├── .env.example     # Environment variables template
├── .gitignore      # Git ignore file
├── package.json     # Dependencies
└── server.js        # Main server file
```

## API Endpoints

- `GET /` - API welcome message
- `GET /api/health` - Health check endpoint

## Database

Make sure MongoDB is running locally or provide a MongoDB Atlas connection string in your `.env` file.

