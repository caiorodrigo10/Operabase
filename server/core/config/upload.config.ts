import multer from 'multer';

/**
 * Configuração do Multer para upload de arquivos
 * Refatorado de: railway-server.ts (linhas 47-53)
 * Módulo: File Upload Configuration
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB máximo
  }
});

/**
 * Configurações de upload
 */
export const uploadConfig = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: [
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/webm',
    'audio/ogg'
  ]
}; 