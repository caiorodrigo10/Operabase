import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de validação para requisições N8N
 * Valida se os parâmetros obrigatórios estão presentes
 */
export const validateN8NRequest = (req: Request, res: Response, next: NextFunction) => {
  // Verificar parâmetros obrigatórios
  const conversationId = req.headers['x-conversation-id'] || req.body?.conversationId;
  const clinicId = req.headers['x-clinic-id'] || req.body?.clinicId;
  
  if (!conversationId) {
    console.error('❌ Missing conversation ID in N8N request');
    return res.status(400).json({
      success: false,
      error: 'Missing conversation ID',
      message: 'Header x-conversation-id or body.conversationId required'
    });
  }

  if (!clinicId) {
    console.error('❌ Missing clinic ID in N8N request');
    return res.status(400).json({
      success: false,
      error: 'Missing clinic ID', 
      message: 'Header x-clinic-id or body.clinicId required'
    });
  }

  // Validar se clinic_id é um número válido
  const clinicIdNum = parseInt(clinicId.toString());
  if (isNaN(clinicIdNum) || clinicIdNum < 1) {
    console.error('❌ Invalid clinic ID:', clinicId);
    return res.status(400).json({
      success: false,
      error: 'Invalid clinic ID',
      message: 'Clinic ID must be a valid positive number'
    });
  }

  console.log('✅ N8N request parameters validated successfully');
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