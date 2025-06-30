/**
 * Rota isolada para áudio gravado - Bypass completo para /sendWhatsAppAudio
 * Evita conflitos com detecção automática e PostgreSQL
 */

import { Express, Request, Response } from 'express';
import multer from 'multer';
import { IStorage } from '../storage';
import { SupabaseStorageService } from '../services/supabase-storage.service';
import { EvolutionAPIService } from '../services/evolution-api.service';
import fetch from 'node-fetch';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB máximo
  }
});

export function setupAudioVoiceRoutes(app: Express, storage: IStorage) {
  console.log('🎤 Registrando rota isolada de áudio gravado...');
  
  // Rota dedicada para áudio gravado
  app.post('/api/conversations/:id/upload-voice', upload.single('file'), async (req: Request, res: Response) => {
    console.log('🎤 ROTA ISOLADA ÁUDIO GRAVADO ATIVADA');
    
    // Adicionar headers JSON
    res.setHeader('Content-Type', 'application/json');
    
    try {
      const conversationId = req.params.id;
      const { caption } = req.body;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Nenhum arquivo enviado'
        });
      }
      
      console.log('🎤 Processando áudio gravado:', {
        filename: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        conversationId
      });
      
      // 1. Upload para Supabase Storage
      const supabaseStorage = new SupabaseStorageService();
      const timestamp = Date.now();
      const sanitizedFilename = `voice_${timestamp}_${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      console.log('📁 Uploading voice to Supabase Storage...');
      const storageResult = await supabaseStorage.uploadFile({
        file: req.file.buffer,
        filename: sanitizedFilename,
        mimeType: req.file.mimetype,
        conversationId,
        clinicId: 1,
        category: 'audio'
      });
      
      console.log('✅ Voice uploaded to storage:', storageResult.file_url);
      
      // 2. Salvar mensagem no banco FORÇANDO message_type = 'audio_voice'
      console.log('💾 Creating voice message in database...');
      const message = await storage.createMessage({
        conversation_id: conversationId,
        sender_type: 'professional',
        content: caption || 'Mensagem de voz',
        message_type: 'audio_voice', // FORÇADO
        ai_action: 'voice_upload'
      });
      
      console.log('✅ Voice message created:', message.id);
      
      // 3. Criar attachment
      const attachment = await storage.createAttachment({
        message_id: message.id,
        clinic_id: 1,
        file_name: req.file.originalname,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        file_url: storageResult.signed_url
      });
      
      console.log('✅ Voice attachment created:', attachment.id);
      
      // 4. BYPASS COMPLETO - Direto para Evolution API sendWhatsAppAudio
      console.log('🎤 BYPASS: Enviando direto para /sendWhatsAppAudio');
      
      try {
        const evolutionAPI = new EvolutionAPIService();
        
        // Buscar conversa para obter telefone
        const conversation = await storage.getConversationWithContact(conversationId);
        if (!conversation) {
          throw new Error('Conversa não encontrada');
        }
        
        // Buscar instância WhatsApp da clínica
        const instances = await storage.getWhatsAppInstances(1);
        const activeInstance = instances.find(i => i.status === 'open');
        if (!activeInstance) {
          throw new Error('Nenhuma instância WhatsApp ativa');
        }
        
        console.log('🎤 Enviando para WhatsApp:', {
          phone: conversation.contact.phone,
          instance: activeInstance.instance_name,
          audioUrl: storageResult.signed_url
        });
        
        // CHAMADA DIRETA para sendWhatsAppAudio (bypass completo)
        const evolutionUrl = process.env.EVOLUTION_URL || 'https://n8n-evolution-api.4gmy9o.easypanel.host';
        const evolutionApiKey = process.env.EVOLUTION_API_KEY!;
        
        // Formatação correta do payload conforme documentação Evolution API
        const phoneNumber = conversation.contact.phone.replace(/\D/g, '');
        const whatsappPayload = {
          number: phoneNumber,
          audio: storageResult.signed_url, // Campo correto: 'audio' (não 'media')
          delay: 1000
        };
        
        console.log('🎤 BYPASS DIRETO - Payload /sendWhatsAppAudio:', whatsappPayload);
        console.log('🎤 URL:', `${evolutionUrl}/message/sendWhatsAppAudio/${activeInstance.instance_name}`);
        
        const response = await fetch(`${evolutionUrl}/message/sendWhatsAppAudio/${activeInstance.instance_name}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey
          },
          body: JSON.stringify(whatsappPayload)
        });
        
        const result = await response.json();
        console.log('🎤 Evolution API Response:', response.status, result);
        
        if (response.ok && result.key) {
          // Atualizar status da mensagem
          await storage.updateMessage(message.id, {
            status: 'sent'
          });
          console.log('✅ Voice message sent via WhatsApp!');
          
          res.json({
            success: true,
            data: {
              message,
              attachment,
              whatsapp: {
                sent: true,
                messageId: result.key.id
              }
            },
            message: 'Mensagem de voz enviada com sucesso!'
          });
        } else {
          throw new Error(`Evolution API failed: ${JSON.stringify(result)}`);
        }
        
      } catch (whatsappError) {
        console.error('❌ WhatsApp sending failed:', whatsappError);
        
        // Manter arquivo salvo mesmo se WhatsApp falhar
        await storage.updateMessage(message.id, {
          status: 'failed'
        });
        
        res.json({
          success: true,
          data: {
            message,
            attachment,
            whatsapp: {
              sent: false,
              error: whatsappError instanceof Error ? whatsappError.message : 'Erro desconhecido'
            }
          },
          message: 'Áudio salvo, mas falha no envio WhatsApp'
        });
      }
      
    } catch (error) {
      console.error('❌ Voice upload error:', error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  });
  
  console.log('🎤 Rota isolada de áudio gravado registrada: POST /api/conversations/:id/upload-voice');
}