# 🔧 Guia de Resolução de APIs - Operabase

## 📋 Visão Geral

Este documento apresenta a **metodologia comprovada** para diagnóstico e resolução de problemas em endpoints da API Operabase, baseada na resolução bem-sucedida dos endpoints de usuários e profissionais.

## 🎯 **CASO DE SUCESSO: Usuários e Profissionais**

### Problema Original
```javascript
TypeError: Cannot read properties of undefined (reading 'split')
```

### Status Final
✅ **RESOLVIDO COMPLETAMENTE**
- Endpoints funcionando: `/api/clinic/:id/users/management` e `/api/clinic/:id/professionals`
- Frontend sem erros de JavaScript
- Dados completos com nomes e emails
- Sistema 100% operacional

---

## 🔍 **METODOLOGIA DE DIAGNÓSTICO**

### Fase 1: Identificação do Erro

#### 1.1 Análise do Erro Frontend
```bash
# ✅ PASSO: Examinar stack trace no console do browser
# OBJETIVO: Identificar linha específica e operação que falha

# EXEMPLO DO CASO RESOLVIDO:
# TypeError: Cannot read properties of undefined (reading 'split')
# at index-BNhU-L4t.js:177:80936
```

#### 1.2 Localização do Código Problemático
```bash
# ✅ PASSO: Buscar por padrões no código fonte
grep -r "\.split(" src/
grep -r "\.map(" src/
grep -r "operação_suspeita" src/

# EXEMPLO DO CASO RESOLVIDO:
# src/components/UserManagement.tsx:390
# {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
```

#### 1.3 Identificação da Origem dos Dados
```bash
# ✅ PASSO: Rastrear de onde vêm os dados problemáticos
# PROCURAR POR: useQuery, fetch, API calls

# EXEMPLO DO CASO RESOLVIDO:
# const { data: users = [] } = useQuery({
#   queryKey: [`/api/clinic/${clinicId}/users/management`],
# });
```

### Fase 2: Verificação dos Dados da API

#### 2.1 Teste Direto do Endpoint
```bash
# ✅ PASSO: Testar endpoint via proxy Vercel
curl -s "https://operabase.vercel.app/api/endpoint" | jq '.'

# EXEMPLO DO CASO RESOLVIDO:
curl -s "https://operabase.vercel.app/api/clinic/1/users/management" | jq '.[].name'
# RESULTADO: null, null, null (problema identificado!)
```

#### 2.2 Teste Direto do Backend
```bash
# ✅ PASSO: Testar endpoint diretamente no AWS
curl -s "http://operabase-backend-mvp-env-1.sa-east-1.elasticbeanstalk.com/api/endpoint" | jq '.'

# OBJETIVO: Verificar se problema está no backend ou proxy
```

#### 2.3 Análise da Estrutura de Dados
```bash
# ✅ PASSO: Examinar estrutura completa dos dados retornados
curl -s "https://operabase.vercel.app/api/endpoint" | jq '.[0]'

# EXEMPLO DO CASO RESOLVIDO:
# {
#   "id": 11,
#   "clinic_id": 1,
#   "user_id": 6,
#   "name": null,    # ← PROBLEMA ENCONTRADO
#   "email": null    # ← PROBLEMA ENCONTRADO
# }
```

### Fase 3: Análise Arquitetural

#### 3.1 Mapeamento de Tabelas
```sql
-- ✅ PASSO: Identificar tabelas envolvidas e relacionamentos

-- EXEMPLO DO CASO RESOLVIDO:
-- clinic_users (tabela principal consultada)
clinic_users {
  id: number,
  clinic_id: number,
  user_id: number,        -- ← FK para users
  role: string,
  permissions: array,
  is_professional: boolean
  -- ❌ SEM name, email
}

-- users (tabela com dados necessários)
users {
  id: number,
  name: string,           -- ← CAMPO NECESSÁRIO
  email: string,          -- ← CAMPO NECESSÁRIO
  created_at: timestamp
}
```

