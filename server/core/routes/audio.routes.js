const express = require('express');
const { createSupabaseClient } = require('../config/database.config');
const { upload } = require('../config/upload.config');

const router = express.Router();

/**
 * Rotas de Áudio
 * Refatorado de: railway-server.ts (linhas 501-762)
 * Módulo: Audio Processing & WhatsApp Integration
 */

/**
 * POST /api/audio/voice-message/:conversationId - Upload de áudio com transcrição
 * Funcionalidades:
 * - Upload para Supabase Storage
 * - Transcrição via Whisper
 * - Integração N8N
 * - Envio WhatsApp via Evolution API
 */
router.post('/audio/voice-message/:conversationId', upload.single('file'), async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    
    console.log('🎤 Audio voice message upload for conversation:', conversationId);
    
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'Arquivo de áudio não encontrado'
      });
      return;
    }

    console.log('🎤 Audio file info:', {
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    });

    // ========== UPLOAD TO SUPABASE STORAGE ==========
    const supabaseAdmin = createSupabaseClient();
    const timestamp = Date.now();
    const fileName = `voice_${timestamp}_${req.file.originalname}`;
    const filePath = `audio/${fileName}`;

    console.log('☁️ Uploading to Supabase Storage:', filePath);

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('attachments')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      res.status(500).json({
        success: false,
        error: 'Erro no upload do arquivo'
      });
      return;
    }

    console.log('✅ Upload successful:', uploadData.path);

    // ========== CREATE PUBLIC URL ==========
    const { data: publicUrl, error: urlError } = await supabaseAdmin.storage
      .from('attachments')
      .createSignedUrl(filePath, 3600); // 1 hora

    if (urlError) {
      console.error('❌ URL error:', urlError);
      res.status(500).json({
        success: false,
        error: 'Erro ao gerar URL do arquivo'
      });
      return;
    }

    console.log('🔗 Public URL created:', publicUrl.signedUrl);

    // ========== CREATE MESSAGE RECORD ==========
    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        content: 'Áudio enviado',
        message_type: 'audio_voice',
        sender_type: 'user',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (messageError) {
      console.error('❌ Message error:', messageError);
      res.status(500).json({
        success: false,
        error: 'Erro ao salvar mensagem'
      });
      return;
    }

    console.log('💬 Message created:', message.id);

    // ========== CREATE ATTACHMENT RECORD ==========
    const { data: attachment, error: attachmentError } = await supabaseAdmin
      .from('attachments')
      .insert([{
        message_id: message.id,
        file_name: req.file.originalname,
        file_path: filePath,
        file_size: req.file.size,
        file_type: req.file.mimetype,
        storage_url: publicUrl.signedUrl,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (attachmentError) {
      console.error('❌ Attachment error:', attachmentError);
      res.status(500).json({
        success: false,
        error: 'Erro ao salvar anexo'
      });
      return;
    }

    console.log('📎 Attachment created:', attachment.id);

    // ========== RESPONSE ==========
    res.json({
      success: true,
      message: 'Áudio processado com sucesso',
      data: {
        message_id: message.id,
        attachment_id: attachment.id,
        file_url: publicUrl.signedUrl
      }
    });

    console.log('✅ Audio message and attachment created');

    // ========== TRANSCRIÇÃO + N8N INTEGRATION ==========
    console.log('🔤 ÁUDIO LIMPO: Iniciando transcrição de áudio para memória da IA...');
    
    setImmediate(async () => {
      try {
        console.log('🔤 TRANSCRIPTION: Iniciando processo de transcrição em background...');
        
        // Verificar se o arquivo existe antes de processar
        if (!req.file || !req.file.buffer || !req.file.originalname) {
          console.error('❌ TRANSCRIPTION: Arquivo não disponível para transcrição');
          return;
        }
        
        // 1. Importar serviços dinamicamente
        const TranscriptionService = (await import('../../services/transcription.service.js')).default;
        const { saveToN8NTable } = await import('../../utils/n8n-integration.js');
        
        // 2. Transcrever áudio
        const transcriptionService = new TranscriptionService();
        const transcribedText = await transcriptionService.transcribeAudio(
          req.file.buffer,
          req.file.originalname
        );
        
        console.log('🔤 TRANSCRIPTION: Texto transcrito:', transcribedText?.substring(0, 100) + '...');
        
        // 3. Salvar transcrição na tabela N8N
        if (transcribedText) {
          await saveToN8NTable({
            conversation_id: conversationId,
            message_id: message.id,
            transcribed_text: transcribedText,
            audio_file_path: filePath,
            created_at: new Date().toISOString()
          });
          
          console.log('✅ TRANSCRIPTION: Transcrição salva na tabela N8N');
        }
        
        console.log('🔤 TRANSCRIPTION: Processo concluído com sucesso');
        
      } catch (transcriptionError) {
        console.error('❌ TRANSCRIPTION: Erro na transcrição:', transcriptionError);
      }
    });

    // ========== WHATSAPP INTEGRATION ==========
    setImmediate(async () => {
      try {
        console.log('🎤 Sending audio to WhatsApp...');
        
        // Buscar dados da conversa
        const { data: conversation } = await supabaseAdmin
          .from('conversations')
          .select(`
            id,
            contacts!inner (phone)
          `)
          .eq('id', conversationId)
          .single();

        const contactPhone = (conversation?.contacts)?.[0]?.phone || (conversation?.contacts)?.phone;

        if (!contactPhone) {
          console.log('❌ No contact phone for audio');
          return;
        }

        // Baixar arquivo para envio
        const response = await fetch(publicUrl.signedUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Audio = buffer.toString('base64');

        // Configurar Evolution API
        const evolutionUrl = process.env.EVOLUTION_API_URL || 'https://n8n-evolution-api.4gmy9o.easypanel.host';
        const evolutionApiKey = process.env.EVOLUTION_API_KEY;

        const audioPayload = {
          number: contactPhone,
          audio: base64Audio,
          delay: 1000
        };

        const evolutionResponse = await fetch(`${evolutionUrl}/message/sendWhatsAppAudio/activeInstance.instance_name`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey
          },
          body: JSON.stringify(audioPayload)
        });

        if (evolutionResponse.ok) {
          console.log('✅ Audio sent to WhatsApp successfully');
        } else {
          console.error('❌ Failed to send audio to WhatsApp:', evolutionResponse.status);
        }

      } catch (whatsappError) {
        console.error('❌ WhatsApp integration error:', whatsappError);
      }
    });

  } catch (error) {
    console.error('❌ Erro no processamento de áudio:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router; 