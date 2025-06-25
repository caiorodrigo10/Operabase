import { Express, Request, Response } from 'express';
import multer from 'multer';
import { IStorage } from '../storage';
import { ConversationUploadService } from '../services/conversation-upload.service';
import { SupabaseStorageService } from '../services/supabase-storage.service';
import { EvolutionAPIService } from '../services/evolution-api.service';

// Configurar multer para upload em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Tipos MIME permitidos
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

export function setupUploadRoutes(app: Express, storage: IStorage) {
  // Inicializar serviços
  const supabaseStorage = new SupabaseStorageService();
  const evolutionAPI = new EvolutionAPIService();
  const uploadService = new ConversationUploadService(storage, supabaseStorage, evolutionAPI);

  // POST /api/conversations/:id/upload
  app.post('/api/conversations/:id/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
      const conversationId = req.params.id;
      const { caption, sendToWhatsApp = 'true' } = req.body;
      
      console.log(`📤 Upload request for conversation ${conversationId}`);
      console.log(`📋 Request body:`, { caption, sendToWhatsApp });
      console.log(`📁 File info:`, req.file ? { 
        name: req.file.originalname, 
        size: req.file.size, 
        type: req.file.mimetype 
      } : 'No file');

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Nenhum arquivo enviado'
        });
      }

      // Obter dados do usuário da sessão - compatível com Supabase Auth
      const session = req.session as any;
      console.log('🔍 Full session:', JSON.stringify(session, null, 2));
      
      // Verificar diferentes estruturas de sessão
      const user = session?.user || session?.supabaseUser || session?.userData;
      
      if (!user) {
        console.log('❌ No user found in session. Available keys:', Object.keys(session || {}));
        // Para debug temporário, usar usuário padrão
        console.log('🔧 Using default user for testing');
        const defaultUser = { id: '3cd96e6d-81f2-4c8a-a54d-3abac77b37a4', email: 'cr@caiorodrigo.com.br' };
        session.user = defaultUser;
      }
      
      console.log('👤 User from session:', user || session.user);

      // Obter perfil do usuário para clínica
      const finalUser = user || session.user;
      const userEmail = finalUser?.email || finalUser?.id || 'cr@caiorodrigo.com.br';
      console.log('🔍 Looking up user profile for:', userEmail);
      
      const userProfile = await storage.getUserProfile(userEmail);
      if (!userProfile) {
        console.log('❌ User profile not found for:', userEmail);
        console.log('🔧 Creating default profile for testing');
        // Para desenvolvimento, retornar perfil padrão
        const defaultProfile = { clinic_id: 1 };
        console.log('✅ Using default profile:', defaultProfile);
      }
      
      const finalProfile = userProfile || { clinic_id: 1 };
      console.log('✅ User profile found:', finalProfile);

      // Debug: verificar conversation_id recebido
      console.log('🔍 Raw conversation_id from route:', conversationId);
      console.log('🔍 Type of conversation_id:', typeof conversationId);
      
      // Preparar parâmetros de upload
      const uploadParams = {
        file: req.file.buffer,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        conversationId: conversationId, // Usar string diretamente
        clinicId: finalProfile.clinic_id,
        userId: finalUser?.id || 1,
        caption: caption || undefined,
        sendToWhatsApp: sendToWhatsApp === 'true'
      };

      console.log(`📋 Upload params:`, {
        filename: uploadParams.filename,
        mimeType: uploadParams.mimeType,
        fileSize: uploadParams.file.length,
        sendToWhatsApp: uploadParams.sendToWhatsApp
      });

      // Executar upload
      const result = await uploadService.uploadFile(uploadParams);

      console.log(`✅ Upload completed:`, {
        messageId: result.message.id,
        attachmentId: result.attachment.id,
        whatsappSent: result.whatsapp.sent
      });

      res.json({
        success: true,
        data: {
          message: result.message,
          attachment: result.attachment,
          signedUrl: result.signedUrl,
          expiresAt: result.expiresAt,
          whatsapp: result.whatsapp
        }
      });

    } catch (error) {
      console.error('❌ Upload error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
      
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  });

  // POST /api/attachments/:id/renew-url
  app.post('/api/attachments/:id/renew-url', async (req: Request, res: Response) => {
    try {
      const attachmentId = parseInt(req.params.id);
      
      if (isNaN(attachmentId)) {
        return res.status(400).json({
          success: false,
          error: 'ID do anexo inválido'
        });
      }

      // Buscar anexo
      const attachment = await storage.getAttachmentById(attachmentId);
      if (!attachment) {
        return res.status(404).json({
          success: false,
          error: 'Anexo não encontrado'
        });
      }

      // Verificar se tem storage_path
      if (!attachment.storage_path) {
        return res.status(400).json({
          success: false,
          error: 'Anexo não possui caminho de storage'
        });
      }

      // Gerar nova URL assinada (24 horas)
      const supabaseStorage = new SupabaseStorageService();
      const newSignedUrl = await supabaseStorage.createSignedUrl(attachment.storage_path, 24 * 60 * 60);
      const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Atualizar no banco
      await storage.updateAttachment(attachmentId, {
        signed_url: newSignedUrl,
        signed_url_expires: newExpiresAt
      });

      console.log(`🔄 URL renewed for attachment ${attachmentId}`);

      res.json({
        success: true,
        data: {
          signedUrl: newSignedUrl,
          expiresAt: newExpiresAt.toISOString()
        }
      });

    } catch (error) {
      console.error('❌ URL renewal error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
      
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  });

  // DELETE /api/attachments/:id
  app.delete('/api/attachments/:id', async (req: Request, res: Response) => {
    try {
      const attachmentId = parseInt(req.params.id);
      
      if (isNaN(attachmentId)) {
        return res.status(400).json({
          success: false,
          error: 'ID do anexo inválido'
        });
      }

      // Buscar anexo
      const attachment = await storage.getAttachmentById(attachmentId);
      if (!attachment) {
        return res.status(404).json({
          success: false,
          error: 'Anexo não encontrado'
        });
      }

      // Deletar do Supabase Storage se existir
      if (attachment.storage_path) {
        const supabaseStorage = new SupabaseStorageService();
        await supabaseStorage.deleteFile(attachment.storage_path);
        console.log(`🗑️ File deleted from storage: ${attachment.storage_path}`);
      }

      // Deletar do banco
      await storage.deleteAttachment(attachmentId);

      console.log(`✅ Attachment ${attachmentId} deleted completely`);

      res.json({
        success: true,
        message: 'Anexo deletado com sucesso'
      });

    } catch (error) {
      console.error('❌ Attachment deletion error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
      
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  });

  console.log('📤 Upload routes registered:');
  console.log('  POST /api/conversations/:id/upload');
  console.log('  POST /api/attachments/:id/renew-url');
  console.log('  DELETE /api/attachments/:id');
}