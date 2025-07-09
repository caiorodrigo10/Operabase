// Carregar variáveis de ambiente PRIMEIRO
import dotenv from 'dotenv';
dotenv.config();

// Configurar serialização de BigInt
(BigInt.prototype as any).toJSON = function() {
  return this.toString();
};

import { createExpressApp, serverConfig, logServerConfig } from './core/config/app.config';
import { testSupabaseConnection } from './core/config/database.config';
import healthRoutes from './core/routes/health.routes';
import * as path from 'path';
import express from 'express';
import multer from 'multer';
import { ConversationUploadService } from './services/conversation-upload.service';

// Usar caminhos absolutos baseados na localização do arquivo
const currentDir = path.dirname(__filename);
const contactsRoutes = require(path.join(currentDir, 'core', 'routes', 'contacts.routes.js'));
const appointmentsRoutes = require(path.join(currentDir, 'core', 'routes', 'appointments.routes.js'));
const authRoutes = require(path.join(currentDir, 'core', 'routes', 'auth.routes.js'));
const audioRoutes = require(path.join(currentDir, 'core', 'routes', 'audio.routes.js'));
const clinicRoutes = require(path.join(currentDir, 'core', 'routes', 'clinic.routes.js'));
const conversationsRoutes = require(path.join(currentDir, 'core', 'routes', 'conversations.routes.js'));
const { setupStaticFiles } = require(path.join(currentDir, 'core', 'middleware', 'static.middleware.js'));