#### 3.2 Identificação do Problema Arquitetural
```javascript
// ✅ ANÁLISE: Endpoint consultava apenas uma tabela
// ❌ PROBLEMA: Dados necessários estavam em tabela relacionada

// EXEMPLO DO CASO RESOLVIDO:
router.get('/clinic/:clinic_id/users/management', async (req, res) => {
  const query = `select=*&clinic_id=eq.${clinic_id}`;
  const clinicUsers = await supabaseQuery(`clinic_users?${query}`);
  //                                       ^^^^^^^^^^^
  //                                       TABELA SEM name/email
  res.json(clinicUsers);
});
```

---

## ✅ **METODOLOGIA DE CORREÇÃO**

### Abordagem: JOIN Manual via Múltiplas Queries

#### Padrão Template para Endpoints com Relacionamentos
```javascript
router.get('/api/endpoint-com-relacionamento', async (req, res) => {
  try {
    const { clinic_id } = req.params;
    
    // 1. BUSCAR DADOS DA TABELA PRINCIPAL
    const mainQuery = `select=*&clinic_id=eq.${clinic_id}&is_active=eq.true`;
    const mainRecords = await supabaseQuery(`main_table?${mainQuery}`);
    
    log(`📊 Found ${mainRecords.length} main records`);
    
    // 2. ENRIQUECER COM DADOS RELACIONADOS
    const enrichedRecords = await Promise.all(
      mainRecords.map(async (record) => {
        let relatedData = { 
          name: 'Unknown Entity', 
          email: '',
          // outros campos padrão
        };
        
        // 2.1 Buscar dados relacionados se FK existe
        if (record.related_id) {
          try {
            const relatedQuery = `select=name,email,other_fields&id=eq.${record.related_id}`;
            const related = await supabaseQuery(`related_table?${relatedQuery}`);
            
            if (related.length > 0) {
              relatedData = {
                name: related[0].name || 'Unknown Entity',
                email: related[0].email || '',
                // outros campos
              };
            }
          } catch (relatedError) {
            log(`⚠️ Error getting related data for ${record.id}: ${relatedError.message}`);
          }
        }
        
        // 3. COMBINAR DADOS E SANITIZAR
        return {
          ...record,
          // Adicionar campos relacionados
          name: relatedData.name,
          email: relatedData.email,
          // Sanitizar campos array (CRÍTICO!)
          permissions: record.permissions || [],
          tags: record.tags || [],
          categories: record.categories || [],
          // Sanitizar campos string
          description: record.description || '',
          notes: record.notes || ''
        };
      })
    );
    
    log(`✅ Returning ${enrichedRecords.length} enriched records`);
    res.json(enrichedRecords);
    
  } catch (error) {
    log(`❌ Error in endpoint: ${error.message}`);
    log(`❌ Stack trace: ${error.stack}`);
    res.status(500).json({ 
      error: 'Failed to get records',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

### Regras de Sanitização Obrigatórias

#### Campos Array
```javascript
// ✅ SEMPRE: Transformar null em array vazio
const sanitized = {
  ...record,
  permissions: record.permissions || [],
  tags: record.tags || [],
  categories: record.categories || [],
  working_days: record.working_days || [],
  specialties: record.specialties || [],
  services: record.services || [],
  payment_methods: record.payment_methods || [],
  lunch_times: record.lunch_times || [],
  business_hours: record.business_hours || []
};
```

#### Campos String
```javascript
// ✅ SEMPRE: Transformar null em string vazia
const sanitized = {
  ...record,
  name: record.name || 'Unknown',
  email: record.email || '',
  description: record.description || '',
  notes: record.notes || '',
  phone: record.phone || ''
};
```

#### Campos Opcionais
```javascript
// ✅ SEMPRE: Manter null para campos verdadeiramente opcionais
const sanitized = {
  ...record,
  avatar_url: record.avatar_url || null,
  last_login: record.last_login || null,
  invited_at: record.invited_at || null
};
```

---

## 🧪 **METODOLOGIA DE VALIDAÇÃO**

### Fase 1: Validação Backend

#### 1.1 Teste Endpoint Direto
```bash
# ✅ PASSO: Validar resposta do backend AWS
curl -s "http://operabase-backend-mvp-env-1.sa-east-1.elasticbeanstalk.com/api/endpoint" | jq '.'

