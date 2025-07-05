const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'production';

// Função de log
function logMessage(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  
  console.log(logEntry.trim());
  
  // Tentar escrever no log, mas não falhar se não conseguir
  try {
    fs.appendFileSync('/tmp/production.log', logEntry);
  } catch (err) {
    // Ignorar erros de log em produção
  }
}

logMessage('🚀 Production Server iniciando...');
logMessage(`📍 PORT: ${PORT}`);
logMessage(`📍 NODE_ENV: ${NODE_ENV}`);
logMessage(`📍 Process PID: ${process.pid}`);

// CORS configuration para Vercel frontend
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://operabase-frontend.vercel.app',
    'https://operabase-main.vercel.app',
    'https://operabase-main-git-main-caioapfelbaums-projects.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Middleware de log
app.use((req, res, next) => {
  logMessage(`📥 ${req.method} ${req.url} - ${req.ip}`);
  next();
});

// Middleware básico
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  const healthData = {
    status: 'ok',
    message: 'Operabase Production Server is running!',
    timestamp: new Date().toISOString(),
    version: 'production-v1.0',
    port: PORT,
    env: NODE_ENV,
    pid: process.pid,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: process.platform,
    arch: process.arch,
    node_version: process.version
  };
  
  logMessage(`✅ Health check respondido: ${JSON.stringify(healthData)}`);
  res.json(healthData);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Operabase Production Backend is running!',
    timestamp: new Date().toISOString(),
    version: 'production-v1.0',
    port: PORT,
    env: NODE_ENV,
    endpoints: [
      '/health',
      '/api/test',
      '/api/appointments',
      '/api/contacts',
      '/api/clinics'
    ]
  });
});

// Test API endpoint
app.get('/api/test', (req, res) => {
  logMessage('🧪 Test endpoint chamado');
  res.json({
    message: 'Production API is working!',
    timestamp: new Date().toISOString(),
    cors: 'enabled',
    database: 'connected',
    version: 'production-v1.0'
  });
});

// Mock API endpoints para teste inicial
app.get('/api/appointments', (req, res) => {
  logMessage('📅 Appointments endpoint chamado');
  res.json({
    message: 'Appointments API endpoint',
    data: [],
    timestamp: new Date().toISOString(),
    status: 'mock'
  });
});

app.get('/api/contacts', (req, res) => {
  logMessage('👥 Contacts endpoint chamado');
  res.json({
    message: 'Contacts API endpoint',
    data: [],
    timestamp: new Date().toISOString(),
    status: 'mock'
  });
});

app.get('/api/clinics', (req, res) => {
  logMessage('🏥 Clinics endpoint chamado');
  res.json({
    message: 'Clinics API endpoint',
    data: [],
    timestamp: new Date().toISOString(),
    status: 'mock'
  });
});

// Debug logs endpoint
app.get('/debug/logs', (req, res) => {
  try {
    const logs = fs.readFileSync('/tmp/production.log', 'utf8');
    res.type('text/plain').send(logs);
  } catch (err) {
    res.json({ 
      error: 'Logs não encontrados', 
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Catch all para rotas não encontradas
app.get('*', (req, res) => {
  logMessage(`❌ Rota não encontrada: ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    url: req.url,
    available_routes: [
      '/health',
      '/api/test',
      '/api/appointments',
      '/api/contacts',
      '/api/clinics',
      '/debug/logs'
    ],
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  logMessage(`💥 Erro capturado: ${err.message}`);
  logMessage(`💥 Stack: ${err.stack}`);
  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  logMessage(`🚀 Production Server rodando na porta ${PORT}`);
  logMessage(`📍 Ambiente: ${NODE_ENV}`);
  logMessage(`📍 Bind: 0.0.0.0:${PORT}`);
  logMessage(`⏰ Iniciado em: ${new Date().toISOString()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logMessage('🛑 SIGTERM recebido, fechando servidor...');
  server.close(() => {
    logMessage('🛑 Servidor fechado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logMessage('🛑 SIGINT recebido, fechando servidor...');
  server.close(() => {
    logMessage('🛑 Servidor fechado');
    process.exit(0);
  });
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  logMessage(`💥 Uncaught Exception: ${err.message}`);
  logMessage(`💥 Stack: ${err.stack}`);
  process.exit(1);
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logMessage(`💥 Unhandled Rejection: ${reason}`);
  logMessage(`💥 Promise: ${promise}`);
  process.exit(1);
});

logMessage('✅ Production Server configurado e aguardando conexões...');

module.exports = app; 