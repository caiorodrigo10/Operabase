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

      // Get conversation
      const conversationResult = await storage.db.execute(`
        SELECT * FROM conversations 
        WHERE id = ${conversationId} AND clinic_id = ${clinicId}
        LIMIT 1;
      `);

      if (!conversationResult.rows.length) {
        return res.status(404).json({ error: 'Conversa não encontrada' });
      }

      // Get messages
      const messagesResult = await storage.db.execute(`
        SELECT * FROM messages 
        WHERE conversation_id = ${conversationId}
        ORDER BY timestamp ASC;
      `);

      console.log('📨 Found messages:', messagesResult.rows.length);

      // Format messages for frontend
      const messages = messagesResult.rows.map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        content: msg.content,
        sender_type: msg.sender_type,
        sender_name: msg.sender_type === 'professional' ? 'Caio Rodrigo' : 'Paciente',
        direction: msg.sender_type === 'professional' ? 'outbound' : 'inbound',
        message_type: 'text',
        created_at: msg.timestamp,
        attachments: []
      }));

      res.json({
        conversation: conversationResult.rows[0],
        messages: messages
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

      // Insert message
      const messageResult = await storage.db.execute(`
        INSERT INTO messages (conversation_id, sender_type, content, timestamp)
        VALUES (${conversationId}, 'professional', '${content.replace(/'/g, "''")}', NOW())
        RETURNING *;
      `);

      const newMessage = {
        id: messageResult.rows[0].id,
        conversation_id: conversationId,
        content: content,
        sender_type: 'professional',
        sender_name: 'Caio Rodrigo',
        direction: 'outbound',
        message_type: 'text',
        created_at: messageResult.rows[0].timestamp,
        attachments: []
      };

      console.log('✅ Message sent successfully');

      res.status(201).json({ message: newMessage });

    } catch (error) {
      console.error('❌ Error sending message:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

}