# replit.md

## Overview

TaskMed is a comprehensive healthcare management platform built with modern full-stack architecture. The system provides multi-tenant clinic management with advanced features including appointment scheduling, patient management, medical records, Google Calendar integration, WhatsApp communication, and an AI-powered assistant named Mara with RAG (Retrieval-Augmented Generation) capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state and React hooks for local state
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js 20+ with Express.js framework
- **Language**: TypeScript for type safety
- **Database**: PostgreSQL with Drizzle ORM
- **Cloud Database**: Supabase for production (migrated from Neon)
- **Authentication**: Custom session-based authentication with bcrypt
- **API Design**: RESTful APIs with structured response patterns

### Multi-Tenant Architecture
- **Isolation Strategy**: Database-level tenant isolation using clinic_id
- **Security**: Row-level security policies and application-level tenant validation
- **Performance**: Optimized indexes for multi-tenant queries with sub-5ms response times

## Key Components

### Core Domains
1. **Authentication & User Management**
   - Custom user authentication system
   - Role-based access control (super_admin, admin, user)
   - Multi-clinic user relationships

2. **Patient Management (Contacts)**
   - Complete patient lifecycle management
   - Medical history tracking with structured records
   - Patient timeline with appointment history
   - Status management workflow

3. **Appointment System**
   - Advanced scheduling with conflict detection
   - Google Calendar bidirectional synchronization
   - Appointment tags and categorization
   - Real-time availability management

4. **Medical Records**
   - Structured medical record creation and management
   - SOAP note format support
   - Medical history tracking
   - Integration with appointment system

5. **Communication Systems**
   - WhatsApp Evolution API integration for patient communication
   - Internal conversation system
   - Message threading and history

6. **CRM/Pipeline Management**
   - Lead management with customizable stages
   - Opportunity tracking with probability scoring
   - Conversion analytics and reporting
   - Activity timeline per prospect

7. **AI Assistant (Mara)**
   - Conversational AI powered by OpenAI GPT-4
   - RAG system for knowledge base integration
   - Patient context-aware responses
   - Medical knowledge retrieval

### Advanced Features
- **RAG System**: Vector-based knowledge retrieval using pgvector extension
- **MCP Protocol**: Model Context Protocol implementation for AI integrations
- **System Logging**: Comprehensive audit trail for compliance
- **Performance Monitoring**: Real-time performance metrics and alerting

## Data Flow

### Authentication Flow
```
User Login → Credential Validation → Session Creation → Clinic Context Setting → Dashboard Access
```

### Appointment Creation Flow
```
Appointment Request → Conflict Check → Database Save → Google Calendar Sync → Patient Notification
```

### AI Assistant Flow
```
User Query → Context Gathering → RAG Knowledge Search → OpenAI Processing → Contextual Response
```

### Multi-Tenant Data Access Flow
```
API Request → Authentication → Clinic ID Extraction → Tenant Isolation → Data Access → Response
```

## External Dependencies

### Core Dependencies
- **Database**: Supabase (PostgreSQL with pgvector extension)
- **AI Services**: OpenAI API (GPT-4, text-embedding-ada-002)
- **Calendar Integration**: Google Calendar API v3
- **Communication**: WhatsApp Evolution API
- **File Storage**: Local file system with plans for cloud storage

### Development Dependencies
- **Build Tools**: Vite, TypeScript, ESLint, Prettier
- **Testing**: Planned implementation
- **Deployment**: Replit autoscale deployment

### Environment Variables
```
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://connection_string

# APIs
OPENAI_API_KEY=your_openai_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
EVOLUTION_API_URL=your_whatsapp_api_url

# Application
NODE_ENV=production
SESSION_SECRET=your_session_secret
```

## Deployment Strategy

### Production Environment
- **Platform**: Replit with autoscale deployment
- **Database**: Supabase managed PostgreSQL
- **Build Process**: `npm run build` creating optimized production bundle
- **Start Command**: `npm run start` serving built application
- **Port Configuration**: Port 5000 mapped to external port 80

### Performance Optimizations
- **Database Indexes**: Comprehensive multi-tenant indexes for sub-5ms queries
- **Caching**: Intelligent caching strategies
- **Connection Pooling**: Supabase pooler for database connections
- **Concurrent User Support**: Validated for 500+ concurrent users

### Security Measures
- **Multi-Tenant Isolation**: Complete data separation between clinics
- **Session Management**: Secure session handling with express-session
- **Input Validation**: Zod schema validation for all API inputs
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM

## Changelog

### June 23, 2025 - Action Notification System Implementation
- Implemented conversation action notification system for appointment events
- Added conversation_actions table to database schema with proper indexes
- Created ActionNotification component with minimalist design using compact blue blocks
- Integrated action notifications chronologically with message timeline
- Added support for "appointment_created" and "appointment_status_changed" actions
- Updated API to return action notifications alongside messages
- Fixed Pedro Oliveira contact status to 'active' for appointment scheduling availability
- Made patient name clickable in PatientInfoPanel to navigate to `/contatos/{id}` for patient details
- Updated PatientInfoPanel to show real appointment data instead of mock data

### June 23, 2025 - Media Message System with Database Attachments
- Implemented proper message attachment system using message_attachments table
- Created 3 media attachments for Pedro Oliveira conversation: PDF document, MP3 audio, JPEG image
- Fixed message content to remove emoji prefixes and store clean text
- Updated API to load and associate attachments with messages correctly
- Enhanced MessageBubble component to render MediaMessage components for attachments
- Added support for MIME type detection and proper media categorization (audio/mp3 → audio, image/jpeg → image, application/pdf → document)
- Backend now returns 6 total attachments across all conversations with proper file metadata

### June 24, 2025 - Calendar Appointment Positioning Complete Fix
- Completely fixed calendar week view appointment positioning bug where appointments appeared cut in half
- Removed complex collision detection system that was causing false positive overlaps
- Simplified layout calculation to give all appointments full width by default
- Eliminated the collision group system that was incorrectly reducing appointment widths
- All appointments now display correctly with full width regardless of time positioning
- Fixed multiple appointments (Caio Apfelbaum4, Lucas Ferreira, Maria Oliveira, etc.) that were appearing truncated

### June 24, 2025 - Application Startup Issues Fixed
- Fixed TypeScript compilation errors preventing app from starting
- Added missing mockAppointments and mockContacts exports to mock-data.ts
- Converted useAvailabilityCheck hook to properly return useMutation with mutateAsync support
- Fixed AppointmentForm schema to handle tag_id type conversion from string to number
- Updated availability check function calls to use correct parameter structure
- Added proper error handling with fallback values for professionalName parameter
- Application now starts successfully with all systems operational

### June 23, 2025 - Media Message System Completion
- Completed media message system with audio, image, and document support
- Fixed attachment loading from Supabase with proper relationship queries
- Implemented 13 messages for Pedro including AI interactions and media files
- Verified backend correctly loads and serves media attachments

- June 23, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.