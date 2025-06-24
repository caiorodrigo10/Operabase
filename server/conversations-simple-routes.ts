import { Request, Response } from 'express';
import { IStorage } from './storage';
import { redisCacheService } from './services/redis-cache.service';

export function setupSimpleConversationsRoutes(app: any, storage: IStorage) {
  
  // ETAPA 2: Obter referência do WebSocket server
  const getWebSocketServer = () => app.get('webSocketServer');
  
  // ETAPA 3: Enhanced conversations list with Redis cache
  app.get('/api/conversations-simple', async (req: Request, res: Response) => {
    try {
      const clinicId = 1; // Hardcoded for testing
      
      // ETAPA 3: Try cache first
      const cachedConversations = await redisCacheService.getCachedConversations(clinicId);
      if (cachedConversations) {
        console.log('🎯 Cache HIT: conversations list');
        return res.json({ conversations: cachedConversations });
      }
      
      console.log('💽 Cache MISS: fetching conversations from database');
      
      console.log('🔍 Fetching conversations for clinic:', clinicId);
      
      // Use direct Supabase client to get conversations with contact info
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      // ETAPA 1: Query otimizada - elimina N+1 queries
      // Single query com joins para carregar dados relacionados
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select(`
          id,
          clinic_id,
          contact_id,
          status,
          created_at,
          updated_at,
          contacts!inner (
            name,
            phone,
            email,
            status
          )
        `)
        .eq('clinic_id', clinicId)
        .order('updated_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('❌ Supabase error:', error);
        return res.status(500).json({ error: 'Erro ao buscar conversas' });
      }
      
      console.log('📊 Found conversations:', conversationsData?.length || 0);
      
      // ETAPA 1: Batch query para última mensagem e contagens
      // Evita N+1 queries por conversa individual
      const conversationIds = (conversationsData || []).map(c => c.id);
      
      // Batch load últimas mensagens
      const { data: lastMessages } = await supabase
        .from('messages')
        .select('conversation_id, content, timestamp')
        .in('conversation_id', conversationIds)
        .order('timestamp', { ascending: false });
      
      // Agrupa por conversation_id para pegar a última mensagem
      const lastMessageMap = {};
      lastMessages?.forEach(msg => {
        if (!lastMessageMap[msg.conversation_id]) {
          lastMessageMap[msg.conversation_id] = msg;
        }
      });

      // Format for frontend com dados otimizados - fix large ID handling
      const formattedConversations = (conversationsData || []).map(conv => ({
        id: conv.id.toString(), // Convert to string to preserve large numbers
        clinic_id: conv.clinic_id,
        contact_id: conv.contact_id,
        status: conv.status || 'active',
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        contact_name: conv.contacts?.name || `Contato ${conv.contact_id}`,
        contact_phone: conv.contacts?.phone || '',
        contact_email: conv.contacts?.email || '',
        contact_status: conv.contacts?.status || 'active',
        last_message: lastMessageMap[conv.id]?.content || 'Nenhuma mensagem ainda',
        last_message_at: lastMessageMap[conv.id]?.timestamp || conv.updated_at,
        total_messages: 0, // Será calculado se necessário
        unread_count: 0 // Será calculado dinamicamente quando necessário
      }));

      // ETAPA 3: Cache the result for next requests
      await redisCacheService.cacheConversations(clinicId, formattedConversations);
      console.log('💾 Cached conversations list for clinic:', clinicId);
      
      res.json({
        conversations: formattedConversations,
        total: formattedConversations.length,
        hasMore: false
      });

    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
      console.error('❌ Error details:', error.message);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // ETAPA 3: Enhanced conversation detail with Redis cache
  app.get('/api/conversations-simple/:id', async (req: Request, res: Response) => {
    try {
      // Fix: Handle large WhatsApp IDs properly
      const conversationIdParam = req.params.id;
      console.log('🔍 Raw conversation ID param:', conversationIdParam);
      
      // Fix: Use the raw string directly for database query to avoid parsing issues
      const conversationId = conversationIdParam;
      
      console.log('🔍 Using conversation ID as string:', conversationId);
      const clinicId = 1; // Hardcoded for testing
      
      // ETAPA 3: Try cache first
      const cachedDetail = await redisCacheService.getCachedConversationDetail(conversationId);
      if (cachedDetail) {
        console.log('🎯 Cache HIT: conversation detail', conversationId);
        return res.json(cachedDetail);
      }
      
      console.log('💽 Cache MISS: fetching conversation detail from database');

      console.log('🔍 Fetching conversation detail:', conversationId);

      // Use direct Supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Get conversation - use direct string comparison
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('clinic_id', clinicId)
        .single();

      if (convError || !conversation) {
        console.error('❌ Conversation not found:', convError);
        console.error('❌ Searched for ID:', conversationId, 'in clinic:', clinicId);
        
        // Debug: Let's check what conversations exist
        const { data: allConversations } = await supabase
          .from('conversations')
          .select('id, contact_id, clinic_id')
          .eq('clinic_id', clinicId);
        
        console.log('🔍 Available conversations:', allConversations);
      } else {
        // Conversation found, continue processing
        console.log('✅ Found conversation:', conversation.id);
      }

      // ETAPA 1: Paginação para mensagens (carrega apenas últimas 50)
      // Elimina problema de performance com conversas muito longas
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: false })
        .limit(50); // Paginação: apenas últimas 50 mensagens

      if (msgError) {
        console.error('❌ Error fetching messages:', msgError);
        return res.status(500).json({ error: 'Erro ao buscar mensagens' });
      }

      // Reordena mensagens para exibição cronológica
      const sortedMessages = (messages || []).reverse();

      // ETAPA 1: Batch load attachments - elimina N+1 queries
      // Single query para todos attachments da conversa
      const { data: attachments, error: attachError } = await supabase
        .from('message_attachments')
        .select('*')
        .in('message_id', sortedMessages.map(m => m.id))
        .eq('clinic_id', clinicId);
      
      const allAttachments = attachments || [];

      console.log('📨 Found messages:', sortedMessages.length);
      console.log('📎 Found attachments:', allAttachments.length);

      // ETAPA 1: Otimização de mapeamento de attachments 
      // Map otimizado para lookup O(1) em vez de nested loops
      const attachmentMap = new Map();
      allAttachments.forEach(attachment => {
        const messageId = attachment.message_id;
        if (!attachmentMap.has(messageId)) {
          attachmentMap.set(messageId, []);
        }
        attachmentMap.get(messageId).push(attachment);
      });

      // Get action notifications from database
      let actionNotifications = [];
      try {
        const { data: actionData, error: actionError } = await supabase
          .from('conversation_actions')
          .select('*')
          .eq('conversation_id', conversationId)
          .eq('clinic_id', conversation.clinic_id)
          .order('created_at', { ascending: true });

        if (actionError && (actionError.code === '42P01' || actionError.message?.includes('does not exist'))) {
          console.log('🔧 Table conversation_actions does not exist, creating sample actions...');
          
          if (conversationId === 4) {
            actionNotifications = [
              {
                id: 1,
                clinic_id: 1,
                conversation_id: 4,
                action_type: 'appointment_created',
                title: 'Consulta agendada',
                description: 'Consulta agendada para 25/06 às 10:00 com Dr. Caio Rodrigo',
                metadata: {
                  appointment_id: 123,
                  doctor_name: 'Dr. Caio Rodrigo',
                  date: '25/06',
                  time: '10:00',
                  specialty: 'Clínico Geral'
                },
                related_entity_type: 'appointment',
                related_entity_id: 123,
                created_at: '2025-06-23T20:30:00Z'
              },
              {
                id: 2,
                clinic_id: 1,
                conversation_id: 4,
                action_type: 'appointment_status_changed',
                title: 'Status da consulta alterado',
                description: 'Status da consulta alterado de Agendada para Confirmada',
                metadata: {
                  appointment_id: 123,
                  old_status: 'Agendada',
                  new_status: 'Confirmada',
                  doctor_name: 'Dr. Caio Rodrigo'
                },
                related_entity_type: 'appointment',
                related_entity_id: 123,
                created_at: '2025-06-23T20:35:00Z'
              }
            ];
            console.log('✅ Created sample actions for Pedro conversation');
          }
        } else if (!actionError) {
          actionNotifications = actionData || [];
        }
      } catch (error) {
        console.error('❌ Error handling action notifications:', error);
        actionNotifications = [];
      }

      console.log('📋 Found actions:', actionNotifications.length);

      // ETAPA 1: Format messages com Map otimizado - elimina filter() loops
      const finalFormattedMessages = sortedMessages.map(msg => {
        const msgAttachments = attachmentMap.get(msg.id) || [];
        
        // Determine message type based on attachments
        let messageType = 'text';
        if (msgAttachments.length > 0) {
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
          sender_name: msg.sender_type === 'professional' ? 'Caio Rodrigo' : 
                      msg.sender_type === 'ai' ? 'Mara AI' : 'Paciente',
          direction: msg.sender_type === 'professional' ? 'outbound' : 'inbound',
          message_type: messageType,
          created_at: msg.timestamp,
          attachments: msgAttachments
        };
      });

      const responseData = {
        conversation: conversation,
        messages: finalFormattedMessages,
        actions: actionNotifications
      };

      // ETAPA 3: Cache the result for next requests
      await redisCacheService.cacheConversationDetail(conversationId, responseData);
      console.log('💾 Cached conversation detail for:', conversationId);

      res.json(responseData);

    } catch (error) {
      console.error('❌ Error fetching conversation detail:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Simple send message
  app.post('/api/conversations-simple/:id/messages', async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      if (!content || !conversationId) {
        return res.status(400).json({ error: 'Conteúdo e ID da conversa são obrigatórios' });
      }

      console.log('📤 Sending message to conversation:', conversationId);

      // Use direct Supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Insert message
      const { data: newMessage, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'professional',
          content: content,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error inserting message:', error);
        return res.status(500).json({ error: 'Erro ao enviar mensagem' });
      }

      const formattedMessage = {
        id: newMessage.id,
        conversation_id: conversationId,
        content: content,
        sender_type: 'professional',
        sender_name: 'Caio Rodrigo',
        direction: 'outbound',
        message_type: 'text',
        created_at: newMessage.timestamp,
        attachments: []
      };

      // ETAPA 3: Invalidate cache after new message
      await redisCacheService.invalidateConversationDetail(conversationId);
      await redisCacheService.invalidateConversationCache(clinicId);
      console.log('🧹 Cache invalidated after new message');

      // ETAPA 2: Emit via WebSocket after message creation
      const webSocketServer = getWebSocketServer();
      if (webSocketServer) {
        await webSocketServer.emitNewMessage(conversationId, clinicId, {
          id: newMessage.id,
          conversation_id: conversationId,
          content: content,
          sender_type: 'professional',
          sender_name: 'Caio Rodrigo',
          message_type: 'text',
          created_at: newMessage.timestamp,
          attachments: []
        });
        console.log('🔗 Message emitted via WebSocket');
      }

      console.log('✅ Message sent successfully');

      res.status(201).json({ message: formattedMessage });

    } catch (error) {
      console.error('❌ Error sending message:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

}