# MCP API Reference - TaskMed

## Visão Geral

A API MCP (Model Context Protocol) do TaskMed oferece endpoints seguros para integração com N8N e ferramentas de automação, com autenticação por API Keys e isolamento multi-tenant completo.

## Base URL

```
https://your-domain.replit.app/api/mcp
```

## Autenticação

Todos os endpoints MCP requerem autenticação via API Key no header Authorization:

```http
Authorization: Bearer tk_clinic_1_45ce00c0e7236e4d25e86936822c432c
```

## Endpoints Disponíveis

### 1. Health Check

```http
GET /api/mcp/health
```

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-06-18T18:00:00Z",
    "clinic_id": 1
  },
  "error": null
}
```

### 2. Validar API Key

```http
GET /api/mcp/status/valid
```

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "api_key_valid": true,
    "clinic_id": 1,
    "permissions": ["read", "write"],
    "key_name": "N8N Production"
  },
  "error": null
}
```

### 3. Consultar Disponibilidade

```http
GET /api/mcp/appointments/availability?date=2025-06-25&duration_minutes=60
```

**Parâmetros de Query:**
- `date` (obrigatório): Data no formato YYYY-MM-DD
- `duration_minutes` (opcional): Duração em minutos (padrão: 60)
- `user_id` (opcional): ID do profissional específico

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "date": "2025-06-25",
    "available_slots": [
      {
        "time": "09:00",
        "available": true,
        "user_id": 4,
        "user_name": "Dr. Silva"
      },
      {
        "time": "10:00",
        "available": true,
        "user_id": 4,
        "user_name": "Dr. Silva"
      }
    ],
    "total_slots": 16,
    "available_count": 12
  },
  "error": null
}
```

### 4. Listar Consultas

```http
GET /api/mcp/appointments?date=2025-06-25&status=agendada
```

**Parâmetros de Query:**
- `date` (opcional): Filtrar por data específica
- `status` (opcional): Filtrar por status (agendada, confirmada, realizada, cancelada)
- `user_id` (opcional): Filtrar por profissional
- `contact_id` (opcional): Filtrar por paciente

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 25,
      "contact_id": 15,
      "contact_name": "João Silva",
      "user_id": 4,
      "doctor_name": "Dr. Silva",
      "specialty": "consulta",
      "scheduled_date": "2025-06-25T14:00:00Z",
      "duration_minutes": 60,
      "status": "agendada",
      "created_at": "2025-06-18T17:00:00Z"
    }
  ],
  "total": 1,
  "error": null
}
```

### 5. Obter Consulta Específica

```http
GET /api/mcp/appointments/:id
```

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "id": 25,
    "contact_id": 15,
    "contact_name": "João Silva",
    "contact_phone": "+5511999999999",
    "user_id": 4,
    "doctor_name": "Dr. Silva",
    "specialty": "consulta",
    "appointment_type": "consulta",
    "scheduled_date": "2025-06-25T14:00:00Z",
    "duration_minutes": 60,
    "status": "agendada",
    "session_notes": null,
    "payment_status": "pendente",
    "payment_amount": 15000,
    "created_at": "2025-06-18T17:00:00Z",
    "updated_at": "2025-06-18T17:00:00Z"
  },
  "error": null
}
```

### 6. Criar Consulta

```http
POST /api/mcp/appointments/create
Content-Type: application/json

{
  "contact_id": 15,
  "user_id": 4,
  "scheduled_date": "2025-06-25",
  "scheduled_time": "14:00",
  "duration_minutes": 60,
  "doctor_name": "Dr. Silva",
  "specialty": "consulta",
  "appointment_type": "consulta",
  "payment_amount": 15000
}
```

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "data": {
    "id": 26,
    "contact_id": 15,
    "user_id": 4,
    "scheduled_date": "2025-06-25T14:00:00Z",
    "duration_minutes": 60,
    "status": "agendada"
  },
  "appointment_id": 26,
  "error": null,
  "conflicts": null,
  "next_available_slots": null
}
```

