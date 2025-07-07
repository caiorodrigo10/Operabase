# Appointment Scheduling Module - Comprehensive Mapping & Correction Plan

## Overview

This document provides a complete mapping of the appointment scheduling module in the Operabase medical clinic management system, along with identified issues and correction recommendations.

## System Architecture

### Technology Stack
- **Frontend**: React + Vite, TypeScript, TanStack Query, Shadcn UI, Tailwind CSS
- **Backend**: Express.js with domain-driven architecture
- **Database**: Supabase PostgreSQL with Drizzle ORM
- **Additional**: Multi-tenant isolation, Google Calendar integration

## Database Schema Analysis

### Primary Tables

#### 1. Appointments Table
**Location**: `server/domains/appointments/appointments.schema.ts`

```sql
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER NOT NULL,
  clinic_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  doctor_name TEXT,
  specialty TEXT,
  appointment_type TEXT,
  scheduled_date TIMESTAMP,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT NOT NULL,
  cancellation_reason TEXT,
  session_notes TEXT,
  payment_status TEXT DEFAULT 'pendente',
  payment_amount INTEGER,
  google_calendar_event_id TEXT,
  tag_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes for Performance**:
- `idx_appointments_clinic_date` (clinic_id, scheduled_date)
- `idx_appointments_clinic_status` (clinic_id, status)
- `idx_appointments_clinic_user` (clinic_id, user_id)
- `idx_appointments_contact_clinic` (contact_id, clinic_id)

#### 2. Related Tables
- **contacts**: Patient information
- **users**: Medical professionals and staff
- **clinics**: Multi-tenant clinic data
- **appointment_tags**: Categorization system
- **clinic_users**: Professional assignments

## Backend Implementation

### 1. MCP Agents (AI-Powered Appointment Management)

#### AppointmentMCPAgent (`server/mcp/appointment-agent.ts`)
- **Purpose**: Full-featured appointment CRUD with advanced validation
- **Features**:
  - Conflict detection with existing appointments
  - Working hours validation with lunch break support
  - Available time slot generation
  - Google Calendar integration
  - Multi-tenant security

**Key Methods**:
```typescript
- createAppointment(params): MCPResponse
- rescheduleAppointment(params): MCPResponse  
- updateStatus(params): MCPResponse
- listAppointments(clinicId, filters): MCPResponse
- getAvailableSlots(params): MCPResponse
- checkConflicts(clinicId, userId, date, time, duration): Promise<any[]>
```

#### AppointmentMCPAgentSimple (`server/mcp/appointment-agent-simple.ts`)
- **Purpose**: Simplified agent for basic operations
- **Features**: Streamlined validation and conflict checking

### 2. Domain Architecture

#### Appointments Domain (`server/domains/appointments/`)

**Controller** (`appointments.controller.ts`):
- REST API endpoints
- Request validation with Zod schemas
- Error handling and logging
- Multi-tenant filtering

**Service** (`appointments.service.ts`):
- Business logic layer
- Google Calendar synchronization
- Timezone handling utilities
- Conflict detection algorithms

**Repository** (`appointments.repository.ts`):
- Data access layer
- Database abstraction
- Query optimization

**Routes** (`appointments.routes.ts`):
```typescript
GET    /appointments                    // List with filters
GET    /appointments/paginated          // Paginated results
GET    /appointments/:id                // Get by ID
GET    /contacts/:contactId/appointments // By contact
POST   /appointments                    // Create
PUT    /appointments/:id                // Update
PATCH  /appointments/:id                // Update status
DELETE /appointments/:id                // Delete
POST   /appointments/availability/check // Check availability
POST   /appointments/availability/find-slots // Find time slots
```

### 3. API Integration

#### N8N Routes (`server/mcp/n8n-routes.ts`)
- External API access with API key authentication
- Secure multi-tenant operations
- Comprehensive CRUD endpoints

## Frontend Implementation

### 1. Main Calendar Component

#### Consultas Page (`src/pages/consultas.tsx`)
**Size**: 1300+ lines - Core appointment management interface

**Features**:
- **Multi-view Calendar**: Month, Week, Day views
- **Professional Filter**: Multi-tenant professional selection
- **Drag & Drop**: Appointment rescheduling with visual feedback
- **Real-time Availability**: Conflict detection and validation
- **Time Slot Analysis**: Working hours, lunch breaks, conflicts
- **Appointment CRUD**: Full create, read, update, delete operations

**Key State Management**:
```typescript
const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
const [calendarView, setCalendarView] = useState<"month" | "week" | "day">("week");
const [selectedProfessional, setSelectedProfessional] = useState<number | null>();
const [availabilityConflict, setAvailabilityConflict] = useState();
```

### 2. Appointment Forms

#### AppointmentForm (`src/components/AppointmentForm.tsx`)
- **Validation**: Zod schema with comprehensive field validation
- **Professional Selection**: Dynamic loading of clinic professionals
- **Time Selection**: Date/time pickers with validation
- **Availability Check**: Real-time conflict detection
- **Patient Search**: Integrated contact selection

#### AppointmentEditor (`src/components/AppointmentEditor.tsx`)
- **Modal Interface**: Dialog-based appointment creation/editing
- **Form Integration**: Reusable form components
- **Mutation Handling**: TanStack Query mutations for CRUD operations

### 3. Advanced Features

#### Drag & Drop System
**Components**:
- `DragProvider.tsx`: Context provider for drag operations
- `DraggableAppointment.tsx`: Individual appointment drag handling
- `DroppableTimeSlot.tsx`: Time slot drop targets

**Features**:
- **Precision Snapping**: 5-minute interval snapping
- **Visual Feedback**: Real-time drop zone highlighting
- **Conflict Prevention**: Pre-drop validation
- **Custom Cursors**: Enhanced UX during drag operations

#### Time Slot Finding (`src/components/FindTimeSlots.tsx`)
- **Intelligent Search**: Available time slot discovery
- **Working Hours**: Clinic schedule integration
- **Conflict Avoidance**: Existing appointment checking
- **Professional Filtering**: Per-professional availability

### 4. Hooks and Utilities

#### useAvailability (`src/hooks/useAvailability.ts`)
- **Real-time Validation**: Appointment conflict checking
- **Working Hours**: Business hours validation
- **Professional Context**: Multi-professional support
- **Error Handling**: Graceful conflict reporting

## Google Calendar Integration

### Bidirectional Sync
**Location**: `server/calendar-routes.ts`

**Features**:
- **OAuth2 Authentication**: Secure Google account linking
- **Event Synchronization**: Two-way sync between systems
- **Conflict Detection**: Cross-platform availability checking
- **Token Management**: Automatic refresh handling

**Sync Process**:
1. User authenticates with Google OAuth2
2. System stores access/refresh tokens
3. Appointments auto-sync to Google Calendar
4. External events import as appointments
5. Real-time conflict detection across platforms

## Current Issues Identified

### 1. Schema Inconsistencies

#### Critical Type Mismatch
**Problem**: `user_id` field type inconsistency
- **Domain Schema**: `user_id: integer` (correct)
- **Shared Schema**: `user_id: integer` (minimal definition)
- **Types Interface**: `user_id: string` (incorrect)

**Impact**: Type conflicts in frontend/backend communication

**Correction**:
```typescript
// Fix in server/domains/appointments/appointments.types.ts
export interface Appointment {
  // Change from:
  user_id: string;
  // To:
  user_id: number;
}
```

#### Missing Fields in Shared Schema
**Problem**: Shared schema has minimal appointment definition
**Missing Fields**:
- `doctor_name`, `specialty`, `appointment_type`
- `duration_minutes`, `cancellation_reason`, `session_notes`
- `payment_status`, `payment_amount`
- `google_calendar_event_id`, `tag_id`

### 2. Business Logic Issues

#### Timezone Handling
**Problem**: Inconsistent timezone handling between frontend and backend
**Current Workaround**: Manual timezone normalization in service layer

**Correction**:
```typescript
// Implement consistent timezone handling
const createLocalDateTime = (date: string, time: string): Date => {
  return new Date(`${date}T${time}:00.000`);
};
```

#### Working Hours Validation
**Problem**: Hardcoded working hours in multiple places
**Solution**: Centralize clinic configuration usage

### 3. Performance Considerations

#### Large File Size
**Issue**: `consultas.tsx` is 1300+ lines
**Recommendation**: Refactor into smaller components:
- `CalendarGrid.tsx`
- `AppointmentList.tsx`
- `ProfessionalFilter.tsx`
- `AvailabilityChecker.tsx`

#### Query Optimization
**Current**: Multiple individual queries
**Recommendation**: Implement query batching and caching

## Recommended Corrections

### 1. Immediate Fixes

#### Fix Type Inconsistencies
```typescript
// server/domains/appointments/appointments.types.ts
export interface Appointment {
  id: number;
  contact_id: number;
  user_id: number; // Fix: Change from string to number
  clinic_id: number;
  doctor_name?: string;
  specialty?: string;
  appointment_type?: string;
  scheduled_date: Date;
  duration_minutes: number;
  status: string;
  payment_status: string;
  payment_amount?: number;
  session_notes?: string;
  created_at: Date;
  updated_at: Date;
  google_calendar_event_id?: string;
  tag_id?: number;
}
```

#### Update Shared Schema
```typescript
// shared/schema.ts - Expand appointments table definition
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  contact_id: integer("contact_id").notNull(),
  clinic_id: integer("clinic_id").notNull(),
  user_id: integer("user_id").notNull(),
  doctor_name: text("doctor_name"),
  specialty: text("specialty"),
  appointment_type: text("appointment_type"),
  scheduled_date: timestamp("scheduled_date"),
  duration_minutes: integer("duration_minutes").default(60),
  status: text("status").notNull(),
  cancellation_reason: text("cancellation_reason"),
  session_notes: text("session_notes"),
  payment_status: text("payment_status").default("pendente"),
  payment_amount: integer("payment_amount"),
  google_calendar_event_id: text("google_calendar_event_id"),
  tag_id: integer("tag_id"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});
