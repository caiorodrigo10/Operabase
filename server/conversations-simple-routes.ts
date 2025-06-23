import { Request, Response } from 'express';
import { IStorage } from './storage';

export function setupSimpleConversationsRoutes(app: any, storage: IStorage) {
  
  // Simple conversations list with real contact data
  app.get('/api/conversations-simple', async (req: Request, res: Response) => {
    try {
      const clinicId = 1; // Hardcoded for testing
      
      console.log('🔍 Fetching conversations for clinic:', clinicId);
      
      // Use direct Supabase client to get conversations with contact info
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      // Get conversations with contact information
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select(`
          id,
          clinic_id,
          contact_id,
          status,
          created_at,
          updated_at,
          contacts (
            name,
            phone,
            email
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
      
      // Format for frontend
      const formattedConversations = (conversationsData || []).map(conv => ({
        id: conv.id,
        clinic_id: conv.clinic_id,
        contact_id: conv.contact_id,
        status: conv.status || 'active',
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        contact_name: conv.contacts?.name || `Contato ${conv.contact_id}`,
        contact_phone: conv.contacts?.phone || '',
        contact_email: conv.contacts?.email || '',
        total_messages: 0,
        unread_count: 0
      }));
      
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

  // Simple conversation detail
  app.get('/api/conversations-simple/:id', async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const clinicId = 1; // Hardcoded for testing

      console.log('🔍 Fetching conversation detail:', conversationId);

      // Use direct Supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Get conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('clinic_id', clinicId)
        .single();

      if (convError || !conversation) {
        console.error('❌ Conversation not found:', convError);
        return res.status(404).json({ error: 'Conversa não encontrada' });
      }

      // Get messages first
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (msgError) {
        console.error('❌ Error fetching messages:', msgError);
        return res.status(500).json({ error: 'Erro ao buscar mensagens' });
      }

      // Get all attachments for this conversation
      const { data: attachments, error: attachError } = await supabase
        .from('message_attachments')
        .select('*')
        .eq('clinic_id', 1); // Get all attachments for clinic
      
      const allAttachments = attachments || [];

      console.log('📨 Found messages:', messages?.length || 0);
      console.log('📎 Found attachments:', allAttachments.length);

      // Get action notifications for this conversation
      let actionNotifications = [];
      if (conversationId === 4) { // Pedro's conversation - add sample actions
        actionNotifications = [
          {
            id: 1,
            conversation_id: 4,
            action_type: 'appointment_created',
            title: 'Consulta agendada',
            description: 'Consulta agendada para 25/06 às 10:00 com Dr. Caio Rodrigo',
            metadata: {
              appointment_id: 123,
              doctor_name: 'Dr. Caio Rodrigo',
              date: '25/06/2025',
              time: '10:00',
              specialty: 'Clínico Geral'
            },
            related_entity_type: 'appointment',
            related_entity_id: 123,
            created_at: new Date('2025-06-23T20:30:00Z').toISOString()
          },
          {
            id: 2,
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
            created_at: new Date('2025-06-23T20:35:00Z').toISOString()
          }
        ];
      }

      console.log('📋 Found actions:', actionNotifications.length);

      // Format messages for frontend
      const formattedMessages = (messages || []).map(msg => {
        // Find attachments for this message
        const msgAttachments = allAttachments.filter(att => att.message_id === msg.id);
        
        // Determine message type based on attachments
        let messageType = 'text';
        if (msgAttachments.length > 0) {
          const attachment = msgAttachments[0];
          if (attachment.file_type.startsWith('image/')) messageType = 'image';
          else if (attachment.file_type.startsWith('audio/')) messageType = 'audio';
          else if (attachment.file_type.startsWith('video/')) messageType = 'video';
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

      res.json({
        conversation: conversation,
        messages: formattedMessages,
        actions: actionNotifications
      });

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

      console.log('✅ Message sent successfully');

      res.status(201).json({ message: formattedMessage });

    } catch (error) {
      console.error('❌ Error sending message:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

}