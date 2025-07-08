const express = require('express');
const path = require('path');
const fs = require('fs');

/**
 * Middleware de Arquivos Estáticos
 * Refatorado de: railway-server.ts (linhas 763-882)
 * Módulo: Static Files & SPA Routing
 */

/**
 * Configurar serving de arquivos estáticos
 * Inclui fallback para SPA e página de erro personalizada
 */
function setupStaticFiles(app) {
  // Verificar se diretório dist existe
  const distPath = path.join(__dirname, '../../..');
  const indexPath = path.join(distPath, 'index.html');
  
  console.log('📁 Configurando arquivos estáticos...');
  console.log('📁 Dist path:', distPath);
  
  try {
    // Verificar conteúdo do diretório
    if (fs.existsSync(distPath)) {
      const distContents = fs.readdirSync(distPath);
      console.log('📁 Conteúdo do diretório:', distContents);
      
      // Servir arquivos estáticos
      app.use(express.static(distPath));
      
      if (fs.existsSync(indexPath)) {
        console.log('✅ index.html encontrado - SPA routing ativo');
        
        // SPA routing - todas as rotas não-API servem index.html
        app.get('*', (req, res) => {
          // Não interceptar rotas da API
          if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
            return res.status(404).json({
              success: false,
              error: 'Endpoint não encontrado'
            });
          }
          
          console.log('🔀 SPA routing:', req.path, '-> index.html');
          res.sendFile(indexPath);
        });
      } else {
        console.log('⚠️ index.html não encontrado');
        setupErrorPage(app, distPath);
      }
    } else {
      console.log('⚠️ Diretório dist não encontrado');
      setupErrorPage(app, distPath);
    }
  } catch (error) {
    console.error('❌ Erro ao configurar arquivos estáticos:', error);
    setupErrorPage(app, distPath);
  }
}

/**
 * Configurar página de erro personalizada
 */
function setupErrorPage(app, distPath) {
  app.get('*', (req, res) => {
    // Não interceptar rotas da API
    if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
      return res.status(404).json({
        success: false,
        error: 'Endpoint não encontrado'
      });
    }
    
    console.log('📄 Servindo página de erro para:', req.path);
    
    // Verificar diretório pai
    const parentPath = path.join(__dirname, '../../../..');
    let parentContents = [];
    try {
      parentContents = fs.readdirSync(parentPath);
    } catch (error) {
      console.error('❌ Erro ao ler diretório pai:', error);
    }
    
    const errorHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Operabase - Servidor Ativo</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                background: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                max-width: 600px;
                width: 100%;
            }
            .status {
                text-align: center;
                margin-bottom: 30px;
            }
            .status-icon {
                font-size: 48px;
                margin-bottom: 16px;
            }
            h1 {
                color: #2d3748;
                margin: 0 0 16px 0;
                font-size: 28px;
            }
            .info {
                background: #f7fafc;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }
            .info h3 {
                margin: 0 0 12px 0;
                color: #4a5568;
            }
            .info ul {
                margin: 0;
                padding-left: 20px;
            }
            .info li {
                margin: 4px 0;
                color: #718096;
            }
            .debug {
                font-size: 12px;
                color: #a0aec0;
                margin-top: 20px;
                padding: 12px;
                background: #edf2f7;
                border-radius: 4px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="status">
                <div class="status-icon">🚀</div>
                <h1>Operabase Server</h1>
                <p style="color: #68d391; font-weight: 600;">Servidor está rodando!</p>
            </div>
            
            <div class="info">
                <h3>📋 API Endpoints Disponíveis:</h3>
                <ul>
                    <li><strong>GET</strong> /health - Health check</li>
                    <li><strong>GET</strong> /api - API info</li>
                    <li><strong>GET</strong> /api/contacts - Listar contatos</li>
                    <li><strong>POST</strong> /api/contacts - Criar contato</li>
                    <li><strong>GET</strong> /api/appointments - Listar agendamentos</li>
                    <li><strong>POST</strong> /api/appointments - Criar agendamento</li>
                    <li><strong>POST</strong> /api/auth/login - Login</li>
                    <li><strong>POST</strong> /api/audio/voice-message/:id - Upload áudio</li>
                </ul>
            </div>
            
            <div class="info">
                <h3>🛠️ Informações do Sistema:</h3>
                <ul>
                    <li><strong>Ambiente:</strong> <code>${process.env.NODE_ENV || 'development'}</code></li>
                    <li><strong>Porta:</strong> <code>${process.env.PORT || 3000}</code></li>
                    <li><strong>Dist Path:</strong> <code>${distPath}</code></li>
                    <li><strong>Arquivos no diretório pai:</strong> <code>${parentContents.join(', ')}</code></li>
                </ul>
            </div>
            
            <div class="debug">
                <strong>Debug Info:</strong><br>
                Requested path: ${req.path}<br>
                Timestamp: ${new Date().toISOString()}
            </div>
        </div>
    </body>
    </html>
    `;
    
    res.status(200).send(errorHtml);
  });
}

module.exports = {
  setupStaticFiles
}; 