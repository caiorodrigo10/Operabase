# Plano: Sistema de Upload de Arquivos - Supabase Storage

## 🎯 Objetivo
Implementar sistema completo de upload de arquivos (imagem, vídeo, áudio, documentos) conectado ao botão de anexo existente, usando Supabase Storage com estrutura organizada por cliente.

## 📋 Funcionalidades Principais

### 1. **Interface de Upload**
- **Trigger**: Botão "Paperclip" existente no MainConversationArea (linha 186)
- **Modal/Dialog**: Interface drag-and-drop para seleção de arquivos
- **Preview**: Visualização prévia antes do upload
- **Progress**: Barra de progresso durante upload
- **Validação**: Tipos MIME e tamanho (50MB máximo)

### 2. **Estrutura de Armazenamento**
```
conversation-attachments/
  clinic-{clinicId}/
    conversation-{conversationId}/
      images/
        {timestamp}-{filename}.{ext}
      videos/
        {timestamp}-{filename}.{ext}
      audio/
        {timestamp}-{filename}.{ext}
      documents/
        {timestamp}-{filename}.{ext}
```

### 3. **Tipos de Arquivo Suportados**
- **Imagens**: JPG, PNG, GIF, WEBP (até 10MB)
- **Vídeos**: MP4, MOV, AVI, WEBM (até 50MB)
- **Áudio**: MP3, WAV, OGG, M4A (até 25MB)
- **Documentos**: PDF, DOC, DOCX, TXT (até 20MB)

## 🔧 Implementação Técnica

### **FASE 1: Frontend Upload Component**

#### FileUploadModal Component
```typescript
interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  onUploadSuccess: (attachment: MessageAttachment) => void;
}

// Funcionalidades:
// - Drag and drop zone
// - Multiple file selection
// - File type validation
// - Size validation
// - Progress tracking
// - Error handling
```

#### Integração com MainConversationArea
```typescript
// Atualizar botão existente (linha 186):
<Button
  variant="ghost"
  size="sm"
  className="text-gray-500 hover:text-gray-700 flex-shrink-0 w-10 h-10"
  title="Anexar arquivo"
  onClick={() => setShowUploadModal(true)} // Nova funcionalidade
>
  <Paperclip className="w-4 h-4" />
</Button>

// Adicionar modal:
<FileUploadModal
  isOpen={showUploadModal}
  onClose={() => setShowUploadModal(false)}
  conversationId={selectedConversationId}
  onUploadSuccess={handleUploadSuccess}
/>
```

### **FASE 2: Backend Upload Service**

#### Endpoint de Upload
```typescript
POST /api/conversations/:conversationId/upload
Content-Type: multipart/form-data

// Request:
{
  file: File,
  clinicId: number,
  messageContent?: string
}

// Response:
{
  success: boolean,
  message: MessageWithAttachment,
  attachment: MessageAttachment,
  signedUrl: string,
  expiresAt: string
}
```

#### UploadService Class
```typescript
class ConversationUploadService {
  // Upload com categorização automática
  async uploadFile(params: {
    file: Buffer,
    filename: string,
    mimeType: string,
    conversationId: string,
    clinicId: number,
    userId: number
  }): Promise<UploadResult>;

  // Gerar URLs assinadas
  async generateSignedUrl(storagePath: string): Promise<string>;
  
  // Validação de arquivos
  validateFile(file: Buffer, mimeType: string): ValidationResult;
  
  // Cleanup em caso de erro
  async cleanupFailedUpload(storagePath: string): Promise<void>;
}
```

### **FASE 3: Database Integration**

#### Criação Automática de Mensagem
```typescript
// Fluxo completo:
1. Upload do arquivo para Supabase Storage
2. Criação da mensagem na tabela messages
3. Criação do attachment na tabela message_attachments
4. Geração de URL assinada (24h)
5. Invalidação do cache da conversa
6. Notificação WebSocket (se disponível)
```

