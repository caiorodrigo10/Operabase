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
      
      // ETAPA 3: Try cache first (DISABLED for debugging first_message_at)
      // const cachedConversations = await redisCacheService.getCachedConversations(clinicId);
      // if (cachedConversations) {
      //   console.log('🎯 Cache HIT: conversations list');
      //   return res.json({ conversations: cachedConversations });
      // }
      
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
      console.log('🔍 Looking for messages in conversations:', conversationIds.length, 'conversations');
      
      // Batch load últimas mensagens de cada conversa (melhorada para garantir precisão)
      const { data: allMessages } = await supabase
        .from('messages')
        .select('conversation_id, content, timestamp, id')
        .in('conversation_id', conversationIds)
        .not('timestamp', 'is', null)
        .order('timestamp', { ascending: false })
        .order('id', { ascending: false });
      
      console.log('📨 Found last messages:', allMessages?.length || 0);
      
      // Batch load primeiras mensagens de cada conversa (mais antigas)
      const { data: firstMessages, error: firstMsgError } = await supabase
        .from('messages')
        .select('conversation_id, content, timestamp, id')
        .in('conversation_id', conversationIds)
        .not('timestamp', 'is', null)
        .order('timestamp', { ascending: true })
        .order('id', { ascending: true });
      
      console.log('📨 Found first messages result:', firstMessages?.length || 0, 'error:', firstMsgError?.message || 'none');
      
      // Agrupa por conversation_id para pegar APENAS a última mensagem real
      const lastMessageMap = {};
      allMessages?.forEach(msg => {
        if (!lastMessageMap[msg.conversation_id] && msg.timestamp) {
          // Usa timezone correto do Brasil (America/Sao_Paulo)
          const messageDate = new Date(msg.timestamp);
          const brasiliaTime = new Date(messageDate.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
          
          lastMessageMap[msg.conversation_id] = {
            ...msg,
            timestamp: brasiliaTime.toISOString(),
            original_timestamp: msg.timestamp // Manter original para debug
          };
        }
      });
      
      // Agrupa por conversation_id para pegar APENAS a primeira mensagem real (mais antiga)
      const firstMessageMap = {};
      console.log('🔍 Found first messages:', firstMessages?.length || 0);
      firstMessages?.forEach(msg => {
        if (!firstMessageMap[msg.conversation_id] && msg.timestamp) {
          // Usa timezone correto do Brasil (America/Sao_Paulo)
          const messageDate = new Date(msg.timestamp);
          const brasiliaTime = new Date(messageDate.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
          
          firstMessageMap[msg.conversation_id] = {
            ...msg,
            timestamp: brasiliaTime.toISOString(),
            original_timestamp: msg.timestamp // Manter original para debug
          };
        }
      });
      console.log('📊 First message map populated:', Object.keys(firstMessageMap).length, 'conversations');

      // Format for frontend com dados otimizados - fix large ID handling
      const formattedConversations = (conversationsData || []).map(conv => {
        const lastMsg = lastMessageMap[conv.id];
        const firstMsg = firstMessageMap[conv.id];
        const lastMessageTime = lastMsg?.timestamp || conv.created_at; // Use created_at only for conversations without messages
        const firstMessageTime = firstMsg?.timestamp || conv.created_at; // Use created_at for conversations without messages
        
        return {
          id: conv.id.toString(), // Convert to string to preserve large numbers
          clinic_id: conv.clinic_id,
          contact_id: conv.contact_id,
          status: conv.status || 'active',
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          contact_name: conv.contacts?.name || `Contato ${conv.contact_id}`,
          patient_name: conv.contacts?.name || `Contato ${conv.contact_id}`, // Frontend expects patient_name
          contact_phone: conv.contacts?.phone || '',
          contact_email: conv.contacts?.email || '',
          contact_status: conv.contacts?.status || 'active',
          last_message: lastMsg?.content || 'Nenhuma mensagem ainda',
          last_message_at: lastMessageTime,
          first_message_at: firstMessageTime, // Novo campo para primeira mensagem
          timestamp: lastMessageTime, // Fallback field for compatibility
          total_messages: 0, // Será calculado se necessário
          unread_count: 0 // Será calculado dinamicamente quando necessário
        };
      });

      // Ordenar conversas por timestamp da última mensagem (mais recente primeiro)
      formattedConversations.sort((a, b) => {
        const timeA = new Date(a.last_message_at).getTime();
        const timeB = new Date(b.last_message_at).getTime();
        return timeB - timeA; // Ordem decrescente (mais recente primeiro)
      });

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

  // NOVO: Endpoint para invalidar cache e reordenar conversas em tempo real
  app.patch('/api/conversations-simple/:id/update-timestamp', async (req: Request, res: Response) => {
    try {
      const conversationId = req.params.id;
      const clinicId = 1; // Hardcoded for testing
      
      console.log('🔄 Invalidating cache for conversation update:', conversationId);
      
      // Invalidar cache Redis para forçar reload
      await redisCacheService.invalidateConversations(clinicId);
      
      // ETAPA 2: Cache invalidation para reordenação automática
      console.log('📡 Cache invalidated for real-time conversation reordering');
      
      res.json({ success: true, message: 'Conversation timestamp updated' });
      
    } catch (error) {
      console.error('❌ Error updating conversation timestamp:', error);
      res.status(500).json({ error: 'Erro ao atualizar timestamp da conversa' });
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
          evolution_status: msg.evolution_status || 'sent',
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
        // Usar diretamente o actualConversationId que já foi encontrado corretamente
        console.log('💾 Using actualConversationId directly:', actualConversationId);
        console.log('💾 Type of actualConversationId:', typeof actualConversationId);
        
        // Para IDs científicos, usar o valor como string para preservar precisão
        const insertConversationId = typeof actualConversationId === 'number' && actualConversationId.toString().includes('e+') 
          ? actualConversationId.toString() 
          : actualConversationId;
        
        console.log('💾 Using conversation_id for insert:', insertConversationId);
        
        // Função para obter timestamp no horário de Brasília
        const getBrasiliaTimestamp = () => {
          const now = new Date();
          const brasiliaOffset = -3 * 60; // GMT-3 em minutos
          const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
          const brasiliaTime = new Date(utcTime + (brasiliaOffset * 60000));
          return brasiliaTime.toISOString();
        };

        const { data: insertResult, error: insertError } = await supabase
          .from('messages')
          .insert({
            conversation_id: insertConversationId,
            sender_type: 'professional',
            content: content,
            timestamp: getBrasiliaTimestamp(),
            device_type: 'manual',
            evolution_status: 'pending'
          })
          .select()
          .single();
        
        console.log('💾 Insert attempt with conversation_id:', insertConversationId);
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
          timestamp: getBrasiliaTimestamp(),
          evolution_status: newMessage.evolution_status || 'pending',
          attachments: []
        };
        
      } catch (dbError) {
        console.error('❌ Database insert error:', dbError);
        return res.status(500).json({ 
          error: 'Erro ao salvar mensagem',
          details: dbError.message
        });
      }

      // 🎯 INTEGRAÇÃO N8N: Salvar na tabela n8n_chat_messages
      console.log('🔗 Iniciando integração N8N para mensagem ID:', formattedMessage.id);
      
      setImmediate(async () => {
        try {
          console.log('📋 N8N Integration: Coletando dados para session_id...');
          
          // Buscar telefone do contato
          const contactPhone = actualConversation.contacts?.phone;
          if (!contactPhone) {
            console.log('⚠️ N8N Integration: Telefone do contato não encontrado, pulando integração');
            return;
          }
          
          // Buscar número WhatsApp da clínica
          const { data: clinicWhatsApp, error: whatsappError } = await supabase
            .from('whatsapp_numbers')
            .select('phone_number')
            .eq('clinic_id', 1)
            .eq('status', 'open')
            .limit(1)
            .single();
          
          if (whatsappError || !clinicWhatsApp) {
            console.log('⚠️ N8N Integration: Número WhatsApp da clínica não encontrado:', whatsappError?.message);
            return;
          }
          
          // Formatar session_id: "CONTACT_NUMBER-RECEIVING_NUMBER"
          const sessionId = `${contactPhone}-${clinicWhatsApp.phone_number}`;
          console.log('🆔 N8N Integration: Session ID formatado:', sessionId);
          
          // Criar estrutura de mensagem conforme especificação
          const n8nMessage = {
            type: "human",
            content: content,
            additional_kwargs: {},
            response_metadata: {}
          };
          
          console.log('💾 N8N Integration: Salvando mensagem na tabela n8n_chat_messages...');
          
          // Inserir na tabela n8n_chat_messages usando Supabase client
          const { data: insertResult, error: insertError } = await supabase
            .from('n8n_chat_messages')
            .insert({
              session_id: sessionId,
              message: n8nMessage
            })
            .select()
            .single();
          
          if (insertError) {
            console.error('❌ N8N Integration: Erro ao inserir no Supabase:', insertError);
            throw new Error(`Supabase insert error: ${insertError.message}`);
          }
          
          console.log('✅ N8N Integration: Mensagem salva com sucesso!', {
            n8n_id: insertResult?.id,
            session_id: sessionId,
            content_preview: content.substring(0, 50) + '...'
          });
          
        } catch (n8nError) {
          console.error('❌ N8N Integration: Erro ao salvar mensagem:', {
            error: n8nError.message,
            stack: n8nError.stack,
            message_id: formattedMessage.id
          });
          
          // Não interrompe o fluxo principal - integração N8N é opcional
        }
      });

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

      // Enviar para Evolution API em background usando instância ativa da clínica
      setImmediate(async () => {
        try {
          console.log('🔧 Starting Evolution API send process for message ID:', formattedMessage.id);
          
          // Buscar instância WhatsApp ativa da clínica (status "open")
          const { data: activeInstance, error: instanceError } = await supabase
            .from('whatsapp_numbers')
            .select('*')
            .eq('clinic_id', clinicId)
            .eq('status', 'open')
            .limit(1)
            .single();

          if (instanceError) {
            console.error('❌ Error fetching WhatsApp instance:', instanceError);
            
            // NÃO marcar como failed - é erro de configuração, não falha da Evolution API  
            console.log('📝 Message ID', formattedMessage.id, 'mantém status "pending" - erro de configuração de instância');
            return;
          }

          if (!activeInstance) {
            console.error('❌ No active WhatsApp instance found for clinic:', clinicId);
            
            // Marcar mensagem como falha se não houver instância ativa
            await supabase
              .from('messages')
              .update({ evolution_status: 'failed' })
              .eq('id', formattedMessage.id);
            
            return;
          }

          console.log('✅ Active WhatsApp instance found:', {
            instance_name: activeInstance.instance_name,
            phone_number: activeInstance.phone_number,
            status: activeInstance.status
          });

          // Buscar informações de contato para o número de destino
          const { data: conversationWithContact, error: contactError } = await supabase
            .from('conversations')
            .select(`
              id,
              clinic_id,
              contact_id,
              contacts (
                name,
                email,
                phone
              )
            `)
            .eq('id', insertConversationId)
            .single();

          console.log('🔍 Conversation lookup result:', {
            insertConversationId,
            found: !!conversationWithContact,
            phone: conversationWithContact?.contacts?.phone,
            error: contactError
          });

          if (contactError) {
            console.error('❌ Error fetching conversation contact:', contactError);
            
            // NÃO marcar como failed - é erro de configuração, não falha da Evolution API
            console.log('📝 Message ID', formattedMessage.id, 'mantém status "pending" - erro de configuração de contato');
            return;
          }

          if (!conversationWithContact?.contacts?.phone) {
            console.error('❌ No contact phone found for conversation:', insertConversationId);
            
            const { error: failError } = await supabase
              .from('messages')
              .update({ evolution_status: 'failed' })
              .eq('id', formattedMessage.id);
            
            if (failError) {
              console.error('❌ Error updating to failed:', failError);
            } else {
              console.log('✅ Message marked as failed - no phone');
            }
            
            return;
          }

          console.log('📤 Sending to Evolution API with clinic instance...', {
            phone: conversationWithContact.contacts.phone,
            instance: activeInstance.instance_name,
            content: content.substring(0, 50) + '...'
          });
          
          const evolutionUrl = process.env.EVOLUTION_API_URL || 'https://n8n-evolution-api.4gmy9o.easypanel.host';
          const evolutionApiKey = process.env.EVOLUTION_API_KEY;
          
          // Usar formato exato do N8N com instância da clínica
          const response = await fetch(`${evolutionUrl}/message/sendText/${activeInstance.instance_name}`, {
            method: 'POST',
            headers: {
              'apikey': evolutionApiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              number: conversationWithContact.contacts.phone,
              text: content
            })
          });

            if (response.ok) {
              const result = await response.json();
              console.log('✅ Evolution API success:', result);
              console.log('ℹ️ Mantendo status "pending" - assumindo sucesso (não atualizamos para "sent")');
              
            } else {
              const errorText = await response.text();
              console.error('❌ Evolution API confirmou falha:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
              });
              
              // ÚNICO caso onde marcamos como 'failed' - Evolution API confirmou falha
              const { error: updateError } = await supabase
                .from('messages')
                .update({ evolution_status: 'failed' })
                .eq('id', formattedMessage.id);
              
              if (updateError) {
                console.error('❌ Error updating message status to failed:', updateError);
              } else {
                console.log('🚨 Message marcada como FAILED - Evolution API confirmou falha definitiva');
                
                // Invalidate cache para mostrar ícone de falha imediatamente
                await redisCacheService.invalidateConversationDetail(insertConversationId.toString());
                console.log('🧹 Cache invalidated - ícone de falha aparecerá imediatamente');
              }
            }
          } catch (error) {
            console.error('⚠️ Evolution API erro de conexão/rede:', error.message);
            console.log('ℹ️ Mantendo status "pending" - Evolution API não respondeu definitivamente');
            
            // NÃO marcar como falha - apenas erro de rede/conexão
            // Mensagem pode ter sido enviada mesmo com erro de resposta
            console.log('📝 Message ID', formattedMessage.id, 'mantém status "pending" - sem confirmação definitiva da Evolution');
          }
        });

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