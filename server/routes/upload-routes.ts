/**
 * FASE 2: Upload Routes para Supabase Storage
 * Endpoints para upload de arquivos em conversas
 */

import { Request, Response } from 'express';
import multer from 'multer';
import { SupabaseStorageService } from '../services/supabase-storage.service';
import { IStorage } from '../storage';
import { isAuthenticated } from '../auth';
import { createClient } from '@supabase/supabase-js';

// Configurar multer para upload em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    // Validação básica de tipo será feita no service
    cb(null, true);
  }
});

// Helper function para determinar tipo de mensagem
function getMessageType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document';
}

export function setupUploadRoutes(app: any, storage: IStorage) {
  const storageService = new SupabaseStorageService();

  /**
   * Upload de arquivo para conversa específica
   */
  app.post('/api/conversations-simple/:id/upload', 
    isAuthenticated, 
    upload.single('file'), 
    async (req: Request, res: Response) => {
      try {
        const conversationId = req.params.id;
        const file = req.file;
        const clinicId = 1; // Hardcoded for testing
        
        if (!file) {
          return res.status(400).json({
            success: false,
            error: 'Nenhum arquivo enviado'
          });
        }

        console.log('📤 Processando upload:', {
          conversationId,
          fileName: file.originalname,
          size: file.size,
          mimeType: file.mimetype
        });

        // Validar tipo MIME
        if (!storageService.validateMimeType(file.mimetype)) {
          return res.status(400).json({
            success: false,
            error: 'Tipo de arquivo não permitido'
          });
        }

        // Validar tamanho
        if (!storageService.validateFileSize(file.size)) {
          return res.status(400).json({
            success: false,
            error: 'Arquivo muito grande (máximo 50MB)'
          });
        }

        // Verificar se conversa existe
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select('id, clinic_id, contact_id')
          .eq('id', conversationId)
          .single();

        if (convError || !conversation) {
          return res.status(404).json({
            success: false,
            error: 'Conversa não encontrada'
          });
        }

        // 1. Criar mensagem para o arquivo
        const { data: message, error: messageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_type: 'professional',
            sender_name: req.user?.name || 'Sistema',
            content: `Arquivo enviado: ${file.originalname}`,
            message_type: getMessageType(file.mimetype),
            direction: 'outbound',
            device_type: 'system',
            evolution_status: 'sent' // Arquivos não passam pela Evolution API
          })
          .select()
          .single();

        if (messageError) {
          console.error('❌ Erro ao criar mensagem:', messageError);
          return res.status(500).json({
            success: false,
            error: 'Erro ao criar mensagem'
          });
        }

        // 2. Upload para Supabase Storage
        const uploadResult = await storageService.uploadFile(file, {
          conversationId,
          clinicId,
          messageId: message.id,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size
        });

        // 3. Criar attachment record
        const { data: attachment, error: attachmentError } = await supabase
          .from('message_attachments')
          .insert({
            message_id: message.id,
            clinic_id: clinicId,
            file_name: file.originalname,
            file_type: file.mimetype,
            file_size: file.size,
            storage_bucket: 'conversation-attachments',
            storage_path: uploadResult.storage_path,
            signed_url: uploadResult.signed_url,
            signed_url_expires: uploadResult.expires_at.toISOString()
          })
          .select()
          .single();

        if (attachmentError) {
          console.error('❌ Erro ao criar attachment:', attachmentError);
          // Cleanup: deletar arquivo do storage se falhou
          await storageService.deleteFile(uploadResult.storage_path);
          return res.status(500).json({
            success: false,
            error: 'Erro ao registrar anexo'
          });
        }

        console.log('✅ Upload concluído com sucesso:', {
          messageId: message.id,
          attachmentId: attachment.id,
          storagePath: uploadResult.storage_path
        });

        // 4. Retornar resposta com mensagem e anexo
        res.json({
          success: true,
          message: {
            ...message,
            attachments: [attachment]
          },
          attachment
        });

      } catch (error) {
        console.error('❌ Erro no upload:', error);
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    }
  );

  /**
   * Renovar URL assinada de arquivo
   */
  app.post('/api/attachments/:id/renew-url', 
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const attachmentId = req.params.id;

        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Buscar attachment
        const { data: attachment, error } = await supabase
          .from('message_attachments')
          .select('*')
          .eq('id', attachmentId)
          .single();

        if (error || !attachment) {
          return res.status(404).json({
            success: false,
            error: 'Anexo não encontrado'
          });
        }

        // Gerar nova URL assinada
        const { signed_url, expires_at } = await storageService.generateSignedUrl(
          attachment.storage_path
        );

        // Atualizar no banco
        const { error: updateError } = await supabase
          .from('message_attachments')
          .update({
            signed_url,
            signed_url_expires: expires_at.toISOString()
          })
          .eq('id', attachmentId);

        if (updateError) {
          console.error('❌ Erro ao atualizar URL:', updateError);
          return res.status(500).json({
            success: false,
            error: 'Erro ao renovar URL'
          });
        }

        res.json({
          success: true,
          signed_url,
          expires_at
        });

      } catch (error) {
        console.error('❌ Erro ao renovar URL:', error);
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    }
  );

  /**
   * Deletar arquivo
   */
  app.delete('/api/attachments/:id', 
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const attachmentId = req.params.id;

        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Buscar attachment
        const { data: attachment, error } = await supabase
          .from('message_attachments')
          .select('*')
          .eq('id', attachmentId)
          .single();

        if (error || !attachment) {
          return res.status(404).json({
            success: false,
            error: 'Anexo não encontrado'
          });
        }

        // Deletar do storage se tem storage_path
        if (attachment.storage_path) {
          await storageService.deleteFile(attachment.storage_path);
        }

        // Deletar registro do banco
        const { error: deleteError } = await supabase
          .from('message_attachments')
          .delete()
          .eq('id', attachmentId);

        if (deleteError) {
          console.error('❌ Erro ao deletar anexo:', deleteError);
          return res.status(500).json({
            success: false,
            error: 'Erro ao deletar anexo'
          });
        }

        res.json({
          success: true,
          message: 'Anexo deletado com sucesso'
        });

      } catch (error) {
        console.error('❌ Erro ao deletar anexo:', error);
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    }
  );
}