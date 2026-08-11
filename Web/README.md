# Bookstore Web Frontend

A modern, responsive web application for the Bookstore project built with React, Vite, and Tailwind CSS.

## Features

- 🚀 **Modern React 18** with hooks and functional components
- 🎨 **Beautiful UI** built with Tailwind CSS
- 📱 **Responsive design** that works on all devices
- 🔐 **Authentication system** with JWT tokens
- 📚 **Book management** - create, view, and delete books
- 👤 **User profiles** with personal book collections
- 🔄 **Real-time updates** with optimistic UI
- 📱 **Mobile-first** responsive design

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Routing**: React Router DOM

## Prerequisites

- Node.js 16+ 
- MongoDB running locally
- Backend server running (see Backend setup)

## Setup Instructions

### 1. Install Dependencies

```bash
cd Web
npm install
```

### 2. Start the Development Server

```bash
npm run dev
```

The application will open at `http://localhost:5173`

### 3. Build for Production

```bash
npm run build
npm run preview
```

## Backend Connection

Make sure your backend server is running on `http://localhost:3000` and has CORS enabled.

The web frontend will automatically connect to your local MongoDB through the backend API.

## Project Structure

```
Web/
├── src/
│   ├── components/          # Reusable UI components
│   ├── contexts/            # React contexts (Auth)
│   ├── pages/               # Page components
│   ├── services/            # API services
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── public/                  # Static assets
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── README.md               # This file
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Features Overview

### Authentication
- User registration and login
- JWT token management
- Protected routes
- Automatic token refresh

### Book Management
- View all books with pagination
- Create new books with ratings
- Delete your own books
- Book cover image support

### User Experience
- Responsive navigation
- Loading states
- Error handling
- Success notifications
- Image previews

## API Endpoints Used

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/books` - Get all books (paginated)
- `POST /api/books` - Create new book
- `GET /api/books/user` - Get user's books
- `DELETE /api/books/:id` - Delete book

## Customization

### Colors
Edit `tailwind.config.js` to customize the color scheme:

```javascript
colors: {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    // ... customize your colors
  }
}
```

### Styling
Modify `src/index.css` to add custom CSS classes and overrides.

## Troubleshooting

### Common Issues

1. **Backend Connection Error**
   - Ensure backend is running on port 3000
   - Check CORS configuration in backend
   - Verify MongoDB connection

2. **Build Errors**
   - Clear `node_modules` and reinstall
   - Check Node.js version compatibility
   - Verify all dependencies are installed

3. **Styling Issues**
   - Ensure Tailwind CSS is properly configured
   - Check PostCSS configuration
   - Verify CSS imports in main files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Bookstore application.
