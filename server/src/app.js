const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const sensorRoutes = require('./routes/sensor.routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();

// Security middleware - adjust CSP for frontend domain
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://taskcanvas.me'],
    },
  },
}));

// CORS - Allow frontend domain and ESP32
const allowedOrigins = [
  'https://nfrontend.taskcanvas.me',
  'https://taskcanvas.me',
  'http://localhost:5173',  // Local dev
  'http://localhost:3000',  // Local dev
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, ESP32, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key'],
}));

// Rate limiting
app.use(rateLimiter);

// Body parsing with size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Routes
app.use('/api', sensorRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  const sensorStore = require('./services/sensorStore.service');
  const health = sensorStore.getHealthStatus();
  res.json(health);
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

module.exports = app;