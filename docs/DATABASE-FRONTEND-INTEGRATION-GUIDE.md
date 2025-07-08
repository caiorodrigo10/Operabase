# Guia de Integração Banco de Dados - Frontend

## 📋 Visão Geral

Este documento consolida os aprendizados práticos sobre como vincular corretamente o banco de dados com o frontend, baseado na resolução de problemas reais no sistema de consultas da Operabase.

## 🎯 Problema Principal Resolvido

### ❌ **Problema Original**
Consultas apareciam e desapareciam no calendário devido a problemas de timing e vinculação incorreta entre:
- Tabela `appointments` (consultas)
- Tabela `clinic_users` (profissionais)
- Frontend (seleção de profissionais)

### ✅ **Solução Implementada**
Sistema multi-tenant robusto com vinculação correta de IDs e carregamento coordenado.

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### `appointments` (Consultas)
```sql
appointments {
  id: number,
  clinic_id: number,      -- FK para clinics
  user_id: number,        -- FK para users (PROFISSIONAL)
  contact_id: number,     -- FK para contacts (PACIENTE)
  scheduled_date: timestamp,
  status: string,
  doctor_name: string,    -- Campo redundante (pode ser null)
  notes: text
}
```

#### `clinic_users` (Relacionamento Clínica-Usuário)
```sql
clinic_users {
  id: number,             -- clinic_user_id (INTERNO)
  clinic_id: number,      -- FK para clinics
  user_id: number,        -- FK para users (CHAVE REAL)
  is_professional: boolean,
  is_active: boolean,
  role: string,
  permissions: array
}
```

#### `users` (Dados dos Usuários)
```sql
users {
  id: number,             -- user_id (CHAVE PRIMÁRIA)
  name: string,
  email: string,
  created_at: timestamp
}
```

### 🔑 **REGRA FUNDAMENTAL**
**SEMPRE usar `user_id` para relacionamentos, NUNCA `clinic_user_id`**

---

## 🚨 Problemas Identificados e Soluções

### 1. **Confusão Entre IDs**

#### ❌ **Erro Comum**
```javascript
// ERRADO: Usar clinic_user_id para filtrar consultas
const selectedProfessional = 2; // clinic_user_id
const filteredAppointments = appointments.filter(apt => 
  apt.user_id === selectedProfessional // ← NUNCA VAI BATER!
);
```

#### ✅ **Correção**
```javascript
// CORRETO: Usar user_id consistentemente
const selectedProfessional = 4; // user_id
const filteredAppointments = appointments.filter(apt => 
  apt.user_id === selectedProfessional // ← AGORA FUNCIONA!
);
```

#### 📊 **Mapeamento Real**
```
clinic_users.id=2 → clinic_users.user_id=4 → users.id=4 (Caio Rodrigo)
appointments.user_id=4 → 63 consultas

PROBLEMA: selectedProfessional=2 (clinic_user_id)
SOLUÇÃO: selectedProfessional=4 (user_id)
```

### 2. **Query Sem queryFn**

#### ❌ **Erro Comum**
```javascript
// ERRADO: Query sem queryFn nunca executa
const { data: clinicUsers = [] } = useQuery({
  queryKey: QUERY_KEYS.CLINIC_USERS(1),
  staleTime: 5 * 60 * 1000,
  // ← FALTANDO queryFn!
});
// Resultado: clinicUsers sempre = []
```

#### ✅ **Correção**
```javascript
// CORRETO: Query com queryFn completo
const { data: clinicUsers = [] } = useQuery({
  queryKey: QUERY_KEYS.CLINIC_USERS(1),
  queryFn: async () => {
    const url = buildApiUrl('/api/clinic/1/users/management');
    const response = await fetch(url, { /* headers */ });
    return response.json();
  },
  staleTime: 5 * 60 * 1000,
});
```

### 3. **Timing de Carregamento**

#### ❌ **Problema de Timing**
```javascript
// ERRADO: Carregamento sequencial causa flicker
1. Página carrega com selectedProfessional = null
2. Appointments carregam e mostram TODAS as consultas
3. clinicUsers carrega (2-3 segundos depois)
4. useEffect auto-seleciona profissional
5. Consultas são filtradas → outras desaparecem
```

