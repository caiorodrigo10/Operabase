# Banco de Dados

## 📋 Visão Geral

O Operabase utiliza **PostgreSQL** com **pgvector** para embeddings, **Drizzle ORM** como query builder, e **Supabase** como infraestrutura de backend. O sistema implementa isolamento completo multi-tenant e suporte avançado a busca vetorial para IA.

## 🗃️ Arquitetura de Dados (Real Implementation)

### Stack de Dados

```mermaid
graph TD
    A[Frontend] --> B[Drizzle ORM]
    B --> C[PostgreSQL + pgvector]
    C --> D[Supabase Infrastructure]
    
    E[Auth System] --> F[Supabase Auth]
    F --> G[Profiles Table]
    
    H[File Storage] --> I[Supabase Storage]
    
    J[Vector Search] --> K[pgvector Extension]
    K --> C
```

### Configuração Real do Banco

```typescript
// server/db.ts - Configuração Real
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema";

// Force Supabase connection - override DATABASE_URL
let connectionString = process.env.SUPABASE_POOLER_URL || 
                      process.env.SUPABASE_CONNECTION_STRING || 
                      process.env.SUPABASE_DATABASE_URL || 
                      process.env.DATABASE_URL;

if (process.env.SUPABASE_POOLER_URL) {
  // Use Supabase pooler URL (preferred)
  connectionString = process.env.SUPABASE_POOLER_URL;
  
  // Fix common issues with Supabase URLs
  if (connectionString.startsWith('postgres://')) {
    connectionString = connectionString.replace('postgres://', 'postgresql://');
  }
  if (connectionString.includes('#')) {
    connectionString = connectionString.replace(/#/g, '%23');
  }
}

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

// Create Drizzle instance
export const db = drizzle(pool, { schema });
```

## 👥 Schema Core - Usuários e Clínicas

### Tabela de Usuários (Local)

