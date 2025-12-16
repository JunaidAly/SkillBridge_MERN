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