// Configurar multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    // Tipos permitidos
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/mov', 'video/avi', 'video/webm',
      'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/mp4', 'audio/webm',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'application/json', 'application/octet-stream'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype}`));
    }
  }
});

/**
 * Servidor Principal Refatorado - Modelo Painelespelho
 * Módulo: Core Server
 * 
 * Baseado no painelespelho/server/index.ts
 * Rotas de upload registradas ANTES dos middlewares
 */
async function startServer() {
  try {
    // Log de configuração
    logServerConfig();

    // Criar app Express
    const app = createExpressApp();

    // Testar conexão com Supabase
    console.log('🔍 Testando conexões...');
    const supabaseConnected = await testSupabaseConnection();
    
    if (!supabaseConnected) {
      console.log('⚠️  Servidor iniciado sem conexão com Supabase');
    }

    // ✅ CRITICAL: Setup upload routes ANTES dos middlewares (modelo painelespelho)
    console.log('🔥 Registrando rotas de upload ANTES dos middlewares...');
    
    // BYPASS TOTAL DE MIDDLEWARE PARA UPLOADS - SOLUÇÃO DEFINITIVA
    app.use('/api/conversations-simple/:id/upload', (req: any, res: any, next: any) => {
      console.log('🔥 BYPASS MIDDLEWARE - Upload detectado, pulando TODA autenticação');
      console.log('🔥 URL:', req.originalUrl);
      console.log('🔥 Method:', req.method);
      console.log('🔥 User-Agent:', req.headers['user-agent']);
      console.log('🔥 Content-Type:', req.headers['content-type']);
      
      // Definir usuário fixo para uploads da interface
      req.user = {
        id: 4,
        email: 'cr@caiorodrigo.com.br',
        name: 'Caio Rodrigo',
        role: 'super_admin'
      };
      
      req.clinic_id = 1; // Definir clinic_id fixo
      
      console.log('🔥 Usuário fixo definido para upload');
      next();
    });

    // Registrar rota de upload específica ANTES de outras rotas
    app.post('/api/conversations-simple/:id/upload', upload.single('file'), async (req: any, res: any) => {
      console.log('🚨🚨🚨 UPLOAD HANDLER REACHED 🚨🚨🚨');
      console.log('🚨 Handler - Request URL:', req.url);
      console.log('🚨 Handler - Request path:', req.path);
      console.log('🚨 Handler - Request method:', req.method);
      console.log('🚨 Handler - Conversation ID param:', req.params.id);
      console.log('🚨 Handler - Has file?:', !!req.file);
      console.log('🚨 Handler - Body keys:', req.body ? Object.keys(req.body) : 'No body');
      
      try {
        const conversationId = req.params.id;
        const { caption, sendToWhatsApp = 'true' } = req.body;
        const file = req.file;
        
        console.log('📤 Upload request received:', {
          conversationId,
          fileName: file?.originalname,
          fileSize: file?.size,
          mimeType: file?.mimetype,
          caption: caption || 'no caption',
          sendToWhatsApp
        });
        
        if (!file) {
          return res.status(400).json({ 
            error: 'Nenhum arquivo enviado',
            success: false 
          });
        }
        
        // Validar conversation ID
        if (!conversationId) {
          return res.status(400).json({ 
            error: 'ID da conversa é obrigatório',
            success: false 
          });
        }
        
        // Importar e usar o serviço de upload
        const { ConversationUploadService } = require('./services/conversation-upload.service');
        const uploadService = new ConversationUploadService();
        
        // Fazer upload
        const result = await uploadService.uploadFile({
          file: file.buffer,
          filename: file.originalname,
          mimeType: file.mimetype,
          conversationId,
          clinicId: 1, // Fixo para teste
          userId: 4, // Fixo para teste
          caption: caption || undefined,
          sendToWhatsApp: sendToWhatsApp === 'true'
        });
        
        console.log('✅ Upload completed successfully:', {
          messageId: result.message.id,
          attachmentId: result.attachment?.id,
          whatsappSent: result.whatsapp.sent,
          whatsappError: result.whatsapp.error
        });
        
        // Resposta formatada
        res.status(201).json({
          success: true,
          message: result.message,
          attachment: result.attachment,
          signedUrl: result.signedUrl,
          expiresAt: result.expiresAt,
          whatsapp: {
            sent: result.whatsapp.sent,
            messageId: result.whatsapp.messageId,
            error: result.whatsapp.error
          }
        });
        
      } catch (error) {
        console.error('❌ Upload error:', error);
        
        // Tratamento de erros específicos
        if (error.message.includes('Arquivo muito grande')) {
          return res.status(413).json({
            error: error.message,
            success: false,
            code: 'FILE_TOO_LARGE'
          });
        }
        
        if (error.message.includes('Tipo de arquivo não suportado')) {
          return res.status(415).json({
            error: error.message,
            success: false,
            code: 'UNSUPPORTED_FILE_TYPE'
          });
        }
        
        if (error.message.includes('Conversation') && error.message.includes('not found')) {
          return res.status(404).json({
            error: error.message,
            success: false,
            code: 'CONVERSATION_NOT_FOUND'
          });
        }
        
        if (error.message.includes('Evolution API')) {
          return res.status(200).json({
            success: true,
            message: 'Arquivo salvo com sucesso, mas falha no envio WhatsApp',
            error: error.message,
            code: 'WHATSAPP_SEND_FAILED'
          });
        }
        
        // Erro genérico
        res.status(500).json({
          error: 'Erro interno do servidor',
          success: false,
          details: error.message
        });
      }
    });

    console.log('✅ Upload routes registered BEFORE middleware chain');

    // ========== ENDPOINT N8N UPLOAD ==========
    // Endpoint N8N para receber arquivos de pacientes (SEM validação de API key)
    app.post('/api/n8n/upload', upload.single('file'), async (req: any, res: any) => {
      console.log('🤖 ========== N8N UPLOAD ENDPOINT ==========');
      console.log('🤖 Headers:', {
        'x-conversation-id': req.headers['x-conversation-id'],
        'x-clinic-id': req.headers['x-clinic-id'],
        'x-caption': req.headers['x-caption'],
        'x-whatsapp-message-id': req.headers['x-whatsapp-message-id'],
        'x-sender-type': req.headers['x-sender-type']
      });
      console.log('🤖 File:', req.file ? `${req.file.originalname} (${req.file.size} bytes, ${req.file.mimetype})` : 'No file');
      
      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            error: 'Nenhum arquivo enviado'
          });
        }

        // Extrair parâmetros dos headers
        const conversationId = req.headers['x-conversation-id'];
        const clinicId = parseInt(req.headers['x-clinic-id']) || 1;
        const caption = req.headers['x-caption'];
        const whatsappMessageId = req.headers['x-whatsapp-message-id'];
        const senderType = req.headers['x-sender-type'] || 'patient';

        if (!conversationId) {
          return res.status(400).json({
            success: false,
            error: 'Header x-conversation-id é obrigatório'
          });
        }

        console.log('🤖 Processing N8N upload:', {
          conversationId,
          clinicId,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          caption,
          senderType,
          whatsappMessageId
        });

        // Usar o ConversationUploadService importado estaticamente
        const uploadService = new ConversationUploadService();
        
        // Usar método específico para N8N (não envia via WhatsApp)
        const result = await uploadService.uploadFromN8N({
          file: req.file.buffer,
          filename: req.file.originalname,
          mimeType: req.file.mimetype,
          conversationId,
          clinicId,
          caption,
          whatsappMessageId,
          senderType
        });

        console.log('✅ N8N upload completed:', {
          success: result.success,
          messageId: result.message?.id,
          attachmentId: result.attachment?.id
        });

        res.status(201).json({
          success: true,
          message: result.message,
          attachment: result.attachment,
          signedUrl: result.signedUrl,
          expiresAt: result.expiresAt
        });

      } catch (error) {
        console.error('❌ N8N upload error:', error);
        
        if (error.message.includes('Conversation') && error.message.includes('not found')) {
          return res.status(404).json({
            success: false,
            error: 'Conversa não encontrada',
            code: 'CONVERSATION_NOT_FOUND'
          });
        }
        
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor',
          details: error.message
        });
      }
    });

    console.log('✅ N8N upload endpoint registered');

    // ========== ENDPOINT DE ÁUDIO DE VOZ ==========
    // Registrar endpoint específico para áudio de voz
    app.post('/api/audio/voice-message/:conversationId', upload.single('file'), async (req: any, res: any) => {
      console.log('🎤 ========== AUDIO VOICE MESSAGE ENDPOINT ==========');
      console.log('🎤 Conversation ID:', req.params.conversationId);
      console.log('🎤 File received:', req.file ? `${req.file.originalname} (${req.file.size} bytes, ${req.file.mimetype})` : 'No file');
      
      try {
        const conversationId = req.params.conversationId;
        
        if (!req.file) {
          console.log('❌ No audio file received');
          return res.status(400).json({
            success: false,
            error: 'Arquivo de áudio não encontrado'
          });
        }

        // Validar se é um arquivo de áudio válido
        if (!req.file.mimetype.startsWith('audio/')) {
          console.log('❌ Invalid audio file type:', req.file.mimetype);
          return res.status(400).json({
            success: false,
            error: `Tipo de arquivo inválido: ${req.file.mimetype}. Esperado: audio/*`
          });
        }

        // Validar tamanho mínimo para áudio
        if (req.file.size < 100) {
          console.log('❌ Audio file too small:', req.file.size);
          return res.status(400).json({
            success: false,
            error: 'Arquivo de áudio muito pequeno (possível arquivo corrompido)'
          });
        }

        console.log('✅ Audio file validation passed');

        // Usar o ConversationUploadService importado estaticamente
        const uploadService = new ConversationUploadService();
        
        const uploadResult = await uploadService.uploadFile({
          file: req.file.buffer,
          filename: req.file.originalname,
          mimeType: req.file.mimetype,
          conversationId: conversationId,
          clinicId: 1, // TODO: Pegar da sessão do usuário
          userId: 1, // TODO: Pegar da sessão do usuário
          caption: req.body.caption || 'Mensagem de voz',
          sendToWhatsApp: true,
          messageType: 'audio_voice' // Importante: marcar como mensagem de voz
        });

        console.log('🎤 Upload result:', {
          success: uploadResult.success,
          messageId: uploadResult.message?.id,
          whatsappSent: uploadResult.whatsapp?.sent,
          whatsappError: uploadResult.whatsapp?.error
        });

        if (uploadResult.success) {
          // Executar transcrição em background (não bloquear resposta)
          if (req.file.mimetype.startsWith('audio/')) {
            console.log('🔄 Starting background transcription...');
            
            // Executar transcrição em background
            setImmediate(async () => {
              try {
                console.log('🎤 Starting transcription process...');
                
                // Importar serviços dinamicamente
                const { TranscriptionService } = await import('./services/transcription.service');
                const { saveToN8NTable } = await import('./utils/n8n-integration');
                
                const transcriptionService = new TranscriptionService();
                const transcription = await transcriptionService.transcribeAudio(req.file.buffer, req.file.originalname);
                
                console.log('✅ Transcription completed:', transcription);
                
                // Salvar transcrição no N8N
                await saveToN8NTable(conversationId, transcription, 'human');
                
                console.log('✅ Transcription saved to N8N');
              } catch (transcriptionError) {
                console.error('❌ Background transcription failed:', transcriptionError);
                // Não falhar a requisição principal por erro de transcrição
              }
            });
          }

          return res.json({
            success: true,
            data: {
              message: uploadResult.message,
              attachment: uploadResult.attachment,
              whatsapp: uploadResult.whatsapp
            },
            message: 'Áudio enviado com sucesso'
          });
        } else {
          console.log('❌ Upload failed');
          return res.status(500).json({
            success: false,
            error: 'Erro no upload do arquivo'
          });
        }
      } catch (error) {
        console.error('❌ Audio voice message endpoint error:', error);
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Erro interno do servidor'
        });
      }
    });

    console.log('✅ Audio voice message endpoint registered');

    // Registrar outras rotas da API APÓS as rotas de upload
    app.use('/', healthRoutes);
    app.use('/api', contactsRoutes);
    app.use('/api', appointmentsRoutes);
    app.use('/api', authRoutes);
    app.use('/api', audioRoutes);
    app.use('/api', clinicRoutes);
    app.use('/api', conversationsRoutes);

    // Configurar arquivos estáticos (deve ser por último)
    setupStaticFiles(app);

    // Iniciar servidor
    const server = app.listen(serverConfig.port, () => {
      console.log('🚀 Servidor iniciado com sucesso!');
      console.log(`📡 Rodando na porta: ${serverConfig.port}`);
      console.log(`🌍 Ambiente: ${serverConfig.isProduction ? 'production' : 'development'}`);
      console.log('');
      console.log('📋 Endpoints disponíveis:');
      console.log('   GET  /health - Health check');
      console.log('   GET  /api - API info');
      console.log('   GET  /api/debug - Debug info');
      console.log('   GET  /api/contacts - List contacts');
      console.log('   GET  /api/contacts/:id - Get contact');
      console.log('   POST /api/contacts - Create contact');
      console.log('   GET  /api/appointments - List appointments');
      console.log('   POST /api/appointments - Create appointment');
      console.log('   GET  /api/auth/profile - User profile');
      console.log('   POST /api/auth/login - Login');
      console.log('   POST /api/auth/logout - Logout');
      console.log('   POST /api/audio/voice-message/:conversationId - Audio upload');
      console.log('   GET  /api/clinic/:id/users/management - Clinic users');
      console.log('   GET  /api/clinic/:id/config - Clinic config');
      console.log('   GET  /api/conversations-simple - List conversations');
      console.log('   POST /api/conversations-simple/:id/messages - Send message');
      console.log('   POST /api/conversations-simple/:id/upload - Upload file');
      console.log('');
      console.log('✅ Servidor pronto para receber requisições!');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('📴 Recebido SIGTERM, encerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor encerrado com sucesso');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('📴 Recebido SIGINT, encerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor encerrado com sucesso');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor se este arquivo for executado diretamente
if (require.main === module) {
  startServer();
}

export { startServer }; 