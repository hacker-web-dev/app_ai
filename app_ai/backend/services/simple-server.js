// simple-server.js - A minimal server with CORS enabled
const express = require('express');
const routes = require('./routes'); // Import your routes

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// VERY SIMPLE CORS MIDDLEWARE - applies to all routes
app.use((req, res, next) => {
  // Allow requests from any origin
  res.header('Access-Control-Allow-Origin', '*');
  
  // Allow specific HTTP methods
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Allow specific headers
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Parse JSON requests
app.use(express.json());

// Test endpoint to verify CORS headers
app.get('/test-cors', (req, res) => {
  res.json({ 
    message: 'CORS test successful', 
    headers: {
      origin: req.headers.origin,
      requestMethod: req.method,
      corsHeaders: {
        'access-control-allow-origin': res.getHeader('Access-Control-Allow-Origin'),
        'access-control-allow-methods': res.getHeader('Access-Control-Allow-Methods'),
        'access-control-allow-headers': res.getHeader('Access-Control-Allow-Headers')
      }
    }
  });
});

// Mount your routes
app.use('/api', routes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test CORS at: http://localhost:${PORT}/test-cors`);
  console.log(`API routes available at: http://localhost:${PORT}/api/services`);
});

module.exports = app;