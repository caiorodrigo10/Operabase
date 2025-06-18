# API Reference - Sistema MCP de Agendamentos

## Autenticação

Todas as requisições requerem autenticação via session cookie ou bearer token:

```
Authorization: Bearer <your-token>
```

## Base URL

```
https://your-domain.com/api/mcp
```

---

## 1. Health Check

Verifica se o sistema está funcionando corretamente.

### Endpoint
```
GET /health
```

### Response
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-06-18T01:53:18.720Z",
    "version": "1.0.0"
  },
  "error": null,
  "appointment_id": null,
  "conflicts": null,
  "next_available_slots": null
}
```

---

## 2. Criar Consulta

Cria uma nova consulta no sistema.

### Endpoint
```
POST /appointments/create
```

### Request Body
```json
{
  "contact_id": 1,
  "clinic_id": 1,
  "user_id": 4,
  "scheduled_date": "2025-06-26",
  "scheduled_time": "10:00",
  "duration_minutes": 60,
  "status": "agendada",
  "doctor_name": "Dr. Silva",
  "specialty": "ortodontia",
  "appointment_type": "consulta",
  "payment_status": "pendente",
  "payment_amount": 15000,
  "tag_id": 1
}
```

### Campos Obrigatórios
- `contact_id`: ID do contato/paciente
- `clinic_id`: ID da clínica
- `user_id`: ID do usuário responsável
- `scheduled_date`: Data no formato YYYY-MM-DD
- `scheduled_time`: Horário no formato HH:MM

### Campos Opcionais
- `duration_minutes`: Duração em minutos (padrão: 60)
- `status`: Status da consulta (padrão: "agendada")
- `doctor_name`: Nome do profissional
- `specialty`: Especialidade médica
- `appointment_type`: Tipo da consulta
- `payment_status`: Status do pagamento (padrão: "pendente")
- `payment_amount`: Valor em centavos
- `tag_id`: ID da etiqueta

### Response Success
```json
{
  "success": true,
  "data": {
    "id": 18,
    "contact_id": 1,
    "clinic_id": 1,
    "user_id": 4,
    "doctor_name": "Dr. Silva",
    "specialty": "ortodontia",
    "appointment_type": "consulta",
    "scheduled_date": "2025-06-26T10:00:00.000Z",
    "duration_minutes": 60,
    "status": "agendada",
    "payment_status": "pendente",
    "payment_amount": 15000,
    "tag_id": 1,
    "created_at": "2025-06-18T01:53:35.218Z",
    "updated_at": "2025-06-18T01:53:35.218Z"
  },
  "error": null,
  "appointment_id": 18,
  "conflicts": null,
  "next_available_slots": null
}
```

### Response Error
```json
{
  "success": false,
  "data": null,
  "error": "Contact not found or does not belong to this clinic",
  "appointment_id": null,
  "conflicts": null,
  "next_available_slots": null
}
```

### Status Codes
- `200`: Sucesso
- `400`: Dados inválidos
- `403`: Acesso negado
- `500`: Erro interno

---

## 3. Atualizar Status da Consulta

Atualiza apenas o status de uma consulta existente.

### Endpoint
```
PUT /appointments/{appointment_id}/status
```

### Request Body
```json
{
  "clinic_id": 1,
  "status": "confirmada"
}
```

### Status Válidos
- `agendada`: Consulta agendada
- `confirmada`: Paciente confirmou presença
- `paciente_aguardando`: Paciente chegou
- `paciente_em_atendimento`: Consulta em andamento
- `finalizada`: Consulta concluída
- `faltou`: Paciente não compareceu
- `cancelada_paciente`: Cancelada pelo paciente
- `cancelada_dentista`: Cancelada pelo profissional

### Response
```json
{
  "success": true,
  "data": {
    "id": 18,
    "status": "confirmada",
    "updated_at": "2025-06-18T02:15:30.000Z"
  },
  "error": null,
  "appointment_id": 18,
  "conflicts": null,
  "next_available_slots": null
}
```

---

## 4. Reagendar Consulta

Move uma consulta para nova data/horário.

### Endpoint
```
PUT /appointments/{appointment_id}/reschedule
```

### Request Body
```json
{
  "clinic_id": 1,
  "new_date": "2025-06-27",
  "new_time": "14:00",
  "duration_minutes": 60
}
```

### Response
```json
{
  "success": true,
  "data": {
    "id": 18,
    "scheduled_date": "2025-06-27T14:00:00.000Z",
    "updated_at": "2025-06-18T02:20:15.000Z"
  },
  "error": null,
  "appointment_id": 18,
  "conflicts": null,
  "next_available_slots": null
}
```

### Response com Conflito
```json
{
  "success": false,
  "data": null,
  "error": "Time slot conflict detected",
  "appointment_id": null,
  "conflicts": [
    {
      "id": 15,
      "scheduled_date": "2025-06-27T14:00:00.000Z",
      "duration_minutes": 60,
      "contact_name": "João Silva"
    }
  ],
  "next_available_slots": [
    {
      "time": "15:00",
      "datetime": "2025-06-27T15:00:00.000Z"
    },
    {
      "time": "16:00", 
      "datetime": "2025-06-27T16:00:00.000Z"
    }
  ]
}
```

---

## 5. Cancelar Consulta

Cancela uma consulta existente.

### Endpoint
```
DELETE /appointments/{appointment_id}/cancel
```

### Request Body
```json
{
  "clinic_id": 1,
  "cancelled_by": "paciente",
  "reason": "Conflito de agenda"
}
```

### Campos
- `cancelled_by`: "paciente" ou "dentista"
- `reason`: Motivo do cancelamento (opcional)

### Response
```json
{
  "success": true,
  "data": {
    "id": 18,
    "status": "cancelada_paciente",
    "cancellation_reason": "Conflito de agenda",
    "updated_at": "2025-06-18T02:25:45.000Z"
  },
  "error": null,
  "appointment_id": 18,
  "conflicts": null,
  "next_available_slots": null
}
```

---

## 6. Verificar Disponibilidade

Retorna horários disponíveis para agendamento.

### Endpoint
```
POST /appointments/availability
```

### Request Body
```json
{
  "clinic_id": 1,
  "user_id": 4,
  "date": "2025-06-26",
  "duration_minutes": 60,
  "working_hours_start": "08:00",
  "working_hours_end": "18:00",
  "interval_minutes": 30
}
```

### Response
```json
{
  "success": true,
  "data": {
    "date": "2025-06-26",
    "available_slots": [
      {
        "time": "08:00",
        "datetime": "2025-06-26T08:00:00.000Z"
      },
      {
        "time": "08:30",
        "datetime": "2025-06-26T08:30:00.000Z"
      },
      {
        "time": "09:00",
        "datetime": "2025-06-26T09:00:00.000Z"
      }
    ],
    "total_slots": 20,
    "available_count": 17,
    "occupied_slots": [
      {
        "time": "10:00",
        "appointment_id": 15,
        "contact_name": "Maria Santos"
      }
    ]
  },
  "error": null,
  "appointment_id": null,
  "conflicts": null,
  "next_available_slots": null
}
```

---

## 7. Listar Consultas

Busca consultas com filtros opcionais.

### Endpoint
```
POST /appointments/list
```

### Request Body
```json
{
  "clinic_id": 1,
  "filters": {
    "startDate": "2025-06-01",
    "endDate": "2025-06-30",
    "status": "agendada",
    "userId": 4,
    "contactId": 1
  },
  "pagination": {
    "limit": 50,
    "offset": 0
  }
}
```

### Filtros Disponíveis
- `startDate`: Data inicial (YYYY-MM-DD)
- `endDate`: Data final (YYYY-MM-DD)
- `status`: Status específico
- `userId`: Consultas de um usuário
- `contactId`: Consultas de um contato

### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 18,
      "contact_id": 1,
      "clinic_id": 1,
      "user_id": 4,
      "scheduled_date": "2025-06-26T10:00:00.000Z",
      "duration_minutes": 60,
      "status": "agendada",
      "doctor_name": "Dr. Silva",
      "specialty": "ortodontia",
      "contact_name": "João Silva",
      "contact_phone": "+5511999999999",
      "created_at": "2025-06-18T01:53:35.218Z"
    }
  ],
  "error": null,
  "appointment_id": null,
  "conflicts": null,
  "next_available_slots": null
}
```

