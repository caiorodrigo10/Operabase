import { Request, Response, NextFunction } from 'express';

/**
 * Sanitizar valores de headers para evitar caracteres problemáticos
 */
function sanitizeHeaderValue(value: any): string {
  if (typeof value !== 'string') {
    return String(value || '');
  }
  
  // Remove caracteres de controle e normaliza
  return value
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove caracteres de controle
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim()
    .substring(0, 1000); // Limita tamanho
}

/**
 * Middleware para sanitizar headers do N8N
 */
export const sanitizeN8NHeaders = (req: Request, res: Response, next: NextFunction) => {
  const headersToSanitize = [
    'x-caption', 'x-filename', 'x-whatsapp-message-id',
    'x-whatsapp-media-id', 'x-whatsapp-media-url'
  ];
  
  headersToSanitize.forEach(headerName => {
    if (req.headers[headerName]) {
      const sanitized = sanitizeHeaderValue(req.headers[headerName]);
      req.headers[headerName] = sanitized;
    }
  });
  
  next();
};

/**
 * Middleware para validar requisição N8N
 */
export const validateN8NRequest = (req: Request, res: Response, next: NextFunction) => {
  const conversationId = req.headers['x-conversation-id'] || req.body.conversationId;
  const clinicId = req.headers['x-clinic-id'] || req.body.clinicId;
  
  if (!conversationId) {
    return res.status(400).json({
      success: false,
      error: 'Missing conversation ID',
      message: 'Header x-conversation-id or body.conversationId required'
    });
  }

  if (!clinicId || isNaN(parseInt(clinicId))) {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid clinic ID',
      message: 'Header x-clinic-id or body.clinicId required as number'
    });
  }

  next();
};

/**
 * Middleware para parsing de multipart/form-data específico para N8N
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