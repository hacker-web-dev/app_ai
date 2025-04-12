// cors-middleware.js
const cors = require('cors');

// Create a flexible CORS middleware that works in both development and production
const corsMiddleware = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5173',     // Vite dev server
      'http://localhost:3000',     // Express server
      'http://127.0.0.1:5173',     // Alternative local address
      'http://127.0.0.1:3000'      // Alternative local address
    ];
    
    // Check if the origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
});

module.exports = corsMiddleware;