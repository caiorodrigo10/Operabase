// Railway Unified Server - Operabase v2.0 (Simplified)
// Frontend + Backend unificado para Railway

import express, { type Request, Response, NextFunction } from "express";
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

// Log de inicialização
console.log('🚀 Iniciando Operabase Railway Unified Server (Simplified)...');
console.log('📍 NODE_ENV:', process.env.NODE_ENV);
console.log('📍 PORT:', PORT);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check (deve vir antes de qualquer middleware complexo)
app.get('/health', (req, res) => {
  console.log('🏥 Health check endpoint acessado');
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '2.0-railway-simplified',
    architecture: 'unified-server'
  });
});

// Root endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Operabase Railway API v2.0 (Simplified)',
    status: 'ok',
    timestamp: new Date().toISOString(),
    architecture: 'unified-server'
  });
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
  });

  next();
});

(async () => {
  try {
    
    // Frontend setup
    if (process.env.NODE_ENV === 'production') {
      // Servir arquivos estáticos do build
      const distPath = path.join(__dirname, '../dist');
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        
        // SPA fallback - todas as rotas não-API servem o index.html
        app.get('*', (req, res) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
        
        console.log('🌐 Production frontend serving static files from:', distPath);
      } else {
        console.warn('⚠️ Dist folder not found, serving basic HTML');
        app.get('*', (req, res) => {
          res.send('<h1>Operabase Railway - Build Required</h1><p>Run npm run build first</p>');
        });
      }
    } else {
      // Desenvolvimento - usar Vite dev server
      try {
        const { setupVite } = await import('./vite');
        await setupVite(app);
        console.log('🔥 Development frontend with Vite hot reload');
      } catch (error) {
        console.warn('⚠️ Vite setup failed, serving basic HTML:', error);
        app.get('*', (req, res) => {
          res.send('<h1>Operabase Railway Development</h1><p>Vite setup failed</p>');
        });
      }
    }
    
    // Error handling middleware
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('❌ Server error:', err);
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });
    
    // Start server
    app.listen(PORT, () => {
      console.log('🚀 Operabase Railway Unified Server started successfully!');
      console.log(`📍 Server running on port ${PORT}`);
      console.log(`🌐 Frontend: ${process.env.NODE_ENV === 'production' ? 'Static files' : 'Vite dev server'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 API base: http://localhost:${PORT}/api`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
}); 