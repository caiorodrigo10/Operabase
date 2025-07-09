import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Rate limiter específico para N8N
 * 30 requests por minuto por IP
 */
export const n8nRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 requests por minuto
  message: {
    success: false,
    error: 'Too many N8N requests',
    message: 'Rate limit exceeded. Try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Middleware para validar API Key do N8N
 */
export const validateN8NApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = process.env.N8N_API_KEY;
  
  if (!apiKey) {
    console.error('❌ N8N_API_KEY not configured in environment');
    return res.status(500).json({
      success: false,
      error: 'Server configuration error',
      message: 'N8N API key not configured'
    });
  }

  // Verificar diferentes headers de autenticação
  const providedKey = req.headers['x-api-key'] || 
                     req.headers['x-n8n-api-key'] ||
                     req.headers.authorization?.replace('Bearer ', '') ||
                     req.headers.authorization?.replace('ApiKey ', '');

  if (!providedKey) {
    console.log('❌ N8N API key missing in request headers');
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'API key required in X-API-Key, X-N8N-API-Key, or Authorization header'
    });
  }

  if (providedKey !== apiKey) {
    console.log('❌ N8N API key invalid');
    return res.status(401).json({
      success: false,
      error: 'Invalid API key',
      message: 'The provided API key is invalid'
    });
  }

  console.log('✅ N8N API key validated successfully');
  next();
};