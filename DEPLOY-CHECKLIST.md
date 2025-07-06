# 🚀 Deploy Checklist - Operabase

## ✅ **MUDANÇAS APLICADAS**

### **1. 🔒 Segurança - Chaves Removidas**
- [x] **src/lib/supabase.ts** - Removidas chaves hardcoded, agora obrigatório usar variáveis de ambiente
- [x] **src/lib/api.ts** - Removido fallback hardcoded, agora força configuração de VITE_API_URL
- [x] **server/enhanced-debug-server-v5.cjs** - Removidas chaves expostas, validação obrigatória
- [x] **server/production-server.js** - Limpo e padronizado, sem chaves hardcoded
- [x] **.ebextensions/environment-variables.config** - Removidas todas as chaves expostas

### **2. 📦 Package.json Corrigido**
- [x] **Dependências simplificadas** - Apenas backend (express, cors, dotenv, node-fetch)
- [x] **Package-lock.json atualizado** - Em sincronia com package.json
- [x] **Scripts padronizados** - Focado no servidor de produção
- [x] **Removidas dependências frontend** - Que causavam conflito no AWS

### **3. 🔧 GitHub Actions Melhorado**
- [x] **Validação de secrets** adicionada
- [x] **Variáveis de ambiente seguras** via GitHub Secrets
- [x] **Deploy package limpo** sem chaves expostas
- [x] **Verificação de SUPABASE_URL** adicionada

### **4. 🧪 Página de Teste Criada**
- [x] **src/pages/test-api.tsx** - Interface para testar conectividade
- [x] **Testes automáticos** de todos os endpoints
- [x] **Monitoramento em tempo real** do status da API

## 🎯 **CONFIGURAÇÕES REALIZADAS**

### **Secrets GitHub (✅ CONFIGURADOS):**
- [x] `AWS_ACCESS_KEY_ID`
- [x] `AWS_SECRET_ACCESS_KEY`
- [x] `SUPABASE_URL`
- [x] `SUPABASE_SERVICE_ROLE_KEY`

### **Variáveis Vercel (✅ CONFIGURADAS):**
- [x] `VITE_SUPABASE_URL`
- [x] `VITE_SUPABASE_ANON_KEY` 
- [x] `VITE_API_URL`

## 🎯 **PRÓXIMOS PASSOS**

### **Antes do Deploy:**
1. ✅ **Variáveis configuradas no Vercel:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` 
   - `VITE_API_URL`

2. ✅ **Secrets configurados no GitHub:**
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

### **Deploy Process:**
1. **Commit e Push** - Trigger automático do GitHub Actions
2. **Monitorar logs** do GitHub Actions
3. **Verificar deploy** do backend no AWS
4. **Testar conectividade** usando `/test-api`

## 🔍 **VALIDAÇÃO PÓS-DEPLOY**

### **Frontend (Vercel):**
- [ ] Site carrega sem erros
- [ ] Variáveis de ambiente funcionando
- [ ] Página de teste acessível

### **Backend (AWS):**
- [ ] Health check responde: `/health`
- [ ] API test funciona: `/api/test`
- [ ] Endpoints principais funcionam:
  - [ ] `/api/calendar/events?clinic_id=1`
  - [ ] `/api/contacts?clinic_id=1`

### **Integração:**
- [ ] CORS configurado corretamente
- [ ] Comunicação frontend ↔ backend funcionando
- [ ] Dados do Supabase sendo retornados

## 🚨 **PROBLEMAS RESOLVIDOS**

### **Antes:**
❌ Chaves do Supabase expostas no código  
❌ Package.json com dependências conflitantes  
❌ Package-lock.json desatualizado  
❌ Secrets não configurados no GitHub  

### **Depois:**
✅ Todas as chaves via variáveis de ambiente  
✅ Package.json simplificado (backend only)  
✅ Package-lock.json em sincronia  
✅ Secrets configurados no GitHub  

## 📞 **Suporte**

Se houver problemas no deploy:

1. **Verificar logs do GitHub Actions**
2. **Verificar variáveis de ambiente no Vercel**
3. **Testar endpoints individualmente**
4. **Usar página de teste para diagnóstico**

---

**Status**: ✅ **PRONTO PARA DEPLOY COM SECRETS CONFIGURADOS**  
**Data**: $(date)  
**Versão**: 1.0.1-secure-with-secrets 