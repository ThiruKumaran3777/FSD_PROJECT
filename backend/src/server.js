require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Connect to MongoDB (Compass-compatible URI)
connectDB();

const app = express();
const server = http.createServer(app);

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5175';

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    credentials: true,
  },
});

// Attach io to app so it can be used in routes/controllers
app.set('io', io);

// Middleware
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/feedback', feedbackRoutes);

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running', port: PORT });
});

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend is reachable',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    cookies: req.cookies
  });
});

// TODO: mount auth, course, feedback, analytics routes here

// Prefer PORT from .env but fall back to 5001 if not set
const PORT = process.env.PORT || 5001;

// Start HTTP server with basic error handling
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} is already in use. ` +
        'Either stop the other process using this port or set a different PORT in your .env file.'
    );
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

// Graceful shutdown to close HTTP server and MongoDB connection
const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully…`);

  server.close(() => {
    console.log('HTTP server closed.');
    mongoose.connection
      .close(false)
      .then(() => {
        console.log('MongoDB connection closed.');
        process.exit(0);
      })
      .catch((err) => {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      });
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected', socket.id);

  // Clients join a room per-course to receive live updates
  socket.on('join-course', (courseId) => {
    if (courseId) {
      socket.join(courseId.toString());
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
});
