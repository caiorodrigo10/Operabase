// Carregar variáveis de ambiente
require('dotenv').config();

const express = require('express');
const { createSupabaseClient } = require('../utils/supabase');
const multer = require('multer');
const { ConversationUploadService } = require('../../services/conversation-upload.service.ts');

const router = express.Router();

// Middleware básico de autenticação (simplificado para testes)
const authenticate = (req, res, next) => {
  // Para testes, assumir clinic_id = 1
  req.clinic_id = 1;
  next();
};

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
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype}`));
    }
  }
});

// Listar conversas simples - adaptado do painel espelho
router.get('/conversations-simple', authenticate, async (req, res) => {
  try {
    const clinicId = 1; // Hardcoded for testing
    
    console.log('🔍 Fetching conversations for clinic:', clinicId);
    
    // Use direct Supabase client like the working mirror panel
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const startTime = Date.now();
    
    // Query optimized following mirror panel pattern
    const { data: conversationsData, error } = await supabase
      .from('conversations')
      .select(`
        id,
        clinic_id,
        contact_id,
        status,
        created_at,
        updated_at,
        ai_active,
        contacts!inner (
          name,
          phone,
          email,
          status,
          profile_picture
        )
      `)
      .eq('clinic_id', clinicId)
      .order('updated_at', { ascending: false })
      .limit(20);
      
    const queryTime = Date.now() - startTime;
    console.log('⚡ DB Query completed in', queryTime, 'ms');
    
    if (error) {
      console.error('❌ Supabase error:', error);
      return res.status(500).json({ error: 'Erro ao buscar conversas' });
    }
    
    console.log('📊 Found conversations:', conversationsData?.length || 0);
    
    // Get conversation IDs for message fetching
    const conversationIds = (conversationsData || []).map(c => c.id);
    
    if (conversationIds.length === 0) {
      console.log('⚠️ No conversations found');
      return res.json({ conversations: [] });
    }
    
    // Get latest message per conversation
    const { data: allMessages } = await supabase
      .from('messages')
      .select('conversation_id, content, timestamp, id')
      .in('conversation_id', conversationIds)
      .not('timestamp', 'is', null)
      .order('timestamp', { ascending: false })
      .limit(conversationIds.length * 2);

    // Process messages into a map
    const lastMessageMap = {};
    
    allMessages?.forEach((msg) => {
      if (!lastMessageMap[msg.conversation_id] && msg.timestamp) {
        lastMessageMap[msg.conversation_id] = {
          content: msg.content,
          timestamp: msg.timestamp,
          id: msg.id
        };
      }
    });
    
    const processingTime = Date.now() - startTime;
    console.log('⚡ Performance: Processed', Object.keys(lastMessageMap).length, 'messages in', processingTime, 'ms');

    // Format for frontend following mirror panel pattern
    const formattedConversations = (conversationsData || []).map(conv => {
      const lastMsg = lastMessageMap[conv.id];
      const lastMessageTime = lastMsg?.timestamp || conv.created_at;
      
      return {
        id: conv.id.toString(),
        clinic_id: conv.clinic_id,
        contact_id: conv.contact_id,
        status: conv.status || 'active',
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        ai_active: conv.ai_active ?? true,
        contact_name: conv.contacts?.name || `Contato ${conv.contact_id}`,
        patient_name: conv.contacts?.name || `Contato ${conv.contact_id}`,
        patient_avatar: conv.contacts?.profile_picture || null,
        contact_phone: conv.contacts?.phone || '',
        contact_email: conv.contacts?.email || '',
        contact_status: conv.contacts?.status || 'active',
        last_message: lastMsg?.content || 'Nenhuma mensagem ainda',
        last_message_at: lastMessageTime,
        timestamp: lastMessageTime,
        total_messages: 0,
        unread_count: 0
      };
    });

    // Sort by last message timestamp (most recent first)
    formattedConversations.sort((a, b) => {
      const timeA = new Date(a.last_message_at).getTime();
      const timeB = new Date(b.last_message_at).getTime();
      return timeB - timeA;
    });
    
    res.json({
      conversations: formattedConversations,
      total: formattedConversations.length,
      hasMore: false
    });

  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar conversa específica com mensagens - adaptado do painel espelho
router.get('/conversations-simple/:id', authenticate, async (req, res) => {
  try {
    const conversationIdParam = req.params.id;
    console.log('🔍 Fetching conversation detail for ID:', conversationIdParam);
    
    const clinicId = 1; // Hardcoded for testing
    
    // Use direct Supabase client like the working mirror panel
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    let conversationId = conversationIdParam;
    const isScientificNotation = conversationIdParam.includes('e+') || conversationIdParam.includes('E+');
    
    let conversation, convError;
    
    if (isScientificNotation) {
      console.log('🔍 Scientific notation detected, finding conversation by robust matching');
      const { data: allConversations } = await supabase
        .from('conversations')
        .select('*, ai_active')
        .eq('clinic_id', clinicId);
      
      const paramIdNum = parseFloat(conversationId);
      
      conversation = allConversations?.find(conv => {
        const convIdStr = conv.id.toString();
        const convIdNum = parseFloat(convIdStr);
        
        if (Math.abs(convIdNum - paramIdNum) < 1) return true;
        if (convIdStr === conversationId) return true;
        
        try {
          const convExp = parseFloat(convIdStr).toExponential();
          const paramExp = parseFloat(conversationId).toExponential();
          if (convExp === paramExp) return true;
        } catch (e) {}
        
        return false;
      });
      
      if (!conversation) {
        convError = { message: 'Conversation not found for scientific notation ID' };
      } else {
        console.log('✅ Found conversation via robust matching:', conversation.id);
      }
    } else {
      const result = await supabase
        .from('conversations')
        .select('*, ai_active')
        .eq('id', conversationId)
        .eq('clinic_id', clinicId)
        .single();
      conversation = result.data;
      convError = result.error;
    }

    if (convError || !conversation) {
      console.error('❌ Conversation lookup failed:', convError);
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }
    
    const actualConversationId = conversation.id;
    console.log('✅ Found conversation:', actualConversationId);

    // Fetch contact data with profile picture
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('id, name, phone, email, status, profile_picture')
      .eq('id', conversation.contact_id)
      .single();

    if (contactError) {
      console.error('❌ Error fetching contact data:', contactError);
    }

    // Enrich conversation with contact info
    const enrichedConversation = {
      ...conversation,
      contact: contactData
    };

    // Fetch messages for the conversation
    let messages, msgError;
    
    if (isScientificNotation) {
      const { data: allMessages, error: allMsgError } = await supabase
        .from('messages')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(200);
      
      const targetIdNum = parseFloat(actualConversationId.toString());
      messages = allMessages?.filter(msg => {
        const msgIdNum = parseFloat(msg.conversation_id.toString());
        return Math.abs(msgIdNum - targetIdNum) < 1;
      }).slice(0, 50);
      
      msgError = allMsgError;
    } else {
      const { data: directMessages, error: directError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', actualConversationId)
        .order('timestamp', { ascending: false })
        .limit(50);
      
      messages = directMessages;
      msgError = directError;
    }

    if (msgError) {
      console.error('❌ Error fetching messages:', msgError);
      return res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }

    // Sort messages chronologically
    const sortedMessages = (messages || []).reverse();

    // Batch load attachments
    const { data: attachments, error: attachError } = await supabase
      .from('message_attachments')
      .select('*')
      .in('message_id', sortedMessages.map(m => m.id))
      .eq('clinic_id', clinicId);

    if (attachError) {
      console.error('❌ Error fetching attachments:', attachError);
    }

    // Create attachment map
    const attachmentMap = new Map();
    (attachments || []).forEach(att => {
      if (!attachmentMap.has(att.message_id)) {
        attachmentMap.set(att.message_id, []);
      }
      attachmentMap.get(att.message_id).push(att);
    });

    // Format messages following mirror panel pattern
    const finalFormattedMessages = sortedMessages.map(msg => {
      const msgAttachments = attachmentMap.get(msg.id) || [];
      
      // Use message_type from database first, fallback to attachment-based detection
      let messageType = msg.message_type || 'text';
      if (messageType === 'text' && msgAttachments.length > 0) {
        const attachment = msgAttachments[0];
        if (attachment.file_type?.startsWith('image/')) messageType = 'image';
        else if (attachment.file_type?.startsWith('audio/')) messageType = 'audio';
        else if (attachment.file_type?.startsWith('video/')) messageType = 'video';
        else messageType = 'document';
      }

      return {
        id: msg.id,
        conversation_id: msg.conversation_id,
        content: msg.content,
        sender_type: msg.sender_type,
        sender_name: msg.sender_type === 'professional' ? 'Profissional' : 
                    msg.sender_type === 'ai' ? 'IA' : 'Paciente',
        sender_avatar: msg.sender_type === 'patient' ? contactData?.profile_picture : undefined,
        direction: msg.sender_type === 'professional' ? 'outbound' : 'inbound',
        message_type: messageType,
        timestamp: msg.timestamp,
        evolution_status: msg.evolution_status || 'sent',
        attachments: msgAttachments
      };
    });

    const responseData = {
      conversation: enrichedConversation,
      messages: finalFormattedMessages,
      actions: [] // Placeholder for future action notifications
    };
    
    res.json(responseData);

  } catch (error) {
    console.error('❌ Error fetching conversation detail:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Enviar mensagem - adaptado do painel espelho
router.post('/conversations-simple/:id/messages', authenticate, async (req, res) => {
  try {
    const conversationIdParam = req.params.id;
    const { content } = req.body;
    
    console.log('🔍 Sending message to conversation:', conversationIdParam);
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Conteúdo da mensagem é obrigatório' });
    }
    
    const clinicId = 1; // Hardcoded for testing
    
    // Use direct Supabase client like the working mirror panel
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    let conversationId = conversationIdParam;
    const isScientificNotation = conversationIdParam.includes('e+') || conversationIdParam.includes('E+');
    
    let actualConversation;
    
    if (isScientificNotation) {
      console.log('🔍 Scientific notation detected, finding conversation by robust matching');
      const { data: allConversations } = await supabase
        .from('conversations')
        .select('id, contact_id, contacts!inner(name, phone)')
        .eq('clinic_id', clinicId);
      
      const paramIdNum = parseFloat(conversationId);
      
      actualConversation = allConversations?.find(conv => {
        const convIdStr = conv.id.toString();
        const convIdNum = parseFloat(convIdStr);
        
        if (Math.abs(convIdNum - paramIdNum) < 1) return true;
        if (convIdStr === conversationId) return true;
        
        try {
          const convExp = parseFloat(convIdStr).toExponential();
          const paramExp = parseFloat(conversationId).toExponential();
          if (convExp === paramExp) return true;
        } catch (e) {}
        
        return false;
      });
      
      if (!actualConversation) {
        console.error('❌ Conversation not found for scientific notation ID:', conversationId);
        return res.status(404).json({ error: 'Conversa não encontrada' });
      }
      
      console.log('✅ Found conversation via robust matching:', actualConversation.id);
    } else {
      const { data: directConv } = await supabase
        .from('conversations')
        .select('id, contact_id, contacts!inner(name, phone)')
        .eq('id', conversationId)
        .eq('clinic_id', clinicId)
        .single();
      
      actualConversation = directConv;
      
      if (!actualConversation) {
        console.error('❌ Conversation not found for ID:', conversationId);
        return res.status(404).json({ error: 'Conversa não encontrada' });
      }
    }
    
    const actualConversationId = actualConversation.id;
    console.log('✅ Using conversation:', {
      requestedId: conversationId,
      actualId: actualConversationId,
      contact: actualConversation.contacts.name,
      phone: actualConversation.contacts.phone
    });

    // Insert message following mirror panel pattern
    console.log('💾 Inserting message following mirror panel pattern');
    
    // Função para obter timestamp no horário de Brasília (seguindo padrão do painel espelho)
    const getBrasiliaTimestamp = () => {
      const now = new Date();
      // Aplicar offset do fuso horário de São Paulo (GMT-3)
      const saoPauloOffset = -3 * 60; // GMT-3 em minutos
      const saoPauloTime = new Date(now.getTime() + saoPauloOffset * 60000);
      return saoPauloTime.toISOString();
    };

    const insertConversationId = typeof actualConversationId === 'number' && actualConversationId.toString().includes('e+') 
      ? actualConversationId.toString() 
      : actualConversationId;
    
    const { data: newMessage, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: insertConversationId,
        sender_type: 'professional',
        content: content.trim(),
        timestamp: getBrasiliaTimestamp(),
        device_type: 'system',
        evolution_status: 'pending',
        message_type: 'text'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting message:', insertError);
      return res.status(500).json({ error: 'Erro ao salvar mensagem' });
    }

    console.log('✅ Message saved to database:', newMessage.id);

    // 🤖 SISTEMA DE PAUSA AUTOMÁTICA DA IA
    console.log('🤖 AI PAUSE: Iniciando processo de pausa automática...');
    
    try {
      // Importar serviço de pausa
      const { AiPauseService } = require('../../services/ai-pause.service');
      
      // Buscar estado atual da conversa
      const { data: currentConversation } = await supabase
        .from('conversations')
        .select('ai_active, ai_pause_reason')
        .eq('id', actualConversationId)
        .single();
      
      console.log('🤖 AI PAUSE: Estado atual da conversa:', {
        conversationId: actualConversationId,
        ai_active: currentConversation?.ai_active,
        ai_pause_reason: currentConversation?.ai_pause_reason
      });
      
      // Buscar configuração da Lívia
      const { data: liviaConfig } = await supabase
        .from('livia_configurations')
        .select('*')
        .eq('clinic_id', clinicId)
        .single();
      
      console.log('🤖 AI PAUSE: Configuração Lívia:', {
        off_duration: liviaConfig?.off_duration,
        off_unit: liviaConfig?.off_unit
      });
      
      if (liviaConfig) {
        const aiPauseService = AiPauseService.getInstance();
        
        // Contexto da pausa
        const aiPauseContext = {
          conversationId: actualConversationId,
          clinicId: clinicId,
          senderId: '4', // Caio Rodrigo
          senderType: 'professional',
          deviceType: 'system', // Mensagem do chat web
          messageContent: content.trim(),
          timestamp: new Date()
        };
        
        console.log('🤖 AI PAUSE: Contexto da pausa:', aiPauseContext);
        
        const pauseResult = await aiPauseService.processMessage(
          aiPauseContext, 
          liviaConfig,
          currentConversation?.ai_active,
          currentConversation?.ai_pause_reason
        );
        
        console.log('🤖 AI PAUSE: Resultado da análise:', pauseResult);
        
        if (pauseResult.shouldPause) {
          // Aplicar pausa no banco de dados
          const { error: updateError } = await supabase
            .from('conversations')
            .update({
              ai_active: false, // ✅ CRÍTICO: Desativar AI_ACTIVE
              ai_paused_until: pauseResult.pausedUntil?.toISOString(),
              ai_paused_by_user_id: pauseResult.pausedByUserId,
              ai_pause_reason: pauseResult.pauseReason
            })
            .eq('id', actualConversationId);
          
          if (updateError) {
            console.error('❌ AI PAUSE: Erro ao aplicar pausa no banco:', updateError);
          } else {
            console.log('✅ AI PAUSE: Pausa automática aplicada com sucesso!');
          }
        }
      } else {
        console.log('⚠️ AI PAUSE: Configuração da Lívia não encontrada, usando padrões');
        
        // Configuração padrão
        const defaultConfig = {
          off_duration: 6,
          off_unit: 'minutos'
        };
        
        const aiPauseService = AiPauseService.getInstance();
        
        const aiPauseContext = {
          conversationId: actualConversationId,
          clinicId: clinicId,
          senderId: '4', // Caio Rodrigo
          senderType: 'professional',
          deviceType: 'system',
          messageContent: content.trim(),
          timestamp: new Date()
        };
        
        const pauseResult = await aiPauseService.processMessage(
          aiPauseContext, 
          defaultConfig,
          currentConversation?.ai_active,
          currentConversation?.ai_pause_reason
        );
        
        if (pauseResult.shouldPause) {
          const { error: updateError } = await supabase
            .from('conversations')
            .update({
              ai_active: false,
              ai_paused_until: pauseResult.pausedUntil?.toISOString(),
              ai_paused_by_user_id: pauseResult.pausedByUserId,
              ai_pause_reason: pauseResult.pauseReason
            })
            .eq('id', actualConversationId);
          
          if (updateError) {
            console.error('❌ AI PAUSE: Erro ao aplicar pausa no banco:', updateError);
          } else {
            console.log('✅ AI PAUSE: Pausa automática aplicada com sucesso (config padrão)!');
          }
        }
      }
      
    } catch (aiPauseError) {
      console.error('❌ AI PAUSE: Erro no sistema de pausa automática:', aiPauseError);
      // Não interrompe o fluxo - sistema de pausa é opcional
    }

    // Format response following mirror panel pattern
    const formattedMessage = {
      id: newMessage.id,
      conversation_id: newMessage.conversation_id,
      content: newMessage.content,
      sender_type: newMessage.sender_type,
      sender_name: 'Profissional',
      direction: 'outbound',
      message_type: 'text',
      timestamp: newMessage.timestamp,
      evolution_status: newMessage.evolution_status,
      attachments: []
    };

    // Send to WhatsApp via Evolution API in background
    setImmediate(async () => {
      try {
        console.log('🔧 Starting Evolution API send process for message ID:', newMessage.id);
        
        // Get active WhatsApp instance for clinic
        const { data: activeInstance, error: instanceError } = await supabase
          .from('whatsapp_numbers')
          .select('*')
          .eq('clinic_id', clinicId)
          .eq('status', 'open')
          .limit(1)
          .single();

        if (instanceError || !activeInstance) {
          console.error('❌ No active WhatsApp instance found for clinic:', clinicId);
          
          // Update message status to failed
          await supabase
            .from('messages')
            .update({ evolution_status: 'failed' })
            .eq('id', newMessage.id);
          
          return;
        }

        console.log('✅ Active WhatsApp instance found:', {
          instance_name: activeInstance.instance_name,
          phone_number: activeInstance.phone_number,
          status: activeInstance.status
        });

        // Get contact phone number
        const contactPhone = actualConversation.contacts.phone;
        
        if (!contactPhone) {
          console.error('❌ No contact phone found for conversation:', actualConversationId);
          
          await supabase
            .from('messages')
            .update({ evolution_status: 'failed' })
            .eq('id', newMessage.id);
          
          return;
        }

        console.log('📤 Sending to Evolution API:', {
          instance: activeInstance.instance_name,
          phone: contactPhone,
          message: content.trim()
        });

        // Send via Evolution API
        const evolutionUrl = process.env.EVOLUTION_URL;
        const evolutionApiKey = process.env.EVOLUTION_API_KEY;
        
        const evolutionPayload = {
          number: contactPhone,
          text: content.trim()
        };

        const evolutionResponse = await fetch(evolutionUrl + 'message/sendText/' + activeInstance.instance_name, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey
          },
          body: JSON.stringify(evolutionPayload)
        });

        if (evolutionResponse.ok) {
          const evolutionResult = await evolutionResponse.json();
          console.log('✅ WhatsApp message sent successfully:', {
            messageId: evolutionResult.key?.id,
            status: evolutionResult.status
          });
          
          // Update message status to sent
          await supabase
            .from('messages')
            .update({ 
              evolution_status: 'sent',
              evolution_message_id: evolutionResult.key?.id
            })
            .eq('id', newMessage.id);
        } else {
          const errorText = await evolutionResponse.text();
          console.error('❌ Evolution API error:', {
            status: evolutionResponse.status,
            error: errorText
          });
          
          // Update message status to failed
          await supabase
            .from('messages')
            .update({ evolution_status: 'failed' })
            .eq('id', newMessage.id);
        }

      } catch (whatsappError) {
        console.error('❌ WhatsApp sending error:', whatsappError);
        
        // Update message status to failed
        await supabase
          .from('messages')
          .update({ evolution_status: 'failed' })
          .eq('id', newMessage.id);
      }
    });

    res.status(201).json({ 
      success: true,
      message: formattedMessage,
      sent_to_whatsapp: !!actualConversation?.contacts?.phone
    });

  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    });
  }
});

// Criar nova conversa
router.post('/conversations-simple', authenticate, async (req, res) => {
  try {
    const clinicId = 1; // Hardcoded for testing
    const { contact_id, status = 'active' } = req.body;

    if (!contact_id) {
      return res.status(400).json({ error: 'contact_id é obrigatório' });
    }

    const supabase = createSupabaseClient();

    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select()
      .eq('clinic_id', clinicId)
      .eq('contact_id', contact_id)
      .eq('status', 'active')
      .single();

    if (existingConversation) {
      return res.json({
        conversation: existingConversation,
        isExisting: true
      });
    }

    // Create new conversation
    const { data: newConversation, error } = await supabase
      .from('conversations')
      .insert({
        clinic_id: clinicId,
        contact_id: contact_id,
        status: status,
        ai_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating conversation:', error);
      return res.status(500).json({ error: 'Erro ao criar conversa' });
    }

    res.status(201).json({
      conversation: newConversation,
      isExisting: false
    });

  } catch (error) {
    console.error('❌ Error in createConversation:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Debug endpoint - listar todas as mensagens
router.get('/messages', authenticate, async (req, res) => {
  try {
    const supabase = createSupabaseClient();
    
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) {
      console.error('❌ Error fetching messages:', error);
      return res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }

    res.json({
      success: true,
      messages: messages || [],
      total: messages?.length || 0
    });

  } catch (error) {
    console.error('❌ Error in getAllMessages:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/conversations-simple/:id/upload - Upload de arquivo
router.post('/conversations-simple/:id/upload', upload.single('file'), async (req, res) => {
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
    
    // Criar instância do serviço de upload
    const uploadService = new ConversationUploadService();
    
    // Fazer upload
    const result = await uploadService.uploadFile({
      file: file.buffer,
      filename: file.originalname,
      mimeType: file.mimetype,
      conversationId,
      clinicId: 1, // TODO: Get from auth context
      userId: 4, // TODO: Get from auth context
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

// POST /api/audio/voice-message/:conversationId - Upload de áudio de voz com transcrição
router.post('/audio/voice-message/:conversationId', upload.single('file'), async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const file = req.file;
    
    console.log('🎤 ÁUDIO DE VOZ: Upload request received:', {
      conversationId,
      fileName: file?.originalname,
      fileSize: file?.size,
      mimeType: file?.mimetype
    });
    
    if (!file) {
      return res.status(400).json({ 
        error: 'Nenhum arquivo de áudio enviado',
        success: false 
      });
    }
    
    // Validar que é arquivo de áudio
    if (!file.mimetype.startsWith('audio/')) {
      return res.status(400).json({ 
        error: 'Apenas arquivos de áudio são aceitos neste endpoint',
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
    
    // 1. Upload do áudio para Supabase Storage
    const uploadService = new ConversationUploadService();
    
    console.log('📤 ÁUDIO DE VOZ: Fazendo upload para Supabase Storage...');
    
    // Fazer upload usando o serviço existente
    const result = await uploadService.uploadFile({
      file: file.buffer,
      filename: file.originalname,
      mimeType: file.mimetype,
      conversationId,
      clinicId: 1,
      userId: 4,
      caption: undefined, // Áudio de voz não tem caption
      sendToWhatsApp: true,
      messageType: 'audio_voice' // Identificar como áudio de voz
    });
    
    console.log('✅ ÁUDIO DE VOZ: Upload principal completado:', {
      messageId: result.message.id,
      attachmentId: result.attachment?.id,
      whatsappSent: result.whatsapp.sent
    });
    
    // 2. Background: Transcrição + Memória IA
    setImmediate(async () => {
      try {
        console.log('🔤 TRANSCRIÇÃO: Iniciando processo de transcrição em background...');
        
        // Verificar se o arquivo existe antes de processar
        if (!file || !file.buffer || !file.originalname) {
          console.error('❌ TRANSCRIÇÃO: Arquivo não disponível para transcrição');
          return;
        }
        
        // Importar serviços
        const TranscriptionService = require('../../services/transcription.service').TranscriptionService;
        const { saveToN8NTable } = require('../../utils/n8n-integration');
        
        // Transcrever áudio usando Whisper
        const transcriptionService = new TranscriptionService();
        const transcribedText = await transcriptionService.transcribeAudio(
          file.buffer, 
          file.originalname
        );
        
        console.log('🔤 TRANSCRIÇÃO: Texto transcrito obtido:', {
          length: transcribedText.length,
          preview: transcribedText.substring(0, 100) + (transcribedText.length > 100 ? '...' : '')
        });
        
        // Salvar na n8n_chat_messages (tipo "human" = profissional enviando)
        await saveToN8NTable(conversationId, transcribedText, 'human');
        
        console.log('✅ TRANSCRIÇÃO: Transcrição + N8N integration completa para conversa:', conversationId);
        
      } catch (transcriptionError) {
        console.error('❌ TRANSCRIÇÃO: Erro na transcrição/N8N:', {
          message: transcriptionError.message,
          conversationId,
          fileName: file?.originalname,
          fileSize: file?.size
        });
        // Não afeta o fluxo principal do áudio WhatsApp
      }
    });
    
    // 3. Resposta imediata (não espera transcrição)
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
      },
      transcription: {
        status: 'processing',
        message: 'Transcrição sendo processada em background'
      }
    });
    
  } catch (error) {
    console.error('❌ ÁUDIO DE VOZ: Erro no upload:', error);
    
    // Tratamento de erros específicos
    if (error.message.includes('Arquivo muito grande')) {
      return res.status(413).json({
        error: error.message,
        success: false,
        code: 'FILE_TOO_LARGE'
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
        message: 'Áudio salvo com sucesso, mas falha no envio WhatsApp',
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

// PATCH /api/conversations-simple/:id/ai-toggle - Toggle AI status
router.patch('/conversations-simple/:id/ai-toggle', authenticate, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { ai_active } = req.body;
    const clinicId = 1; // Hardcoded for testing

    console.log('🤖 AI Toggle request:', { conversationId, ai_active, clinicId });

    if (typeof ai_active !== 'boolean') {
      return res.status(400).json({ error: 'ai_active deve ser boolean' });
    }

    // Use direct Supabase client like other endpoints
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Atualizar estado da IA na conversa com override manual
    let updateData = { ai_active, updated_at: new Date().toISOString() };
    
    if (ai_active === true) {
      // 🔥 OVERRIDE MANUAL: Limpar pausa automática quando ativando IA manualmente
      updateData.ai_paused_until = null;
      updateData.ai_pause_reason = null;
      updateData.ai_paused_by_user_id = null;
      console.log('🔥 Manual override - clearing automatic pause and activating AI');
    } else {
      // Desativação manual - marcar como manual
      updateData.ai_pause_reason = 'manual';
      updateData.ai_paused_by_user_id = 4; // Caio Rodrigo
      console.log('🔄 Manual deactivation - marking as manual');
    }

    const { data: result, error } = await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', conversationId)
      .eq('clinic_id', clinicId)
      .select('id, ai_active, ai_paused_until, ai_pause_reason');

    if (error) {
      console.error('❌ Supabase error:', error);
      return res.status(500).json({ error: 'Erro ao atualizar conversa' });
    }

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    console.log('✅ AI state updated:', result[0]);
    
    res.json({ 
      success: true, 
      ai_active,
      ai_pause_reason: result[0].ai_pause_reason,
      conversation_id: conversationId,
      message: ai_active ? 'IA ativada com sucesso' : 'IA desativada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao alternar IA:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router; 