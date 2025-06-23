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

      // Get messages with attachments
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select(`
          *,
          message_attachments (
            id,
            file_name,
            file_type,
            file_size,
            file_url,
            thumbnail_url,
            duration,
            width,
            height
          )
        `)
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (msgError) {
        console.error('❌ Error fetching messages:', msgError);
        return res.status(500).json({ error: 'Erro ao buscar mensagens' });
      }

      console.log('📨 Found messages:', messages?.length || 0);

      // Format messages for frontend
      const formattedMessages = (messages || []).map(msg => {
        // Determine message type based on attachments
        let messageType = 'text';
        if (msg.message_attachments && msg.message_attachments.length > 0) {
          const attachment = msg.message_attachments[0];
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
          attachments: msg.message_attachments || []
        };
      });

      res.json({
        conversation: conversation,
        messages: formattedMessages
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