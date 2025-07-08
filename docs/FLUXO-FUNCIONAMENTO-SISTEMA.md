# Fluxo de Funcionamento do Sistema - Operabase Railway

## 🎯 Visão Geral dos Fluxos

Este documento detalha como todos os sistemas implementados funcionam em conjunto, com exemplos práticos e diagramas de fluxo.

## 🔄 Fluxo Principal: Conversa com Pausa Automática da AI

### 1. Estado Inicial
```
Conversa: ai_active = true
Livia Config: off_duration = 1, off_unit = "minutos"
Middleware: Rodando a cada 30 segundos
```

### 2. Profissional Envia Mensagem
```
POST /api/conversations-simple/559887694034551150391104/messages
{
  "content": "Olá, como posso ajudar?"
}
```

### 3. Processamento da Mensagem
```typescript
// 1. Salvar mensagem no banco
const message = await supabaseAdmin.from('messages').insert({
  conversation_id: '559887694034551150391104',
  content: 'Olá, como posso ajudar?',
  sender_type: 'professional',
  sender_id: 4,
  timestamp: '2025-01-07T20:41:23.456-03:00' // Brasília
});

// 2. Pausar AI automaticamente
await aiPauseService.pauseAIForManualMessage(conversationId, userId);
```

### 4. Cálculo da Pausa
```typescript
// Buscar configuração da Livia
const config = { off_duration: 1, off_unit: 'minutos' };

// Calcular timestamp de pausa
const pauseDuration = 1 * 60 * 1000; // 1 minuto em ms
const pauseUntil = new Date(Date.now() + pauseDuration);
// pauseUntil = '2025-01-07T20:42:23.456-03:00'

// Atualizar conversa
await supabaseAdmin.from('conversations').update({
  ai_active: false,
  ai_paused_until: pauseUntil.toISOString(),
  ai_paused_by_user_id: 4,
  ai_pause_reason: 'manual_message'
});
```

### 5. Estado Durante a Pausa
```
Conversa: {
  ai_active: false,
  ai_paused_until: '2025-01-07T20:42:23.456-03:00',
  ai_paused_by_user_id: 4,
  ai_pause_reason: 'manual_message'
}
```

### 6. Middleware Verifica Pausa (a cada 30s)
```typescript
// Verificar pausas expiradas
const now = '2025-01-07T20:42:30.000-03:00';
const expiredPauses = await supabaseAdmin
  .from('conversations')
  .select('*')
  .eq('ai_active', false)
  .eq('ai_pause_reason', 'manual_message')
  .lte('ai_paused_until', now);

// Encontrada pausa expirada -> Reativar AI
await supabaseAdmin.from('conversations').update({
  ai_active: true,
  ai_paused_until: null,
  ai_paused_by_user_id: null,
  ai_pause_reason: null
});
```

### 7. Estado Final
```
Conversa: {
  ai_active: true,
  ai_paused_until: null,
  ai_paused_by_user_id: null,
  ai_pause_reason: null
}
```

## 📁 Fluxo de Upload de Arquivos

### 1. Upload de Imagem
```typescript
// Frontend
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('/api/conversations-simple/559887694034551150391104/upload', {
  method: 'POST',
  body: formData
});
```

### 2. Processamento no Backend
```typescript
// 1. Salvar arquivo no sistema
const file = req.file; // Multer middleware
const filePath = `/uploads/${conversationId}/${file.filename}`;

// 2. Criar mensagem
const message = await supabaseAdmin.from('messages').insert({
  conversation_id: conversationId,
  content: `Arquivo enviado: ${file.originalname}`,
  sender_type: 'professional',
  message_type: 'image',
  timestamp: getBrasiliaTimestamp()
});

// 3. Criar attachment
const attachment = await supabaseAdmin.from('attachments').insert({
  message_id: message.id,
  file_name: file.originalname,
  file_type: file.mimetype,
  file_size: file.size,
  file_path: filePath,
  created_at: getBrasiliaTimestamp()
});

// 4. Pausar AI automaticamente
await aiPauseService.pauseAIForManualMessage(conversationId, userId);
```

### 3. Resultado Final
```json
{
  "message": {
    "id": 123,
    "conversation_id": "559887694034551150391104",
    "content": "Arquivo enviado: imagem.jpg",
    "sender_type": "professional",
    "message_type": "image",
    "timestamp": "2025-01-07T20:41:23.456-03:00"
  },
  "attachment": {
    "id": 45,
    "message_id": 123,
    "file_name": "imagem.jpg",
    "file_type": "image/jpeg",
    "file_size": 245760,
    "file_path": "/uploads/559887694034551150391104/1736288483456-imagem.jpg"
  }
}
```

