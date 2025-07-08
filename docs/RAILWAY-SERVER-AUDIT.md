# 🔍 AUDITORIA COMPLETA - railway-server.ts

> **Data:** $(date +%Y-%m-%d)  
> **Versão:** Pre-refatoração  
> **Arquivo:** server/railway-server.ts (885 linhas)

## 📋 ENDPOINTS MAPEADOS

### **Health & Debug**
- `GET /health` - Health check com status Supabase
- `GET /api` - Informações da API e configurações
- `GET /api/debug` - Debug de variáveis de ambiente

### **Autenticação**
- `GET /api/auth/profile` - Perfil do usuário (mockado)
- `POST /api/auth/login` - Login simples (mockado)
- `POST /api/auth/logout` - Logout

### **Contatos**
- `GET /api/contacts` - Listar contatos com filtros
- `GET /api/contacts/:id` - Buscar contato específico
- `POST /api/contacts` - Criar novo contato

### **Agendamentos**
- `GET /api/appointments` - Listar agendamentos com filtros de data
- `POST /api/appointments` - Criar novo agendamento

### **Clínica**
- `GET /api/clinic/:id/users/management` - Listar usuários da clínica
- `GET /api/clinic/:id/config` - Configurações da clínica (mockado)

### **Áudio**
- `POST /api/audio/voice-message/:conversationId` - Upload de áudio com transcrição

### **Frontend (SPA)**
- `GET *` - Servir arquivos estáticos ou página de erro

## 🔧 MIDDLEWARES E CONFIGURAÇÕES

### **Express Setup**
```typescript
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

### **CORS**
```typescript
// Configuração dinâmica baseada em NODE_ENV
origin: isProduction 
  ? [process.env.FRONTEND_URL || 'https://operabase.railway.app']
  : ['http://localhost:3000', 'http://localhost:5173']
```

### **Autenticação**
```typescript
const authMiddleware = (req, res, next) => {
  // Middleware simples de desenvolvimento
  // TODO: Implementar autenticação real
}
```

### **Upload (Multer)**
```typescript
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});
```

### **Supabase Client**
```typescript
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});
```

## 🌍 VARIÁVEIS DE AMBIENTE

### **Obrigatórias**
- `SUPABASE_URL` - URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço Supabase

### **Opcionais com Defaults**
- `NODE_ENV` - Ambiente (development/production)
- `PORT` - Porta do servidor (default: 3000)
- `FRONTEND_URL` - URL do frontend (default: railway.app)
- `EVOLUTION_API_URL` - URL da Evolution API (default: easypanel)
- `EVOLUTION_API_KEY` - Chave da Evolution API

### **Debug Only**
- `SUPABASE_ANON_KEY` - Chave anônima (apenas debug)

## 🏗️ FUNÇÕES CRÍTICAS

### **testSupabaseConnection()**
- Testa conexão com Supabase
- Fallback para configuração alternativa
- Logs detalhados de debug

### **startServer()**
- Inicialização do servidor
- Teste de conexão Supabase
- Log de endpoints disponíveis

### **Static Files Serving**
- Verificação de diretório `dist/`
- Fallback para página de erro personalizada
- SPA routing para rotas não-API

## 🎯 LÓGICAS DE NEGÓCIO ESPECÍFICAS

### **Contatos**
- Filtros: `search`, `page`, `limit`
- Ordenação por `first_contact` desc
- Formatação de telefone brasileiro

### **Agendamentos**
- Filtros por data específica
- Conversão de timezone (início/fim do dia)
- Ordenação por `scheduled_date` desc

### **Áudio**
- Upload para Supabase Storage
- URL temporária (1 hora)
- Transcrição em background (Whisper)
- Integração N8N
- Envio WhatsApp via Evolution API

### **Clínica**
- Join com tabela `users`
- Filtro por `is_active = true`
- Transformação de dados para formato esperado

## ⚠️ PONTOS CRÍTICOS PARA PRESERVAR

### **1. Configuração CORS Dinâmica**
```typescript
origin: isProduction 
  ? [process.env.FRONTEND_URL || 'https://operabase.railway.app']
  : ['http://localhost:3000', 'http://localhost:5173']
```

### **2. Fallback de Supabase**
```typescript
// Configuração alternativa em caso de erro
const altClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false }
});
```

### **3. Tratamento de Arquivos Estáticos**
```typescript
// Verificação de existência de dist/
// Página de erro personalizada com debug info
// SPA routing com exclusão de rotas /api/*
```

### **4. Headers de Resposta Específicos**
- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Methods`
- `Access-Control-Allow-Headers`

### **5. Lógica de Data/Timezone**
```typescript
const targetDate = new Date(String(date));
const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)).toISOString();
const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)).toISOString();
```

### **6. Transcrição de Áudio**
```typescript
// Import dinâmico dos serviços
const TranscriptionService = (await import('./services/transcription.service.js')).default;
const { saveToN8NTable } = await import('./utils/n8n-integration.js');
```

## 📊 ESTATÍSTICAS

- **Total de Linhas:** 885
- **Endpoints:** 14
- **Middlewares:** 3
- **Variáveis ENV:** 8
- **Funções:** 2
- **Dependências:** 6

## 🎯 PRÓXIMOS PASSOS

1. **Backup Seguro** ✅
2. **Extração Incremental** por módulo
3. **Testes de Regressão** a cada etapa
4. **Validação Funcional** endpoint por endpoint
5. **Migração Gradual** sem downtime 