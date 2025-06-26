import { Request, Response } from 'express';
import { IStorage } from './storage';
import { isAuthenticated } from './auth';
import { 
  conversations, messages, message_attachments,
  insertConversationSchema, insertMessageSchema, insertMessageAttachmentSchema,
  Conversation, Message, MessageAttachment
} from '../shared/schema';
import { eq, and, desc, asc, count, sql } from 'drizzle-orm';
import { systemLogsService } from './services/system-logs.service';

export function setupConversationsRoutes(app: any, storage: IStorage) {
  
  // ================================================================
  // CONVERSATIONS MANAGEMENT
  // ================================================================

  // Listar todas as conversas da clínica
  app.get('/api/conversations', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get clinic ID from authenticated user
      const user = req.user as any;
      console.log('🔍 Authenticated user:', user);
      
      // Try to get clinic ID from user session or database
      let clinicId = user?.clinic_id || user?.clinicId;
      
      if (!clinicId) {
        const clinicResult = await storage.db.execute(`
          SELECT clinic_id FROM clinic_users WHERE user_id = '${user.id}' LIMIT 1;
        `);
        clinicId = clinicResult.rows[0]?.clinic_id;
      }
      
      console.log('🏥 Clinic ID found:', clinicId);
      if (!clinicId) {
        return res.status(400).json({ error: 'Clinic ID é obrigatório' });
      }

      const { status = 'active', limit = 50, offset = 0 } = req.query;

      // Buscar conversas simples usando SQL direto para evitar problemas de schema
      const conversationsResult = await storage.db.execute(`
        SELECT 
          c.id, c.clinic_id, c.contact_id, c.status, c.ai_active, c.created_at, c.updated_at,
          contacts.name as contact_name, 
          contacts.phone as contact_phone, 
          contacts.email as contact_email,
          COUNT(m.id) as total_messages,
          COUNT(CASE WHEN m.sender_type = 'patient' THEN 1 END) as unread_count
        FROM conversations c
        LEFT JOIN contacts ON c.contact_id = contacts.id
        LEFT JOIN messages m ON c.id = m.conversation_id
        WHERE c.clinic_id = ${clinicId}
        ${status !== 'all' ? `AND c.status = '${status}'` : ''}
        GROUP BY c.id, c.clinic_id, c.contact_id, c.status, c.ai_active, c.created_at, c.updated_at,
                 contacts.name, contacts.phone, contacts.email
        ORDER BY c.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset};
      `);
      
      const conversationsList = conversationsResult.rows;

      res.json({
        conversations: conversationsList,
        total: conversationsList.length,
        hasMore: conversationsList.length === Number(limit)
      });

    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Buscar conversa específica com mensagens
  app.get('/api/conversations/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const conversationId = parseInt(req.params.id);

      // Get clinic ID
      let clinicId = user?.clinic_id || user?.clinicId;
      if (!clinicId) {
        const clinicResult = await storage.db.execute(`
          SELECT clinic_id FROM clinic_users WHERE user_id = '${user.id}' LIMIT 1;
        `);
        clinicId = clinicResult.rows[0]?.clinic_id;
      }

      if (!clinicId || !conversationId) {
        return res.status(400).json({ error: 'Parâmetros inválidos' });
      }

      // Buscar conversa usando SQL direto
      const conversationResult = await storage.db.execute(`
        SELECT * FROM conversations 
        WHERE id = ${conversationId} AND clinic_id = ${clinicId}
        LIMIT 1;
      `);

      if (!conversationResult.rows.length) {
        return res.status(404).json({ error: 'Conversa não encontrada' });
      }

      // Buscar mensagens da conversa
      const messagesResult = await storage.db.execute(`
        SELECT * FROM messages 
        WHERE conversation_id = ${conversationId}
        ORDER BY timestamp ASC;
      `);

      // Simular estrutura esperada pelo frontend
      const messages = messagesResult.rows.map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        content: msg.content,
        sender_type: msg.sender_type,
        sender_name: msg.sender_type === 'professional' ? user.name : 'Paciente',
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
      console.error('Erro ao buscar conversa:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Criar nova conversa
  app.post('/api/conversations', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = req.session.user?.clinicId;
      const userId = req.session.user?.id;

      if (!clinicId) {
        return res.status(400).json({ error: 'Clinic ID é obrigatório' });
      }

      const validatedData = insertConversationSchema.parse({
        ...req.body,
        clinic_id: clinicId
      });

      // Verificar se já existe conversa ativa para este contato
      const existingConversation = await storage.db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.clinic_id, clinicId),
            eq(conversations.contact_id, validatedData.contact_id),
            eq(conversations.status, 'active')
          )
        )
        .limit(1);

      if (existingConversation.length > 0) {
        return res.json({
          conversation: existingConversation[0],
          isExisting: true
        });
      }

      // Criar nova conversa
      const newConversation = await storage.db
        .insert(conversations)
        .values(validatedData)
        .returning();

      // Log da criação
      await systemLogsService.logAction({
        clinic_id: clinicId,
        entity_type: 'conversation',
        entity_id: newConversation[0].id,
        action_type: 'created',
        actor_id: userId,
        actor_type: 'professional',
        new_data: validatedData,
        source: 'web'
      });

      res.status(201).json({
        conversation: newConversation[0],
        isExisting: false
      });

    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // ================================================================
  // MESSAGES MANAGEMENT
  // ================================================================

  // Enviar nova mensagem
  app.post('/api/conversations/:id/messages', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = req.session.user?.clinicId;
      const userId = req.session.user?.id;
      const conversationId = parseInt(req.params.id);

      if (!clinicId || !conversationId) {
        return res.status(400).json({ error: 'Parâmetros inválidos' });
      }

      const validatedMessage = insertMessageSchema.parse({
        ...req.body,
        clinic_id: clinicId,
        conversation_id: conversationId,
        sender_type: 'professional',
        sender_id: userId,
        direction: 'outbound'
      });

      // Inserir mensagem
      const newMessage = await storage.db
        .insert(messages)
        .values(validatedMessage)
        .returning();

      // Atualizar counters da conversa
      await storage.db
        .update(conversations)
        .set({
          total_messages: sql`total_messages + 1`,
          last_message_at: new Date(),
          last_activity_at: new Date(),
          updated_at: new Date()
        })
        .where(eq(conversations.id, conversationId));

      // Log da mensagem
      await systemLogsService.logAction({
        clinic_id: clinicId,
        entity_type: 'message',
        entity_id: newMessage[0].id,
        action_type: 'sent',
        actor_id: userId,
        actor_type: 'professional',
        new_data: validatedMessage,
        source: 'web'
      });

      res.status(201).json({ message: newMessage[0] });

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Receber mensagem do webhook N8N/WhatsApp
  app.post('/api/webhook/whatsapp/message', async (req: Request, res: Response) => {
    try {
      const { clinicId, contactPhone, content, whatsappData, messageType = 'text' } = req.body;

      if (!clinicId || !contactPhone || !content) {
        return res.status(400).json({ error: 'Dados obrigatórios em falta' });
      }

      // Buscar ou criar contato
      const contact = await storage.db
        .select()
        .from(sql`contacts`)
        .where(
          and(
            eq(sql`contacts.clinic_id`, clinicId),
            eq(sql`contacts.phone`, contactPhone)
          )
        )
        .limit(1);

      if (!contact.length) {
        return res.status(404).json({ error: 'Contato não encontrado' });
      }

      // Buscar ou criar conversa
      let conversation = await storage.db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.clinic_id, clinicId),
            eq(conversations.contact_id, contact[0].id),
            eq(conversations.status, 'active')
          )
        )
        .limit(1);

      if (!conversation.length) {
        const newConv = await storage.db
          .insert(conversations)
          .values({
            clinic_id: clinicId,
            contact_id: contact[0].id,
            status: 'active',
            priority: 'normal'
          })
          .returning();
        conversation = newConv;
      }

      // Inserir mensagem recebida
      const messageData = {
        conversation_id: conversation[0].id,
        clinic_id: clinicId,
        sender_type: 'patient' as const,
        sender_id: contactPhone,
        sender_name: contact[0].name,
        content,
        message_type: messageType,
        status: 'received' as const,
        direction: 'inbound' as const,
        whatsapp_data: whatsappData,
        external_id: whatsappData?.id,
        sent_at: (() => {
          const brasilTime = new Date();
          brasilTime.setHours(brasilTime.getHours() - 3);
          return brasilTime;
        })()
      };

      const newMessage = await storage.db
        .insert(messages)
        .values(messageData)
        .returning();

      // Atualizar conversa
      await storage.db
        .update(conversations)
        .set({
          total_messages: sql`total_messages + 1`,
          unread_count: sql`unread_count + 1`,
          last_message_at: new Date(),
          last_activity_at: new Date(),
          updated_at: new Date()
        })
        .where(eq(conversations.id, conversation[0].id));

      // Log da mensagem recebida
      await systemLogsService.logAction({
        clinic_id: clinicId,
        entity_type: 'message',
        entity_id: newMessage[0].id,
        action_type: 'received',
        actor_type: 'patient',
        new_data: messageData,
        source: 'whatsapp'
      });

      res.status(201).json({ 
        message: newMessage[0],
        conversation: conversation[0]
      });

    } catch (error) {
      console.error('Erro ao processar mensagem do WhatsApp:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Marcar mensagens como lidas
  app.put('/api/conversations/:id/mark-read', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = req.session.user?.clinicId;
      const conversationId = parseInt(req.params.id);

      if (!clinicId || !conversationId) {
        return res.status(400).json({ error: 'Parâmetros inválidos' });
      }

      // Marcar mensagens como lidas
      await storage.db
        .update(messages)
        .set({ 
          read_at: new Date(),
          status: 'read'
        })
        .where(
          and(
            eq(messages.conversation_id, conversationId),
            eq(messages.direction, 'inbound'),
            sql`read_at IS NULL`
          )
        );

      // Zerar contador de não lidas
      await storage.db
        .update(conversations)
        .set({ 
          unread_count: 0,
          updated_at: new Date()
        })
        .where(eq(conversations.id, conversationId));

      res.json({ success: true });

    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Arquivar/desarquivar conversa
  app.put('/api/conversations/:id/archive', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = req.session.user?.clinicId;
      const conversationId = parseInt(req.params.id);
      const { archive } = req.body;

      if (!clinicId || !conversationId) {
        return res.status(400).json({ error: 'Parâmetros inválidos' });
      }

      const newStatus = archive ? 'archived' : 'active';

      await storage.db
        .update(conversations)
        .set({ 
          status: newStatus,
          updated_at: new Date()
        })
        .where(
          and(
            eq(conversations.id, conversationId),
            eq(conversations.clinic_id, clinicId)
          )
        );

      res.json({ success: true, status: newStatus });

    } catch (error) {
      console.error('Erro ao arquivar conversa:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Alternar estado da IA na conversa
  app.patch('/api/conversations/:id/ai-toggle', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = req.session.user?.clinicId;
      const conversationId = req.params.id;
      const { ai_active } = req.body;

      console.log('🤖 AI Toggle request:', { conversationId, ai_active, clinicId });

      if (!clinicId) {
        return res.status(400).json({ error: 'Clínica não identificada' });
      }

      if (typeof ai_active !== 'boolean') {
        return res.status(400).json({ error: 'ai_active deve ser boolean' });
      }

      // Atualizar estado da IA na conversa
      const result = await storage.db.execute(`
        UPDATE conversations 
        SET ai_active = ${ai_active}, updated_at = NOW() 
        WHERE id = '${conversationId}' AND clinic_id = ${clinicId}
        RETURNING id, ai_active
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Conversa não encontrada' });
      }

      console.log('✅ AI state updated:', result.rows[0]);
      
      res.json({ 
        success: true, 
        ai_active,
        conversation_id: conversationId 
      });

    } catch (error) {
      console.error('❌ Erro ao alternar IA:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

}