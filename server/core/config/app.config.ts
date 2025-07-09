const express = require('express');
const cors = require('cors');

/**
 * Configuração básica do Express
 * Refatorado de: railway-server.ts (linhas 8-17)
 * Módulo: Core Application Configuration
 */
export function createExpressApp() {
  const app = express();
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Configuração de portas customizáveis
  const frontendPort = process.env.FRONTEND_PORT || process.env.VITE_PORT || '5173';
  const backendPort = process.env.BACKEND_PORT || process.env.PORT || '3000';

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS configuration - suporte a portas dinâmicas
  const allowedOrigins = isProduction 
    ? [process.env.FRONTEND_URL || 'https://operabase.railway.app']
    : [
        `http://localhost:${frontendPort}`,
        `http://localhost:${backendPort}`,
        'http://localhost:3000', // fallback
        'http://localhost:5173', // fallback
        'http://localhost:4000', // porta alternativa comum
        'http://localhost:8080', // porta alternativa comum
      ];

  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  console.log(`🌐 CORS configurado para origens: ${allowedOrigins.join(', ')}`);

  return app;
}

/**
 * Configuração do servidor
 * Extraído de: railway-server.ts (linha 17)
 */
export const serverConfig = {
  port: process.env.BACKEND_PORT || process.env.PORT || 3000,
  isProduction: process.env.NODE_ENV === 'production'
};

/**
 * Log de inicialização
 * Extraído de: railway-server.ts (linhas 21-24)
 */
export function logServerConfig() {
  console.log('🚀 Iniciando Operabase Server...');
  console.log('📍 NODE_ENV:', process.env.NODE_ENV);
  console.log('📍 BACKEND_PORT:', serverConfig.port);
  console.log('📍 FRONTEND_PORT:', process.env.FRONTEND_PORT || process.env.VITE_PORT || '5173');
  console.log('📍 SUPABASE_URL:', process.env.SUPABASE_URL ? 'configurado' : 'não configurado');
  console.log('📍 SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configurado' : 'não configurado');
} 