#### ✅ **Solução: Carregamento Coordenado**
```javascript
// CORRETO: Aguardar dados críticos antes de renderizar
const isInitialDataLoading = appointmentsLoading || !clinicUsers.length;

if (isInitialDataLoading) {
  return <LoadingSpinner />;
}

// Só renderiza quando TODOS os dados estão prontos
```

### 4. **Auto-seleção de Profissional**

#### ❌ **Erro de Condicionamento**
```javascript
// ERRADO: useEffect muito restritivo
useEffect(() => {
  if (clinicUsers.length > 0 && selectedProfessional === null && currentUserEmail) {
    // ← Só executa se tiver email
  }
}, [clinicUsers.length, selectedProfessional, currentUserEmail]);
```

#### ✅ **Correção: Fallback Robusto**
```javascript
// CORRETO: useEffect com múltiplos fallbacks
useEffect(() => {
  if (clinicUsers.length > 0 && selectedProfessional === null) {
    // 1º: Tentar usuário atual (se profissional)
    let defaultSelection = getDefaultProfessionalSelection(clinicUsers, currentUserEmail || '', clinicId);
    
    // 2º: Fallback para primeiro profissional disponível
    if (!defaultSelection) {
      const firstProfessional = clinicUsers.find(user => 
        user.is_professional && user.is_active
      );
      if (firstProfessional) {
        defaultSelection = firstProfessional.user_id; // ← user_id!
      }
    }
    
    if (defaultSelection) {
      setSelectedProfessional(defaultSelection);
    }
  }
}, [clinicUsers.length, selectedProfessional, currentUserEmail]);
```

---

## 🏗️ Arquitetura Multi-Tenant

### Funções Utilitárias

#### 1. **Obter IDs Válidos (Incluindo Órfãos)**
```javascript
const getValidUserIds = (clinicId: number, clinicUsers: any[], appointments: any[] = []): number[] => {
  // IDs da tabela clinic_users
  const clinicUserIds = clinicUsers
    .filter(user => user.clinic_id === clinicId && user.is_active)
    .map(user => user.user_id); // ← user_id, não id!
  
  // IDs das consultas (para incluir "órfãos")
  const appointmentUserIds = appointments
    .filter(appointment => appointment.clinic_id === clinicId && appointment.user_id)
    .map(appointment => appointment.user_id);
  
  // Combinar e remover duplicatas
  return [...new Set([...clinicUserIds, ...appointmentUserIds])];
};
```

#### 2. **Seleção Inteligente de Profissional**
```javascript
const getDefaultProfessionalSelection = (
  clinicUsers: any[], 
  currentUserEmail: string,
  clinicId: number
): number | null => {
  if (!clinicUsers.length) return null;
  
  // 1. Prioridade: usuário atual se for profissional
  if (currentUserEmail) {
    const currentUser = clinicUsers.find(u => 
      u.email === currentUserEmail && u.is_professional
    );
    if (currentUser) {
      return currentUser.user_id; // ← SEMPRE user_id!
    }
  }
  
  // 2. Fallback: primeiro profissional ativo
  const firstProfessional = clinicUsers.find(u => 
    u.clinic_id === clinicId && u.is_professional && u.is_active
  );
  if (firstProfessional) {
    return firstProfessional.user_id; // ← SEMPRE user_id!
  }
  
  return null;
};
```

#### 3. **Cache Persistente por Clínica**
```javascript
// Salvar seleção
const saveProfessionalSelection = (professionalId: number, clinicId: number): void => {
  localStorage.setItem(`selected_professional_${clinicId}`, professionalId.toString());
};

// Recuperar seleção
const getCachedProfessionalSelection = (clinicId: number): number | null => {
  const cached = localStorage.getItem(`selected_professional_${clinicId}`);
  return cached ? parseInt(cached, 10) : null;
};
```

---

## 🔄 Padrões de TanStack Query

