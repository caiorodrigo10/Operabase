# Sistema de Conversas e Áudio - Documentação Técnica

## Visão Geral

O sistema de conversas do Operabase é uma plataforma completa de comunicação entre profissionais de saúde e pacientes, integrada ao WhatsApp através da Evolution API. O sistema inclui funcionalidades avançadas de gravação e envio de áudio, upload de arquivos, e integração com IA.

## Arquitetura Geral

### Frontend (React + TypeScript)
- **Localização**: `client/src/pages/conversas.tsx` e `client/src/components/features/conversas/`
- **Estado**: TanStack Query para gerenciamento de estado do servidor
- **WebSocket**: Comunicação em tempo real para atualizações instantâneas
- **Cache**: Sistema multicamadas com Redis e cache em memória

### Backend (Express + TypeScript)
- **Localização**: `server/conversations-simple-routes.ts` e `server/routes/audio-voice-clean.ts`
- **Storage**: Supabase Storage para arquivos
- **Banco**: PostgreSQL via Supabase
- **Integração**: Evolution API para WhatsApp

## Sistema de Áudio - Fluxo Completo

### 1. Frontend - Gravação de Áudio

#### Hook `useAudioRecorder`
**Localização**: `client/src/hooks/useAudioRecorder.ts`

```typescript
interface AudioRecorderState {
  isRecording: boolean;
  audioBlob: Blob | null;
  duration: number;
  error: string | null;
  isSupported: boolean;
}
```

**Funcionalidades**:
- **Verificação de Suporte**: Detecta se o navegador suporta `MediaRecorder`
- **Permissões**: Solicita acesso ao microfone com tratamento de erros específicos
- **Configuração de Áudio**: 
  - Echo cancellation: `true`
  - Noise suppression: `true`
  - Sample rate: `44100 Hz`
  - Bitrate: `128000 bps`
- **Formatos Suportados**: Prioriza `audio/webm;codecs=opus`, fallback para `audio/webm`, `audio/mp4`

**Estados de Erro**:
- `NotAllowedError`: Permissão negada pelo usuário
- `NotFoundError`: Microfone não encontrado
- `NotSupportedError`: Gravação não suportada no navegador

### 2. Componente Modal de Gravação

#### `AudioRecordingModal`
**Localização**: `client/src/components/features/conversas/AudioRecordingModal.tsx`

**Interface do Usuário**:
- Indicador visual de gravação (pulsante quando ativo)
- Timer em tempo real (formato MM:SS)
- Controles de gravação (Iniciar/Parar)
- Preview com botão Play/Pause
- Botões de Cancelar/Enviar

**Estados**:
1. **Pronto para gravar**: Botão de microfone disponível
2. **Gravando**: Indicador vermelho pulsante, timer ativo
3. **Gravação concluída**: Preview disponível, botões de ação
4. **Enviando**: Loading state durante upload

### 3. Integração no Chat

#### `MainConversationArea`
**Localização**: `client/src/components/features/conversas/MainConversationArea.tsx`

**Botão de Áudio**:
```typescript
<Button
  variant="ghost"
  size="sm"
  className="text-gray-500 hover:text-gray-700 flex-shrink-0 w-10 h-10"
  title="Gravar áudio"
  onClick={() => setShowAudioRecorder(true)}
>
  <Mic className="w-4 h-4" />
</Button>
```

**Fluxo de Envio**:
```typescript
const handleAudioReady = async (audioFile: File) => {
  // Upload via rota isolada para áudio
  const response = await fetch(`/api/audio/voice-message/${selectedConversationId}`, {
    method: 'POST',
    body: formData,
  });
  
  // Invalidar cache para refresh automático
  queryClient.invalidateQueries({ queryKey: ['/api/conversations-simple'] });
}
```

### 4. Backend - Processamento de Áudio

#### Rota Principal: `/api/audio/voice-message/:conversationId`
**Localização**: `server/routes/audio-voice-clean.ts`

**Configuração Multer**:
```typescript
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB máximo
  }
});
```

**Fluxo de Processamento**:

1. **Validação**: Verificar se arquivo existe
2. **Upload Supabase**: 
   - Path: `clinic-1/conversation-${conversationId}/audio/voice_${timestamp}_${filename}`
   - Bucket: `conversation-attachments`
3. **URL Pública Temporária**: Válida por 1 hora (3600 segundos)
4. **Banco de Dados**: 
   - Criar registro na tabela `messages`
   - Criar registro na tabela `message_attachments`
