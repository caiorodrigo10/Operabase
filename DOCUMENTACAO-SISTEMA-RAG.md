# Documentação Completa do Sistema RAG

**Versão:** 1.0  
**Data:** 22 de Junho de 2025  
**Sistema:** Healthcare Communication Platform - RAG Module

---

## 1. Visão Geral do Sistema

### 1.1 Arquitetura Geral

O sistema RAG (Retrieval-Augmented Generation) implementado utiliza uma arquitetura híbrida que combina:

- **PostgreSQL** com extensão **pgvector** para armazenamento vetorial
- **OpenAI API** para geração de embeddings 
- **Sistema de arquivos local** para armazenamento físico de PDFs
- **Drizzle ORM** para gerenciamento de banco de dados
- **Node.js/Express** para APIs backend
- **React/TypeScript** para interface frontend

### 1.2 Fluxo de Dados Principal

```
Upload PDF → Extração de Texto → Chunking → Embeddings → Armazenamento → Busca Semântica
```

1. **Upload**: PDF carregado via interface web
2. **Processamento**: Texto extraído e dividido em chunks
3. **Embeddings**: Vetores gerados via OpenAI API
4. **Armazenamento**: Dados salvos no PostgreSQL + arquivo no filesystem
5. **Busca**: Queries semânticas usando similaridade vetorial

---

## 2. Estrutura de Dados

### 2.1 Schema do Banco de Dados