### 1. **Query Structure Padrão**
```javascript
const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
  queryKey: QUERY_KEYS.APPOINTMENTS(clinicId),
  queryFn: async () => {
    const url = buildApiUrl(`/api/appointments?clinic_id=${clinicId}`);
    const response = await fetch(url, {
      headers: await getAuthHeaders()
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  staleTime: 2 * 60 * 1000,    // 2 minutos
  gcTime: 10 * 60 * 1000,      // 10 minutos
  refetchOnWindowFocus: false,
  enabled: !!clinicId,         // Só executa se tiver clinicId
});
```

### 2. **Invalidação Coordenada**
```javascript
// Invalidar todas as queries relacionadas
const invalidateAppointmentQueries = async (queryClient: QueryClient, clinicId: number) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['appointments', clinicId] }),
    queryClient.invalidateQueries({ queryKey: ['clinic-users', clinicId] }),
    queryClient.invalidateQueries({ queryKey: ['contacts', clinicId] })
  ]);
};
```

### 3. **Loading States Coordenados**
```javascript
// Aguardar TODOS os dados críticos
const isInitialDataLoading = appointmentsLoading || !clinicUsers.length || clinicConfigLoading;

// Loading com feedback detalhado
if (isInitialDataLoading) {
  return (
    <LoadingSpinner>
      <div>• {appointmentsLoading ? '⏳' : '✅'} Consultas</div>
      <div>• {!clinicUsers.length ? '⏳' : '✅'} Profissionais</div>
      <div>• {clinicConfigLoading ? '⏳' : '✅'} Configurações</div>
    </LoadingSpinner>
  );
}
```

---

## 🎯 Componentes Frontend

### 1. **Seleção de Profissionais**
```javascript
// Botões de profissionais usando user_id
{clinicUsers
  .filter(user => user.is_professional === true)
  .map(professional => {
    const isSelected = selectedProfessional === professional.user_id; // ← user_id!
    
    return (
      <button
        key={professional.user_id}                          // ← user_id!
        onClick={() => selectProfessional(professional.user_id)} // ← user_id!
        className={isSelected ? 'selected' : 'unselected'}
      >
        {professional.name}
      </button>
    );
  })
}
```

### 2. **Filtragem de Consultas**
```javascript
// Filtrar consultas pelo profissional selecionado
const filteredAppointments = useMemo(() => {
  if (!selectedProfessional) return validAppointments;
  
  return validAppointments.filter(appointment => 
    appointment.user_id === selectedProfessional // ← user_id sempre!
  );
}, [validAppointments, selectedProfessional]);
```

---

## 🚨 Armadilhas Comuns

### 1. **❌ Usar clinic_user_id em vez de user_id**
```javascript
// NUNCA FAÇA ISSO
const selectedProfessional = professional.id; // ← clinic_user_id
const filteredAppointments = appointments.filter(apt => 
  apt.user_id === selectedProfessional // ← Nunca vai bater!
);
```

### 2. **❌ Query sem queryFn**
```javascript
// NUNCA FAÇA ISSO
const { data } = useQuery({
  queryKey: ['data'],
  // ← Sem queryFn = nunca executa
});
```

### 3. **❌ useEffect muito restritivo**
```javascript
// NUNCA FAÇA ISSO
useEffect(() => {
  if (data && user && email && condition1 && condition2) {
    // ← Muitas condições = nunca executa
  }
}, [data, user, email, condition1, condition2]);
```

### 4. **❌ Renderizar antes dos dados**
```javascript
// NUNCA FAÇA ISSO
// Renderiza imediatamente, depois os dados chegam
return (
  <div>
    {appointments.map(apt => <AppointmentCard key={apt.id} appointment={apt} />)}
  </div>
);
```

---

## ✅ Melhores Práticas

### 1. **🔑 Consistência de IDs**
- **SEMPRE** use `user_id` para relacionamentos
- **NUNCA** use `clinic_user_id` para filtros
- **SEMPRE** documente qual ID está sendo usado

### 2. **⏱️ Carregamento Coordenado**
```javascript
// Aguarde TODOS os dados críticos
const isReady = !appointmentsLoading && clinicUsers.length > 0 && !configLoading;

if (!isReady) {
  return <LoadingSpinner />;
}
```