## 🎵 Fluxo de Upload de Áudio

### 1. Upload de Áudio
```typescript
// Frontend
const formData = new FormData();
formData.append('audio', audioBlob);

const response = await fetch('/api/audio/voice-message/559887694034551150391104', {
  method: 'POST',
  body: formData
});
```

### 2. Processamento no Backend
```typescript
// 1. Salvar áudio
const audioFile = req.file;
const audioPath = `/uploads/audio/${audioFile.filename}`;

// 2. Criar mensagem de áudio
const message = await supabaseAdmin.from('messages').insert({
  conversation_id: conversationId,
  content: 'Mensagem de áudio enviada',
  sender_type: 'professional',
  message_type: 'audio',
  timestamp: getBrasiliaTimestamp()
});

// 3. Criar attachment
const attachment = await supabaseAdmin.from('attachments').insert({
  message_id: message.id,
  file_name: audioFile.originalname,
  file_type: audioFile.mimetype,
  file_path: audioPath,
  created_at: getBrasiliaTimestamp()
});

// 4. Pausar AI
await aiPauseService.pauseAIForManualMessage(conversationId, userId);
```

### 3. Integração com N8N (Transcrição)
```typescript
// N8N recebe notificação do upload de áudio
// Processa transcrição via Whisper/OpenAI
// Envia resultado via webhook

// POST /api/transcription/webhook
{
  "conversationId": "559887694034551150391104",
  "messageId": 123,
  "transcription": "Texto transcrito do áudio..."
}

// Backend salva transcrição
const transcriptionMessage = await supabaseAdmin.from('messages').insert({
  conversation_id: conversationId,
  content: `Transcrição: ${transcription}`,
  sender_type: 'system',
  message_type: 'text',
  timestamp: getBrasiliaTimestamp()
});
```

## ⚙️ Fluxo de Configurações

### 1. Configurações da Clínica
```typescript
// Carregar configurações
const response = await fetch('/api/clinic/1/config');
const clinicConfig = await response.json();

// Exemplo de dados retornados
{
  "id": 1,
  "name": "Clínica Operabase Atualizada",
  "responsible": "Dr. Teste",
  "phone": "+5511987654321",
  "email": "teste@operabase.com",
  "working_days": ["monday", "tuesday", "thursday", "friday"],
  "work_start": "09:00",
  "work_end": "17:00",
  "specialties": [
    "Psicologia Clínica",
    "TDAH em Adultos",
    "TDAH Infantil",
    "Terapia Cognitivo-Comportamental"
  ]
}
```

### 2. Configurações da Livia
```typescript
// Carregar configurações
const response = await fetch('/api/livia/config');
const liviaConfig = await response.json();

// Exemplo de dados retornados
{
  "id": 1,
  "clinic_id": 1,
  "prompt": "Atue como a Lívia, atendente fixa e humanizada da...",
  "off_duration": 1,
  "off_unit": "minutos"
}

// Salvar configurações
const updateResponse = await fetch('/api/livia/config', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "Novo prompt...",
    off_duration: 5,
    off_unit: "minutos"
  })
});
```

## 🔄 Fluxo de Controle Manual da AI

### 1. Toggle AI (Desativar)
```typescript
// Frontend
const response = await fetch('/api/conversations-simple/559887694034551150391104/ai-toggle', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ai_active: false })
});

// Backend
await aiPauseService.deactivateAI(conversationId, userId);

// Resultado
{
  ai_active: false,
  ai_paused_until: null,
  ai_paused_by_user_id: 4,
  ai_pause_reason: 'manual'
}
```

### 2. Toggle AI (Reativar)
```typescript
// Frontend
const response = await fetch('/api/conversations-simple/559887694034551150391104/ai-toggle', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ai_active: true })
});

// Backend
await aiPauseService.reactivateAI(conversationId);

// Resultado
{
  ai_active: true,
  ai_paused_until: null,
  ai_paused_by_user_id: null,
  ai_pause_reason: null
}
```

