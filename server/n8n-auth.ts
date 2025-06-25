import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de autenticação para N8N via API Key
 * Valida se a API key está presente e é válida
 */
export const validateN8NApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    console.error('❌ N8N API Key missing in request');
    return res.status(401).json({
      success: false,
      error: 'API Key required',
      message: 'Header x-api-key or Authorization Bearer token is required'
    });
  }

  // Validar contra API key configurada no ambiente
  const validApiKey = process.env.N8N_API_KEY;
  
  if (!validApiKey) {
    console.error('❌ N8N_API_KEY not configured in environment');
    return res.status(500).json({
      success: false,
      error: 'Server configuration error',
      message: 'N8N API Key not configured'
    });
  }

  if (apiKey !== validApiKey) {
    console.error('❌ Invalid N8N API Key provided');
    return res.status(401).json({
      success: false,
      error: 'Invalid API Key',
      message: 'The provided API Key is not valid'
    });
  }

  console.log('✅ N8N API Key validated successfully');
  next();
};

/**
 * Middleware para parsing de multipart/form-data específico para N8N
 * Extrai file, metadata e parâmetros da requisição
 */
export const parseN8NUpload = (req: any, res: Response, next: NextFunction) => {
  const contentType = req.headers['content-type'];
  
  if (!contentType?.includes('multipart/form-data') && !contentType?.includes('application/octet-stream')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid content type',
      message: 'Expected multipart/form-data or application/octet-stream'
    });
  }

  // Se for binary stream direto, usar req.body como buffer
  if (contentType.includes('application/octet-stream')) {
    req.n8nFile = {
      buffer: req.body,
      filename: req.headers['x-filename'] || 'unknown-file',
      mimeType: req.headers['x-mime-type'] || 'application/octet-stream'
    };
  }

  next();
};