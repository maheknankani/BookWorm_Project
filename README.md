<div align="center">
  <img src="Mobile/assets/images/icon.png" alt="BookWorm Logo" width="120" />
  <h1>BookWorm</h1>
  <p><strong>Read • Discover • Share • Connect</strong></p>
</div>

BookWorm is a full-stack mobile application designed to provide readers with a complete digital reading and book-sharing experience. The application allows users to discover, share, read, save, rate, and review books while managing their personal reading library.

## About the Project
BookWorm combines digital reading with a social book community. Users can create an account, explore books shared by other readers, upload their own eBooks, and interact with the community through likes, comments, and ratings.
The application also provides a personalized library where users can organize books according to their reading status and track their reading progress while reading PDFs directly inside the app.

## Features

- Secure user registration and login
- User profile management
- Upload and share books/eBooks
- Search books by title and caption
- Book ratings and rating filters
- Like and comment on books
- In-app PDF/eBook reader
- Reading progress tracking
- Personal library management
- Want to Read status
- Currently Reading status
- Finished status
- Community-based home feed
- Cloud storage for images and PDFs
- Notifications
- JWT-based authentication
- Secure password hashing using bcrypt

## Technology Stack
### Mobile Application
- React Native
- Expo
- Expo Router
- Zustand
- AsyncStorage
### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
### Additional Technologies
- JWT
- bcrypt
- Cloudinary
- REST APIs
- Vercel
- EAS Build
- 
## How It Works
The BookWorm mobile application communicates with a Node.js and Express.js backend through REST APIs. The backend handles authentication, users, books, libraries, notifications, ratings, likes, comments, and reading progress.
MongoDB is used to store application data, while Cloudinary stores uploaded book PDFs, cover images, and other media.
The application follows this architecture:
React Native Mobile App  
↓  
REST API  
↓  
Node.js + Express.js  
↓  
MongoDB

Cloudinary is used separately for storing uploaded media files.

## Authentication
BookWorm uses JWT-based authentication to protect user accounts and private API routes. Passwords are securely hashed using bcrypt, while authentication data is persisted locally using AsyncStorage.

## Reading & Library System
Users can save books to their personal library and manage their reading status:
- **Want to Read** – books the user plans to read
- **Currently Reading** – books the user is currently reading
- **Finished** – books the user has completed
The reading progress tracker allows users to keep track of their current page while reading an eBook.

## Deployment

### Backend API
The BookWorm backend is deployed on Vercel.

**Live Backend:**
https://book-worm-project-mauve.vercel.app

### Android Application
The Android version is built using Expo EAS Build.

**Download BookWorm APK:**
https://expo.dev/accounts/mahek_nankani/projects/bookworm/builds/c1990515-e53b-4324-8cf3-c184d27dbeb6

> Note: The Android APK is currently distributed outside the Google Play Store, so Android may display a security warning during installation.

## Project Goal
The goal of BookWorm is to create a centralized platform where readers can discover new books, share their reading interests, manage their personal library, read digital books, track their progress, and interact with other readers in a community-driven environment.
