const express = require('express');
const app = express();

// Middleware básico
app.use(express.json());

// Health check endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Operabase Backend is running!',
    timestamp: new Date().toISOString(),
    version: 'v1.2.2-simple',
    port: process.env.PORT || 8080
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 8080;

console.log('🚀 Starting Simple Operabase Server...');
console.log(`📍 NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`📍 PORT: ${PORT}`);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`📍 Root: http://0.0.0.0:${PORT}/`);
  console.log(`📍 Test API: http://0.0.0.0:${PORT}/api/test`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📍 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📍 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app; 