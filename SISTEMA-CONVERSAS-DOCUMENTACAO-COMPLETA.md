# Sistema de Conversas - Documentação Técnica Completa

**Data de Atualização**: 24 de Junho de 2025  
**Versão**: 3.0 - Sistema Definitivo com Evolution API

## 📋 Visão Geral

O Sistema de Conversas é um módulo multi-tenant completo que gerencia comunicações entre profissionais de saúde e pacientes através de WhatsApp, utilizando a Evolution API. O sistema suporta conversas em tempo real, status de entrega inteligente e isolamento completo entre clínicas.

## 🏗️ Arquitetura do Sistema

### Componentes Principais

1. **Backend API** - Express.js com TypeScript
2. **Frontend** - React 18 com TanStack Query
3. **Database** - Supabase (PostgreSQL) com isolamento multi-tenant
4. **Cache** - Redis para performance otimizada
5. **WhatsApp Integration** - Evolution API
6. **Real-time** - Socket.IO com fallback para polling

## 📊 Estrutura de Banco de Dados

### Schema TypeScript (shared/schema.ts)

```typescript
// Tabela de conversas
export const conversations = pgTable('conversations', {
  id: varchar('id').primaryKey(),
  clinic_id: integer('clinic_id').notNull(),
  contact_id: integer('contact_id').notNull(),
  status: varchar('status').default('active'),
  last_message_at: timestamp('last_message_at'),
  unread_count: integer('unread_count').default(0),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Tabela de mensagens
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversation_id: varchar('conversation_id').notNull(),
  sender_type: varchar('sender_type').notNull(),
  sender_name: varchar('sender_name'),
  content: text('content').notNull(),
  message_type: varchar('message_type').default('text'),
  direction: varchar('direction'),
  timestamp: timestamp('timestamp').defaultNow(),
  device_type: varchar('device_type').default('manual'),
  evolution_status: varchar('evolution_status').default('pending'),
  ai_action: varchar('ai_action'),
});

// Tabela de anexos
export const messageAttachments = pgTable('message_attachments', {
  id: serial('id').primaryKey(),
  message_id: integer('message_id').notNull(),
  file_name: varchar('file_name').notNull(),
  file_type: varchar('file_type').notNull(),
  file_size: integer('file_size'),
  file_path: varchar('file_path'),
  media_type: varchar('media_type'),
  created_at: timestamp('created_at').defaultNow(),
});

// Tabela de instâncias WhatsApp
export const whatsappNumbers = pgTable('whatsapp_numbers', {
  id: serial('id').primaryKey(),
  clinic_id: integer('clinic_id').notNull(),
  instance_name: varchar('instance_name').notNull(),
  phone_number: varchar('phone_number').notNull(),
  status: varchar('status').default('pending'),
  qr_code: text('qr_code'),
  webhook_url: varchar('webhook_url'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});
```

## 📊 Estrutura de Banco de Dados SQL

### Tabela `conversations`
```sql
CREATE TABLE conversations (
  id VARCHAR PRIMARY KEY,              -- ID único da conversa
  clinic_id INTEGER NOT NULL,          -- Isolamento multi-tenant
  contact_id INTEGER NOT NULL,         -- Referência ao paciente
  status VARCHAR DEFAULT 'active',     -- active, archived, closed
  last_message_at TIMESTAMP,           -- Última mensagem da conversa
  unread_count INTEGER DEFAULT 0,      -- Contador de mensagens não lidas
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Índices para performance
  INDEX idx_conversations_clinic (clinic_id),
  INDEX idx_conversations_contact (contact_id),
  INDEX idx_conversations_clinic_contact (clinic_id, contact_id),
  INDEX idx_conversations_last_message (clinic_id, last_message_at DESC)
);
```

### Tabela `messages`
```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  conversation_id VARCHAR NOT NULL,    -- Referência à conversa
  sender_type VARCHAR NOT NULL,        -- 'patient', 'professional', 'ai', 'system'
  sender_name VARCHAR,                 -- Nome do remetente
  content TEXT NOT NULL,               -- Conteúdo da mensagem
  message_type VARCHAR DEFAULT 'text', -- text, image, audio, document, note
  direction VARCHAR,                   -- inbound, outbound
  timestamp TIMESTAMP DEFAULT NOW(),   -- Horário da mensagem (GMT-3 Brasil)
  device_type VARCHAR DEFAULT 'manual', -- manual, system
  evolution_status VARCHAR DEFAULT 'pending', -- pending, sent, failed
  ai_action VARCHAR,                   -- Ações específicas da IA
  
  -- Índices críticos para performance
  INDEX idx_messages_conversation (conversation_id),
  INDEX idx_messages_timestamp (conversation_id, timestamp DESC),
  INDEX idx_messages_sender (conversation_id, sender_type),
  INDEX idx_messages_evolution_status (evolution_status),
  
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);
```

