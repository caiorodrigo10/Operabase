# Guia do Agente de IA - Sistema de Anamneses

## 🎯 Ações Diretas para Agente de IA

### VERIFICAR STATUS DE ANAMNESE

```bash
# Consultar anamneses de um paciente
GET /api/contacts/{contactId}/anamnesis

# Resposta esperada:
[
  {
    "id": 123,
    "template_name": "Anamnese Geral",
    "status": "completed|pending|expired",
    "share_token": "abc123",
    "created_at": "2025-06-20T10:00:00Z",
    "completed_at": "2025-06-20T15:30:00Z"
  }
]
```

### CRIAR NOVA ANAMNESE

```bash
# Passo 1: Listar templates disponíveis
GET /api/anamnesis/templates

# Passo 2: Criar anamnese para paciente
POST /api/contacts/{contactId}/anamnesis
{
  "template_id": 1,
  "status": "solicitado"
}

# Resposta: Token para compartilhamento
{
  "id": 456,
  "share_token": "xyz789",
  "expires_at": "2025-07-20T10:00:00Z"
}

# Passo 3: Gerar link público
Link: https://sistema.com/anamnese/xyz789
```

### VERIFICAR RESPOSTAS DE PACIENTE

```bash
# Buscar respostas específicas
GET /api/anamnesis/{responseId}

# Estrutura das respostas:
{
  "id": 456,
  "responses": {
    "queixa_principal": "Dor de cabeça constante",
    "historico_familiar": "sim",
    "historico_familiar_additional": "Diabetes na família"
  },
  "patient_name": "João Silva",
  "completed_at": "2025-06-20T15:30:00Z"
}
```

## 🔍 DECISÕES DO AGENTE

### Quando Criar Nova Anamnese
```typescript
// SE: Paciente não tem anamnese OU última anamnese > 6 meses
if (!hasAnamnesis || lastAnamnesisAge > 6months) {
  createNewAnamnesis();
}

// SE: Mudança de especialidade médica
if (currentSpecialty !== lastAnamnesisSpecialty) {
  createSpecializedAnamnesis();
}
```

### Qual Template Usar
```typescript
// Mapeamento de especialidades
const templateMap = {
  "geral": 1,           // Anamnese Geral
  "cirurgia": 2,        // Anamnese Cirúrgica
  "pediatria": 3,       // Anamnese Pediátrica
  "ortodontia": 4       // Anamnese Ortodôntica
};

// Lógica de seleção
function selectTemplate(specialty, patientAge) {
  if (patientAge < 18) return templateMap.pediatria;
  if (specialty.includes("cirurg")) return templateMap.cirurgia;
  if (specialty.includes("ortodon")) return templateMap.ortodontia;
  return templateMap.geral;
}
```

### Status de Urgência
```typescript
// Avaliar necessidade de anamnese
function evaluateUrgency(patient, appointment) {
  if (appointment.type === "cirurgia" && !hasRecentAnamnesis()) {
    return "CRITICAL"; // Bloquear consulta
  }
  if (appointment.type === "primeira_consulta" && !hasAnamnesis()) {
    return "HIGH"; // Recomendar antes da consulta
  }
  return "NORMAL";
}
```

## 🚨 TRATAMENTO DE ERROS

### Token Expirado
```typescript
// Detectar token expirado
if (error.message.includes("expired") || error.status === 410) {
  // Ação: Gerar novo token
  const newAnamnesis = await createNewAnamnesis(contactId, templateId);
  return newAnamnesis.share_token;
}
```

### Template Não Encontrado
```typescript
// Se template específico não existe
if (error.status === 404 && error.context === "template") {
  // Fallback para template geral
  return await createAnamnesis(contactId, GENERAL_TEMPLATE_ID);
}
```

### Dados Incompletos
```typescript
// Validar campos obrigatórios
function validateResponse(responses, template) {
  const required = template.fields.questions
    .filter(q => q.required)
    .map(q => q.id);
    
  const missing = required.filter(field => !responses[field]);
  
  if (missing.length > 0) {
    throw new Error(`Campos obrigatórios: ${missing.join(", ")}`);
  }
}
```

## 📋 TEMPLATES E CONTEXTOS

### Template IDs Padrão
```typescript
const TEMPLATES = {
  GERAL: 1,
  CIRURGICA: 2,
  PEDIATRICA: 3,
  ORTODONTICA: 4
};
```

### Contextos de Uso
```typescript
// Primeira consulta
if (isFirstAppointment) {
  recommendTemplate(TEMPLATES.GERAL);
}

// Procedimento cirúrgico
if (appointmentType === "cirurgia") {
  requireTemplate(TEMPLATES.CIRURGICA);
}

// Paciente menor de idade
if (patientAge < 18) {
  recommendTemplate(TEMPLATES.PEDIATRICA);
}
```

## 🔄 WORKFLOWS AUTOMATIZADOS