---

## 8. Buscar Consulta por ID

Retorna dados completos de uma consulta específica.

### Endpoint
```
GET /appointments/{appointment_id}?clinic_id={clinic_id}
```

### Parameters
- `appointment_id`: ID da consulta (path parameter)
- `clinic_id`: ID da clínica (query parameter)

### Response
```json
{
  "success": true,
  "data": {
    "id": 18,
    "contact_id": 1,
    "clinic_id": 1,
    "user_id": 4,
    "doctor_name": "Dr. Silva",
    "specialty": "ortodontia",
    "appointment_type": "consulta",
    "scheduled_date": "2025-06-26T10:00:00.000Z",
    "duration_minutes": 60,
    "status": "agendada",
    "cancellation_reason": null,
    "session_notes": null,
    "payment_status": "pendente",
    "payment_amount": 15000,
    "google_calendar_event_id": null,
    "tag_id": 1,
    "created_at": "2025-06-18T01:53:35.218Z",
    "updated_at": "2025-06-18T01:53:35.218Z",
    "contact": {
      "id": 1,
      "name": "João Silva",
      "phone": "+5511999999999",
      "email": "joao@email.com"
    },
    "user": {
      "id": 4,
      "name": "Dr. Carlos Silva",
      "email": "carlos@clinica.com"
    },
    "tag": {
      "id": 1,
      "name": "Urgente",
      "color": "#ff0000"
    }
  },
  "error": null,
  "appointment_id": 18,
  "conflicts": null,
  "next_available_slots": null
}
```