### Tabela `message_attachments`
```sql
CREATE TABLE message_attachments (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  message_id INTEGER NOT NULL,
  file_name VARCHAR NOT NULL,
  file_type VARCHAR NOT NULL,         -- MIME type
  file_size INTEGER,
  file_path VARCHAR,                  -- Caminho do arquivo
  media_type VARCHAR,                 -- audio, image, document
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_attachments_message (message_id),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);
```

### Tabela `whatsapp_numbers`
```sql
CREATE TABLE whatsapp_numbers (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  clinic_id INTEGER NOT NULL,         -- Isolamento por clínica
  instance_name VARCHAR NOT NULL,     -- Nome da instância Evolution API
  phone_number VARCHAR NOT NULL,      -- Número do WhatsApp
  status VARCHAR DEFAULT 'pending',   -- pending, open, connected, disconnected
  qr_code TEXT,                      -- QR Code para conexão
  webhook_url VARCHAR,               -- URL do webhook
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Cada clínica tem apenas uma instância ativa
  UNIQUE INDEX idx_whatsapp_clinic_active (clinic_id, status) 
    WHERE status = 'open',
  INDEX idx_whatsapp_clinic (clinic_id),
  INDEX idx_whatsapp_status (status)
);
```

### Tabela `conversation_actions`
```sql
CREATE TABLE conversation_actions (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  conversation_id VARCHAR NOT NULL,
  action_type VARCHAR NOT NULL,       -- appointment_created, appointment_status_changed, etc.
  action_data JSONB,                 -- Dados específicos da ação
  timestamp TIMESTAMP DEFAULT NOW(),
  created_by INTEGER,                -- ID do usuário que criou
  
  INDEX idx_actions_conversation (conversation_id),
  INDEX idx_actions_timestamp (conversation_id, timestamp DESC),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);
```

## 🔄 Fluxo de Identificação de Conversas

### 1. Tipos de ID de Conversa
```typescript
// IDs regulares (contatos internos)
"4" // Pedro Oliveira

// IDs científicos (WhatsApp externos)  
"5.511965860124552e+24" // Convertido de: 5511965860124551150391104

// IDs longos (WhatsApp diretos)
"5598876940345511948922493" // Igor Venturin
```

### 2. Sistema de Resolução de ID
```typescript
function resolveConversationId(requestedId: string) {
  // 1. Tentar ID exato
  let conversation = await findById(requestedId);
  
  // 2. Se não encontrar e for científico, converter
  if (!conversation && isScientificNotation(requestedId)) {
    const expandedId = expandScientificNotation(requestedId);
    conversation = await findById(expandedId);
  }
  
  // 3. Buscar por contact_id se for número simples
  if (!conversation && isSimpleNumber(requestedId)) {
    conversation = await findByContactId(requestedId);
  }
  
  return conversation;
}
```

## 🔌 Integração Evolution API

### 1. Sistema de Instâncias Dinâmicas
```typescript
// Busca instância ativa da clínica
const { data: activeInstance } = await supabase
  .from('whatsapp_numbers')
  .select('*')
  .eq('clinic_id', clinicId)
  .eq('status', 'open')  // APENAS instâncias "open"
  .limit(1)
  .single();
```

### 2. Envio de Mensagens
```typescript
const response = await fetch(
  `${evolutionUrl}/message/sendText/${activeInstance.instance_name}`,
  {
    method: 'POST',
    headers: {
      'apikey': evolutionApiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      number: contact.phone,
      text: content
    })
  }
);
```

### 3. Sistema de Status Inteligente
```typescript
// Lógica de Status Evolution
if (response.ok) {
  // ✅ Sucesso: Manter status 'pending' (assumir sucesso)
  console.log('Mensagem enviada - mantendo status pending');
} else {
  // ❌ Falha: APENAS agora marcar como 'failed'
  await updateMessageStatus(messageId, 'failed');
  // Invalidar cache para mostrar ícone de erro imediatamente
  await invalidateCache(conversationId);
}
```

## 🎨 Interface do Usuário

### Tipos TypeScript Frontend