### 3. Diferença entre Pausas
```typescript
// Pausa Automática (por mensagem)
{
  ai_active: false,
  ai_paused_until: '2025-01-07T20:42:23.456-03:00', // Timestamp futuro
  ai_pause_reason: 'manual_message' // Middleware pode reativar
}

// Pausa Manual (por usuário)
{
  ai_active: false,
  ai_paused_until: null, // Sem timestamp
  ai_pause_reason: 'manual' // Middleware NÃO reativa
}
```

## 📊 Fluxo de Monitoramento

### 1. Logs Estruturados
```typescript
// Exemplo de logs durante uma operação
console.log('🔍 Sending message to conversation: 559887694034551150391104');
console.log('✅ Message saved to database: 123');
console.log('⏸️ AI pausada para conversa 559887694034551150391104 por 1 minutos');
console.log('🔄 AI PAUSE: Verificando conversas com pausa de IA expirada...');
console.log('✅ AI PAUSE: IA reativada para conversa 559887694034551150391104 (pausa expirou)');
```

### 2. Métricas de Performance
```typescript
// Exemplo de logs de performance
console.log('⚡ DB Query completed in 110 ms');
console.log('📊 Found conversations: 5');
console.log('⚡ Performance: Processed 3 messages in 170 ms');
```

## 🕐 Fluxo de Timestamps (Brasília)

### 1. Função Unificada
```typescript
const getBrasiliaTimestamp = () => {
  const now = new Date();
  const saoPauloOffset = -3 * 60; // GMT-3 em minutos
  const saoPauloTime = new Date(now.getTime() + saoPauloOffset * 60000);
  return saoPauloTime.toISOString();
};

// Exemplo de uso
const timestamp = getBrasiliaTimestamp();
// "2025-01-07T20:41:23.456Z" (representa 17:41 horário de Brasília)
```

### 2. Aplicação em Todos os Sistemas
```typescript
// Mensagens de texto
const message = await supabaseAdmin.from('messages').insert({
  timestamp: getBrasiliaTimestamp(),
  created_at: getBrasiliaTimestamp()
});

// Upload de arquivos
const attachment = await supabaseAdmin.from('attachments').insert({
  created_at: getBrasiliaTimestamp()
});

// Transcrições
const transcription = await supabaseAdmin.from('messages').insert({
  timestamp: getBrasiliaTimestamp(),
  created_at: getBrasiliaTimestamp()
});
```

## 📱 Fluxo de Interface do Usuário

### 1. Carregamento de Conversas
```typescript
// 1. Buscar lista de conversas
const conversations = await fetch('/api/conversations-simple?clinic_id=1');

// 2. Exibir lista com status da AI
conversations.map(conv => ({
  id: conv.id,
  name: conv.contact_name,
  aiActive: conv.ai_active, // true/false
  aiPausedUntil: conv.ai_paused_until // timestamp ou null
}));
```

### 2. Abertura de Conversa
```typescript
// 1. Buscar detalhes da conversa
const conversation = await fetch('/api/conversations-simple/559887694034551150391104');

// 2. Exibir mensagens ordenadas por timestamp
const messages = conversation.messages.sort((a, b) => 
  new Date(a.timestamp) - new Date(b.timestamp)
);

// 3. Exibir status da AI
const aiStatus = conversation.ai_active ? 'Ativa' : 'Pausada';
```

### 3. Envio de Mensagem
```typescript
// 1. Usuário digita mensagem
const content = "Olá, como posso ajudar?";

// 2. Enviar mensagem
const response = await fetch('/api/conversations-simple/559887694034551150391104/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content })
});

// 3. Atualizar interface
// - Adicionar mensagem na lista
// - Mostrar que AI foi pausada
// - Iniciar contagem regressiva (1 minuto)
```

## 🔍 Exemplos Práticos Reais

### Exemplo 1: Envio de Mensagem de Texto
```bash
# 1. Estado inicial
Conversa 559887694034551150391104: ai_active = true

# 2. Profissional envia mensagem
POST /api/conversations-simple/559887694034551150391104/messages
Body: { "content": "Olá, preciso de ajuda" }

# 3. Logs do sistema
🔍 Sending message to conversation: 559887694034551150391104
✅ Message saved to database: 124
⏸️ AI pausada para conversa 559887694034551150391104 por 1 minutos

# 4. Estado após envio
Conversa 559887694034551150391104: {
  ai_active: false,
  ai_paused_until: "2025-01-07T20:42:23.456Z",
  ai_pause_reason: "manual_message"
}

# 5. Middleware verifica (30s depois)
🔄 AI PAUSE: Verificando conversas com pausa de IA expirada...
ℹ️ AI PAUSE: Nenhuma pausa de IA expirada encontrada

# 6. Middleware verifica (1 minuto depois)
🔄 AI PAUSE: Verificando conversas com pausa de IA expirada...
🔄 AI PAUSE: Encontradas 1 pausas expiradas para reativar
✅ AI PAUSE: IA reativada para conversa 559887694034551150391104 (pausa expirou)
```