### 3. **🎯 Auto-seleção Robusta**
```javascript
// Múltiplos fallbacks para sempre ter algo selecionado
useEffect(() => {
  if (hasData && !hasSelection) {
    const selection = 
      getUserSelection() ||           // 1º: Usuário atual
      getCachedSelection() ||         // 2º: Cache
      getFirstAvailable() ||          // 3º: Primeiro disponível
      getDefaultFallback();           // 4º: Fallback final
    
    if (selection) setSelection(selection);
  }
}, [hasData, hasSelection]);
```

### 4. **📝 Logging Detalhado**
```javascript
// Logs para debug de problemas de vinculação
console.log('🔧 Valid user IDs calculation:', {
  clinicId,
  clinicUserIds,      // IDs da tabela clinic_users
  appointmentUserIds, // IDs das consultas
  allValidUserIds     // União final
});

console.log('🎯 Final filtered appointments:', filteredAppointments.length);
```

### 5. **🧪 Validação de Dados**
```javascript
// Sempre validar estrutura dos dados
const validateUserData = (users: any[]) => {
  return users.every(user => 
    user.user_id &&           // Tem user_id
    user.clinic_id &&         // Tem clinic_id
    typeof user.is_professional === 'boolean' // is_professional é boolean
  );
};
```

---

## 📊 Debugging e Monitoramento

### 1. **Logs Estruturados**
```javascript
// Log detalhado para debug
console.log('🔍 DETAILED APPOINTMENT DEBUG:');
appointments.forEach(apt => {
  console.log(`   ID ${apt.id}: ${apt.contact_name || 'null'} - User ${apt.user_id}`);
  console.log(`   📅 Date: ${apt.scheduled_date}`);
  console.log(`   📍 Status: ${apt.status}`);
});
```

### 2. **Métricas de Performance**
```javascript
// Monitorar performance das queries
const startTime = performance.now();
const appointments = await fetchAppointments();
const endTime = performance.now();
console.log(`⏱️ Appointments loaded in ${endTime - startTime}ms`);
```

### 3. **Validação de Integridade**
```javascript
// Verificar integridade dos dados
const orphanedAppointments = appointments.filter(apt => 
  !clinicUsers.some(user => user.user_id === apt.user_id)
);

if (orphanedAppointments.length > 0) {
  console.warn('🚨 Found orphaned appointments:', orphanedAppointments);
}
```

---

## 🎯 Checklist de Implementação

### ✅ **Backend**
- [ ] Endpoint retorna `user_id` consistentemente
- [ ] JOIN manual implementado para dados relacionados
- [ ] Sanitização de campos null → arrays vazios
- [ ] Logs detalhados para debug
- [ ] Tratamento de erro robusto

### ✅ **Frontend**
- [ ] TanStack Query com `queryFn` completo
- [ ] Loading coordenado de dados críticos
- [ ] Auto-seleção com múltiplos fallbacks
- [ ] Uso consistente de `user_id`
- [ ] Cache persistente por clínica

### ✅ **Integração**
- [ ] Mapeamento correto de IDs documentado
- [ ] Logs de debug implementados
- [ ] Validação de integridade de dados
- [ ] Tratamento de casos edge
- [ ] Testes com dados reais

---

## 🚀 Resultados Comprovados

### Antes da Correção
```
❌ Consultas apareciam e desapareciam
❌ selectedProfessional = clinic_user_id (2)
❌ appointments.user_id = 4
❌ Filtro nunca funcionava
❌ Final filtered appointments: 0
```

### Depois da Correção
```
✅ Consultas aparecem consistentemente
✅ selectedProfessional = user_id (4)
✅ appointments.user_id = 4
✅ Filtro funciona perfeitamente
✅ Final filtered appointments: 63
```

---

## 🔬 Validações Implementadas e Testadas

