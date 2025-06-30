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
      
      // 1. Upload direto para Supabase Storage - BYPASS
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const timestamp = Date.now();
      const sanitizedFilename = `voice_${timestamp}_${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const storagePath = `clinic-1/conversation-${conversationId}/audio/${sanitizedFilename}`;
      
      console.log('📁 Uploading voice to Supabase Storage...');
      console.log('📁 Storage path:', storagePath);
      
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
        // Buscar conversa para obter telefone
        const conversation = await storage.getConversationById(conversationId);
        if (!conversation) {
          throw new Error('Conversa não encontrada');
        }
        
        // Buscar instância WhatsApp da clínica
        const instances = await storage.getWhatsAppNumbers(1);
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
        const evolutionUrl = (process.env.EVOLUTION_URL || 'https://n8n-evolution-api.4gmy9o.easypanel.host').replace(/\/$/, '');
        const evolutionApiKey = process.env.EVOLUTION_API_KEY!;
        
        // Formatação correta do payload conforme documentação Evolution API
        const phoneNumber = conversation.contact.phone.replace(/\D/g, '');
        
        console.log('📞 Phone number formatted:', phoneNumber);
        console.log('🌐 NOVA ABORDAGEM: Enviando URL direta (sem base64) para Evolution API');
        
        // NOVA SOLUÇÃO: URL direta ao invés de base64 (mais eficiente)
        console.log('🔗 Signed URL:', storageResult.signed_url.substring(0, 100) + '...');
        
        // Verificar se URL é acessível
        try {
          const testResponse = await fetch(storageResult.signed_url, { method: 'HEAD' });
          console.log('✅ URL accessibility test:', testResponse.status, testResponse.statusText);
        } catch (testError) {
          console.warn('⚠️ URL test failed:', testError.message);
        }
        
        // SOLUÇÃO: Usar URL direta do Supabase (mais simples e eficiente)
        const whatsappPayload = {
          number: phoneNumber,
          media: storageResult.signed_url, // URL direta (não base64)
          mediatype: 'audio',
          delay: 1000
        };
        
        console.log('🎤 USANDO /sendMedia (SOLUÇÃO TESTADA) - Payload:', {
          number: whatsappPayload.number,
          media: whatsappPayload.media.substring(0, 50) + '...[base64 truncated]',
          mediatype: whatsappPayload.mediatype,
          delay: whatsappPayload.delay
        });
        console.log('🎤 URL:', `${evolutionUrl}/message/sendMedia/${activeInstance.instance_name}`);
        
        const response = await fetch(`${evolutionUrl}/message/sendMedia/${activeInstance.instance_name}`, {
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
        console.error('❌ WhatsApp Error details:', {
          name: whatsappError.name,
          message: whatsappError.message,
          stack: whatsappError.stack
        });
        
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