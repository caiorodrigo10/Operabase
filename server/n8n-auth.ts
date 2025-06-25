import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de autenticação para endpoints do N8N
 * Verifica API key via header x-api-key ou Authorization Bearer
 */
export const authenticateN8N = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string || 
                 req.headers['authorization']?.replace('Bearer ', '');
  
  const expectedApiKey = process.env.N8N_API_KEY;
  
  if (!expectedApiKey) {
    console.error('🔑 N8N_API_KEY not configured in environment');
    return res.status(500).json({ 
      success: false,
      error: 'N8N integration not configured' 
    });
  }
  
  if (!apiKey) {
    console.warn('🔑 N8N API key missing in request headers');
    return res.status(401).json({ 
      success: false,
      error: 'API key required. Use x-api-key header or Authorization Bearer token.' 
    });
  }
  
  if (apiKey !== expectedApiKey) {
    console.warn('🔑 Invalid N8N API key attempt');
    return res.status(401).json({ 
      success: false,
      error: 'Invalid API key' 
    });
  }
  
  console.log('✅ N8N authentication successful');
  next();
};