### Fluxo de Primeira Consulta
```typescript
async function handleFirstAppointment(contactId, appointmentDate) {
  // 1. Verificar se tem anamnese
  const existingAnamnesis = await getContactAnamnesis(contactId);
  
  // 2. Se não tem, criar
  if (!existingAnamnesis.length) {
    const anamnesis = await createAnamnesis(contactId, TEMPLATES.GERAL);
    
    // 3. Enviar notificação
    await notifyPatient(anamnesis.share_token, appointmentDate);
  }
  
  // 4. Verificar se foi preenchida antes da consulta
  if (appointmentDate - now < 24hours && anamnesis.status !== 'completed') {
    await sendUrgentReminder(contactId);
  }
}
```

### Fluxo Pré-Cirúrgico
```typescript
async function handleSurgicalPrep(contactId, surgeryDate) {
  // 1. Anamnese cirúrgica obrigatória
  const surgicalAnamnesis = await createAnamnesis(contactId, TEMPLATES.CIRURGICA);
  
  // 2. Definir prazo crítico (48h antes)
  const deadline = surgeryDate - 48hours;
  
  // 3. Monitorar preenchimento
  if (now > deadline && anamnesis.status !== 'completed') {
    throw new Error("BLOQUEIO: Anamnese cirúrgica não preenchida");
  }
}
```

## 📊 MÉTRICAS E MONITORAMENTO

### KPIs para Agente
```typescript
// Taxa de preenchimento
const completionRate = completed / sent * 100;

// Tempo médio de resposta
const avgResponseTime = totalResponseTime / completedCount;

// Templates mais eficazes
const templateEfficiency = completedByTemplate / sentByTemplate;
```

### Alertas Automáticos
```typescript
// Configurar alertas
const alerts = {
  lowCompletionRate: completionRate < 70,
  expiredTokens: expiredCount > 5,
  validationErrors: errorRate > 10
};
```

## 🎯 COMANDOS ESPECÍFICOS

### Listar Anamneses Pendentes
```sql
SELECT 
  ar.id,
  c.name as patient_name,
  at.name as template_name,
  ar.created_at,
  ar.expires_at
FROM anamnesis_responses ar
JOIN contacts c ON ar.contact_id = c.id
JOIN anamnesis_templates at ON ar.template_id = at.id
WHERE ar.status = 'pending' 
  AND ar.expires_at > NOW()
ORDER BY ar.expires_at ASC;
```

### Pacientes Sem Anamnese
```sql
SELECT 
  c.id,
  c.name,
  COUNT(ar.id) as anamnesis_count
FROM contacts c
LEFT JOIN anamnesis_responses ar ON c.id = ar.contact_id
GROUP BY c.id, c.name
HAVING COUNT(ar.id) = 0;
```

### Anamneses Expiradas
```sql
SELECT 
  ar.id,
  c.name,
  ar.expires_at
FROM anamnesis_responses ar
JOIN contacts c ON ar.contact_id = c.id
WHERE ar.status = 'pending' 
  AND ar.expires_at < NOW();
```

## 🔧 UTILITÁRIOS PARA AGENTE

### Gerar Link de Compartilhamento
```typescript
function generateShareLink(token) {
  return `${process.env.FRONTEND_URL}/anamnese/${token}`;
}
```

### Verificar Validade do Token
```typescript
function isTokenValid(expiresAt) {
  return new Date(expiresAt) > new Date();
}
```

### Formatar Respostas para Exibição
```typescript
function formatResponses(responses, template) {
  return template.fields.questions.map(question => ({
    question: question.text,
    answer: responses[question.id] || 'Não respondido',
    additional: responses[`${question.id}_additional`] || null
  }));
}
```

## ⚡ AÇÕES RÁPIDAS

### Criar Anamnese Express
```bash
curl -X POST /api/contacts/123/anamnesis \
  -H "Content-Type: application/json" \
  -d '{"template_id": 1, "status": "solicitado"}'
```

### Verificar Status Múltiplos Pacientes
```bash
curl -X GET /api/contacts/bulk-anamnesis \
  -H "Content-Type: application/json" \
  -d '{"contact_ids": [123, 124, 125]}'
```

### Reenviar Link Expirado
```bash
curl -X PUT /api/anamnesis/456/renew \
  -H "Content-Type: application/json"
```

## 🎯 CENÁRIOS CRÍTICOS

### Consulta em Menos de 24h Sem Anamnese
```typescript
if (appointmentIn24h && !hasCompletedAnamnesis) {
  // AÇÃO: Criar anamnese express
  // NOTIFICAR: Paciente e profissional
  // ALERTAR: Anamnese pendente crítica
}
```

### Cirurgia Sem Anamnese Cirúrgica
```typescript
if (isSurgery && !hasSurgicalAnamnesis) {
  // BLOQUEAR: Agendamento
  // CRIAR: Anamnese cirúrgica obrigatória
  // PRAZO: 48h antes do procedimento
}
```

### Token Expirado com Consulta Próxima
```typescript
if (tokenExpired && appointmentSoon) {
  // RENOVAR: Token automaticamente
  // NOTIFICAR: Novo link
  // ESTENDER: Prazo se necessário
}
```

Esta documentação fornece comandos diretos e lógicas de decisão que um agente de IA pode seguir para operar o sistema de anamneses de forma autônoma e eficaz.