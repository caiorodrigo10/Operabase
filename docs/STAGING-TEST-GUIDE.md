# 🧪 Guia de Testes de Staging - Servidor Refatorado

Este guia explica como testar o servidor refatorado em ambiente de staging com variáveis de ambiente reais.

## 🎯 Objetivo

Validar que o servidor refatorado (`server/core/server.ts`) funciona perfeitamente com:
- Variáveis de ambiente reais
- Conexão com Supabase
- Todos os endpoints funcionais
- Integração com serviços externos

## 📋 Pré-requisitos

- [ ] Node.js e npm instalados
- [ ] Credenciais do Supabase disponíveis
- [ ] Acesso à Evolution API (opcional)
- [ ] curl instalado (para testes)

## 🔧 Configuração

### 1. Configurar Ambiente

```bash
# Executar script de setup
bash scripts/setup-staging.sh
```

### 2. Editar Variáveis de Ambiente

Edite o arquivo `.env.local` criado:

```bash
# Opção 1: Editor de texto
nano .env.local

# Opção 2: VS Code
code .env.local
```

**Variáveis obrigatórias para substituir:**
- `SUPABASE_URL` - URL do seu projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key do Supabase
- `SUPABASE_ANON_KEY` - Anonymous Key do Supabase

**Variáveis opcionais:**
- `EVOLUTION_API_KEY` - Para funcionalidade WhatsApp
- `PORT` - Porta do servidor (padrão: 3001)

### 3. Exemplo de Configuração

```env
# ========== AMBIENTE ==========
NODE_ENV=staging
PORT=3001

# ========== SUPABASE ==========
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ========== FRONTEND ==========
FRONTEND_URL=http://localhost:5173

# ========== EVOLUTION API ==========
EVOLUTION_API_URL=https://n8n-evolution-api.4gmy9o.easypanel.host
EVOLUTION_API_KEY=sua-chave-evolution-api

# ========== LOGS ==========
LOG_LEVEL=debug
```

## 🧪 Executar Testes

### Teste Automatizado Completo

```bash
# Executar todos os testes
bash scripts/test-staging.sh
```

### Teste Manual Simples

```bash
# 1. Iniciar servidor
npx ts-node server/core/server.ts

# 2. Em outro terminal, testar endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api
curl http://localhost:3001/api/contacts
```

## 📊 Endpoints Testados

O script de teste verifica todos os endpoints principais:

### ✅ Endpoints Básicos
- `GET /health` - Health check
- `GET /api` - Informações da API
- `GET /api/debug` - Debug info

### ✅ Endpoints de Negócio
- `GET /api/contacts` - Listar contatos
- `GET /api/appointments` - Listar agendamentos
- `GET /api/auth/profile` - Perfil do usuário
- `POST /api/auth/login` - Login

### ✅ Endpoints de Clínica
- `GET /api/clinic/1/users/management` - Usuários da clínica
- `GET /api/clinic/1/config` - Configuração da clínica

### ✅ Arquivos Estáticos
- `GET /` - Página inicial (SPA)

## 🔍 Interpretando Resultados

### ✅ Sucesso Total
```
🎉 TODOS OS TESTES PASSARAM!
✅ Servidor refatorado está funcionando perfeitamente
🚀 Pronto para substituir o arquivo original
```

### ⚠️ Falhas Parciais
```
⚠️  ALGUNS TESTES FALHARAM
🔍 Verifique os logs do servidor e as configurações
```

**Possíveis causas:**
- Credenciais Supabase incorretas
- Tabelas não existem no banco
- Problemas de rede
- Configuração incorreta

## 🐛 Troubleshooting

### Erro: "Cannot find module"
```bash
# Verificar se todos os arquivos existem
ls -la server/core/routes/
ls -la server/core/config/
ls -la server/core/middleware/
```

### Erro: "SUPABASE_URL not configured"
```bash
# Verificar arquivo .env.local
cat .env.local | grep SUPABASE_URL
```

### Erro: "Connection refused"
```bash
# Verificar se servidor está rodando
ps aux | grep "ts-node"
netstat -an | grep 3001
```

### Erro: "Timeout: Servidor não ficou pronto"
```bash
# Verificar logs do servidor
npx ts-node server/core/server.ts
# Procurar por erros de inicialização
```

## 📈 Próximos Passos

### Se Todos os Testes Passaram

1. **Backup do arquivo original:**
   ```bash
   cp server/railway-server.ts server/railway-server-original.ts
   ```

2. **Substituir arquivo principal:**
   ```bash
   cp server/core/server.ts server/railway-server.ts
   ```

3. **Atualizar imports (se necessário):**
   - Verificar se há referências ao arquivo antigo
   - Atualizar scripts de deploy

### Se Alguns Testes Falharam

1. **Analisar logs detalhados**
2. **Verificar configurações específicas**
3. **Testar endpoints individualmente**
4. **Corrigir problemas identificados**
5. **Repetir testes**

## 🔧 Comandos Úteis

```bash
# Configurar ambiente
bash scripts/setup-staging.sh

# Testar servidor
bash scripts/test-staging.sh

# Iniciar servidor manualmente
npx ts-node server/core/server.ts

# Verificar logs
tail -f server/core/server.ts

# Testar endpoint específico
curl -v http://localhost:3001/health

# Parar servidor
pkill -f "ts-node server/core/server.ts"
```

## 📚 Arquivos Relacionados

- `server/core/config/staging.env.example` - Exemplo de configuração
- `scripts/setup-staging.sh` - Script de configuração
- `scripts/test-staging.sh` - Script de teste
- `server/core/server.ts` - Servidor refatorado
- `docs/REFACTORING-SUMMARY.md` - Resumo da refatoração

## 🎯 Critérios de Sucesso

Para considerar o teste bem-sucedido:

- [ ] Todos os 10 endpoints respondem corretamente
- [ ] Servidor inicia sem erros
- [ ] Conexão com Supabase funciona
- [ ] Arquivos estáticos são servidos
- [ ] Logs não mostram erros críticos
- [ ] Performance é aceitável (< 2s para inicialização)

---

**💡 Dica:** Execute os testes sempre que fizer mudanças na estrutura do servidor refatorado para garantir que nada foi quebrado. 