// Arquivo de fallback simples para Elastic Beanstalk
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

console.log('🚀 Iniciando aplicação de fallback...');
console.log('📍 PORT:', port);
console.log('📍 NODE_ENV:', process.env.NODE_ENV);

app.get('/', (req, res) => {
  console.log('🏠 Root endpoint acessado (fallback)');
  res.json({
    message: 'Operabase API Fallback funcionando!',
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: 'fallback-1.0.0',
    port: port
  });
});

app.get('/health', (req, res) => {
  console.log('🏥 Health check endpoint acessado (fallback)');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: port,
    env: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🎉 SERVIDOR FALLBACK INICIADO COM SUCESSO!`);
  console.log(`📍 Porta: ${port}`);
  console.log(`📍 URL: http://0.0.0.0:${port}`);
});

module.exports = app; 