# ✅ VERIFICAR:
# - Status 200
# - Dados completos
# - Campos não-null onde esperado
# - Arrays não-null
```

#### 1.2 Validação de Campos Críticos
```bash
# ✅ PASSO: Verificar campos específicos que causavam erro
curl -s "http://backend/api/endpoint" | jq '.[0].campo_critico'

# EXEMPLO DO CASO RESOLVIDO:
curl -s "http://backend/api/clinic/1/users/management" | jq '.[0].name'
# RESULTADO ESPERADO: "Teste2" (não null)
```

### Fase 2: Validação Proxy

#### 2.1 Teste Via Vercel
```bash
# ✅ PASSO: Validar funcionamento end-to-end
curl -s "https://operabase.vercel.app/api/endpoint" | jq '.'

# ✅ VERIFICAR:
# - Mesmo resultado do backend direto
# - Proxy funcionando corretamente
# - Headers corretos
```

### Fase 3: Validação Frontend

#### 3.1 Teste Local
```bash
# ✅ PASSO: Executar frontend local
npm run dev
# Acessar http://localhost:5174

# ✅ VERIFICAR:
# - Console sem erros TypeError
# - Dados carregando corretamente
# - Funcionalidades operacionais
```

#### 3.2 Teste de Funcionalidades
```bash
# ✅ PASSO: Testar funcionalidades específicas que falhavam

