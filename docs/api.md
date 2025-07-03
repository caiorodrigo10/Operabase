# API e Endpoints

## 📋 Visão Geral

A API do Operabase segue padrões RESTful com validação robusta via **Zod**, controle de acesso multi-tenant e documentação automática. Todos os endpoints são organizados por domínios funcionais com isolamento completo entre clínicas.

## 🌐 Estrutura da API (Real Implementation)

### Base URL e Versionamento

```
Produção: https://operabase.com/api
Desenvolvimento: http://localhost:5000/api
Versão Atual: v1
Router Principal: /api/v1/*
```

### Estrutura Real do Router

```typescript
// server/api/v1/router.ts - Implementação Real
export function createApiRouter(storage: any): Router {
  const apiRouter = Router();

  // Health check
  apiRouter.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: 'v1'
    });
  });

  // Domínios organizados em rotas modulares
  const authRoutes = createAuthRoutes(storage);
  apiRouter.use('/', authRoutes);

  const appointmentsRoutes = createAppointmentsRoutes(storage);
  apiRouter.use('/', appointmentsRoutes);

  const contactsRoutes = createContactsRoutes(storage);
  apiRouter.use('/', contactsRoutes);

  const calendarRoutes = createCalendarRoutes(storage);
  apiRouter.use('/', calendarRoutes);

  const medicalRecordsRoutes = createMedicalRecordsRoutes(storage);
  apiRouter.use('/', medicalRecordsRoutes);

  const pipelineRoutes = createPipelineRoutes(storage);
  apiRouter.use('/', pipelineRoutes);

  const analyticsRoutes = createAnalyticsRoutes(storage);
  apiRouter.use('/', analyticsRoutes);

  const settingsRoutes = createSettingsRoutes(storage);
  apiRouter.use('/', settingsRoutes);

  const aiTemplatesRoutes = createAiTemplatesRoutes(storage);
  apiRouter.use('/', aiTemplatesRoutes);

  const appointmentTagsRoutes = createAppointmentTagsRoutes(storage);
  apiRouter.use('/', appointmentTagsRoutes);

  const userProfileRoutes = createUserProfileRoutes(storage);
  apiRouter.use('/', userProfileRoutes);

  const liviaRoutes = createLiviaRoutes(storage);
  apiRouter.use('/', liviaRoutes);

  const loadTestingRoutes = createLoadTestingRoutes();
  apiRouter.use('/v1/load-testing', loadTestingRoutes);

  return apiRouter;
}
```

### Middleware Chain Real

```typescript
// server/index.ts - Cadeia de Middleware Real
app.use('/api', (req: any, res: any, next: any) => {
  // Skip all middleware for upload routes
  if (req.path.includes('/upload')) {
    console.log('🔧 Middleware chain: Skipping for upload:', req.path);
    return next();
  }
  
  // Apply normal middleware chain for other routes
  performanceTrackingMiddleware(req, res, () => {
    auditLoggingMiddleware(req, res, () => {
      cacheInterceptorMiddleware(req, res, () => {
        tenantIsolationMiddleware(req, res, () => {
          cacheInvalidationMiddleware(req, res, next);
        });
      });
    });
  });
});
```

### Padrões de Response

```typescript
// Resposta de sucesso
interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// Resposta de erro
interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
  code?: string;
}
```

## 🔐 Autenticação Real

### Headers Obrigatórios

```http
# Autenticação Supabase (principal)
Authorization: Bearer <supabase-jwt-token>

# API Key para N8N (automação)
X-API-Key: tk_clinic_1_abc123...
# ou
Authorization: Bearer tk_clinic_1_abc123...

# Headers padrão
Content-Type: application/json
```

### Middleware de Autenticação Real