```typescript
// client/src/types/conversations.ts
export interface Conversation {
  id: string;
  clinic_id: number;
  contact_id: number;
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  status: 'active' | 'archived' | 'closed';
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'patient' | 'professional' | 'ai' | 'system';
  sender_name: string;
  content: string;
  message_type: 'text' | 'image' | 'audio' | 'document' | 'note';
  direction: 'inbound' | 'outbound';
  timestamp: string;
  evolution_status: 'pending' | 'sent' | 'failed';
  attachments: MessageAttachment[];
}

export interface MessageAttachment {
  id: number;
  message_id: number;
  file_name: string;
  file_type: string;
  media_type: 'audio' | 'image' | 'document';
  file_path: string;
  file_size: number;
}

export interface TimelineItem {
  id: string;
  type: 'message' | 'action';
  timestamp: string;
  data: Message | ConversationAction;
}
```

## 🎨 Interface do Usuário

### 1. Componente MessageBubble
```tsx
// Indicadores Visuais de Status
{/* Ícone de falha APENAS quando confirmado */}
{!isReceived && !isNote && message.evolution_status === 'failed' && (
  <AlertTriangle className="w-3 h-3 text-red-500" 
    title="Falha confirmada pela Evolution API" />
)}

{/* Status 'pending' e 'sent' sem ícone - considerados sucesso */}
```

### 2. Sistema de Cache Inteligente
```typescript
// Cache estratificado por domínio
const cacheConfig = {
  conversations: { ttl: 60 }, // 1 minuto
  details: { ttl: 30 },      // 30 segundos  
  attachments: { ttl: 300 }   // 5 minutos
};

// Invalidação automática após mudanças
await redisCacheService.invalidateConversationDetail(conversationId);
```

## 🚀 Performance e Otimização

### 1. Índices de Performance
```sql
-- Índices críticos para conversas
CREATE INDEX idx_conversations_clinic_last_message 
  ON conversations(clinic_id, last_message_at DESC);

-- Índices para mensagens  
CREATE INDEX idx_messages_conversation_timestamp 
  ON messages(conversation_id, timestamp DESC);

-- Índices para attachments
CREATE INDEX idx_attachments_message_type 
  ON message_attachments(message_id, media_type);
```

### 2. Otimizações Implementadas
- **Paginação**: Limit 50 mensagens por request
- **Cache Redis**: 2-5ms response time para dados cached
- **Batch Queries**: Eliminação de N+1 queries
- **Lazy Loading**: Attachments carregados sob demanda

## 🔗 APIs e Endpoints

### Endpoints Principais

```typescript
// GET /api/conversations-simple
// Lista todas as conversas da clínica
interface ConversationsResponse {
  conversations: Conversation[];
}

// GET /api/conversations-simple/:id  
// Detalhes de uma conversa específica
interface ConversationDetailResponse {
  conversation: Conversation;
  messages: Message[];
  actions: ConversationAction[];
}

// POST /api/conversations-simple/:id/messages
// Enviar nova mensagem
interface SendMessageRequest {
  content: string;
  isNote?: boolean;
}

interface SendMessageResponse {
  success: boolean;
  message: Message;
  sent_to_whatsapp: boolean;
}

// POST /api/webhook/whatsapp/message
// Webhook para receber mensagens do WhatsApp
interface WhatsAppWebhookPayload {
  conversation_id: string;
  sender_name: string;
  content: string;
  timestamp: string;
  phone_number: string;
}
```

### Hooks React Customizados

```typescript
// client/src/hooks/useConversations.ts
export function useConversations() {
  return useQuery({
    queryKey: ['conversations-simple'],
    queryFn: () => apiRequest('/conversations-simple'),
    staleTime: 60 * 1000, // 1 minuto
  });
}

// client/src/hooks/useConversationDetail.ts  
export function useConversationDetail(conversationId: string) {
  return useQuery({
    queryKey: ['conversations-simple', conversationId],
    queryFn: () => apiRequest(`/conversations-simple/${conversationId}`),
    staleTime: 30 * 1000, // 30 segundos
  });
}

// client/src/hooks/useSendMessage.ts
export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ conversationId, content }: SendMessageParams) => {
      return apiRequest(`/conversations-simple/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    },
    onSuccess: (data, variables) => {
      // Invalidar cache para atualização em tempo real
      queryClient.invalidateQueries(['conversations-simple', variables.conversationId]);
      queryClient.invalidateQueries(['conversations-simple']);
    },
  });
}
```

## 🔄 Fluxo Completo de Mensagem

### 1. Envio de Mensagem
```
1. Frontend → API: POST /api/conversations-simple/{id}/messages
2. Backend → Database: INSERT message (status: 'pending')
3. Backend → Cache: Invalidate conversation cache
4. Backend → Evolution API: Send message (background)
5. Evolution Response → Database: Update status if failed
6. Frontend ← API: Immediate response (optimistic UI)
```

### 2. Recebimento via Webhook
```
1. Evolution API → N8N Webhook
2. N8N → Backend: POST /api/webhook/whatsapp/message  
3. Backend → Database: INSERT message
4. Backend → WebSocket: Emit new message
5. Frontend ← WebSocket: Real-time update
```

## 🛡️ Isolamento Multi-Tenant

### 1. Segurança por Clínica
```typescript
// Todas as queries incluem clinic_id
const conversations = await supabase
  .from('conversations')
  .select('*')
  .eq('clinic_id', clinicId); // Isolamento obrigatório