### 1. **Sistema WhatsApp Numbers**
```javascript
// Problema: Array vazio no frontend
// Causa: Endpoint não implementado corretamente
// Solução: Logs detalhados + endpoint validado

// Backend validado:
✅ Dados no Supabase: 1 número ativo (551150391104)
✅ Endpoint funcionando: GET /api/whatsapp/numbers
✅ Response JSON: Array com 1 item

// Frontend validado:
✅ Logs implementados: [WhatsAppManager][fetch] pattern
✅ Estado atualizado: setWhatsappNumbers(data)
✅ Renderização: WhatsAppNumberCard exibido
```

### 2. **Sistema de Conversas**
```javascript
// Problema: Endpoints 404
// Causa: Rotas não registradas
// Solução: Registro correto + timezone fix

// Backend validado:
✅ Rotas registradas: conversations.routes.js
✅ Dados no Supabase: 5 conversas, múltiplas mensagens
✅ Timezone Brasília: getBrasiliaTimestamp() implementado

// Frontend validado:
✅ Conversas carregando: useConversations hook
✅ Mensagens exibindo: MessageBubble component
✅ Horário correto: 1:43 AM (não 4:43 AM)
```

### 3. **Metodologia de Debugging Validada**
```
Processo comprovado eficaz:

1. Identificar sintoma
   ✅ WhatsApp array vazio
   ✅ Conversas 404

2. Verificar fonte de dados
   ✅ MCP Supabase: dados existem
   ✅ SQL queries: registros confirmados

3. Testar endpoint isolado
   ✅ curl localhost:3000/api/whatsapp/numbers
   ✅ Response JSON válido

4. Adicionar logs frontend
   ✅ [Component][operation] pattern
   ✅ Logs de fetch, parse, setState

5. Rastrear fluxo completo
   ✅ Database → Backend → Frontend → UI
   ✅ Cada etapa logada e validada

6. Implementar correção
   ✅ Endpoint implementado
   ✅ Rotas registradas
   ✅ Logs mantidos para monitoramento

7. Validar funcionamento
   ✅ Dados aparecendo no frontend
   ✅ Estados atualizados corretamente
   ✅ UI renderizando como esperado

8. Documentar solução
   ✅ Relatório de validação criado
   ✅ Documentação atualizada
   ✅ Processo replicável
```

### 4. **Padrões de Logs Validados**
```javascript
// Padrão implementado e funcionando:

// Backend
console.log('🔍 Buscando dados para clinic_id:', clinic_id);
console.log('✅ Dados encontrados:', data?.length || 0);
console.log('❌ Erro ao buscar dados:', error);

// Frontend
console.log('[Component][operation] Iniciando...');
console.log('[Component][operation] Dados recebidos:', data);
console.log('[Component][operation] Estado atualizado:', state);

// Resultado: Debugging eficaz e rastreabilidade completa
```

---

## 📚 Recursos Adicionais

### Documentação Relacionada
- `docs/BACKEND-ARCHITECTURE.md` - Arquitetura do backend
- `docs/FRONTEND-ARCHITECTURE.md` - Arquitetura do frontend
- `docs/FRONTEND-BACKEND-VALIDATION-REPORT.md` - Relatório completo de validações
- `docs/API-RESOLUTION-GUIDE.md` - Guia de resolução de APIs

### Ferramentas de Debug Validadas
- ✅ React DevTools - Para estado dos componentes
- ✅ TanStack Query DevTools - Para cache e queries
- ✅ Supabase MCP Tools - Para validação de dados
- ✅ Browser Network Tab - Para requests HTTP
- ✅ Console Logs Estruturados - Para fluxo de dados

### Comandos de Validação
```bash
# Testar endpoints diretamente
curl -s http://localhost:3000/api/whatsapp/numbers | jq
curl -s http://localhost:3000/api/conversations-simple?clinic_id=1 | jq

# Verificar dados no Supabase (via MCP)
# SELECT * FROM whatsapp_numbers WHERE clinic_id = 1;
# SELECT * FROM conversations WHERE clinic_id = 1;

# Monitorar logs em tempo real
npm run dev:railway | grep "🔍\|✅\|❌"
```

---

*Documentação criada em: Janeiro 2025*
*Baseada em problemas reais resolvidos no projeto Operabase*
*Atualizada com validações implementadas*
*Status: ✅ Testado e Validado em Produção* 