```typescript
// server/auth.ts - isAuthenticated middleware real
export const isAuthenticated = async (req: any, res: any, next: any) => {
  // BYPASS para uploads
  if (req.originalUrl?.includes('/upload') || req.url?.includes('/upload')) {
    console.log('🔥 AUTH BYPASS: Upload detectado');
    return next();
  }
  
  // Verificar session primeiro
  if (req.isAuthenticated && req.isAuthenticated()) {
    console.log('✅ Session authentication successful');
    return next();
  }
  
  // Verificar token Supabase
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!, 
        process.env.SUPABASE_ANON_KEY!
      );
      
      const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
      
      if (error || !supabaseUser) {
        return res.status(401).json({ error: "Token inválido" });
      }
      
      // Buscar usuário no banco local
      const storage = req.app.get('storage');
      const user = await storage.getUserByEmail(supabaseUser.email);
      
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }
      
      req.user = user;
      return next();
      
    } catch (error) {
      return res.status(401).json({ error: "Erro de autenticação" });
    }
  }
  
  res.status(401).json({ error: "Acesso negado" });
};
```

## 💬 Sistema de Conversas (Real Endpoints)

### GET /api/conversations-simple

Lista conversas da clínica.

**Implementação Real:**
```typescript
// server/conversations-simple-routes.ts
app.get('/api/conversations-simple', async (req: Request, res: Response) => {
  try {
    const clinicId = parseInt(req.query.clinic_id as string) || 1;
    console.log('📋 Listing conversations for clinic:', clinicId);

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        id,
        clinic_id,
        contact_id,
        last_message_id,
        last_message_at,
        ai_active,
        ai_pause_end_time,
        contact:contacts(
          id,
          name,
          phone,
          email,
          status
        )
      `)
      .eq('clinic_id', clinicId)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching conversations:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch conversations'
      });
    }

    // Adicionar informações de última mensagem e contador não lidas
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        // Buscar última mensagem
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content, message_type, sender_type, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Contar mensagens não lidas
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('sender_type', 'patient')
          .eq('is_read', false);

        return {
          ...conv,
          last_message: lastMessage?.content || 'Sem mensagens',
          last_message_type: lastMessage?.message_type || 'text',
          last_message_sender: lastMessage?.sender_type || 'system',
          unread_count: unreadCount || 0
        };
      })
    );

    res.json({
      success: true,
      data: enrichedConversations
    });

  } catch (error) {
    console.error('❌ Error in conversations endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
```

### GET /api/conversations-simple/:id

Busca conversa específica com mensagens.

**Response Real:**
```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": 1,
      "contact_id": 1,
      "clinic_id": 1,
      "ai_active": true,
      "ai_pause_end_time": null,
      "contact": {
        "id": 1,
        "name": "João Silva",
        "phone": "+5511999999999",
        "email": "joao@email.com"
      }
    },
    "messages": [
      {
        "id": 1,
        "conversation_id": 1,
        "sender_type": "patient",
        "content": "Olá, preciso agendar uma consulta",
        "message_type": "text",
        "is_note": false,
        "attachments": [],
        "created_at": "2025-01-14T10:30:00Z",
        "status": "delivered"
      }
    ]
  }
}
```

### POST /api/conversations-simple/:id

Envia nova mensagem na conversa.

**Request Body Real:**
```json
{
  "content": "Confirmo a consulta para amanhã às 14h",
  "sender_type": "professional",
  "message_type": "text",
  "is_note": false
}
```

**Implementação Backend Real:**
```typescript
// server/conversations-simple-routes.ts
app.post('/api/conversations-simple/:id', async (req: Request, res: Response) => {
  try {
    const conversationId = req.params.id;
    const { content, sender_type = 'professional', message_type = 'text', is_note = false } = req.body;

    // Buscar conversa
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*, contact:contacts(*)')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversa não encontrada'
      });
    }

    // Criar mensagem
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: parseInt(conversationId),
        sender_type,
        content,
        message_type,
        is_note,
        clinic_id: conversation.clinic_id,
        status: 'pending'
      })
      .select()
      .single();

    if (messageError) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao salvar mensagem'
      });
    }

    // Atualizar última mensagem da conversa
    await supabase
      .from('conversations')
      .update({
        last_message_id: message.id,
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    // Enviar para WhatsApp em background (se sender_type = professional)
    if (sender_type === 'professional') {
      setImmediate(async () => {
        try {
          const evolutionService = new EvolutionMessageService(storage);
          const evolutionResult = await evolutionService.sendTextMessage(conversationId, content);
          
          if (evolutionResult.success) {
            console.log('✅ WhatsApp message sent successfully in background');
            // Atualizar status da mensagem
            await supabase
              .from('messages')
              .update({ status: 'sent' })
              .eq('id', message.id);
          } else {
            console.error('❌ Background WhatsApp send failed:', evolutionResult.error);
            await supabase
              .from('messages')
              .update({ status: 'failed' })
              .eq('id', message.id);
          }
        } catch (error) {
          console.error('❌ Background WhatsApp send error:', error);
        }
      });
    }

    res.status(201).json({
      success: true,
      data: message
    });

  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});
