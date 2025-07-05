# 🎯 PLANO DE IMPLEMENTAÇÃO COMPLETA - 100% DAS FUNCIONALIDADES

## 📋 **ÍNDICE**

1. [Status Atual e Fundação](#status-atual-e-fundação)
2. [Princípios e Padrões](#princípios-e-padrões)
3. [Arquitetura de Implementação](#arquitetura-de-implementação)
4. [Plano de Execução por Fase](#plano-de-execução-por-fase)
5. [Funcionalidades por Domínio](#funcionalidades-por-domínio)
6. [Configuração de Ambiente](#configuração-de-ambiente)
7. [Testes e Validação](#testes-e-validação)
8. [O QUE FAZER e O QUE NÃO FAZER](#o-que-fazer-e-o-que-não-fazer)

---

## 📊 **STATUS ATUAL E FUNDAÇÃO**

### ✅ **FUNCIONANDO (MANTER EXATAMENTE COMO ESTÁ)**

| Componente | Status | Tecnologia | Observações |
|------------|--------|------------|-------------|
| **Backend AWS** | ✅ FUNCIONANDO | Elastic Beanstalk + CommonJS | `server/debug-server.cjs` funcionando |
| **Frontend Vercel** | ✅ FUNCIONANDO | Vite + React + TypeScript | Build corrigido e funcionando |
| **Database** | ✅ FUNCIONANDO | Supabase PostgreSQL | 82 appointments, 5 clinics, 37 contacts |
| **CORS** | ✅ CONFIGURADO | Express middleware | Vercel origins configurados |
| **Build System** | ✅ ESTÁVEL | Vite (frontend) + tsc (backend) | ES Module conflicts resolvidos |

### 🔧 **PADRÕES QUE FUNCIONARAM**

1. **Backend**: CommonJS (`.cjs`) files para AWS Elastic Beanstalk
2. **Frontend**: ES Modules com Vite build
3. **API**: Express routes com domínios separados
4. **Database**: Supabase com queries diretas
5. **CORS**: Origins específicos configurados
6. **Deploy**: GitHub Actions automático

---

## 🎯 **PRINCÍPIOS E PADRÕES**

### ✅ **REGRAS DE OURO - O QUE MANTER**

1. **NUNCA alterar** `server/debug-server.cjs` que está funcionando na AWS
2. **SEMPRE usar** `.cjs` para novos arquivos de servidor AWS
3. **MANTER** estrutura de domínios (`server/domains/`)
4. **PRESERVAR** configuração CORS existente
5. **USAR** TanStack Query para estado do frontend
6. **MANTER** Supabase como database principal
7. **SEGUIR** padrão de hooks existentes (`useConversations`, `useAuth`, etc.)

### ❌ **O QUE NÃO FAZER - REGRAS CRÍTICAS**

1. **NUNCA** mudar `"type": "module"` no `package.json`
2. **NUNCA** criar arquivos `.js` que conflitem com `.ts`
3. **NUNCA** alterar Procfile que está funcionando
4. **NUNCA** modificar `.ebextensions/00-nodejs-aws.config`
5. **NUNCA** mudar URLs de CORS configuradas
6. **NUNCA** usar ES Modules (import/export) em arquivos `.cjs`
7. **NUNCA** fazer deploy sem testar localmente primeiro

---

## 🏗️ **ARQUITETURA DE IMPLEMENTAÇÃO**

### **Estrutura de Domínios (Backend)**

```
server/domains/
├── appointments/     ✅ EXISTE - Implementar APIs restantes
├── calendar/         ✅ EXISTE - Conectar com frontend
├── contacts/         ✅ EXISTE - Implementar CRUD completo  
├── medical-records/  ✅ EXISTE - Implementar frontend
├── analytics/        ✅ EXISTE - Implementar dashboards
├── conversas/        🔄 PARCIAL - Completar integração
├── livia/           🔄 PARCIAL - Completar configuração
├── mara/            ❌ CRIAR - Sistema RAG completo
├── pipeline/        ✅ EXISTE - Implementar frontend
├── settings/        ✅ EXISTE - Implementar interface
└── user-profile/    ✅ EXISTE - Implementar interface
```

### **Estrutura Frontend**

```
src/
├── hooks/              ✅ FUNCIONANDO - Expandir conforme necessário
├── components/
│   ├── features/
│   │   ├── conversas/  ✅ FUNCIONANDO - Conectar com backend
│   │   ├── calendar/   ❌ CRIAR - Interface completa
│   │   ├── mara/       ❌ CRIAR - Chat AI interface
│   │   ├── livia/      ❌ CRIAR - Configuração interface
│   │   └── pipeline/   ❌ CRIAR - CRM interface
│   └── ui/             ✅ FUNCIONANDO - shadcn/ui
├── pages/              🔄 PARCIAL - Completar todas as páginas
└── lib/                ✅ FUNCIONANDO - API client configurado
```

---

## 📅 **PLANO DE EXECUÇÃO POR FASE**

### **FASE 1: CALENDÁRIO E AGENDAMENTOS (Semana 1)**

**Objetivo**: Sistema de calendário 100% funcional

#### **Backend (AWS)**
- [ ] Criar `server/calendar-api.cjs` (CommonJS)
- [ ] Implementar todas as rotas de calendário
- [ ] Conectar com Google Calendar API
- [ ] Sistema de disponibilidade completo

#### **Frontend (Vercel)**
- [ ] Criar `src/components/features/calendar/`
- [ ] Implementar visualização semanal/mensal
- [ ] Sistema de agendamento drag-and-drop
- [ ] Integração com `useAvailability` hook

#### **Endpoints Necessários**
```typescript
GET /api/calendar/events?clinic_id=1&start_date=2025-01-01&end_date=2025-01-31
POST /api/appointments
PUT /api/appointments/:id
DELETE /api/appointments/:id
GET /api/appointments/availability/check
```

### **FASE 2: CONVERSAS E WHATSAPP (Semana 2)**

**Objetivo**: Sistema de conversas 100% funcional

#### **Backend (AWS)**
- [ ] Criar `server/whatsapp-api.cjs`
- [ ] Integração Evolution API completa
- [ ] Sistema de mensagens em tempo real
- [ ] Attachments e mídia

#### **Frontend (Vercel)**
- [ ] Completar integração com backend real
- [ ] Sistema de upload de arquivos
- [ ] Notificações em tempo real
- [ ] Interface de configuração WhatsApp

### **FASE 3: MARA AI E RAG (Semana 3)**

**Objetivo**: Assistente AI 100% funcional

#### **Backend (AWS)**
- [ ] Criar `server/mara-ai.cjs`
- [ ] Sistema RAG completo
- [ ] Integração OpenAI GPT-4
- [ ] Base de conhecimento por clínica

#### **Frontend (Vercel)**
- [ ] Interface de chat com Mara
- [ ] Sistema de upload de documentos
- [ ] Configuração de bases de conhecimento
- [ ] Histórico de conversas AI

### **FASE 4: LÍVIA E AUTOMAÇÃO (Semana 4)**

**Objetivo**: Sistema de automação completo

#### **Backend (AWS)**
- [ ] Criar `server/livia-automation.cjs`
- [ ] Sistema de regras de automação
- [ ] Integração com WhatsApp
- [ ] Pausas inteligentes

#### **Frontend (Vercel)**
- [ ] Interface de configuração Lívia
- [ ] Sistema de regras visuais
- [ ] Monitoramento de automações
- [ ] Estatísticas de performance

### **FASE 5: PIPELINE CRM (Semana 5)**

**Objetivo**: Sistema CRM completo

#### **Backend (AWS)**
- [ ] Completar `server/domains/pipeline/`
- [ ] Sistema de leads e oportunidades
- [ ] Analytics e relatórios
- [ ] Automações de vendas

#### **Frontend (Vercel)**
- [ ] Interface Kanban para pipeline
- [ ] Dashboards analíticos
- [ ] Sistema de relatórios
- [ ] Configurações de CRM

---

## 🎯 **FUNCIONALIDADES POR DOMÍNIO**

### **📅 CALENDÁRIO**

#### **Backend APIs**
```typescript
// server/calendar-complete.cjs
const express = require('express');

// ✅ FAZER: Usar CommonJS
const calendarRoutes = {
  'GET /api/calendar/events': getCalendarEvents,
  'POST /api/calendar/sync-google': syncGoogleCalendar,
  'GET /api/calendar/availability': checkAvailability,
  'POST /api/appointments': createAppointment,
  'PUT /api/appointments/:id': updateAppointment,
  'DELETE /api/appointments/:id': deleteAppointment
};

// ❌ NÃO FAZER: Usar import/export em .cjs
// import { CalendarService } from './calendar.service'; // ❌ ERRADO
```

#### **Frontend Components**
```typescript
// ✅ FAZER: Usar ES Modules no frontend
import { useQuery } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';

export function CalendarView() {
  const { data: events } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => api.get('/api/calendar/events')
  });
  
  return <Calendar events={events} />;
}
```

### **💬 CONVERSAS**

#### **Integração Completa**
- [ ] Conectar frontend existente com backend real
- [ ] Sistema de WebSocket para tempo real
- [ ] Upload de arquivos e mídia
- [ ] Integração WhatsApp Evolution API

### **🤖 MARA AI**

#### **Sistema RAG**
- [ ] Upload de documentos por clínica
- [ ] Embeddings com OpenAI
- [ ] Busca semântica
- [ ] Respostas contextualizadas

### **⚡ LÍVIA**

#### **Automação Inteligente**
- [ ] Regras de resposta automática
- [ ] Pausas baseadas em contexto
- [ ] Integração com horários de trabalho
- [ ] Configuração por profissional

---

## ⚙️ **CONFIGURAÇÃO DE AMBIENTE**

### **Variáveis de Ambiente**

#### **Backend (AWS)**
```bash
# .env (AWS Elastic Beanstalk)
NODE_ENV=production
PORT=8080
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
WHATSAPP_API_URL=your-evolution-api-url
GOOGLE_CALENDAR_CLIENT_ID=your-google-client-id
GOOGLE_CALENDAR_CLIENT_SECRET=your-google-client-secret
```

#### **Frontend (Vercel)**
```bash
# .env.local (Vercel)
VITE_API_URL=http://operabase-backend-mvp-env-1.sa-east-1.elasticbeanstalk.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### **Configuração de Build**

#### **Backend - Manter Exatamente Como Está**
```json
// package.json - NÃO ALTERAR
{
  "scripts": {
    "start": "node dist/server/index.js",
    "start:fallback": "node server/simple-server.cjs"
  }
}
```

#### **Frontend - Manter Funcionando**
```json
// package.json - MANTER
{
  "scripts": {
    "build": "vite build"
  }
}
```

---

## 🧪 **TESTES E VALIDAÇÃO**

### **Checklist de Teste por Fase**

#### **FASE 1 - Calendário**
- [ ] ✅ Backend AWS respondendo
- [ ] ✅ Frontend Vercel carregando
- [ ] ✅ API endpoints funcionando
- [ ] ✅ Database queries corretas
- [ ] ✅ CORS configurado
- [ ] ✅ Dados aparecendo no frontend

#### **Comandos de Teste**
```bash
# Teste Backend Local
node server/debug-server.cjs
curl http://localhost:8080/health

# Teste Frontend Local  
npm run build
npm run dev

# Teste Integração
curl http://localhost:8080/api/calendar/events?clinic_id=1
```

---

## ⚡ **O QUE FAZER E O QUE NÃO FAZER**

### ✅ **O QUE FAZER - REGRAS DE SUCESSO**

#### **1. Backend (AWS)**
```javascript
// ✅ CORRETO: Usar CommonJS em arquivos .cjs
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

module.exports = {
  setupRoutes: (app) => {
    app.get('/api/test', (req, res) => {
      res.json({ status: 'ok' });
    });
  }
};
```

#### **2. Frontend (Vercel)**
```typescript
// ✅ CORRETO: Usar ES Modules
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function useCalendarEvents() {
  return useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => apiRequest('/api/calendar/events')
  });
}
```

#### **3. Database Queries**
```javascript
// ✅ CORRETO: Queries diretas no Supabase
const { data, error } = await supabase
  .from('appointments')
  .select('*')
  .eq('clinic_id', clinicId)
  .order('scheduled_date', { ascending: true });
```

#### **4. Error Handling**
```javascript
// ✅ CORRETO: Error handling robusto
try {
  const result = await apiCall();
  return result;
} catch (error) {
  console.error('API Error:', error);
  throw new Error('Failed to fetch data');
}
```

### ❌ **O QUE NÃO FAZER - REGRAS CRÍTICAS**

#### **1. NUNCA Misturar Module Systems**
```javascript
// ❌ ERRADO: import em arquivo .cjs
import express from 'express'; // ❌ QUEBRA AWS

// ✅ CORRETO: require em arquivo .cjs  
const express = require('express'); // ✅ FUNCIONA AWS
```

#### **2. NUNCA Alterar Configurações Funcionais**
```javascript
// ❌ ERRADO: Alterar Procfile funcionando
web: npm start // ❌ PODE QUEBRAR

// ✅ CORRETO: Manter Procfile atual
web: node server/debug-server.cjs // ✅ FUNCIONANDO
```

#### **3. NUNCA Ignorar CORS**
```javascript
// ❌ ERRADO: CORS genérico
res.header('Access-Control-Allow-Origin', '*'); // ❌ INSEGURO

// ✅ CORRETO: CORS específico
const allowedOrigins = [
  'https://operabase-main.vercel.app',
  'http://localhost:5173'
]; // ✅ SEGURO
```

#### **4. NUNCA Deploy Sem Teste**
```bash
# ❌ ERRADO: Deploy direto
git push origin main // ❌ SEM TESTE

# ✅ CORRETO: Teste primeiro
npm run build
npm test
git push origin main // ✅ TESTADO
```

---

## 🎯 **CRONOGRAMA DE EXECUÇÃO**

### **Semana 1: Calendário**
- **Dias 1-2**: Backend APIs
- **Dias 3-4**: Frontend Components  
- **Dia 5**: Integração e Testes

### **Semana 2: Conversas**
- **Dias 1-2**: WhatsApp Integration
- **Dias 3-4**: Real-time Features
- **Dia 5**: Testes de Integração

### **Semana 3: Mara AI**
- **Dias 1-2**: RAG System
- **Dias 3-4**: AI Interface
- **Dia 5**: Knowledge Base Setup

### **Semana 4: Lívia**
- **Dias 1-2**: Automation Engine
- **Dias 3-4**: Configuration UI
- **Dia 5**: Testing & Optimization

### **Semana 5: Pipeline CRM**
- **Dias 1-2**: Backend APIs
- **Dias 3-4**: Frontend Dashboards
- **Dia 5**: Final Integration

---

## 🎉 **RESULTADO ESPERADO**

Ao final da implementação, teremos:

### ✅ **Sistema 100% Funcional**
- **Calendário**: Agendamentos completos com Google Calendar
- **Conversas**: WhatsApp integrado com tempo real
- **Mara AI**: Assistente inteligente com RAG
- **Lívia**: Automação completa configurável  
- **Pipeline**: CRM completo com analytics

### ✅ **Arquitetura Robusta**
- **Backend AWS**: Estável e escalável
- **Frontend Vercel**: Rápido e responsivo
- **Database Supabase**: Performante e seguro
- **Integração**: APIs bem documentadas

### ✅ **Experiência do Usuário**
- **Interface Intuitiva**: Design moderno e responsivo
- **Performance**: Carregamento rápido
- **Confiabilidade**: Sistema estável 24/7
- **Funcionalidades**: Todas as features funcionando

---

## 📞 **PRÓXIMOS PASSOS**

1. **Aprovação do Plano**: Revisar e aprovar estratégia
2. **Setup Ambiente**: Configurar variáveis necessárias  
3. **Início Fase 1**: Implementar calendário completo
4. **Testes Contínuos**: Validar cada funcionalidade
5. **Deploy Incremental**: Subir features conforme ficam prontas

**Este plano garante 100% de funcionalidade mantendo a estabilidade atual do sistema AWS + Vercel + Supabase.** 