# EXEMPLO DO CASO RESOLVIDO:
# - Verificar se avatares dos usuários aparecem
# - Verificar se nomes são exibidos
# - Verificar se não há erros de split()
```

---

## 📋 **CHECKLIST DE VALIDAÇÃO COMPLETA**

### ✅ Antes de Implementar
- [ ] Identificar todas as tabelas envolvidas
- [ ] Mapear relacionamentos (foreign keys)
- [ ] Verificar quais campos são necessários no frontend
- [ ] Identificar campos que podem ser null
- [ ] Verificar operações JavaScript que podem falhar (split, map, etc.)

### ✅ Durante Implementação
- [ ] Implementar JOIN manual via múltiplas queries
- [ ] Sanitizar TODOS os campos array (null → [])
- [ ] Sanitizar campos string críticos (null → '')
- [ ] Adicionar tratamento de erro detalhado
- [ ] Incluir logs de debug com contexto
- [ ] Usar try/catch para queries relacionadas

### ✅ Validação Pós-Implementação
- [ ] Testar endpoint direto no backend AWS
- [ ] Testar via proxy Vercel
- [ ] Verificar no frontend local (sem erros no console)
- [ ] Validar com dados reais da produção
- [ ] Testar casos extremos (dados faltando, relacionamentos quebrados)
- [ ] Verificar performance (múltiplas queries podem ser lentas)

### ✅ Documentação
- [ ] Documentar mudanças no código
- [ ] Atualizar lista de endpoints disponíveis
- [ ] Registrar aprendizados específicos
- [ ] Criar testes automatizados (se aplicável)

---

## 🎯 **APLICAÇÃO PARA PRÓXIMAS FUNCIONALIDADES**

### Funcionalidades Pendentes e Padrões Esperados

#### 1. **Conversations**
```javascript
// ESPERADO: JOIN com contacts para nomes dos pacientes
// PADRÃO: conversation.contact_id → contacts.name
// SANITIZAÇÃO: messages: [], attachments: []
```

#### 2. **Medical Records**  
```javascript
// ESPERADO: JOIN com contacts e users
// PADRÃO: record.contact_id → contacts.name
// PADRÃO: record.professional_id → users.name
// SANITIZAÇÃO: symptoms: [], medications: []
```

#### 3. **Pipeline**
```javascript
// ESPERADO: JOIN com contacts para oportunidades
// PADRÃO: opportunity.contact_id → contacts.name
// SANITIZAÇÃO: tags: [], custom_fields: []
```

#### 4. **Analytics**
```javascript
// ESPERADO: Agregações com JOINs
// PADRÃO: Múltiplas queries para diferentes métricas
// SANITIZAÇÃO: Todos os arrays de dados
```

#### 5. **Settings**
```javascript
// ESPERADO: Relacionamentos com users para configurações
// PADRÃO: setting.user_id → users.name
// SANITIZAÇÃO: permissions: [], preferences: []
```

---

## 🚀 **RESULTADOS COMPROVADOS**

### Antes da Aplicação da Metodologia
```json
// ❌ DADOS PROBLEMÁTICOS
{
  "id": 11,
  "name": null,           // ← Causava erro split()
  "email": null,
  "permissions": null     // ← Causava erro map()
}
```

### Depois da Aplicação da Metodologia
```json
// ✅ DADOS CORRIGIDOS
{
  "id": 11,
  "name": "Teste2",              // ← Nome real do usuário
  "email": "teste2@gmail.com",   // ← Email real do usuário
  "permissions": []              // ← Array vazio (não null)
}
```

### Impacto no Frontend
```typescript
// ✅ CÓDIGO FUNCIONANDO
{user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
//     ^^^^
//     "Teste2" → ["Teste2"] → ["T"] → "T"
```

---

## 📚 **LIÇÕES CRÍTICAS APRENDIDAS**

### 1. **Diagnóstico Sistemático é Fundamental**
- ✅ Sempre começar pelo erro específico no frontend
- ✅ Rastrear até a origem dos dados na API
- ✅ Verificar estrutura das tabelas no banco de dados
- ❌ Nunca assumir que o problema está onde parece estar

### 2. **Supabase REST API Limitações**
- ✅ Não faz JOINs automáticos entre tabelas
- ✅ Implementar JOIN manual via múltiplas queries
- ✅ Sempre incluir fallbacks para dados não encontrados
- ❌ Não assumir que dados relacionados estarão disponíveis

### 3. **Sanitização é Obrigatória**
- ✅ Frontend JavaScript não tolera null em operações de array
- ✅ Sempre transformar null em [] para campos array
- ✅ Sempre transformar null em string vazia para campos string críticos
- ❌ Nunca retornar null para campos que serão processados no frontend

### 4. **Validação End-to-End é Essencial**
- ✅ Testar backend direto (AWS)
- ✅ Testar via proxy (Vercel)
- ✅ Testar no frontend (local)
- ✅ Validar com dados reais de produção
- ❌ Nunca assumir que funcionou sem testar todos os níveis

---

## 🔄 **PRÓXIMOS PASSOS**

### Aplicar Esta Metodologia Para:

1. **Conversations** → Resolver exibição de nomes de contatos
2. **Medical Records** → Resolver relacionamentos com pacientes e profissionais  
3. **Pipeline** → Resolver dados de oportunidades e contatos
4. **Analytics** → Resolver agregações e relatórios
5. **Settings** → Resolver configurações de usuários

### Cada funcionalidade deve seguir:
1. **Diagnóstico** usando esta metodologia
2. **Correção** usando os padrões estabelecidos
3. **Validação** usando o checklist completo
4. **Documentação** dos aprendizados específicos

---

**Este guia garante que todas as futuras correções de API sigam um padrão comprovado e eficiente, evitando retrabalho e garantindo qualidade.** 