```

### 2. Instâncias WhatsApp Isoladas
```typescript
// Cada clínica tem sua própria instância Evolution
const instanceName = `clinic_${clinicId}_user_${userId}_${timestamp}`;
```

## 📱 Suporte a Diferentes Tipos de Mídia

### 1. Tipos Suportados
- **Texto**: Mensagens simples e notas internas
- **Imagem**: JPEG, PNG com preview
- **Áudio**: MP3, WhatsApp voice messages  
- **Documento**: PDF, DOC, etc.

### 2. Estrutura de Attachments
```typescript
interface MessageAttachment {
  id: number;
  message_id: number;
  file_name: string;
  file_type: string;    // MIME type
  media_type: string;   // audio, image, document
  file_path: string;
  file_size: number;
}
```

## 🔧 Configuração e Deploy

### 1. Variáveis de Ambiente
```env
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Evolution API
EVOLUTION_API_URL=https://n8n-evolution-api.4gmy9o.easypanel.host
EVOLUTION_API_KEY=your_api_key

# Cache
REDIS_URL=redis://localhost:6379
```

### 2. Inicialização do Sistema
```typescript
// 1. Configurar Evolution API
await setupEvolutionConfig();

// 2. Inicializar cache Redis
await initializeRedisCache();

// 3. Configurar WebSocket
await setupWebSocketServer();

// 4. Aplicar isolamento multi-tenant
await applyTenantIsolation();
```

## 📊 Métricas e Monitoramento

### 1. Métricas de Performance
- **Response Time**: <500ms para conversas, <50ms para cache hits
- **Cache Hit Rate**: >80% para dados frequentes
- **Concurrent Users**: Suporte para 500+ usuários simultâneos

### 2. Logs do Sistema
```typescript
// Logs estruturados para debugging
console.log('📤 Sending to Evolution API:', {
  conversationId,
  instanceName,
  phoneNumber,
  contentLength: content.length
});
```

## 🔮 Roadmap Futuro

### Próximas Implementações
1. **Mensagens de Voz**: Transcrição automática
2. **Templates**: Mensagens pré-definidas
3. **Agendamento**: Envio programado
4. **Analytics**: Métricas de engajamento
5. **Chatbots**: Respostas automáticas

## 🧪 Testes e Validação

### 1. Testes de Integração
```bash
# Teste de envio de mensagem
curl -X POST "http://localhost:5000/api/conversations-simple/{id}/messages" \
  -H "Content-Type: application/json" \
  -d '{"content": "Teste de integração"}'
```

### 2. Validação de Status
```typescript
// Verificar mensagens recentes
const { data: recentMessages } = await supabase
  .from('messages')
  .select('id, evolution_status, timestamp')
  .eq('conversation_id', conversationId)
  .order('timestamp', { ascending: false })
  .limit(10);
```

---

## 📝 Notas de Implementação

### Decisões Arquiteturais Importantes

1. **Status 'pending' = Sucesso**: Sistema assume que mensagens foram entregues a menos que Evolution API confirme falha
2. **Isolamento por Clínica**: Cada clínica opera independentemente com sua própria instância WhatsApp
3. **Cache Inteligente**: Invalidação automática após mudanças para UI responsiva
4. **IDs Científicos**: Suporte robusto para IDs longos do WhatsApp em notação científica

### Lições Aprendidas

1. **Performance**: Índices de banco críticos para sub-500ms response times
2. **Reliability**: Fallback gracioso quando Evolution API não responde
3. **UX**: Feedback visual imediato com optimistic updates
4. **Scalability**: Arquitetura preparada para 1000+ usuários simultâneos

---

**Última Atualização**: 24/06/2025 - Sistema em produção estável