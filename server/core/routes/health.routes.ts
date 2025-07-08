import { Router, Request, Response } from 'express';
import { testSupabaseConnection } from '../config/database.config';

const router = Router();

/**
 * Health Check Endpoint
 * Refatorado de: railway-server.ts (linhas 138-173)
 * Módulo: Health Check Routes
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    console.log('🏥 Health check solicitado');
    
    const supabaseConnected = await testSupabaseConnection();
    
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        supabase: supabaseConnected ? 'connected' : 'disconnected',
        server: 'running'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0'
    };

    const statusCode = supabaseConnected ? 200 : 503;
    
    res.status(statusCode).json(healthData);
    
    console.log(`✅ Health check concluído - Status: ${statusCode}`);
  } catch (error) {
    console.error('❌ Erro no health check:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Internal server error'
    });
  }
});

/**
 * API Info Endpoint
 * Refatorado de: railway-server.ts (linhas 174-186)
 * Módulo: API Information
 */
router.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'Operabase API',
    version: '1.0.0',
    description: 'API para gerenciamento de clínicas médicas',
    endpoints: [
      'GET /health - Health check',
      'GET /api - API info',
      'GET /api/debug - Debug info',
      'GET /api/contacts - List contacts',
      'POST /api/contacts - Create contact',
      'GET /api/appointments - List appointments',
      'POST /api/appointments - Create appointment',
      'GET /api/auth/profile - User profile',
      'POST /api/auth/login - Login',
      'POST /api/auth/logout - Logout',
      'POST /api/audio/voice-message/:conversationId - Audio upload'
    ]
  });
});

/**
 * Debug Info Endpoint
 * Refatorado de: railway-server.ts (linhas 187-204)
 * Módulo: Debug Information
 */
router.get('/api/debug', (req: Request, res: Response) => {
  res.json({
    environment: {
      SUPABASE_URL: process.env.SUPABASE_URL?.substring(0, 30) + '...',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 30) + '...',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY?.substring(0, 30) + '...',
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT
    },
    lengths: {
      SUPABASE_URL: process.env.SUPABASE_URL?.length,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY?.length
    }
  });
});

export default router; 