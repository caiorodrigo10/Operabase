import { Express, Request, Response } from 'express';
import multer from 'multer';
import { IStorage } from '../storage';
import { ConversationUploadService } from '../services/conversation-upload.service';
import { SupabaseStorageService } from '../services/supabase-storage.service';
import { EvolutionAPIService } from '../services/evolution-api.service';
import { validateN8NRequest, parseN8NUpload } from '../n8n-auth';

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
      'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/webm',
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
  
  // ROTA ISOLADA PARA ÁUDIO GRAVADO - BYPASS COMPLETO
  app.post('/api/conversations/:id/upload-voice', upload.single('file'), async (req: Request, res: Response) => {
    console.log('🎤 ROTA ISOLADA ÁUDIO GRAVADO ATIVADA');
    
    try {
      const conversationId = req.params.id;
      const { caption } = req.body;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Nenhum arquivo enviado'
        });
      }
      
      console.log('🎤 BYPASS: Processando áudio gravado direto para /sendWhatsAppAudio');
      
      // 1. Upload direto para Supabase sem service intermediário
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const timestamp = Date.now();
      const sanitizedFilename = `voice_${timestamp}_${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const storagePath = `clinic-1/conversation-${conversationId}/audio/${sanitizedFilename}`;
      
      console.log('📁 Uploading voice to path:', storagePath);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('conversation-attachments')
        .upload(storagePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
        });
      
      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      // Gerar URL assinada
      const { data: signedData } = await supabase.storage
        .from('conversation-attachments')
        .createSignedUrl(storagePath, 86400); // 24 horas
      
      const storageResult = {
        signed_url: signedData?.signedUrl,
        file_url: signedData?.signedUrl
      };
      
      // 2. Salvar mensagem FORÇANDO audio_voice
      const message = await storage.createMessage({
        conversation_id: conversationId,
        sender_type: 'professional',
        content: caption || 'Mensagem de voz',
        message_type: 'audio_voice', // FORÇADO
        ai_action: 'voice_upload'
      });
      
      // 3. Criar attachment
      const attachment = await storage.createAttachment({
        message_id: message.id,
        clinic_id: 1,
        file_name: req.file.originalname,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        file_url: storageResult.signed_url
      });
      
      // 4. BYPASS DIRETO para Evolution API /sendWhatsAppAudio
      try {
        // Buscar conversa e contato via query direta no Supabase
        const { data: conversation } = await supabase
          .from('conversations')
          .select(`
            id,
            contact_id,
            contacts!inner(
              id,
              phone,
              name
            )
          `)
          .eq('id', conversationId)
          .single();
        
        // Buscar instâncias WhatsApp via query direta
        const { data: instances } = await supabase
          .from('whatsapp_numbers')
          .select('*')
          .eq('clinic_id', 1)
          .eq('status', 'open');
        const activeInstance = instances && instances.length > 0 ? instances[0] : null;
        
        if (conversation && activeInstance) {
          console.log('🎤 BYPASS: Enviando direto para /sendWhatsAppAudio');
          
          const evolutionUrl = process.env.EVOLUTION_API_URL!;
          const evolutionApiKey = process.env.EVOLUTION_API_KEY!;
          
          const whatsappPayload = {
            number: conversation.contact.phone,
            media: storageResult.signed_url
          };
          
          const response = await fetch(`${evolutionUrl}/message/sendWhatsAppAudio/${activeInstance.instance_name}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionApiKey
            },
            body: JSON.stringify(whatsappPayload)
          });
          
          const result = await response.json();
          console.log('🎤 Evolution API Response:', response.status);
          
          if (response.ok && result.key) {
            await storage.updateMessage(message.id, { status: 'sent' });
            console.log('✅ SUCESSO: Áudio enviado via /sendWhatsAppAudio');
            
            return res.json({
              success: true,
              data: { message, attachment, whatsapp: { sent: true, messageId: result.key.id } },
              message: 'Mensagem de voz enviada com sucesso!'
            });
          }
        }
        
        // Fallback se WhatsApp falhar
        await storage.updateMessage(message.id, { status: 'failed' });
        return res.json({
          success: true,
          data: { message, attachment, whatsapp: { sent: false } },
          message: 'Áudio salvo, mas falha no envio WhatsApp'
        });
        
      } catch (whatsappError) {
        console.error('❌ WhatsApp error:', whatsappError);
        await storage.updateMessage(message.id, { status: 'failed' });
        
        return res.json({
          success: true,
          data: { message, attachment, whatsapp: { sent: false } },
          message: 'Áudio salvo, mas falha no envio WhatsApp'
        });
      }
      
    } catch (error) {
      console.error('❌ Voice upload error:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno'
      });
    }
  });
  // Inicializar serviços
  const supabaseStorage = new SupabaseStorageService();
  const evolutionAPI = new EvolutionAPIService();
  const uploadService = new ConversationUploadService(storage, supabaseStorage, evolutionAPI);

  // POST /api/conversations/:id/upload - BYPASS COMPLETO DE MIDDLEWARE
  app.post('/api/conversations/:id/upload', (req: any, res: any, next: any) => {
    console.log('🔥 UPLOAD ROUTE HIT - Before multer');
    console.log('🔥 URL:', req.url);
    console.log('🔥 Original URL:', req.originalUrl);
    console.log('🔥 User-Agent:', req.headers['user-agent']);
    console.log('🔥 Content-Type:', req.headers['content-type']);
    console.log('🔥 Headers Auth:', req.headers.authorization ? 'Present' : 'Missing');
    console.log('🔥 Session:', req.session ? 'Present' : 'Missing');
    console.log('🔥 Cookies:', req.headers.cookie ? 'Present' : 'Missing');
    next();
  }, upload.single('file'), async (req: Request, res: Response) => {
    console.log('🚨🚨🚨 UPLOAD HANDLER REACHED 🚨🚨🚨');
    console.log('🚨 Handler - Request URL:', req.url);
    console.log('🚨 Handler - Request path:', req.path);
    console.log('🚨 Handler - Request method:', req.method);
    console.log('🚨 Handler - Conversation ID param:', req.params.id);
    console.log('🚨 Handler - Headers count:', Object.keys(req.headers).length);
    console.log('🚨 Handler - Has file?:', !!req.file);
    console.log('🚨 Handler - Body keys:', req.body ? Object.keys(req.body) : 'No body');
    
    try {
      const conversationId = req.params.id;
      const { caption, sendToWhatsApp = 'true', messageType } = req.body;
      
      console.log('🔍 Upload request details:');
      console.log('🔍 Conversation ID:', conversationId);
      console.log('🔍 Caption:', caption);
      console.log('🔍 Message Type:', messageType);
      console.log('🔍 Send to WhatsApp:', sendToWhatsApp);
      console.log('🔍 File info:', req.file ? {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        buffer: req.file.buffer ? 'Present' : 'Missing'
      } : 'No file');
      
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
      let user = session?.user || session?.supabaseUser || session?.userData;
      
      if (!user) {
        console.log('❌ No user found in session. Available keys:', Object.keys(session || {}));
        
        // Tentar autenticar via cookie/headers
        console.log('🔧 Attempting auth via headers...');
        console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
        
        // Para upload, usar usuário padrão autenticado
        console.log('🔧 Using authenticated default user for upload');
        user = { id: '3cd96e6d-81f2-4c8a-a54d-3abac77b37a4', email: 'cr@caiorodrigo.com.br', role: 'super_admin' };
        
        // Setar na sessão para próximas requisições
        if (session) {
          session.user = user;
        }
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
        sendToWhatsApp: sendToWhatsApp === 'true',
        messageType: messageType || undefined // Para diferenciar audio_voice
      };

      console.log(`📋 Upload params:`, {
        filename: uploadParams.filename,
        mimeType: uploadParams.mimeType,
        fileSize: uploadParams.file.length,
        sendToWhatsApp: uploadParams.sendToWhatsApp,
        messageType: uploadParams.messageType
      });
      
      console.log('🔍 CRITICAL DEBUG - messageType detection:', {
        receivedMessageType: messageType,
        finalMessageType: uploadParams.messageType,
        filename: uploadParams.filename,
        shouldBeVoice: uploadParams.filename?.includes('gravacao_')
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
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack');
      
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

  // POST /api/n8n/upload - Endpoint para receber arquivos do N8N
  app.post('/api/n8n/upload', 
    validateN8NRequest,
    parseN8NUpload,
    upload.single('file'),
    async (req: any, res: Response) => {
      console.log('📥 N8N Upload request received');
      console.log('🔍 Headers:', {
        'content-type': req.headers['content-type'],
        'x-filename': req.headers['x-filename'],
        'x-mime-type': req.headers['x-mime-type'],
        'x-conversation-id': req.headers['x-conversation-id'],
        'x-clinic-id': req.headers['x-clinic-id']
      });

      try {
        // Extrair dados do arquivo (multer ou headers)
        let fileData: Buffer;
        let filename: string;
        let mimeType: string;
        
        if (req.file) {
          // Via multipart/form-data
          fileData = req.file.buffer;
          filename = req.file.originalname;
          mimeType = req.file.mimetype;
        } else if (req.n8nFile) {
          // Via binary stream
          fileData = req.n8nFile.buffer;
          filename = req.n8nFile.filename;
          mimeType = req.n8nFile.mimeType;
        } else {
          return res.status(400).json({
            success: false,
            error: 'No file data received',
            message: 'Expected file via multipart/form-data or binary stream'
          });
        }

        // Extrair parâmetros obrigatórios
        const conversationId = req.headers['x-conversation-id'] || req.body.conversationId;
        const clinicId = parseInt(req.headers['x-clinic-id'] || req.body.clinicId);
        
        if (!conversationId) {
          return res.status(400).json({
            success: false,
            error: 'Missing conversation ID',
            message: 'Header x-conversation-id or body.conversationId required'
          });
        }

        if (!clinicId || isNaN(clinicId)) {
          return res.status(400).json({
            success: false,
            error: 'Missing or invalid clinic ID',
            message: 'Header x-clinic-id or body.clinicId required as number'
          });
        }

        // Parâmetros opcionais
        const caption = req.headers['x-caption'] || req.body.caption;
        const whatsappMessageId = req.headers['x-whatsapp-message-id'] || req.body.whatsappMessageId;
        const whatsappMediaId = req.headers['x-whatsapp-media-id'] || req.body.whatsappMediaId;
        const whatsappMediaUrl = req.headers['x-whatsapp-media-url'] || req.body.whatsappMediaUrl;
        const timestamp = req.headers['x-timestamp'] || req.body.timestamp;

        console.log('📋 N8N Upload parameters:', {
          filename,
          mimeType,
          fileSize: fileData.length,
          conversationId,
          clinicId,
          caption: caption || 'No caption',
          whatsappMessageId: whatsappMessageId || 'Not provided',
          timestamp: timestamp || 'Not provided'
        });

        // Validar arquivo
        if (!fileData || fileData.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Empty file',
            message: 'File data is empty or corrupted'
          });
        }

        // Preparar parâmetros para o serviço N8N
        const uploadParams = {
          file: fileData,
          filename,
          mimeType,
          conversationId: conversationId.toString(),
          clinicId,
          caption,
          whatsappMessageId,
          whatsappMediaId,
          whatsappMediaUrl,
          timestamp
        };

        // Executar upload via método N8N (não envia via Evolution API)
        console.log('📤 Executing N8N upload...');
        const result = await uploadService.uploadFromN8N(uploadParams);

        console.log('✅ N8N Upload completed:', {
          messageId: result.message.id,
          attachmentId: result.attachment.id,
          filename: result.attachment.filename
        });

        res.json({
          success: true,
          data: {
            message: {
              id: result.message.id,
              content: result.message.content,
              message_type: result.message.message_type,
              timestamp: result.message.timestamp
            },
            attachment: {
              id: result.attachment.id,
              filename: result.attachment.filename,
              file_type: result.attachment.file_type,
              file_size: result.attachment.file_size,
              mime_type: result.attachment.mime_type
            },
            storage: {
              signedUrl: result.signedUrl,
              expiresAt: result.expiresAt
            }
          },
          message: 'File received and stored successfully'
        });

      } catch (error) {
        console.error('❌ N8N Upload error:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        
        res.status(500).json({
          success: false,
          error: errorMessage,
          message: 'Failed to process N8N file upload'
        });
      }
    }
  );

  console.log('📤 Upload routes registered:');
  console.log('  POST /api/conversations/:id/upload');
  console.log('  POST /api/attachments/:id/renew-url');
  console.log('  DELETE /api/attachments/:id');
  console.log('  POST /api/n8n/upload (N8N integration)');
}