#### Tabela: `rag_knowledge_bases`
```sql
CREATE TABLE rag_knowledge_bases (
  id SERIAL PRIMARY KEY,
  external_user_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Propósito**: Organizar documentos em coleções lógicas por usuário.

#### Tabela: `rag_documents`
```sql
CREATE TABLE rag_documents (
  id SERIAL PRIMARY KEY,
  external_user_id VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  content_type VARCHAR DEFAULT 'pdf',
  file_path VARCHAR,
  processing_status VARCHAR DEFAULT 'pending',
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Status possíveis**:
- `pending`: Aguardando processamento
- `processing`: Em processamento
- `completed`: Processado com sucesso
- `error`: Erro no processamento

#### Tabela: `rag_chunks`
```sql
CREATE TABLE rag_chunks (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES rag_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Propósito**: Armazenar fragmentos de texto extraídos dos documentos para processamento vetorial.

#### Tabela: `rag_embeddings`
```sql
CREATE TABLE rag_embeddings (
  id SERIAL PRIMARY KEY,
  chunk_id INTEGER REFERENCES rag_chunks(id) ON DELETE CASCADE,
  embedding VECTOR(1536),
  model VARCHAR DEFAULT 'text-embedding-3-small',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Detalhes técnicos**:
- `VECTOR(1536)`: Tipo pgvector para armazenar embeddings OpenAI
- Índice otimizado para busca por similaridade de cosseno

#### Tabela: `rag_queries`
```sql
CREATE TABLE rag_queries (
  id SERIAL PRIMARY KEY,
  external_user_id VARCHAR NOT NULL,
  query_text TEXT NOT NULL,
  results_count INTEGER,
  executed_at TIMESTAMP DEFAULT NOW()
);
```

**Propósito**: Log de consultas para análise e otimização.

### 2.2 Relacionamentos

```
rag_knowledge_bases (1) ←→ (N) rag_documents
rag_documents (1) ←→ (N) rag_chunks  
rag_chunks (1) ←→ (1) rag_embeddings
```

---

## 3. Processamento de Documentos

### 3.1 Upload e Validação

**Endpoint**: `POST /api/rag/documents`

**Validações**:
- Tipo de arquivo: apenas PDFs
- Tamanho máximo: 10MB
- Usuário autenticado

**Armazenamento físico**:
```
./uploads/rag/[timestamp]-[random]-[filename].pdf
```

### 3.2 Extração de Texto

**Componente**: `server/rag-processors/pdf-processor.ts`

```typescript
class PDFProcessor {
  async extractText(filePath: string): Promise<{
    text: string;
    pageCount: number;
    metadata: any;
  }> {
    // Usa biblioteca pdf-parse para extrair texto
    // Preserva metadados como número de páginas
    // Trata encoding UTF-8 para caracteres especiais
  }
}
```

**Características**:
- Preserva estrutura de parágrafos
- Remove caracteres de controle
- Mantém acentuação correta (UTF-8)
- Extrai metadados do PDF

### 3.3 Chunking Strategy

**Configurações atuais**:
```typescript
const CHUNK_SIZE = 1000;        // caracteres por chunk
const CHUNK_OVERLAP = 200;      // sobreposição entre chunks
const MAX_CHUNK_SIZE = 2000;    // limite máximo
```

**Algoritmo**:
1. Divide texto em sentenças
2. Agrupa sentenças até atingir CHUNK_SIZE
3. Aplica sobreposição para manter contexto
4. Gera chunks com metadados (índice, posição, etc.)

### 3.4 Geração de Embeddings

**Componente**: `server/rag-processors/embedding-service.ts`

```typescript
class EmbeddingService {
  private model = 'text-embedding-3-small';
  private dimensions = 1536;
  private batchSize = 100;

  async generateEmbeddings(chunks: Chunk[]): Promise<EmbeddingResult[]> {
    // Processa em lotes para otimizar API calls
    // Rate limiting automático
    // Retry logic para falhas temporárias
  }
}
```

**Otimizações**:
- Processamento em lotes (batch)
- Rate limiting para evitar limites da API
- Retry automático para falhas temporárias
- Cache de embeddings para evitar reprocessamento

---

## 4. Sistema de Busca Semântica

### 4.1 Geração de Embedding da Query

**Processo**:
1. Usuário digita pergunta em linguagem natural
2. Sistema gera embedding da query usando mesmo modelo
3. Embedding é usado para busca vetorial

### 4.2 Algoritmo de Busca

**SQL de busca vetorial**:
```sql
SELECT 
  c.content,
  c.metadata,
  d.title,
  d.id as document_id,
  c.id as chunk_id,
  1 - (e.embedding <=> $queryEmbedding::vector) as similarity
FROM rag_embeddings e
JOIN rag_chunks c ON e.chunk_id = c.id
JOIN rag_documents d ON c.document_id = d.id
WHERE d.external_user_id = $userId
  AND d.processing_status = 'completed'
  AND 1 - (e.embedding <=> $queryEmbedding::vector) >= $minSimilarity
ORDER BY similarity DESC
LIMIT $limit
```

**Operadores pgvector**:
- `<=>`: Distância de cosseno (0 = idêntico, 2 = oposto)
- `<#>`: Produto interno negativo
- `<->`: Distância euclidiana

### 4.3 Parâmetros de Busca

```typescript
interface SearchParams {
  query: string;           // Pergunta do usuário
  limit?: number;          // Máximo de resultados (padrão: 5)
  minSimilarity?: number;  // Threshold de similaridade (padrão: 0.7)
  knowledgeBaseId?: number; // Filtro por base específica
}
```

**Similaridade**:
- 1.0 = Idêntico
- 0.9-0.99 = Muito similar
- 0.8-0.89 = Similar
- 0.7-0.79 = Relacionado
- <0.7 = Pouco relacionado

---

## 5. Bases de Conhecimento

### 5.1 Conceito e Organização

**Definição**: Coleções lógicas de documentos que permitem organizar conhecimento por temas, projetos ou domínios específicos.

**Características**:
- Isolamento por usuário (tenant isolation)
- Metadados flexíveis via JSONB
- Contagem automática de documentos
- Tracking de última atualização

### 5.2 Gerenciamento via API

**Criar base**:
```typescript
POST /api/rag/knowledge-bases
{
  "name": "Documentos Médicos",
  "description": "Base para documentos de prontuários e protocolos"
}
```

**Listar bases**:
```typescript
GET /api/rag/knowledge-bases
// Retorna bases com contagem de documentos e última atualização
```

**Associação de documentos**:
- Documentos são associados via metadata
- Campo `knowledge_base` no metadata do documento

### 5.3 Estatísticas e Métricas

Cada base de conhecimento inclui:
- **documentCount**: Número de documentos
- **lastUpdated**: Data da última modificação
- **itemCount**: Total de chunks processados
- **processedEmbeddings**: Embeddings gerados com sucesso

---

## 6. Interface Frontend

### 6.1 Componentes Principais

#### BasesConhecimento.tsx
- Lista todas as bases de conhecimento do usuário
- Cards com preview dos documentos
- Status de processamento visual
- Ações de edição e exclusão

#### ColecaoDetalhe.tsx  
- Visualização detalhada de uma base específica
- Lista de documentos com status
- Interface de busca semântica
- Upload de novos documentos

#### DocumentUpload.tsx
- Drag & drop para PDFs
- Progress bar de upload
- Validação de arquivos
- Feedback visual de status

### 6.2 Estados de Interface

**Status de Documento**:
- 🟡 **Pendente**: Aguardando processamento
- 🔵 **Processando**: Em análise
- 🟢 **Processado**: Pronto para busca
- 🔴 **Erro**: Falha no processamento

**Badges visuais**:
```typescript
const getStatusBadge = (status: string) => {
  switch(status) {
    case 'pending': return <Badge variant="secondary">Pendente</Badge>;
    case 'processing': return <Badge variant="default">Processando</Badge>;
    case 'completed': return <Badge variant="success">Processado</Badge>;
    case 'error': return <Badge variant="destructive">Erro</Badge>;
  }
}
```

---

## 7. Workflow de Processamento

### 7.1 DocumentWorkflow.ts

**Classe principal**: Orquestra todo o fluxo de processamento

```typescript
class DocumentWorkflow {
  async processDocument(documentId: number): Promise<void> {
    // 1. Atualizar status para 'processing'
    // 2. Extrair texto do PDF
    // 3. Gerar chunks
    // 4. Criar embeddings
    // 5. Salvar no banco
    // 6. Atualizar status para 'completed'
  }
}
```

**Tratamento de erros**:
- Rollback automático em caso de falha
- Log detalhado de erros
- Status 'error' com mensagem explicativa
- Possibilidade de reprocessamento

### 7.2 Processamento Assíncrono

```typescript
// Upload retorna imediatamente
const uploadResponse = await uploadDocument();

// Processamento acontece em background
setImmediate(async () => {
  const workflow = new DocumentWorkflow();
  await workflow.processDocument(documentId);
});
```

**Vantagens**:
- Interface responsiva
- Usuário não espera processamento
- Feedback em tempo real via polling

---

## 8. Otimizações e Performance

### 8.1 Índices do Banco

```sql
-- Índice para busca vetorial eficiente
CREATE INDEX rag_embeddings_embedding_idx 
ON rag_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Índices para queries frequentes
CREATE INDEX rag_documents_user_status_idx 
ON rag_documents (external_user_id, processing_status);

CREATE INDEX rag_chunks_document_idx 
ON rag_chunks (document_id);
```

### 8.2 Cache e Otimizações

**Cache de embeddings**:
- Evita reprocessamento desnecessário
- Hash do conteúdo para validação
- TTL configurável

**Batch processing**:
- Embeddings processados em lotes
- Rate limiting automático
- Retry logic inteligente

### 8.3 Monitoramento

**Métricas coletadas**:
- Tempo de processamento por documento
- Taxa de sucesso/erro
- Latência de queries de busca
- Uso de API OpenAI

---

## 9. Segurança e Controle de Acesso

### 9.1 Isolamento por Usuário

**Tenant isolation**:
- Todos os dados filtrados por `external_user_id`
- Impossível acessar dados de outros usuários
- Queries sempre incluem filtro de usuário

### 9.2 Validações de Segurança

**Upload de arquivos**:
- Validação de tipo MIME
- Limite de tamanho
- Verificação de conteúdo
- Sanitização de nomes de arquivo

**API endpoints**:
- Autenticação obrigatória
- Validação de ownership
- Rate limiting
- Sanitização de inputs

---

## 10. Configurações e Variáveis

### 10.1 Variáveis de Ambiente

```env
# OpenAI API
OPENAI_API_KEY=sk-...

# Database
DATABASE_URL=postgresql://...

# Upload paths
UPLOAD_DIR=./uploads/rag

# Processing settings
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
MAX_CHUNK_SIZE=2000
EMBEDDING_BATCH_SIZE=100
```

### 10.2 Configurações Ajustáveis

**Chunking**:
- Tamanho dos chunks
- Sobreposição entre chunks
- Estratégia de divisão

**Embeddings**:
- Modelo OpenAI utilizado
- Dimensionalidade
- Batch size para processamento

**Busca**:
- Threshold de similaridade padrão
- Número máximo de resultados
- Timeout de queries

---

## 11. API Reference

### 11.1 Endpoints de Bases de Conhecimento

```typescript
// Listar bases
GET /api/rag/knowledge-bases
Response: KnowledgeBase[]

// Criar base
POST /api/rag/knowledge-bases
Body: { name: string, description: string }
Response: { id: number, message: string }

// Deletar base
DELETE /api/rag/knowledge-bases/:name
Response: { message: string, deletedDocuments: number }
```

### 11.2 Endpoints de Documentos

```typescript
// Listar documentos
GET /api/rag/documents
Response: Document[]

// Upload documento
POST /api/rag/documents
Body: FormData with PDF file
Response: { id: number, message: string }

// Deletar documento
DELETE /api/rag/documents/:id
Response: { message: string }

// Reprocessar documento
POST /api/rag/documents/:id/reprocess
Response: { message: string, documentId: number }
```

### 11.3 Endpoint de Busca

```typescript
// Busca semântica
POST /api/rag/search
Body: {
  query: string,
  limit?: number,
  minSimilarity?: number
}
Response: {
  results: SearchResult[],
  query: string,
  totalResults: number,
  message: string,
  processedEmbeddings: number
}
```

---

## 12. Troubleshooting

### 12.1 Problemas Comuns

**Documento não processa**:
- Verificar se PDF não está corrompido
- Verificar logs de erro na tabela `rag_documents`
- Verificar conectividade com OpenAI API

**Busca não retorna resultados**:
- Verificar se documentos estão processados (`processing_status = 'completed'`)
- Ajustar threshold de similaridade
- Verificar se embeddings foram gerados

**Performance lenta**:
- Verificar índices do banco
- Otimizar queries com EXPLAIN
- Considerar aumentar batch size

### 12.2 Logs e Debugging

**Logs principais**:
- Upload: `📤 Document uploaded: ${fileName}`
- Processamento: `🔄 Processing document ${documentId}`
- Embedding: `🔮 Generating embeddings for ${chunks.length} chunks`
- Busca: `🔍 Semantic search for: "${query}"`

**Debugging queries**:
```sql
-- Verificar documentos processados
SELECT COUNT(*) FROM rag_documents WHERE processing_status = 'completed';

-- Verificar embeddings gerados
SELECT COUNT(*) FROM rag_embeddings;

-- Verificar chunks por documento
SELECT d.title, COUNT(c.id) as chunks
FROM rag_documents d
LEFT JOIN rag_chunks c ON d.id = c.document_id
GROUP BY d.id, d.title;
```

---

## 13. Roadmap e Melhorias Futuras

### 13.1 Melhorias Planejadas

**Performance**:
- Cache de queries frequentes
- Pré-computação de embeddings populares
- Otimização de índices vetoriais

**Funcionalidades**:
- Suporte a múltiplos tipos de arquivo
- Busca híbrida (vetorial + texto)
- Feedback de relevância

**Interface**:
- Preview de documentos
- Highlighting de trechos relevantes
- Analytics de uso

### 13.2 Considerações de Escala

**Para 1000+ documentos**:
- Implementar particionamento
- Cache distribuído
- Processamento paralelo

**Para 10000+ queries/dia**:
- Load balancing
- Réplicas de leitura
- CDN para assets

---

## 14. Conclusão

O sistema RAG implementado fornece uma base sólida para busca semântica e recuperação de informações em documentos PDF. A arquitetura híbrida (PostgreSQL + pgvector + OpenAI) oferece excelente equilíbrio entre performance, flexibilidade e facilidade de manutenção.

A implementação atual suporta adequadamente casos de uso médios e pode ser escalada conforme necessário. O design modular facilita futuras expansões e otimizações.

**Pontos fortes**:
- Arquitetura robusta e extensível
- Interface intuitiva e responsiva
- Processamento assíncrono eficiente
- Busca semântica precisa
- Isolamento seguro por usuário

**Próximos passos recomendados**:
1. Implementar cache de queries
2. Adicionar analytics de uso
3. Otimizar performance para grandes volumes
4. Expandir tipos de arquivo suportados