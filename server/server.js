// server/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// Init middleware
app.use(express.json({ extended: false })); // Parse JSON request body
app.use(cors()); // Enable CORS for all routes

// Define routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/mood-entries', require('./routes/moodEntries'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/ml-models', require('./routes/mlmodels'));
app.use('/api/user-preferences', require('./routes/userpreferences'));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Mindful Pathways API' });
});

// Set port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // In production, you might want to exit the process
  // process.exit(1);
});