#### Schema da Mensagem com Anexo
```typescript
interface MessageWithAttachment {
  id: number;
  conversation_id: string;
  sender_type: 'professional' | 'patient';
  content: string; // "📎 [filename] enviado"
  message_type: 'image' | 'video' | 'audio' | 'document';
  created_at: string;
  
  message_attachments: {
    id: number;
    file_name: string;
    file_type: string; // MIME type
    file_size: number;
    file_url: string; // URL assinada
    storage_path: string;
    signed_url_expires: string;
  }[];
}
```

## 🎨 Interface do Usuário

### **Upload Modal Design**
```
┌─────────────────────────────────────┐
│  📎 Enviar Arquivo                   │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────────┐ │
│  │  📁 Arraste arquivos aqui       │ │
│  │     ou clique para selecionar   │ │
│  │                                 │ │
│  │  Suportados: imagem, vídeo,     │ │
│  │  áudio, documentos (até 50MB)   │ │
│  └─────────────────────────────────┘ │
│                                     │
│  📄 documento.pdf (2.3 MB)          │
│  ████████████████░░░░ 80%           │
│                                     │
│  [Cancelar]           [Enviar]     │
└─────────────────────────────────────┘
```

### **Preview de Arquivos**
- **Imagens**: Thumbnail com dimensões
- **Vídeos**: Primeiro frame + duração
- **Áudio**: Waveform ou ícone + duração
- **Documentos**: Ícone + nome + tamanho

## 🔄 Fluxo de Upload

### **Passo a Passo**
1. **Usuário clica no botão anexo** → Abre modal
2. **Seleciona arquivo(s)** → Validação client-side
3. **Confirma envio** → Inicia upload
4. **Upload para Storage** → Progress feedback
5. **Criação de mensagem** → Banco de dados
6. **Retorna para conversa** → Anexo visível
7. **Cache invalidation** → Lista atualizada

### **Tratamento de Erros**
- **Arquivo muito grande**: Modal de erro com limite
- **Tipo não suportado**: Lista de tipos aceitos
- **Falha no upload**: Retry automático (3x)
- **Erro de rede**: Mensagem "Verifique conexão"
- **Storage indisponível**: "Tente novamente em instantes"

## 🔒 Segurança e Validação

### **Client-side**
- Validação de tipo MIME
- Verificação de tamanho
- Preview sanitizado
- Rate limiting (max 5 uploads/minuto)

### **Server-side**
- Re-validação de todos os parâmetros
- Scan de malware (futuro)
- Autenticação obrigatória
- Isolamento por clínica
- Logs de auditoria

## 📊 Métricas e Monitoramento

### **Métricas de Upload**
```typescript
interface UploadMetrics {
  totalUploads: number;
  successRate: number;
  avgUploadTime: number;
  storageUsed: number; // GB por clínica
  popularFileTypes: Record<string, number>;
  errorsByType: Record<string, number>;
}
```

### **Alertas**
- Storage > 80% da cota
- Taxa de erro > 5%
- Upload time > 30s
- Arquivos suspeitos

## 🚀 Cronograma de Implementação

### **Dia 1: Frontend Base**
- [ ] FileUploadModal component
- [ ] Integração com MainConversationArea
- [ ] Validação client-side
- [ ] Progress tracking

### **Dia 2: Backend Service**
- [ ] Upload endpoint
- [ ] SupabaseStorageService updates
- [ ] Database integration
- [ ] Error handling

### **Dia 3: Integração e Testes**
- [ ] Frontend + Backend integration
- [ ] Cache invalidation
- [ ] Visual testing
- [ ] Performance optimization

### **Dia 4: Polimento**
- [ ] UI/UX refinements
- [ ] Error messages
- [ ] Documentation update
- [ ] Deployment

## ❓ Decisões Pendentes

1. **Múltiplos arquivos**: Permitir upload simultâneo?
2. **Compressão**: Comprimir imagens/vídeos automaticamente?
3. **Thumbnails**: Gerar thumbnails automáticos?
4. **Histórico**: Mostrar histórico de uploads?
5. **Permissions**: Diferentes permissões por tipo de usuário?

---

**Aguardando aprovação para iniciar implementação** 🚦