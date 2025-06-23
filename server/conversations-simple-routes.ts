import { Request, Response } from 'express';
import { IStorage } from './storage';

export function setupSimpleConversationsRoutes(app: any, storage: IStorage) {
  
  // Simple conversations list - hardcoded clinic ID for testing
  app.get('/api/conversations-simple', async (req: Request, res: Response) => {
    try {
      const clinicId = 1; // Hardcoded for testing
      
      console.log('🔍 Fetching conversations for clinic:', clinicId);
      
      const conversationsResult = await storage.db.execute(`
        SELECT 
          c.id, c.clinic_id, c.contact_id, c.status, c.created_at, c.updated_at,
          contacts.name as contact_name, 
          contacts.phone as contact_phone, 
          contacts.email as contact_email,
          COUNT(m.id) as total_messages,
          COUNT(CASE WHEN m.sender_type = 'patient' THEN 1 END) as unread_count
        FROM conversations c
        LEFT JOIN contacts ON c.contact_id = contacts.id
        LEFT JOIN messages m ON c.id = m.conversation_id
        WHERE c.clinic_id = ${clinicId}
        GROUP BY c.id, c.clinic_id, c.contact_id, c.status, c.created_at, c.updated_at,
                 contacts.name, contacts.phone, contacts.email
        ORDER BY c.created_at DESC
        LIMIT 50;
      `);
      
      console.log('📊 Found conversations:', conversationsResult.rows.length);
      
      res.json({
        conversations: conversationsResult.rows,
        total: conversationsResult.rows.length,
        hasMore: false
      });

    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
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