### Exemplo 2: Upload de Imagem
```bash
# 1. Upload de imagem
POST /api/conversations-simple/559887694034551150391104/upload
Content-Type: multipart/form-data
File: imagem.jpg (245KB)

# 2. Logs do sistema
📁 Uploading file to conversation: 559887694034551150391104
📄 File details: { name: "imagem.jpg", type: "image/jpeg", size: 245760 }
✅ File uploaded successfully: 125
⏸️ AI pausada para conversa 559887694034551150391104 por 1 minutos

# 3. Resultado
Message: {
  id: 125,
  content: "Arquivo enviado: imagem.jpg",
  message_type: "image",
  timestamp: "2025-01-07T17:41:23.456-03:00"
}
Attachment: {
  id: 46,
  file_name: "imagem.jpg",
  file_path: "/uploads/559887694034551150391104/1736288483456-imagem.jpg"
}
```

### Exemplo 3: Configuração da Livia
```bash
# 1. Alterar duração de pausa
PUT /api/livia/config
Body: { "off_duration": 5, "off_unit": "minutos" }

# 2. Logs do sistema
🔄 Atualizando configurações da Livia para clinic_id: 1
✅ Configurações da Livia atualizadas

# 3. Próxima mensagem usará nova configuração
POST /api/conversations-simple/559887694034551150391104/messages
Body: { "content": "Teste com nova configuração" }

# 4. AI pausada por 5 minutos agora
⏸️ AI pausada para conversa 559887694034551150391104 por 5 minutos
```

## 🔧 Troubleshooting

### Problema: AI não reativa automaticamente
```bash
# Verificar logs do middleware
🔄 AI PAUSE: Verificando conversas com pausa de IA expirada...
ℹ️ AI PAUSE: Nenhuma pausa de IA expirada encontrada

# Verificar estado da conversa
SELECT ai_active, ai_paused_until, ai_pause_reason 
FROM conversations 
WHERE id = '559887694034551150391104';

# Possíveis causas:
# 1. ai_pause_reason = 'manual' (não reativa automaticamente)
# 2. ai_paused_until ainda no futuro
# 3. Middleware não está rodando
```

### Problema: Timestamps incorretos
```bash
# Verificar função getBrasiliaTimestamp
const timestamp = getBrasiliaTimestamp();
console.log('Timestamp:', timestamp);
console.log('Hora local:', new Date(timestamp).toLocaleString('pt-BR'));

# Deve mostrar horário de Brasília (GMT-3)
```

### Problema: Upload de arquivo falha
```bash
# Verificar logs de upload
📁 Uploading file to conversation: 559887694034551150391104
📄 File details: { name: "arquivo.pdf", type: "application/pdf", size: 1024000 }
❌ Erro no upload: File too large

# Verificar configuração do multer
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
```

---

## 📋 Resumo dos Fluxos Implementados

### ✅ Fluxos Funcionais
1. **Envio de Mensagem** → **Pausa Automática da AI** → **Reativação Automática**
2. **Upload de Arquivo** → **Criação de Attachment** → **Pausa Automática da AI**
3. **Upload de Áudio** → **Transcrição N8N** → **Pausa Automática da AI**
4. **Configuração da Clínica** → **Salvamento** → **Atualização Interface**
5. **Configuração da Livia** → **Alteração Duração Pausa** → **Aplicação Imediata**
6. **Toggle Manual da AI** → **Pausa/Reativação** → **Persistência Estado**

### 🔄 Processos em Background
1. **Middleware AI Pause Checker** → **Verificação a cada 30s** → **Reativação Automática**
2. **Logs Estruturados** → **Monitoramento em Tempo Real** → **Debug Facilitado**
3. **Timestamp Unificado** → **Brasília GMT-3** → **Consistência Total**

---

*Documentação de fluxos funcionais*
*Atualizada em: Janeiro 2025*
*Versão: v1.0 Fluxos Completos*
*Status: ✅ Totalmente Documentado* 