```

### 2. Architecture Improvements

#### Component Refactoring
Break down large components:

```typescript
// src/components/calendar/CalendarGrid.tsx
export function CalendarGrid({ appointments, onAppointmentMove }) {
  // Calendar rendering logic
}

// src/components/calendar/AppointmentCard.tsx  
export function AppointmentCard({ appointment, onEdit, onDelete }) {
  // Individual appointment display
}

// src/hooks/useCalendarState.ts
export function useCalendarState() {
  // Calendar state management
}
```

#### Service Layer Enhancement
```typescript
// server/services/appointment-availability.service.ts
export class AppointmentAvailabilityService {
  async checkAvailability(params: AvailabilityParams): Promise<AvailabilityResult> {
    // Centralized availability logic
  }
  
  async findTimeSlots(params: TimeSlotParams): Promise<TimeSlot[]> {
    // Intelligent time slot discovery
  }
}
```

### 3. Performance Optimizations

#### Query Optimization
```typescript
// Implement appointment query optimization
const getOptimizedAppointments = async (clinicId: number, filters: AppointmentFilters) => {
  return db.select()
    .from(appointments)
    .leftJoin(contacts, eq(appointments.contact_id, contacts.id))
    .leftJoin(users, eq(appointments.user_id, users.id))
    .where(and(
      eq(appointments.clinic_id, clinicId),
      ...buildFilterConditions(filters)
    ))
    .orderBy(appointments.scheduled_date);
};
```

#### Caching Strategy
```typescript
// Implement Redis caching for frequent queries
const cacheKey = `appointments:${clinicId}:${dateRange}`;
const cachedResult = await redis.get(cacheKey);
if (cachedResult) return JSON.parse(cachedResult);
```

### 4. Testing Strategy

#### Unit Tests
```typescript
// tests/appointment-service.test.ts
describe('AppointmentService', () => {
  test('should detect scheduling conflicts', async () => {
    // Test conflict detection logic
  });
  
  test('should respect working hours', async () => {
    // Test working hours validation
  });
});
```

#### Integration Tests
```typescript
// tests/appointment-api.test.ts
describe('Appointment API', () => {
  test('should create appointment with valid data', async () => {
    // Test API endpoint
  });
});
```

## Multi-Tenant Considerations

### Security
- All queries filtered by `clinic_id`
- Professional access controls via `clinic_users` table
- API key authentication for external access

### Data Isolation
- Composite indexes ensure tenant isolation
- Professional filtering based on clinic membership
- Appointment visibility restricted by clinic context

## Deployment Considerations

### Database Migrations
```sql
-- Migration to add missing indexes
CREATE INDEX CONCURRENTLY idx_appointments_google_event 
ON appointments(google_calendar_event_id) 
WHERE google_calendar_event_id IS NOT NULL;

