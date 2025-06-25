import { Request, Response } from 'express';
import multer from 'multer';
import { IStorage } from '../storage';
import { ConversationUploadService } from '../services/conversation-upload.service';
import { SupabaseStorageService } from '../services/supabase-storage.service';
import { EvolutionAPIService } from '../services/evolution-api.service';
import { isAuthenticated } from '../auth';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow specific file types
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/mov', 'video/avi', 'video/webm',
      'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype}`));
    }
  }
});

export function setupUploadRoutes(app: any, storage: IStorage) {
  const supabaseStorage = new SupabaseStorageService();
  const evolutionAPI = new EvolutionAPIService();
  const uploadService = new ConversationUploadService(storage, supabaseStorage, evolutionAPI);

  // Upload de arquivo para conversa
  app.post('/api/conversations/:conversationId/upload', 
    isAuthenticated,
    upload.single('file'),
    async (req: Request, res: Response) => {
      try {
        const { conversationId } = req.params;
        const { caption, sendToWhatsApp = 'true' } = req.body;
        const user = (req as any).user;

        console.log(`📤 Upload request for conversation ${conversationId}`);

        // Validar arquivo
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'Nenhum arquivo enviado'
          });
        }

        // Validar conversa existe e usuário tem acesso
        const conversation = await storage.getConversationById(conversationId);
        if (!conversation) {
          return res.status(404).json({
            success: false,
            message: 'Conversa não encontrada'
          });
        }

        // Validar acesso à clínica
        if (conversation.clinic_id !== user.clinic_id && user.role !== 'super_admin') {
          return res.status(403).json({
            success: false,
            message: 'Acesso negado'
          });
        }

        // Processar upload
        const result = await uploadService.uploadFile({
          file: req.file.buffer,
          filename: req.file.originalname,
          mimeType: req.file.mimetype,
          conversationId,
          clinicId: conversation.clinic_id,
          userId: user.id,
          caption: caption || undefined,
          sendToWhatsApp: sendToWhatsApp === 'true'
        });

        console.log(`✅ Upload successful for ${req.file.originalname}`);

        res.json(result);

      } catch (error) {
        console.error('❌ Upload error:', error);
        
        let statusCode = 500;
        let message = 'Erro interno do servidor';

        if (error instanceof Error) {
          if (error.message.includes('muito grande')) {
            statusCode = 413;
            message = error.message;
          } else if (error.message.includes('não suportado')) {
            statusCode = 400;
            message = error.message;
          } else if (error.message.includes('não encontrada')) {
            statusCode = 404;
            message = error.message;
          } else {
            message = error.message;
          }
        }

        res.status(statusCode).json({
          success: false,
          message
        });
      }
    }
  );

  // Renovar URL assinada de anexo
  app.post('/api/attachments/:attachmentId/renew-url', 
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const { attachmentId } = req.params;
        const user = (req as any).user;

        console.log(`🔄 Renewing URL for attachment ${attachmentId}`);

        // Buscar anexo
        const attachment = await storage.getAttachmentById(Number(attachmentId));
        if (!attachment) {
          return res.status(404).json({
            success: false,
            message: 'Anexo não encontrado'
          });
        }

        // Validar acesso
        if (attachment.clinic_id !== user.clinic_id && user.role !== 'super_admin') {
          return res.status(403).json({
            success: false,
            message: 'Acesso negado'
          });
        }

        // Renovar URL
        const newSignedUrl = await supabaseStorage.createSignedUrl(attachment.storage_path, 24 * 60 * 60);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Atualizar no banco
        await storage.updateAttachment(Number(attachmentId), {
          signed_url: newSignedUrl,
          signed_url_expires: expiresAt
        });

        console.log(`✅ URL renewed for attachment ${attachmentId}`);

        res.json({
          success: true,
          signedUrl: newSignedUrl,
          expiresAt: expiresAt.toISOString()
        });

      } catch (error) {
        console.error('❌ URL renewal error:', error);
        res.status(500).json({
          success: false,
          message: 'Erro ao renovar URL'
        });
      }
    }
  );

  // Deletar anexo
  app.delete('/api/attachments/:attachmentId',
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const { attachmentId } = req.params;
        const user = (req as any).user;

        console.log(`🗑️ Deleting attachment ${attachmentId}`);

        // Buscar anexo
        const attachment = await storage.getAttachmentById(Number(attachmentId));
        if (!attachment) {
          return res.status(404).json({
            success: false,
            message: 'Anexo não encontrado'
          });
        }

        // Validar acesso
        if (attachment.clinic_id !== user.clinic_id && user.role !== 'super_admin') {
          return res.status(403).json({
            success: false,
            message: 'Acesso negado'
          });
        }

        // Deletar do storage
        if (attachment.storage_path) {
          await supabaseStorage.deleteFile(attachment.storage_path);
        }

        // Deletar do banco
        await storage.deleteAttachment(Number(attachmentId));

        console.log(`✅ Attachment ${attachmentId} deleted`);

        res.json({
          success: true,
          message: 'Anexo deletado com sucesso'
        });

      } catch (error) {
        console.error('❌ Attachment deletion error:', error);
        res.status(500).json({
          success: false,
          message: 'Erro ao deletar anexo'
        });
      }
    }
  );
}