---

## Códigos de Erro Comuns

### 400 - Bad Request
```json
{
  "success": false,
  "data": null,
  "error": "Validation error: scheduled_date must be in YYYY-MM-DD format",
  "appointment_id": null,
  "conflicts": null,
  "next_available_slots": null
}
```

### 403 - Forbidden
```json
{
  "success": false,
  "data": null,
  "error": "Access denied to clinic",
  "appointment_id": null,
  "conflicts": null,
  "next_available_slots": null
}
```

### 404 - Not Found
```json
{
  "success": false,
  "data": null,
  "error": "Appointment not found",
  "appointment_id": null,
  "conflicts": null,
  "next_available_slots": null
}
```

### 409 - Conflict
```json
{
  "success": false,
  "data": null,
  "error": "Time slot conflict detected",
  "appointment_id": null,
  "conflicts": [
    {
      "id": 15,
      "scheduled_date": "2025-06-26T10:00:00.000Z",
      "contact_name": "Maria Santos"
    }
  ],
  "next_available_slots": [
    {
      "time": "11:00",
      "datetime": "2025-06-26T11:00:00.000Z"
    }
  ]
}
```

### 500 - Internal Server Error
```json
{
  "success": false,
  "data": null,
  "error": "Internal server error",
  "appointment_id": null,
  "conflicts": null,
  "next_available_slots": null
}
```

---

## Exemplos de Uso com cURL

### Criar Consulta
```bash
curl -X POST https://api.taskmed.com/api/mcp/appointments/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "contact_id": 1,
    "clinic_id": 1,
    "user_id": 4,
    "scheduled_date": "2025-06-26",
    "scheduled_time": "10:00",
    "duration_minutes": 60,
    "status": "agendada"
  }'
```

### Verificar Disponibilidade
```bash
curl -X POST https://api.taskmed.com/api/mcp/appointments/availability \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "clinic_id": 1,
    "user_id": 4,
    "date": "2025-06-26",
    "duration_minutes": 60,
    "working_hours_start": "08:00",
    "working_hours_end": "18:00"
  }'
```

### Listar Consultas do Dia
```bash
curl -X POST https://api.taskmed.com/api/mcp/appointments/list \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "clinic_id": 1,
    "filters": {
      "startDate": "2025-06-26",
      "endDate": "2025-06-26"
    }
  }'
```

### Atualizar Status
```bash
curl -X PUT https://api.taskmed.com/api/mcp/appointments/18/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "clinic_id": 1,
    "status": "confirmada"
  }'
```

---

## Rate Limiting

- Máximo 100 requisições por IP a cada 15 minutos
- Headers de resposta incluem:
  - `X-RateLimit-Limit`: Limite total
  - `X-RateLimit-Remaining`: Requisições restantes
  - `X-RateLimit-Reset`: Timestamp do reset

---

## Versionamento

A API usa versionamento via header:

```
API-Version: 1.0
```

Versões suportadas:
- `1.0` (atual)

---

*API Reference v1.0 - Atualizada em 18/06/2025*