-- Migration to add tag relationship
ALTER TABLE appointments 
ADD CONSTRAINT fk_appointments_tag 
FOREIGN KEY (tag_id) REFERENCES appointment_tags(id);
```

### Environment Configuration
```env
# Google Calendar Integration
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri

# Database
DATABASE_URL=your_supabase_url
```

## Monitoring and Observability

### Key Metrics
- Appointment creation/update success rates
- Google Calendar sync success rates
- Availability check response times
- Conflict detection accuracy

### Logging
- Structured logging for appointment operations
- Error tracking for sync failures
- Performance monitoring for large queries

## 📋 Checklist para Sistema de Calendário 100% Funcional (Backend/Database Focus)

### **🔍 ANÁLISE ATUAL DO SISTEMA**

#### **Estado Real Identificado:**
- ✅ **Servidor Principal**: `production-server.js` (Domain System v2.0.0) está ativo
- ✅ **Schema Real**: Tabela `appointments` tem 19 campos completos no domain schema
- ✅ **Frontend**: `src/pages/consultas.tsx` (3278 linhas) está funcional
- ⚠️ **Inconsistência**: `shared/schema.ts` tem definição mínima (7 campos apenas)
- ⚠️ **Tipo Mismatch**: `user_id` como string no types vs integer no schema
- ⚠️ **Queries Incompletas**: TanStack Query sem `queryFn` em alguns casos

---

### 🔧 **1. CORREÇÕES CRÍTICAS IMEDIATAS**

#### **Backend - Inconsistências de Schema**
- [ ] **Corrigir shared/schema.ts para refletir schema real**
  ```typescript
  // shared/schema.ts - Expandir para campos completos
  export const appointments = pgTable("appointments", {
    id: serial("id").primaryKey(),
    contact_id: integer("contact_id").notNull(),
    clinic_id: integer("clinic_id").notNull(),
    user_id: integer("user_id").notNull(),
    doctor_name: text("doctor_name"),
    specialty: text("specialty"),
    appointment_type: text("appointment_type"),
    scheduled_date: timestamp("scheduled_date"),
    duration_minutes: integer("duration_minutes").default(60),
    status: text("status").notNull(),
    cancellation_reason: text("cancellation_reason"),
    session_notes: text("session_notes"),
    payment_status: text("payment_status").default("pendente"),
    payment_amount: integer("payment_amount"),
    google_calendar_event_id: text("google_calendar_event_id"),
    tag_id: integer("tag_id"),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
  });
  ```

- [ ] **Corrigir inconsistência de tipos user_id**
  ```typescript
  // server/domains/appointments/appointments.types.ts
  user_id: number; // Fix: Change from string to number
  ```

- [ ] **Validar se production-server.js está realmente usando domain system**
  - Confirmar se `/api/appointments` está roteando para AppointmentsController
  - Testar se middleware de autenticação está funcionando
  - Verificar se storage factory está inicializando corretamente

#### **Frontend - Queries Malformadas**
- [ ] **Corrigir queries TanStack Query sem queryFn**
  ```typescript
  // Encontrado em consultas.tsx - linha ~722
  const { data: clinicUsers = [] } = useQuery({
    queryKey: ['/api/clinic/1/users/management'],
    queryFn: async () => {
      const response = await fetch('/api/clinic/1/users/management');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });
  ```

### 🏗️ **2. VALIDAÇÃO DE ARQUITETURA BACKEND**

#### **Domain System Verification**
- [ ] **Confirmar se AppointmentsService está sendo usado**
  - Verificar se métodos do service estão implementados
  - Testar se repository está conectado ao storage
  - Validar se controller está recebendo requests

- [ ] **Testar endpoints críticos**
  ```bash
  # Testes essenciais
  GET /api/appointments?clinic_id=1
  POST /api/appointments
  PUT /api/appointments/:id
  DELETE /api/appointments/:id
  POST /api/appointments/availability/check
  ```

#### **Database Schema Validation**
- [ ] **Confirmar schema real no banco**
  ```sql
  -- Verificar estrutura real da tabela
  SELECT column_name, data_type, is_nullable 
  FROM information_schema.columns 
  WHERE table_name = 'appointments';
  ```

- [ ] **Validar índices existentes**
  ```sql
  -- Verificar índices da tabela appointments
  SELECT indexname, indexdef 
  FROM pg_indexes 
  WHERE tablename = 'appointments';
  ```

### 🎯 **3. FUNCIONALIDADES ESSENCIAIS**

#### **Sistema de Disponibilidade**
- [ ] **Testar verificação de conflitos**
  - Validar se `checkAvailability` está funcionando
  - Confirmar se timezone handling está correto
  - Testar cenários de double booking

- [ ] **Validar time slot generation**
  - Confirmar se `findAvailableTimeSlots` retorna slots corretos
  - Testar horários de funcionamento
  - Validar intervalos de almoço

#### **Multi-tenant Isolation**
- [ ] **Testar isolamento por clinic_id**
  - Confirmar se queries filtram por clinic_id
  - Validar se usuários só veem dados da própria clínica
  - Testar se middleware de tenant isolation está ativo

### 🔄 **4. INTEGRAÇÃO FRONTEND-BACKEND**

#### **API Communication**
- [ ] **Testar todas as operações CRUD**
  - Create: Criar novo agendamento
  - Read: Listar agendamentos
  - Update: Editar agendamento existente
  - Delete: Remover agendamento

- [ ] **Validar error handling**
  - Testar cenários de erro 400/500
  - Confirmar se mensagens de erro são claras
  - Validar se loading states funcionam

### 🔧 **5. OTIMIZAÇÃO DE PERFORMANCE**

#### **Database Performance**
- [ ] **Implementar índices otimizados**
  ```sql
  -- Índices críticos para performance
  CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date_status 
  ON appointments(clinic_id, scheduled_date, status);
  
  CREATE INDEX IF NOT EXISTS idx_appointments_user_date 
  ON appointments(user_id, scheduled_date);
  ```

#### **Frontend Performance**
- [ ] **Otimizar componente consultas.tsx**
  - Quebrar arquivo de 3278 linhas em componentes menores
  - Implementar `useMemo` para cálculos pesados
  - Adicionar `useCallback` para funções

### 🧪 **6. TESTES E VALIDAÇÃO**

#### **Testes Backend**
- [ ] **Testar services e controllers**
  - Unit tests para AppointmentsService
  - Integration tests para endpoints
  - Testes de cenários de erro

#### **Testes Frontend**
- [ ] **Testar componentes críticos**
  - Formulário de agendamento
  - Calendário de visualização
  - Filtros e buscas

### 📊 **7. MONITORAMENTO E OBSERVABILIDADE**

#### **Logging e Monitoring**
- [ ] **Implementar logging estruturado**
  - Logs de performance para queries lentas
  - Tracking de erros com stack traces
  - Métricas de uso por endpoint

#### **Health checks**
- [ ] **Endpoint `/health` funcionando**
  - Verificação de conectividade com Supabase
  - Status de serviços críticos
  - Métricas de performance

---

## 🎯 **PRIORIZAÇÃO DAS TAREFAS**

### **Fase 1 - CRÍTICO (Semana 1)**
1. ✅ Corrigir shared/schema.ts
2. ✅ Corrigir tipos user_id
3. ✅ Validar production-server.js
4. ✅ Corrigir queries TanStack Query

### **Fase 2 - ESSENCIAL (Semana 2)**
1. ✅ Testar endpoints críticos
2. ✅ Validar storage factory
3. ✅ Confirmar schema do banco
4. ✅ Testar operações CRUD

### **Fase 3 - IMPORTANTE (Semana 3)**
1. ✅ Sistema de disponibilidade
2. ✅ Multi-tenant isolation
3. ✅ Performance optimization
4. ✅ Error handling

---

## 🔍 **CRITÉRIOS DE ACEITAÇÃO**

### **Sistema 100% Funcional significa:**
- ✅ Todas as operações CRUD funcionando sem erros
- ✅ Verificação de conflitos precisa e confiável
- ✅ Performance < 2s para operações críticas
- ✅ Zero data loss em operações
- ✅ Multi-tenant isolation garantido
- ✅ Frontend-backend integration estável
- ✅ Error handling robusto
- ✅ Logging e monitoring ativos
  ```typescript
  // server/domains/calendar/working-hours.service.ts
  export class WorkingHoursService {
    async isWorkingDay(date: Date, clinicId: number): Promise<boolean>
    async isWorkingHour(time: string, date: Date, clinicId: number): Promise<boolean>
    async isLunchTime(time: string, date: Date, clinicId: number): Promise<boolean>
    async getAvailableHours(date: Date, clinicId: number, userId?: number): Promise<string[]>
  }
  ```

### 🔄 **4. Integração de Dados e Multi-tenant**

#### Multi-tenant Consistency
- [ ] **Garantir uso consistente de user_id**
  ```typescript
  // Verificar em todos os endpoints:
  // ✅ SEMPRE usar user_id (não clinic_user_id)
  // ✅ Filtros de profissionais usam user_id
  // ✅ Criação de consultas usa user_id
  // ✅ Validação de acesso por clínica
  ```

- [ ] **Implementar middleware de isolamento**
  ```typescript
  // server/middleware/tenant-isolation.middleware.ts
  export const ensureClinicAccess = (req: Request, res: Response, next: NextFunction) => {
    const clinicId = extractClinicId(req);
    const userId = req.user?.id;
    
    if (!hasClinicAccess(userId, clinicId)) {
      return res.status(403).json({ error: 'Access denied to clinic' });
    }
    
    next();
  };
  ```

#### API Optimization
- [ ] **Implementar endpoint consolidado**
  ```typescript
  // server/domains/calendar/calendar.controller.ts
  async getCalendarData(req: Request, res: Response) {
    const { clinic_id, start_date, end_date, user_id } = req.query;
    
    const [appointments, professionals, config] = await Promise.all([
      this.appointmentService.getByDateRange(clinic_id, start_date, end_date),
      this.userService.getProfessionalsByClinic(clinic_id),
      this.calendarService.getClinicConfig(clinic_id)
    ]);
    
    res.json({ appointments, professionals, config });
  }
  ```

- [ ] **Implementar cache estratégico no backend**
  ```typescript
  // server/services/calendar-cache.service.ts
  export class CalendarCacheService {
    async getAppointments(key: string, fetcher: () => Promise<Appointment[]>): Promise<Appointment[]>
    async getProfessionals(clinicId: number): Promise<Professional[]>
    async getClinicConfig(clinicId: number): Promise<ClinicConfig>
    async invalidateCalendarData(clinicId: number): Promise<void>
  }
  ```

### 💾 **5. Database Optimization**

#### Índices Específicos
- [ ] **Adicionar índices para performance do calendário**
  ```sql
  -- Índices para consultas do calendário
  CREATE INDEX CONCURRENTLY idx_appointments_calendar_view 
  ON appointments(clinic_id, scheduled_date, user_id);
  
  CREATE INDEX CONCURRENTLY idx_appointments_availability_check 
  ON appointments(clinic_id, scheduled_date, scheduled_time, duration_minutes);
  
  CREATE INDEX CONCURRENTLY idx_appointments_date_range 
  ON appointments(clinic_id, scheduled_date) 
  WHERE status != 'cancelada';
  
  CREATE INDEX CONCURRENTLY idx_clinic_users_professionals 
  ON clinic_users(clinic_id, user_id) 
  WHERE is_professional = true AND is_active = true;
  ```

#### Query Optimization
- [ ] **Otimizar queries críticas**
  ```typescript
  // Otimizar query de busca de consultas
  const getAppointmentsByDateRange = async (clinicId: number, startDate: Date, endDate: Date) => {
    return db.select({
      id: appointments.id,
      contact_id: appointments.contact_id,
      user_id: appointments.user_id,
      scheduled_date: appointments.scheduled_date,
      duration_minutes: appointments.duration_minutes,
      status: appointments.status,
      contact_name: contacts.name,
      professional_name: users.name
    })
    .from(appointments)
    .leftJoin(contacts, eq(appointments.contact_id, contacts.id))
    .leftJoin(users, eq(appointments.user_id, users.id))
    .where(and(
      eq(appointments.clinic_id, clinicId),
      gte(appointments.scheduled_date, startDate),
      lte(appointments.scheduled_date, endDate),
      ne(appointments.status, 'cancelada')
    ))
    .orderBy(appointments.scheduled_date);
  };
  ```

#### Schema Migrations
- [ ] **Executar migrações necessárias**
  ```sql
  -- Adicionar campos faltantes se não existirem
  ALTER TABLE appointments 
  ADD COLUMN IF NOT EXISTS scheduled_time TIME,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS appointment_type TEXT,
  ADD COLUMN IF NOT EXISTS tag_id INTEGER REFERENCES appointment_tags(id);
  
  -- Normalizar dados existentes
  UPDATE appointments 
  SET duration_minutes = 60 
  WHERE duration_minutes IS NULL;
  ```

### 🧪 **6. Testes Backend**

#### Testes de Serviços
- [ ] **Testar serviços principais**
  ```typescript
  // tests/services/
  ├── appointment.service.test.ts
  ├── availability.service.test.ts
  ├── calendar.service.test.ts
  └── working-hours.service.test.ts
  ```

#### Testes de API
- [ ] **Testar endpoints críticos**
  ```typescript
  // tests/api/
  ├── appointments.controller.test.ts
  ├── calendar.controller.test.ts
  ├── availability.endpoints.test.ts
  └── multi-tenant.isolation.test.ts
  ```

#### Testes de Database
- [ ] **Testar queries e performance**
  ```typescript
  // tests/database/
  ├── appointment.repository.test.ts
  ├── calendar.repository.test.ts
  ├── query.performance.test.ts
  └── index.efficiency.test.ts
  ```

### 📊 **7. Monitoramento Backend**

#### Logging Estruturado
- [ ] **Implementar logs específicos**
  ```typescript
  // server/services/calendar-logger.service.ts
  export class CalendarLoggerService {
    logAppointmentCreation(appointment: Appointment, userId: number): void
    logAvailabilityCheck(params: AvailabilityParams, result: AvailabilityResult): void
    logPerformanceMetrics(operation: string, duration: number): void
    logMultiTenantAccess(clinicId: number, userId: number, action: string): void
  }
  ```

#### Performance Monitoring
- [ ] **Monitorar métricas críticas**
  ```typescript
  // Métricas a monitorar:
  // - Tempo de resposta dos endpoints de calendário
  // - Performance de queries de disponibilidade
  // - Cache hit/miss ratios
  // - Isolamento multi-tenant
  // - Database connection pool usage
  ```

### 🚀 **8. Deploy e Configuração**

#### Environment Variables
- [ ] **Configurar variáveis específicas**
  ```env
  # Database
  DATABASE_MAX_CONNECTIONS=20
  DATABASE_IDLE_TIMEOUT=30000
  
  # Cache
  REDIS_CALENDAR_TTL=300
  REDIS_AVAILABILITY_TTL=60
  
  # Calendar
  DEFAULT_APPOINTMENT_DURATION=60
  CALENDAR_TIMEZONE=America/Sao_Paulo
  ```

#### Health Checks
- [ ] **Implementar health checks específicos**
  ```typescript
  // server/health/calendar.health.ts
  export class CalendarHealthCheck {
    async checkDatabaseConnection(): Promise<HealthStatus>
    async checkAppointmentQueries(): Promise<HealthStatus>
    async checkAvailabilityService(): Promise<HealthStatus>
    async checkMultiTenantIsolation(): Promise<HealthStatus>
  }
  ```

### ✅ **9. Critérios de Aceitação Backend**

#### Funcionalidade
- [ ] ✅ Todos os endpoints retornam dados corretos
- [ ] ✅ Verificação de disponibilidade funciona precisamente
- [ ] ✅ CRUD de consultas funciona sem erros
- [ ] ✅ Filtros multi-tenant funcionam corretamente
- [ ] ✅ Configurações da clínica são respeitadas

#### Performance
- [ ] ✅ Queries de calendário < 500ms
- [ ] ✅ Availability check < 200ms
- [ ] ✅ Suporta 100+ consultas simultâneas
- [ ] ✅ Cache funciona efetivamente
- [ ] ✅ Índices otimizam queries críticas

#### Segurança
- [ ] ✅ Isolamento multi-tenant funciona
- [ ] ✅ Validação de acesso por clínica
- [ ] ✅ Sanitização de dados de entrada
- [ ] ✅ Logs de auditoria funcionando

### 🎯 **10. Roadmap de Implementação**

#### Semana 1 - Correções Críticas
- [ ] Corrigir tipos e schemas
- [ ] Validar conectividade API
- [ ] Migrar endpoints críticos para domains

#### Semana 2 - Serviços Backend
- [ ] Implementar CalendarService completo
- [ ] Implementar AvailabilityService
- [ ] Otimizar AppointmentService

#### Semana 3 - Database e Performance
- [ ] Adicionar índices otimizados
- [ ] Implementar cache estratégico
- [ ] Otimizar queries críticas

#### Semana 4 - Testes e Deploy
- [ ] Testes abrangentes de backend
- [ ] Monitoramento e logging
- [ ] Deploy e configuração final

---

## Conclusion

O sistema de calendário tem uma base sólida mas precisa das correções e melhorias listadas acima para estar 100% funcional. A arquitetura atual fornece uma excelente fundação para implementar essas melhorias de forma incremental e testável.

**Prioridade Máxima**: Itens marcados como "Correções Críticas Imediatas" devem ser implementados primeiro para garantir estabilidade básica.

**Status Atual**: ~70% funcional - Precisa das correções listadas para atingir 100% de funcionalidade. 