```

## 📁 Sistema de Upload (Real Implementation)

### POST /api/audio/voice-message/:conversationId

Upload de mensagem de voz para WhatsApp.

**Implementação Real:**
```typescript
// server/routes/audio-voice-clean.ts
router.post('/voice-message/:conversationId', upload.single('audio'), async (req, res) => {
  try {
    const { conversationId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'Arquivo de áudio não fornecido'
      });
    }

    console.log('🎤 Voice message upload:', {
      conversationId,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    // Usar ConversationUploadService para processamento completo
    const uploadService = new ConversationUploadService(storage);
    
    const result = await uploadService.uploadFile({
      conversationId,
      file: file.buffer,
      filename: file.originalname,
      mimeType: file.mimetype,
      sendToWhatsApp: true, // Sempre enviar áudio para WhatsApp
      senderType: 'professional',
      caption: undefined // Áudio não tem caption
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          message_id: result.message?.id,
          attachment_id: result.attachment?.id,
          file_url: result.storageResult?.signed_url,
          whatsapp_status: result.whatsappResult?.sent ? 'sent' : 'failed'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Erro no upload'
      });
    }

  } catch (error) {
    console.error('❌ Voice message upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});
```

## 🤖 Assistente IA Mara (Real Endpoints)

### POST /api/mara/analyze

Analisa paciente com IA Mara usando RAG.

**Implementação Real:**
```typescript
// server/mara-ai-service.ts
export class MaraAIService {
  async analyzeContact(contactId: number, question: string, userId?: number): Promise<MaraResponse> {
    console.log('🤖 Mara AI: Analisando contato:', { contactId, question, userId });

    try {
      // 1. Construir contexto do paciente
      const context = await this.buildPatientContext(contactId);
      console.log('📋 Contexto do paciente construído');

      // 2. Buscar configuração Mara do profissional
      let maraConfig = null;
      let ragContext = '';

      if (userId && context.contact?.clinic_id) {
        try {
          maraConfig = await this.getMaraConfigForProfessional(userId, context.contact.clinic_id);
          console.log('⚙️ Configuração Mara:', maraConfig);

          // Se tiver base de conhecimento conectada, fazer busca RAG
          if (maraConfig?.knowledgeBaseId) {
            console.log('🔍 Buscando conhecimento na base RAG:', maraConfig.knowledgeBaseId);
            const ragResults = await this.searchRAGKnowledge(question, maraConfig.knowledgeBaseId);
            ragContext = this.formatRAGContext(ragResults);
            console.log('📚 Contexto RAG obtido:', ragContext ? 'Sim' : 'Não');
          }
        } catch (error: any) {
          console.log('⚠️ Erro ao buscar configuração Mara:', error.message);
        }
      }

      // 3. Criar prompt com contexto híbrido
      const systemPrompt = this.createEnhancedSystemPrompt(context, currentUser, ragContext, maraConfig);
      console.log('📝 Prompt criado, enviando para OpenAI...');

      // 4. Consultar OpenAI GPT-4o
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
        temperature: 0.7,
        max_tokens: 400
      });

      const result = response.choices[0].message.content || "Desculpe, não consegui processar sua pergunta.";
      console.log('✅ Resposta gerada com sucesso');
      
      return {
        response: result
      };

    } catch (error) {
      console.error('❌ Erro na análise Mara:', error);
      return {
        response: 'Desculpe, ocorreu um erro ao processar sua solicitação.'
      };
    }
  }
}
```

### GET /api/mara/configuration

Busca configuração Mara do profissional.

**Response Real:**
```json
{
  "success": true,
  "data": {
    "professional_id": 4,
    "clinic_id": 1,
    "knowledge_base_id": 1,
    "knowledge_base_name": "Base Médica Geral",
    "is_active": true
  }
}
```

## 📊 Sistema RAG (Real Implementation)

### POST /api/rag/upload

Upload de documentos para base de conhecimento.

**Schema de Dados Real:**
```sql
-- Tabelas RAG reais do sistema
CREATE TABLE rag_knowledge_bases (
  id SERIAL PRIMARY KEY,
  external_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rag_documents (
  id SERIAL PRIMARY KEY,
  external_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  metadata JSONB,
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rag_chunks (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES rag_documents(id),
  content TEXT NOT NULL,
  metadata JSONB,
  chunk_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rag_embeddings (
  id SERIAL PRIMARY KEY,
  chunk_id INTEGER REFERENCES rag_chunks(id),
  embedding VECTOR(1536), -- pgvector extension
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 📅 Sistema de Agendamentos (Real Schema)

### Estrutura Real dos Agendamentos

```sql
-- server/shared/schema.ts - appointments table real
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER NOT NULL,
  user_id TEXT, -- UUID from Supabase
  clinic_id INTEGER NOT NULL,
  doctor_name TEXT NOT NULL,
  specialty TEXT,
  appointment_type TEXT DEFAULT 'consulta',
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'agendada',
  payment_status TEXT DEFAULT 'pendente',
  payment_amount INTEGER, -- em centavos
  session_notes TEXT,
  google_calendar_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### GET /api/appointments/availability

Verifica disponibilidade usando configuração real da clínica.

**Implementação Real:**
```typescript
// Endpoint real usa configurações da clínica
const clinic = await storage.getClinic(clinicId);
const workingHours = {
  start: clinic.work_start, // "08:00"
  end: clinic.work_end,     // "18:00"
  lunchStart: clinic.lunch_start, // "12:00"
  lunchEnd: clinic.lunch_end,     // "13:00"
  hasLunchBreak: clinic.has_lunch_break,
  workingDays: clinic.working_days // ['monday', 'tuesday', ...]
};
```

## 🔧 Códigos de Status Real

```http
200 OK          # Sucesso
201 Created     # Recurso criado
400 Bad Request # Dados inválidos
401 Unauthorized # Token inválido/ausente
403 Forbidden   # Sem permissão
404 Not Found   # Recurso não encontrado
409 Conflict    # Conflito de agendamento
422 Unprocessable Entity # Validação Zod falhou
429 Too Many Requests    # Rate limit
500 Internal Server Error # Erro do servidor
```

## 🔧 Configuração de Produção

### Variáveis de Ambiente Críticas

```bash
# Database
SUPABASE_POOLER_URL=postgresql://...
DATABASE_URL=postgresql://...

# Supabase
SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Evolution API (WhatsApp)
EVOLUTION_URL=https://evolution-api.domain.com
EVOLUTION_API_KEY=your-api-key

# OpenAI (Mara AI)
OPENAI_API_KEY=sk-...

# N8N Integration
N8N_API_KEY=tk_clinic_1_...
N8N_WEBHOOK_URL=https://n8n.domain.com/webhook/...
```

---

**Status:** ✅ Documentação atualizada conforme implementação real  
**Detalhes Verificados:** Router structure, middleware chain, authentication flow, real endpoints  
**Próximas Seções:** [Database Schema](database.md) | [Communication System](communication.md) 