5. **Transcrição**: Processo assíncrono usando Whisper AI
6. **WhatsApp**: Envio via Evolution API

### 5. Integração com WhatsApp

#### Evolution API - Endpoint de Áudio
**Método**: `POST /message/sendWhatsAppAudio/{instanceName}`

**Payload**:
```typescript
{
  number: string,        // Número do destinatário
  audio: string,         // Base64 do áudio OU URL pública
  delay: number          // Delay em ms (padrão: 1000)
}
```

**Estratégias de Envio**:
1. **URL Pública**: Primeira tentativa com URL assinada do Supabase
2. **Base64**: Fallback convertendo arquivo para base64
3. **Regeneração de URL**: Se URL expirar, gerar nova automaticamente

### 6. Sistema de Transcrição

#### Integração com Whisper AI
**Localização**: `server/services/transcription.service.ts`

**Processo Assíncrono**:
```typescript
setImmediate(async () => {
  // 1. Transcrever áudio usando Whisper
  const transcribedText = await transcriptionService.transcribeAudio(
    req.file.buffer, 
    req.file.originalname
  );
  
  // 2. Salvar na tabela N8N para memória da IA
  await saveToN8NTable(conversationId, transcribedText, 'human');
});
```

**Benefícios**:
- IA tem acesso ao conteúdo textual do áudio
- Pesquisa e indexação de conteúdo
- Análise de sentimento e contexto

## Sistema de Conversas

### 1. Estrutura de Dados

#### Tabela `conversations`
```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  conversation_id BIGINT UNIQUE,  -- ID do WhatsApp (pode ser muito grande)
  contact_id INTEGER,
  clinic_id INTEGER,
  status TEXT,
  ai_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### Tabela `messages`
```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id TEXT,
  content TEXT,
  sender_type TEXT,  -- 'professional', 'patient', 'ai'
  message_type TEXT, -- 'text', 'audio_voice', 'image', 'document'
  evolution_status TEXT, -- 'pending', 'sent', 'failed'
  timestamp TIMESTAMP
);
```

### 2. Cache Multicamadas

#### Estratégia de Cache
1. **Memory Cache**: Cache em memória para dados frequentes
2. **Redis Cache**: Cache distribuído para dados compartilhados
3. **Query Cache**: TanStack Query no frontend

#### Chaves de Cache
```typescript
// Lista de conversas
`conversations:clinic:${clinicId}:list`

// Detalhes da conversa
`conversation:${conversationId}:detail:page:${page}:limit:${limit}`

// Mensagens
`conversation:${conversationId}:messages`
```

### 3. WebSocket - Tempo Real

#### Conexão
**Localização**: `client/src/hooks/useWebSocket.ts`

```typescript
const webSocket = useWebSocket(userId, clinicId);

// Entrar em sala da conversa
webSocket.joinConversation(conversationId);

// Sair da sala
webSocket.leaveConversation(conversationId);
```

#### Eventos
- `conversation:updated`: Nova mensagem ou atualização
- `message:sent`: Confirmação de envio
- `typing:start/stop`: Indicadores de digitação

### 4. Sistema de Paginação

#### Frontend - Infinite Query
```typescript
const { data: conversationDetail } = useInfiniteConversationDetail(
  selectedConversationId,
  {
    enabled: !!selectedConversationId,
    getNextPageParam: (lastPage) => lastPage.pagination?.nextCursor
  }
);
```

#### Backend - Cursor-based Pagination
```typescript
// Parâmetros de paginação
const { page = 1, limit = 25, cursor } = req.query;
const offset = (page - 1) * limit;

// Query otimizada
const messages = await supabase
  .from('messages')
  .select('*')
  .eq('conversation_id', conversationId)
  .order('timestamp', { ascending: false })
  .range(offset, offset + limit - 1);
```

## Reprodução de Áudio

### 1. Componente `MediaMessage`
**Localização**: `client/src/components/features/conversas/MediaMessage.tsx`

#### Player de Áudio
```typescript
const [isPlaying, setIsPlaying] = useState(false);
const [progress, setProgress] = useState(0);
const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);