```sql
-- shared/schema.ts - users table real
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR NOT NULL UNIQUE,
  password VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  role VARCHAR NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Relacionamento Usuário-Clínica

```sql
-- shared/schema.ts - clinic_users table real
CREATE TABLE clinic_users (
  id SERIAL PRIMARY KEY,
  clinic_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role VARCHAR NOT NULL DEFAULT 'usuario',
  is_professional BOOLEAN DEFAULT false,
  permissions JSONB,
  is_active BOOLEAN DEFAULT true,
  invited_by INTEGER,
  invited_at TIMESTAMP,
  joined_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(clinic_id, user_id)
);
```

### Tabela de Clínicas

```sql
-- shared/schema.ts - clinics table real
CREATE TABLE clinics (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  responsible TEXT NOT NULL,
  phone TEXT,
  phone_country_code TEXT DEFAULT '+55',
  celular TEXT NOT NULL,
  celular_country_code TEXT DEFAULT '+55',
  email TEXT,
  specialties TEXT[],
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  address_country TEXT DEFAULT 'BR',
  total_professionals INTEGER DEFAULT 1,
  working_days TEXT[] DEFAULT ARRAY['monday','tuesday','wednesday','thursday','friday'],
  work_start TEXT DEFAULT '08:00',
  work_end TEXT DEFAULT '18:00',
  has_lunch_break BOOLEAN DEFAULT true,
  lunch_start TEXT DEFAULT '12:00',
  lunch_end TEXT DEFAULT '13:00',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  cnpj TEXT,
  website TEXT,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Profiles (Supabase Integration)

```sql
-- Inicializada automaticamente pelo sistema
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'user',
  clinic_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 💬 Schema de Comunicação

### Conversas

```sql
-- shared/schema.ts - conversations table real
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  clinic_id INTEGER NOT NULL,
  contact_id INTEGER NOT NULL,
  whatsapp_conversation_id TEXT,
  ai_active BOOLEAN DEFAULT false,
  ai_pause_end_time TIMESTAMP,
  last_message_id INTEGER,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Mensagens

```sql
-- shared/schema.ts - messages table real
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL,
  sender_type VARCHAR(20) NOT NULL, -- 'patient', 'professional', 'system', 'ai'
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'file', 'audio_voice', 'image', 'document'
  whatsapp_message_id TEXT,
  evolution_status TEXT,
  is_note BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  clinic_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed', 'pending'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Anexos de Mensagens

```sql
-- shared/schema.ts - message_attachments table real
CREATE TABLE message_attachments (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  file_url TEXT NOT NULL,
  storage_provider VARCHAR(50) DEFAULT 'supabase',
  storage_path TEXT,
  mime_type TEXT,
  metadata JSONB,
  clinic_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 📱 Schema WhatsApp

### Números WhatsApp

```sql
-- shared/schema.ts - whatsapp_numbers table real
CREATE TABLE whatsapp_numbers (
  id SERIAL PRIMARY KEY,
  clinic_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  phone_number TEXT NOT NULL,
  instance_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected', -- 'connected', 'disconnected', 'connecting', 'error'
  connected_at TIMESTAMP,
  disconnected_at TIMESTAMP,
  last_seen TIMESTAMP,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP,
  deleted_by_user_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(phone_number, clinic_id),
  UNIQUE(instance_name)
);
```

## 📅 Schema de Agendamentos

### Consultas

```sql
-- shared/schema.ts - appointments table real
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
  status TEXT DEFAULT 'agendada', -- 'agendada', 'confirmada', 'em_andamento', 'concluida', 'cancelada', 'faltou'
  payment_status TEXT DEFAULT 'pendente',
  payment_amount INTEGER, -- em centavos
  session_notes TEXT,
  google_calendar_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tags de Consultas

```sql
-- shared/schema.ts - appointment_tags table real
CREATE TABLE appointment_tags (
  id SERIAL PRIMARY KEY,
  clinic_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL, -- Cor em hexadecimal
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🤖 Schema do Sistema RAG

### Base de Conhecimento

```sql
-- shared/schema.ts - rag_knowledge_bases table real
CREATE TABLE rag_knowledge_bases (
  id SERIAL PRIMARY KEY,
  external_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Documentos RAG

```sql
-- shared/schema.ts - rag_documents table real
CREATE TABLE rag_documents (
  id SERIAL PRIMARY KEY,
  external_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  url TEXT,
  metadata JSONB,
  status TEXT DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Chunks de Texto

```sql
-- shared/schema.ts - rag_chunks table real
CREATE TABLE rag_chunks (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES rag_documents(id),
  content TEXT NOT NULL,
  metadata JSONB,
  chunk_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Embeddings Vetoriais

```sql
-- shared/schema.ts - rag_embeddings table real
CREATE TABLE rag_embeddings (
  id SERIAL PRIMARY KEY,
  chunk_id INTEGER REFERENCES rag_chunks(id),
  embedding VECTOR(1536), -- pgvector extension para OpenAI embeddings
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Configuração Mara AI

```sql
-- shared/schema.ts - mara_professional_configs table real
CREATE TABLE mara_professional_configs (
  id SERIAL PRIMARY KEY,
  clinic_id INTEGER NOT NULL,
  professional_id INTEGER NOT NULL,
  knowledge_base_id INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(clinic_id, professional_id)
);
```

## 🔍 Sistema de Logs

### Logs do Sistema

```sql
-- shared/schema.ts - system_logs table real
CREATE TABLE system_logs (
  id SERIAL PRIMARY KEY,
  clinic_id INTEGER NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'contact', 'appointment', 'message', 'conversation'
  entity_id INTEGER,
  action_type VARCHAR(100) NOT NULL, -- 'created', 'updated', 'deleted', 'status_changed'
  actor_id UUID,
  actor_type VARCHAR(50), -- 'professional', 'patient', 'system', 'ai'
  actor_name VARCHAR(255),
  professional_id INTEGER,
  related_entity_id INTEGER,
  previous_data JSONB,
  new_data JSONB,
  changes JSONB,
  source VARCHAR(50), -- 'web', 'whatsapp', 'api', 'mobile'
  ip_address VARCHAR(45),
  user_agent TEXT,
  session_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔐 Schema de Autenticação

### Sessões

```sql
-- shared/schema.ts - sessions table real
CREATE TABLE sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);
```

### API Keys

```sql
-- shared/schema.ts - api_keys table real
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  clinic_id INTEGER NOT NULL,
  key_name VARCHAR(255) NOT NULL,
  api_key VARCHAR(64) NOT NULL,
  key_hash TEXT NOT NULL, -- bcrypt hash
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '["read", "write"]',
  last_used_at TIMESTAMP,
  usage_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(api_key)
);
```

## 📋 Schema de Anamneses

### Templates de Anamnese

```sql
-- shared/schema.ts - anamnesis_templates table real
CREATE TABLE anamnesis_templates (
  id SERIAL PRIMARY KEY,
  clinic_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL, -- {questions: [{id, text, type, options, required}]}
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Respostas de Anamnese

```sql
-- shared/schema.ts - anamnesis_responses table real
CREATE TABLE anamnesis_responses (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER NOT NULL,
  clinic_id INTEGER NOT NULL,
  template_id INTEGER NOT NULL,
  responses JSONB NOT NULL, -- {questionId: value}
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'expired'
  share_token TEXT NOT NULL,
  patient_name TEXT,
  patient_email TEXT,
  patient_phone TEXT,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(share_token)
);
```

## 📊 Schema de Analytics

### Métricas

```sql
-- shared/schema.ts - analytics_metrics table real
CREATE TABLE analytics_metrics (
  id SERIAL PRIMARY KEY,
  clinic_id INTEGER NOT NULL,
  metric_type TEXT NOT NULL, -- 'daily_messages', 'appointments_scheduled'
  value INTEGER NOT NULL,
  date TIMESTAMP NOT NULL,
  metadata TEXT, -- JSON string para dados adicionais
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🗂️ Drizzle ORM Implementation

### Schema TypeScript Real

```typescript
// shared/schema.ts - Implementação Real
import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, index, unique, uuid, vector, bigint, bigserial } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Exemplo de tabela com validação Zod
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  name: varchar("name").notNull(),
  role: varchar("role").notNull().default("admin"),
  is_active: boolean("is_active").notNull().default(true),
  last_login: timestamp("last_login"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Validation schema
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  name: z.string().min(1, "Nome é obrigatório"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
```

### Índices e Performance

```sql
-- Índices importantes implementados
CREATE INDEX idx_conversations_clinic ON conversations(clinic_id);
CREATE INDEX idx_conversations_contact ON conversations(contact_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_clinic ON messages(clinic_id);
CREATE INDEX idx_appointments_clinic ON appointments(clinic_id);
CREATE INDEX idx_appointments_date ON appointments(scheduled_date);
CREATE INDEX idx_whatsapp_numbers_clinic ON whatsapp_numbers(clinic_id);
CREATE INDEX idx_system_logs_clinic_entity ON system_logs(clinic_id, entity_type);
CREATE INDEX idx_rag_embeddings_vector ON rag_embeddings USING ivfflat (embedding vector_cosine_ops);
```

## 🚀 Configuração de Produção

### Variáveis de Ambiente

```bash
# Database
SUPABASE_POOLER_URL=postgresql://postgres.xxx:xxx@aws-0-us-east-1.pooler.supabase.com:6543/postgres
SUPABASE_CONNECTION_STRING=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
DATABASE_URL=postgresql://...

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Extensões PostgreSQL Necessárias

```sql
-- Extensões requeridas
CREATE EXTENSION IF NOT EXISTS "vector"; -- pgvector para embeddings
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Text search
```

### Connection Pooling

```typescript
// server/db.ts - Pool configuration real
export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 20, // máximo de conexões
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## 🔧 Checklist de Produção

- [ ] pgvector extension instalada
- [ ] SUPABASE_POOLER_URL configurada
- [ ] Connection pooling ativo
- [ ] Índices de performance criados
- [ ] Profiles table inicializada
- [ ] SSL configurado corretamente
- [ ] Backup automático ativo
- [ ] Monitoring de conexões ativo

---

**Status:** ✅ Documentação atualizada conforme schema real  
**Schema Verificado:** shared/schema.ts, server/db.ts  
**Próximas Seções:** [Communication System](communication.md) | [AI Assistant](ai-assistant.md) 