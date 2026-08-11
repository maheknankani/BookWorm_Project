# Backend Setup Guide

## Prerequisites

- Node.js 16+
- MongoDB installed and running locally
- npm or yarn package manager

## Environment Variables

Create a `.env` file in the Backend directory with the following variables:

```env
# MongoDB Connection (for local MongoDB)
MONGO_URI=mongodb://localhost:27017/bookstore

# JWT Secret (generate a random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Cloudinary Configuration (optional - for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server Port
PORT=3000
```

## MongoDB Setup

### 1. Install MongoDB

**Windows:**
- Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
- Install and start MongoDB service

**macOS:**
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu):**
```bash
sudo apt update
sudo apt install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### 2. Create Database

Connect to MongoDB and create the database:
```bash
mongosh
use bookstore
```

## Installation & Running

### 1. Install Dependencies
```bash
cd Backend
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Books
- `GET /api/books` - Get all books (with pagination)
- `POST /api/books` - Create new book (requires auth)
- `GET /api/books/user` - Get user's books (requires auth)
- `DELETE /api/books/:id` - Delete book (requires auth)

## Testing the API

### 1. Test MongoDB Connection
The server will log "Database connected" when MongoDB is successfully connected.

### 2. Test Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Troubleshooting

### MongoDB Connection Issues
1. Ensure MongoDB service is running
2. Check if port 27017 is available
3. Verify database name in connection string
4. Check MongoDB logs for errors

### Port Already in Use
If port 3000 is busy, change the PORT in your .env file:
```env
PORT=3001
```

### JWT Issues
- Ensure JWT_SECRET is set and not empty
- Use a strong, random string for JWT_SECRET

## Development

The server uses nodemon for automatic restarts during development. Any changes to the source code will automatically restart the server.

## Production

For production deployment:
1. Set NODE_ENV=production
2. Use a strong JWT_SECRET
3. Configure proper MongoDB connection (with authentication if needed)
4. Set up proper CORS origins
5. Use environment-specific configuration