**Resposta de Conflito (400):**
```json
{
  "success": false,
  "data": null,
  "error": "Time slot conflict detected",
  "appointment_id": null,
  "conflicts": [
    {
      "id": 17,
      "scheduled_date": "2025-06-25T14:30:00Z",
      "doctor_name": "Dr. Silva",
      "duration_minutes": 60
    }
  ],
  "next_available_slots": [
    {
      "date": "2025-06-25",
      "time": "15:30",
      "user_id": 4,
      "user_name": "Dr. Silva"
    }
  ]
}
```

### 7. Atualizar Status da Consulta

```http
PUT /api/mcp/appointments/status
Content-Type: application/json

{
  "appointment_id": 25,
  "status": "confirmada",
  "session_notes": "Consulta confirmada via automação N8N"
}
```

**Status válidos:**
- `agendada` - Consulta agendada
- `confirmada` - Consulta confirmada pelo paciente
- `realizada` - Consulta realizada
- `cancelada` - Consulta cancelada
- `reagendada` - Consulta reagendada

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "id": 25,
    "status": "confirmada",
    "session_notes": "Consulta confirmada via automação N8N",
    "updated_at": "2025-06-18T18:00:00Z"
  },
  "appointment_id": 25,
  "error": null
}
```

### 8. Reagendar Consulta

```http
PUT /api/mcp/appointments/reschedule
Content-Type: application/json

{
  "appointment_id": 25,
  "new_date": "2025-06-26",
  "new_time": "15:00",
  "reason": "Solicitação do paciente via WhatsApp"
}
```

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "id": 25,
    "old_date": "2025-06-25T14:00:00Z",
    "new_date": "2025-06-26T15:00:00Z",
    "status": "reagendada",
    "reason": "Solicitação do paciente via WhatsApp"
  },
  "appointment_id": 25,
  "error": null
}
```

### 9. Cancelar Consulta

```http
PUT /api/mcp/appointments/cancel
Content-Type: application/json

{
  "appointment_id": 25,
  "cancellation_reason": "Paciente não pode comparecer"
}
```

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "id": 25,
    "status": "cancelada",
    "cancellation_reason": "Paciente não pode comparecer",
    "updated_at": "2025-06-18T18:00:00Z"
  },
  "appointment_id": 25,
  "error": null
}
```

### 10. Chat Conversacional MARA

```http
POST /api/mcp/chat
Content-Type: application/json

{
  "message": "Agendar consulta para João Silva na próxima terça-feira às 14h",
  "context": {
    "patient_name": "João Silva",
    "phone": "+5511999999999",
    "preferred_time": "afternoon"
  }
}
```

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "mcp_action": "create",
    "response": "Consulta agendada para João Silva no dia 25/06/2025 às 14:00 com Dr. Silva.",
    "appointment_id": 27,
    "details": {
      "patient": "João Silva",
      "date": "2025-06-25",
      "time": "14:00",
      "doctor": "Dr. Silva",
      "duration": 60
    }
  },
  "error": null
}
```

## Estrutura de Resposta Padrão

Todos os endpoints seguem a estrutura MCPResponse:

```typescript
interface MCPResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
  appointment_id?: number | null;
  conflicts?: any[] | null;
  next_available_slots?: any[] | null;
}
```

## Códigos de Status HTTP

- **200** - Operação bem-sucedida
- **201** - Recurso criado com sucesso
- **400** - Erro de validação ou conflito de dados
- **401** - API Key inválida ou não fornecida
- **403** - Permissões insuficientes para a operação
- **404** - Recurso não encontrado
- **500** - Erro interno do servidor

## Tratamento de Erros

### Erro de Autenticação (401)

```json
{
  "success": false,
  "error": "API Key inválida ou inativa",
  "data": null,
  "appointment_id": null
}
```

### Erro de Permissão (403)

```json
{
  "success": false,
  "error": "Permissões insuficientes. Operação requer permissão 'write'",
  "data": null,
  "appointment_id": null
}
```

