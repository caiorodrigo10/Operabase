import { Request, Response } from 'express';
import { IStorage } from './storage';
import { redisCacheService } from './services/redis-cache.service';
import { EvolutionMessageService } from './services/evolution-message.service';

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
      
      // Fix: Handle scientific notation by directly using contact lookup for Igor's conversation
      let conversationId = conversationIdParam;
      const isScientificNotation = conversationIdParam.includes('e+') || conversationIdParam.includes('E+');
      
      console.log('🔍 Processing conversation ID:', conversationIdParam, 'Scientific notation:', isScientificNotation);
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

      // Handle large WhatsApp IDs with scientific notation directly
      let conversation, convError;
      
      if (isScientificNotation) {
        console.log('🔍 Scientific notation detected, finding conversation by robust matching');
        // Para IDs científicos, buscar primeiro todas as conversas e fazer match robusto
        const { data: allConversations } = await supabase
          .from('conversations')
          .select('*')
          .eq('clinic_id', clinicId);
        
        // Múltiplas estratégias de match para garantir encontrar a conversa correta
        const paramIdNum = parseFloat(conversationId);
        
        conversation = allConversations?.find(conv => {
          const convIdStr = conv.id.toString();
          const convIdNum = parseFloat(convIdStr);
          
          // Estratégia 1: Comparação direta com tolerância
          if (Math.abs(convIdNum - paramIdNum) < 1) return true;
          
          // Estratégia 2: Comparação de strings científicas
          if (convIdStr === conversationId) return true;
          
          // Estratégia 3: Comparação de exponenciais
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
          .select('*')
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
      
      // Update conversationId to use the actual database ID
      const actualConversationId = conversation.id;
      console.log('✅ Found conversation:', actualConversationId);

      // ETAPA 1: Paginação para mensagens (carrega apenas últimas 50)
      // Elimina problema de performance com conversas muito longas
      // Fix: Usar sempre o ID real da conversa encontrada no banco com busca robusta
      const queryConversationId = actualConversationId;
      
      // Para IDs científicos, usar busca mais robusta que considera precisão numérica
      let messages, msgError;
      
      if (isScientificNotation) {
        // Busca todas as mensagens e filtra por proximidade numérica
        const { data: allMessages, error: allMsgError } = await supabase
          .from('messages')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(200); // Busca mais para filtrar
        
        const targetIdNum = parseFloat(queryConversationId.toString());
        messages = allMessages?.filter(msg => {
          const msgIdNum = parseFloat(msg.conversation_id.toString());
          return Math.abs(msgIdNum - targetIdNum) < 1;
        }).slice(0, 50); // Limita a 50 após filtrar
        
        msgError = allMsgError;
      } else {
        const { data: directMessages, error: directError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', queryConversationId)
          .order('timestamp', { ascending: false })
          .limit(50);
        
        messages = directMessages;
        msgError = directError;
      }

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
          .eq('conversation_id', queryConversationId)
          .eq('clinic_id', conversation.clinic_id)
          .order('timestamp', { ascending: true });

        if (actionError && (actionError.code === '42P01' || actionError.message?.includes('does not exist'))) {
          console.log('🔧 Table conversation_actions does not exist, generating from appointment logs...');
          
          // Generate actions from appointment logs for this contact
          const { data: appointmentLogs } = await supabase
            .from('system_logs')
            .select('*')
            .eq('entity_type', 'appointment')
            .eq('related_entity_id', conversation.contact_id)
            .eq('clinic_id', conversation.clinic_id)
            .eq('action_type', 'created')
            .order('created_at', { ascending: true });

          if (appointmentLogs && appointmentLogs.length > 0) {
            actionNotifications = appointmentLogs.map((log, index) => {
              const appointmentData = log.new_data;
              const scheduledDate = new Date(appointmentData.scheduled_date);
              
              return {
                id: `log_${log.id}`,
                clinic_id: log.clinic_id,
                conversation_id: queryConversationId,
                action_type: 'appointment_created',
                title: 'Consulta agendada',
                description: `Consulta agendada para ${scheduledDate.toLocaleDateString('pt-BR')} às ${scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${appointmentData.specialty || 'Consulta médica'}`,
                metadata: {
                  appointment_id: appointmentData.id,
                  doctor_name: 'Dr. João Silva',
                  date: scheduledDate.toLocaleDateString('pt-BR'),
                  time: scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                  specialty: appointmentData.specialty || 'Consulta médica'
                },
                related_entity_type: 'appointment',
                related_entity_id: appointmentData.id,
                timestamp: log.created_at
              };
            });
            console.log(`✅ Generated ${actionNotifications.length} actions from appointment logs for contact ${conversation.contact_id}`);
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
          timestamp: msg.timestamp,
          attachments: msgAttachments
        };
      });

      const responseData = {
        conversation: conversation,
        messages: finalFormattedMessages,
        actions: actionNotifications
      };

      // ETAPA 3: Cache the result for next requests
      await redisCacheService.cacheConversationDetail(actualConversationId, responseData);
      console.log('💾 Cached conversation detail for:', actualConversationId);

      res.json(responseData);

    } catch (error) {
      console.error('❌ Error fetching conversation detail:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Simple send message with Evolution API integration
  app.post('/api/conversations-simple/:id/messages', async (req: Request, res: Response) => {
    try {
      const conversationId = req.params.id; // Keep as string to handle large IDs
      const { content } = req.body;

      if (!content || !conversationId) {
        return res.status(400).json({ error: 'Conteúdo e ID da conversa são obrigatórios' });
      }

      console.log('📤 Sending message to conversation:', conversationId);

      // Primeiro salvar no banco de dados
      console.log('💾 Saving message to database first for instant UI update');

      // Use direct Supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Handle large conversation IDs (Igor's case)
      const isScientificNotation = typeof conversationId === 'string' && 
        conversationId.includes('e+');
      
      // Buscar a conversa real no banco usando o mesmo método do GET
      console.log('🔍 Looking up conversation in database for ID:', conversationId);
      
      let actualConversation;
      
      if (isScientificNotation) {
        // Para IDs científicos, usar o mesmo método do GET endpoint
        console.log('🔍 Scientific notation detected, finding conversation by robust matching');
        const { data: allConversations } = await supabase
          .from('conversations')
          .select('id, contact_id, contacts!inner(name, phone)')
          .eq('clinic_id', 1);
        
        const paramIdNum = parseFloat(conversationId);
        
        actualConversation = allConversations?.find(conv => {
          const convIdStr = conv.id.toString();
          const convIdNum = parseFloat(convIdStr);
          
          // Mesma estratégia de match do GET
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
        // Para IDs normais, buscar diretamente
        const { data: directConv } = await supabase
          .from('conversations')
          .select('id, contact_id, contacts!inner(name, phone)')
          .eq('id', conversationId)
          .eq('clinic_id', 1)
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
        actualIdType: typeof actualConversationId,
        contact: actualConversation.contacts.name,
        phone: actualConversation.contacts.phone
      });

      // Usar padrão das mensagens da AI (sem clinic_id)
      console.log('💾 Inserting message following AI message pattern');
      
      let formattedMessage;
      
      try {
        // Usar o target contact_id como conversation_id (padrão atual)
        const targetContactId = actualConversation.contact_id;
        console.log('💾 Attempting insert with targetContactId:', targetContactId);
        
        const { data: insertResult, error: insertError } = await supabase
          .from('messages')
          .insert({
            conversation_id: targetContactId,
            sender_type: 'professional',
            content: content
          })
          .select()
          .single();
        
        console.log('💾 Insert result:', { insertResult, insertError });
        console.log('💾 Insert error details:', JSON.stringify(insertError, null, 2));
        
        if (insertError) {
          console.error('❌ Supabase insert error details:', {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code
          });
          throw new Error(`Database error: ${insertError.message} - ${insertError.details || ''}`);
        }
        
        if (!insertResult) {
          console.error('❌ No result but no error - unexpected');
          throw new Error('No result returned from insert');
        }
        
        const newMessage = insertResult;
        
        console.log('✅ Message inserted successfully:', newMessage.id);

        formattedMessage = {
          id: newMessage.id,
          conversation_id: actualConversationId,
          content: content,
          sender_type: 'professional',
          sender_name: 'Caio Rodrigo',
          direction: 'outbound',
          message_type: 'text',
          timestamp: newMessage.timestamp.toISOString(),
          attachments: []
        };
        
      } catch (dbError) {
        console.error('❌ Database insert error:', dbError);
        return res.status(500).json({ 
          error: 'Erro ao salvar mensagem',
          details: dbError.message
        });
      }

      // ETAPA 3: Invalidate cache after new message
      const clinicId = 1; // Define clinic ID for cache invalidation
      const requestedConversationId = req.params.id;
      await redisCacheService.invalidateConversationDetail(requestedConversationId);
      await redisCacheService.invalidateConversationCache(clinicId);
      console.log('🧹 Cache invalidated after new message');

      // ETAPA 2: Emit via WebSocket after message creation
      const webSocketServer = getWebSocketServer();
      if (webSocketServer) {
        await webSocketServer.emitNewMessage(actualConversationId, clinicId, formattedMessage);
        console.log('🔗 Message emitted via WebSocket');
      }

      // Enviar para WhatsApp em background (não bloquear resposta)
      setImmediate(async () => {
        try {
          const evolutionService = new EvolutionMessageService(storage);
          const evolutionResult = await evolutionService.sendTextMessage(req.params.id, content);
          
          if (evolutionResult.success) {
            console.log('✅ WhatsApp message sent successfully in background');
          } else {
            console.error('❌ Background WhatsApp send failed:', evolutionResult.error);
          }
        } catch (error) {
          console.error('❌ Background WhatsApp send error:', error);
        }
      });

      // Enviar para Evolution API em background usando referência do N8N
      if (actualConversation?.contacts?.phone) {
        setImmediate(async () => {
          try {
            console.log('📤 Sending to Evolution API with N8N format...', {
              phone: actualConversation.contacts.phone,
              content: content.substring(0, 50) + '...'
            });
            
            const evolutionUrl = 'https://n8n-evolution-api.4gmy9o.easypanel.host';
            const evolutionApiKey = process.env.EVOLUTION_API_KEY;
            const instanceName = 'Igor Avantto';
            
            // Usar formato exato do N8N
            const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
              method: 'POST',
              headers: {
                'apikey': evolutionApiKey,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                number: actualConversation.contacts.phone,
                text: content
              })
            });

            if (response.ok) {
              const result = await response.json();
              console.log('✅ Evolution API success:', result);
            } else {
              const errorText = await response.text();
              console.error('❌ Evolution API error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
              });
            }
          } catch (error) {
            console.error('❌ Evolution API network error:', error.message);
          }
        });
      }

      console.log('✅ Message saved to database, WhatsApp sending in background');

      res.status(201).json({ 
        success: true,
        message: formattedMessage,
        sent_to_whatsapp: !!actualConversation?.contacts?.phone
      });

    } catch (error) {
      console.error('❌ Error sending message details:', {
        message: error.message,
        stack: error.stack,
        requestedId: req.params.id,
        content: req.body.content
      });
      res.status(500).json({ 
        error: 'Erro interno do servidor', 
        details: error.message,
        conversationId: req.params.id 
      });
    }
  });

}