const audioRef = useRef<HTMLAudioElement | null>(null);
```

#### Controles
- **Play/Pause**: Botão com ícone dinâmico
- **Progress Bar**: Barra de progresso clicável para seek
- **Timer**: Tempo atual / Tempo total
- **Transcrição**: Botão para mostrar/ocultar texto transcrito

#### Tratamento de Erros
- URLs expiradas do Supabase
- Problemas de codec de áudio
- Falhas de rede

### 2. Tipos de Áudio Suportados

#### Gravação (WebRTC)
- `audio/webm;codecs=opus` (preferencial)
- `audio/webm` (fallback)
- `audio/mp4` (fallback)

#### Upload de Arquivos
- `audio/mp3`
- `audio/mpeg`
- `audio/wav`
- `audio/ogg`
- `audio/m4a`

## Otimizações e Performance

### 1. Lazy Loading
- Componentes de conversa carregados sob demanda
- Imagens e vídeos com loading diferido
- Transcrições carregadas apenas quando solicitadas

### 2. Debouncing
- Pesquisa de conversas com debounce de 300ms
- Auto-save de rascunhos com debounce de 1000ms

### 3. Otimizações de Query
- Índices otimizados no banco de dados
- Queries com LIMIT para evitar over-fetching
- Joins otimizados para reduzir N+1 queries

### 4. Cleanup de Recursos
```typescript
// Cleanup de URLs de objeto
useEffect(() => {
  return () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };
}, [audioUrl]);

// Cleanup de streams de áudio
const resetRecording = useCallback(() => {
  if (streamRef.current) {
    streamRef.current.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }
}, []);
```

## Tratamento de Erros

### 1. Frontend
- **Network Errors**: Retry automático com backoff exponencial
- **Permission Errors**: Mensagens específicas para o usuário
- **Validation Errors**: Feedback imediato na UI

### 2. Backend
- **Upload Failures**: Rollback de transações
- **Evolution API Failures**: Sistema de retry com diferentes estratégias
- **Transcription Failures**: Não bloqueia o fluxo principal

### 3. Logs Estruturados
```typescript
console.log('🎤 ÁUDIO LIMPO: Handler ativado', {
  conversationId,
  fileName: req.file?.originalname,
  fileSize: req.file?.size,
  timestamp: new Date().toISOString()
});
```

## Monitoramento e Observabilidade

### 1. Métricas
- Tempo de upload de áudio
- Taxa de sucesso de envio para WhatsApp
- Tempo de transcrição
- Cache hit/miss ratios

### 2. Alertas
- Falhas consecutivas na Evolution API
- Aumento no tempo de resposta
- Erros de permissão de microfone

### 3. Logs
- Structured logging com contexto
- Correlation IDs para rastreamento
- Diferentes níveis de log por ambiente

## Considerações de Segurança

### 1. Validação
- Tipos de arquivo permitidos
- Tamanho máximo de arquivo (50MB)
- Sanitização de nomes de arquivo

### 2. URLs Temporárias
- Expiração automática (1 hora)
- Regeneração automática quando necessário
- Acesso restrito por clínica

### 3. Permissões
- Verificação de acesso à conversa
- Validação de clinic_id
- Rate limiting para uploads

## Casos de Uso e Fluxos

### 1. Fluxo Básico de Áudio
1. Usuário clica no botão de microfone
2. Modal de gravação abre
3. Usuário concede permissão de microfone
4. Gravação inicia com feedback visual
5. Usuário para a gravação
6. Preview do áudio é exibido
7. Usuário confirma envio
8. Upload para Supabase Storage
9. Criação de registros no banco
10. Envio para WhatsApp via Evolution API
11. Transcrição em background
12. Atualização da UI via WebSocket

### 2. Tratamento de Falhas
- **Permissão Negada**: Instrução para habilitar microfone
- **Upload Falha**: Retry automático com feedback
- **WhatsApp Falha**: Mensagem salva localmente, retry em background
- **Transcrição Falha**: Não afeta o fluxo principal

### 3. Cenários Edge Cases
- **IDs Muito Grandes**: Tratamento de notação científica do JavaScript
- **URLs Expiradas**: Regeneração automática
- **Conexão Instável**: Retry com backoff exponencial
- **Múltiplas Instâncias WhatsApp**: Seleção da instância ativa

## Conclusão

O sistema de conversas e áudio do Operabase é uma solução robusta e escalável que integra múltiplas tecnologias para proporcionar uma experiência fluida de comunicação. Com recursos avançados como transcrição automática, cache multicamadas, e integração em tempo real, o sistema atende às necessidades complexas de comunicação em ambientes de saúde.

A arquitetura modular permite fácil manutenção e extensão, enquanto o tratamento abrangente de erros garante confiabilidade em produção. 