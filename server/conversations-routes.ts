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
      const clinicId = req.session.user?.clinicId;
      if (!clinicId) {
        return res.status(400).json({ error: 'Clinic ID é obrigatório' });
      }

      const { status = 'active', limit = 50, offset = 0 } = req.query;

      // Buscar conversas com informações do contato
      const conversationsList = await storage.db
        .select({
          id: conversations.id,
          clinic_id: conversations.clinic_id,
          contact_id: conversations.contact_id,
          professional_id: conversations.professional_id,
          whatsapp_number_id: conversations.whatsapp_number_id,
          status: conversations.status,
          title: conversations.title,
          priority: conversations.priority,
          total_messages: conversations.total_messages,
          unread_count: conversations.unread_count,
          last_message_at: conversations.last_message_at,
          last_activity_at: conversations.last_activity_at,
          created_at: conversations.created_at,
          updated_at: conversations.updated_at,
          // Dados do contato
          contact_name: sql`contacts.name`,
          contact_phone: sql`contacts.phone`,
          contact_email: sql`contacts.email`,
          contact_status: sql`contacts.status`,
        })
        .from(conversations)
        .leftJoin(sql`contacts`, eq(conversations.contact_id, sql`contacts.id`))
        .where(
          and(
            eq(conversations.clinic_id, clinicId),
            status !== 'all' ? eq(conversations.status, status as string) : undefined
          )
        )
        .orderBy(desc(conversations.last_activity_at))
        .limit(Number(limit))
        .offset(Number(offset));

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
      const clinicId = req.session.user?.clinicId;
      const conversationId = parseInt(req.params.id);

      if (!clinicId || !conversationId) {
        return res.status(400).json({ error: 'Parâmetros inválidos' });
      }

      // Buscar conversa
      const conversation = await storage.db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, conversationId),
            eq(conversations.clinic_id, clinicId)
          )
        )
        .limit(1);

      if (!conversation.length) {
        return res.status(404).json({ error: 'Conversa não encontrada' });
      }

      // Buscar mensagens da conversa
      const messagesList = await storage.db
        .select()
        .from(messages)
        .where(eq(messages.conversation_id, conversationId))
        .orderBy(asc(messages.created_at));

      // Buscar anexos das mensagens
      const messageIds = messagesList.map(m => m.id);
      let attachments: MessageAttachment[] = [];
      
      if (messageIds.length > 0) {
        attachments = await storage.db
          .select()
          .from(message_attachments)
          .where(sql`message_id = ANY(${messageIds})`);
      }

      // Organizar anexos por mensagem
      const messageWithAttachments = messagesList.map(message => ({
        ...message,
        attachments: attachments.filter(att => att.message_id === message.id)
      }));

      res.json({
        conversation: conversation[0],
        messages: messageWithAttachments
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
      await systemLogService.log({
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
        sent_at: new Date()
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
      await systemLogService.log({
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

}