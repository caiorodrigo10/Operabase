const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Função de log
function logMessage(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  
  console.log(logEntry.trim());
  
  try {
    fs.appendFileSync('/tmp/debug.log', logEntry);
  } catch (err) {
    console.error('Erro ao escrever log:', err);
  }
}

logMessage('🚀 Debug Server iniciando...');
logMessage(`📍 PORT: ${PORT}`);
logMessage(`📍 NODE_ENV: ${process.env.NODE_ENV}`);
logMessage(`📍 Process PID: ${process.pid}`);

// Middleware básico
app.use((req, res, next) => {
  logMessage(`📥 ${req.method} ${req.url} - ${req.ip}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  const healthData = {
    status: 'ok',
    message: 'Debug Server is running!',
    timestamp: new Date().toISOString(),
    version: 'debug-v1.0',
    port: PORT,
    env: process.env.NODE_ENV || 'production',
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

// Test endpoint
app.get('/api/test', (req, res) => {
  logMessage('🧪 Test endpoint chamado');
  res.json({
    message: 'Debug API is working!',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    query: req.query
  });
});

// Debug logs endpoint
app.get('/debug/logs', (req, res) => {
  try {
    const logs = fs.readFileSync('/tmp/debug.log', 'utf8');
    res.text(logs);
  } catch (err) {
    res.json({ error: 'Logs não encontrados', message: err.message });
  }
});

// Catch all
app.get('*', (req, res) => {
  logMessage(`❌ Rota não encontrada: ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    url: req.url,
    available_routes: ['/health', '/api/test', '/debug/logs'],
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  logMessage(`💥 Erro capturado: ${err.message}`);
  logMessage(`💥 Stack: ${err.stack}`);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, () => {
  logMessage(`🚀 Debug Server rodando na porta ${PORT}`);
  logMessage(`📍 Ambiente: ${process.env.NODE_ENV || 'production'}`);
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

logMessage('✅ Debug Server configurado e aguardando conexões...'); 