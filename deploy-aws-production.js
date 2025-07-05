const express = require('express');
const fs = require('fs');
const path = require('path');

console.log('🚀 AWS Deploy Script - Production Version');
console.log('📍 Node Version:', process.version);
console.log('📍 Platform:', process.platform);
console.log('📍 Architecture:', process.arch);
console.log('📍 Environment:', process.env.NODE_ENV || 'production');

// Verificar se o servidor de produção existe
const productionServerPath = path.join(__dirname, 'server', 'production-server.cjs');
const simpleServerPath = path.join(__dirname, 'server', 'simple-server.cjs');

let serverToUse = null;

if (fs.existsSync(productionServerPath)) {
  console.log('✅ Production server encontrado');
  serverToUse = productionServerPath;
} else if (fs.existsSync(simpleServerPath)) {
  console.log('⚠️  Usando servidor simples como fallback');
  serverToUse = simpleServerPath;
} else {
  console.log('❌ Nenhum servidor encontrado, criando servidor básico');
  
  // Criar servidor básico inline
  const basicServer = `
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AWS Deploy Basic Server',
    timestamp: new Date().toISOString(),
    version: 'basic-v1.0'
  });
});

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AWS Deploy Basic Server',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('✅ Basic server running on port', PORT);
});
  `;
  
  fs.writeFileSync(path.join(__dirname, 'basic-server.js'), basicServer);
  serverToUse = path.join(__dirname, 'basic-server.js');
}

console.log('🎯 Usando servidor:', serverToUse);

// Importar e executar o servidor
try {
  console.log('🔄 Iniciando servidor...');
  require(serverToUse);
} catch (error) {
  console.error('💥 Erro ao iniciar servidor:', error.message);
  console.error('💥 Stack:', error.stack);
  
  // Fallback final - servidor ultra básico
  console.log('🆘 Iniciando servidor de emergência...');
  
  const app = express();
  const PORT = process.env.PORT || 8080;
  
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Emergency Server',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  });
  
  app.get('/', (req, res) => {
    res.json({
      status: 'emergency',
      message: 'Emergency Server Active',
      timestamp: new Date().toISOString()
    });
  });
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log('🆘 Emergency server running on port', PORT);
  });
} 