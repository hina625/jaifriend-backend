# MongoDB Setup Guide

## Option 1: MongoDB Atlas (Cloud Database) - RECOMMENDED

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free account
3. Create a new cluster (free tier)
4. Click "Connect" on your cluster
5. Choose "Connect your application"
6. Copy the connection string
7. Create a `.env` file in your project root with:

```
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/social-media-app?retryWrites=true&w=majority
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret
```

Replace `username`, `password`, and `cluster` with your actual values.

## Option 2: Local MongoDB Installation

1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Install it on your system
3. Start MongoDB service
4. Create `.env` file with:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/social-media-app
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret
```

## Quick Test

After setting up, run:
```bash
npm start
```

You should see: "MongoDB Connected ✅" 