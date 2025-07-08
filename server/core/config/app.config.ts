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

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS configuration - preservando lógica original
  app.use(cors({
    origin: isProduction 
      ? [process.env.FRONTEND_URL || 'https://operabase.railway.app']
      : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  return app;
}

/**
 * Configuração do servidor
 * Extraído de: railway-server.ts (linha 17)
 */
export const serverConfig = {
  port: process.env.PORT || 3000,
  isProduction: process.env.NODE_ENV === 'production'
};

/**
 * Log de inicialização
 * Extraído de: railway-server.ts (linhas 21-24)
 */
export function logServerConfig() {
  console.log('🚀 Iniciando Operabase Server...');
  console.log('📍 NODE_ENV:', process.env.NODE_ENV);
  console.log('📍 PORT:', serverConfig.port);
  console.log('📍 SUPABASE_URL:', process.env.SUPABASE_URL ? 'configurado' : 'não configurado');
  console.log('📍 SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configurado' : 'não configurado');
} 