### Erro de Validação (400)

```json
{
  "success": false,
  "error": "Validation error: scheduled_date: Data deve estar no futuro",
  "data": null,
  "appointment_id": null
}
```

## Limites de Rate

- **100 requests/minuto** por API Key para operações de leitura
- **50 requests/minuto** por API Key para operações de escrita  
- **10 requests/minuto** para criação de consultas

Headers de rate limit incluídos nas respostas:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Exemplos de Uso N8N

### Webhook de Agendamento

```javascript
// Node HTTP Request - N8N
{
  "method": "POST",
  "url": "https://your-domain.replit.app/api/mcp/appointments/create",
  "headers": {
    "Authorization": "Bearer tk_clinic_1_45ce00c0e7236e4d25e86936822c432c",
    "Content-Type": "application/json"
  },
  "body": {
    "contact_id": "{{$json.contact_id}}",
    "user_id": 4,
    "scheduled_date": "{{$json.date}}",
    "scheduled_time": "{{$json.time}}",
    "duration_minutes": 60,
    "doctor_name": "Dr. Silva",
    "specialty": "consulta"
  }
}
```

### Verificação de Disponibilidade

```javascript
// Node HTTP Request - N8N
{
  "method": "GET",
  "url": "https://your-domain.replit.app/api/mcp/appointments/availability",
  "headers": {
    "Authorization": "Bearer tk_clinic_1_45ce00c0e7236e4d25e86936822c432c"
  },
  "qs": {
    "date": "{{$json.requested_date}}",
    "duration_minutes": "{{$json.duration || 60}}"
  }
}
```

### Atualização de Status

```javascript
// Node HTTP Request - N8N
{
  "method": "PUT",
  "url": "https://your-domain.replit.app/api/mcp/appointments/status",
  "headers": {
    "Authorization": "Bearer tk_clinic_1_45ce00c0e7236e4d25e86936822c432c",
    "Content-Type": "application/json"
  },
  "body": {
    "appointment_id": "{{$json.appointment_id}}",
    "status": "confirmada",
    "session_notes": "Confirmação via WhatsApp - {{$json.confirmation_time}}"
  }
}
```

## Integração com WhatsApp (via N8N)

### Fluxo de Agendamento Automático

1. **Receber mensagem WhatsApp** → N8N Webhook
2. **Processar linguagem natural** → Chat MCP endpoint
3. **Verificar disponibilidade** → Availability endpoint  
4. **Criar consulta** → Create appointment endpoint
5. **Enviar confirmação** → WhatsApp response

### Exemplo de Workflow N8N

```json
{
  "name": "TaskMed - Agendamento WhatsApp",
  "nodes": [
    {
      "name": "WhatsApp Webhook",
      "type": "n8n-nodes-base.webhook"
    },
    {
      "name": "Processar Mensagem",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://your-domain.replit.app/api/mcp/chat",
        "method": "POST",
        "body": {
          "message": "={{$json.message}}",
          "context": {
            "patient_name": "={{$json.contact_name}}",
            "phone": "={{$json.phone}}"
          }
        }
      }
    },
    {
      "name": "Agendar Consulta",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://your-domain.replit.app/api/mcp/appointments/create"
      }
    }
  ]
}
```

## Monitoramento e Logs

### Métricas Disponíveis

- Número de requests por API Key
- Tempo de resposta médio
- Taxa de erro por endpoint
- Uso por clínica

### Logs Estruturados

```json
{
  "timestamp": "2025-06-18T18:00:00Z",
  "level": "info",
  "service": "mcp-api",
  "api_key_id": "1",
  "clinic_id": "1",
  "endpoint": "/appointments/create",
  "method": "POST",
  "response_time": "245ms",
  "status": 201,
  "user_agent": "N8N-Webhook/1.0"
}
```

---

**Documentação atualizada:** June 18, 2025  
**Versão da API:** v1.0.0  
**Suporte:** Sistema MCP TaskMed