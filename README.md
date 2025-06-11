# Taskmed Healthcare Management Platform

A comprehensive multi-tenant healthcare management platform leveraging AI to streamline patient interactions and clinic operations across multiple medical specialties.

## Technology Stack

### Frontend
- **React.js 18** with TypeScript
- **Vite** for development and bundling
- **TailwindCSS** with shadcn/ui components
- **Wouter** for client-side routing
- **TanStack Query** for data fetching and state management
- **React Hook Form** with Zod validation
- **Framer Motion** for animations

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Drizzle ORM** for database operations
- **PostgreSQL** for production data storage
- **Passport.js** for authentication
- **Express Session** for session management

### External Integrations
- **Asaas API** for payment processing (PIX, Credit Card, Boleto)
- **Anthropic Claude** for AI assistant functionality
- **WhatsApp API** for patient communication (planned)

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/        # shadcn/ui component library
│   │   │   ├── Header.tsx
│   │   │   ├── Layout.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions and configurations
│   │   ├── pages/         # Route components
│   │   ├── App.tsx        # Main application component
│   │   ├── index.css      # Global styles
│   │   └── main.tsx       # Application entry point
│   └── index.html
├── server/                # Backend Express application
│   ├── asaas-service.ts   # Asaas payment integration
│   ├── auth.ts            # Authentication middleware
│   ├── db.ts              # Database connection
│   ├── index.ts           # Server entry point
│   ├── postgres-storage.ts # PostgreSQL data layer
│   ├── routes.ts          # API route definitions
│   └── storage.ts         # Storage interface
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema and types
└── Configuration files
```

## Core Architecture Principles

### 1. Multi-Tenant Design
- Each clinic operates as an isolated tenant
- Data isolation enforced at the database level
- Clinic-specific configurations and settings

### 2. Modular Structure
The system is organized into distinct modules:

#### Dashboard Module
- Overview metrics and KPIs
- Recent activity summaries
- Quick access to key functions

#### Contact Management Module
- Patient registration and profiles
- Medical history tracking
- Contact interaction logs
- Detailed patient view with tabs for medical records, appointments, AI chat, and pipeline

#### Appointment System Module
- Appointment scheduling and management
- Doctor assignment and specialty tracking
- Payment status integration
- Session notes and follow-up recommendations

#### Financial Module (Professional Fintech Structure)
- **Customer Management**: Patient billing profiles
- **Charge Management**: Payment requests and invoicing
- **Subscription Management**: Recurring payment plans
- **Transaction Tracking**: Financial movement logs
- **Reporting**: Revenue analytics and financial insights
- **Asaas Integration**: Real payment processing

#### Pipeline/CRM Module
- Sales funnel management
- Opportunity tracking
- Activity logging
- Stage progression monitoring

#### AI Assistant Module (Mara)
- Patient-specific chat interface
- Context-aware responses using patient history
- Integration with medical records

#### Configuration Module
- Clinic settings management
- User permissions and roles
- AI template customization

### 3. Data Storage Strategy

#### Production Data (PostgreSQL)
- User accounts and authentication
- Clinic information and settings
- Patient contacts and medical records
- Appointments and scheduling
- Financial transactions and billing
- Pipeline and CRM data

#### Mock Data (In-Memory)
- Conversations and messaging (placeholder)
- Some dashboard metrics (demonstration)

## Database Schema Overview

### Core Tables

#### Users & Clinics
```sql
users                    # System users
clinics                  # Clinic organizations
clinic_users            # User-clinic relationships
clinic_invitations      # Invitation management
```

#### Patient Management
```sql
contacts                 # Patient profiles and information
appointments            # Appointment scheduling
analytics_metrics       # Performance tracking
```

#### Financial System
```sql
customers               # Billing customer profiles
charges                 # Payment requests and invoices
subscriptions           # Recurring payment plans
payments                # Completed payment records
financial_transactions  # All financial movements
financial_reports       # Generated financial reports
```

#### CRM/Pipeline
```sql
pipeline_stages         # Sales funnel stages
pipeline_opportunities  # Sales opportunities
pipeline_history        # Stage change tracking
pipeline_activities     # Activity logging
```

#### Configuration
```sql
clinic_settings         # Clinic-specific configurations
ai_templates           # AI response templates
```

## Authentication & Security

### Authentication Flow
1. Email/password authentication using Passport.js
2. Session-based authentication with secure cookies
3. Clinic-level access control and permissions
4. Role-based authorization system

### Security Measures
- Password hashing with bcrypt
- Session encryption and secure storage
- Clinic data isolation
- API endpoint protection with middleware

## API Structure

### Authentication Endpoints
```
POST /api/register       # User registration
POST /api/login          # User authentication
POST /api/logout         # Session termination
GET  /api/user           # Current user information
```

### Contact Management
```
GET    /api/contacts              # List clinic contacts
POST   /api/contacts              # Create new contact
GET    /api/contacts/:id          # Get contact details
PUT    /api/contacts/:id          # Update contact
GET    /api/contacts/:id/appointments # Contact appointments
```

### Appointment System
```
GET    /api/appointments          # List appointments
POST   /api/appointments          # Create appointment
GET    /api/appointments/:id      # Get appointment
PUT    /api/appointments/:id      # Update appointment
```

### Financial Module
```
GET    /api/financial/dashboard   # Financial overview
GET    /api/financial/customers   # Billing customers
POST   /api/financial/customers   # Create customer
GET    /api/financial/charges     # Payment charges
POST   /api/financial/charges     # Create charge
GET    /api/financial/transactions # Financial transactions
POST   /api/financial/transactions # Record transaction
GET    /api/financial/subscriptions # Recurring subscriptions
POST   /api/financial/subscriptions # Create subscription
```

### Pipeline/CRM
```
GET    /api/pipeline/stages       # Pipeline stages
POST   /api/pipeline/stages       # Create stage
GET    /api/pipeline/opportunities # Opportunities
POST   /api/pipeline/opportunities # Create opportunity
PUT    /api/pipeline/opportunities/:id/stage # Move stage
```

## Development Guidelines

### Frontend Development

#### Component Structure
- Use functional components with hooks
- Implement proper TypeScript typing
- Follow shadcn/ui design patterns
- Utilize TanStack Query for data fetching

#### State Management
- Local state with React hooks
- Server state with TanStack Query
- Form state with React Hook Form
- Global UI state minimized

#### Routing
- File-based routing with Wouter
- Protected routes with authentication
- Dynamic route parameters for entity details

### Backend Development

#### Database Operations
- Use Drizzle ORM for type-safe database queries
- Implement proper error handling
- Follow the IStorage interface pattern
- Maintain data isolation between clinics

#### API Design
- RESTful endpoint conventions
- Consistent error response format
- Proper HTTP status codes
- Request validation with Zod schemas

#### Authentication Middleware
```typescript
// Protect routes requiring authentication
app.get('/api/protected', isAuthenticated, handler);

// Protect routes requiring clinic access
app.get('/api/clinic-data', isAuthenticated, hasClinicAccess(), handler);
```

## Environment Configuration

### Required Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database
PGHOST=localhost
PGPORT=5432
PGUSER=username
PGPASSWORD=password
PGDATABASE=database_name

# Session Security
SESSION_SECRET=your-secure-session-secret

# External APIs
ASAAS_API_KEY=your-asaas-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Application
NODE_ENV=development|production
```

## Development Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn package manager

### Installation
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npm run db:push

# Start development server
npm run dev
```

### Database Management
```bash
# Push schema changes to database
npm run db:push

# Generate and run migrations (if needed)
npm run db:generate
npm run db:migrate
```

## Testing Strategy

### Frontend Testing
- Component testing with React Testing Library
- Integration testing for user workflows
- E2E testing for critical paths

### Backend Testing
- Unit testing for business logic
- Integration testing for API endpoints
- Database testing with test fixtures

## Deployment Considerations

### Production Database
- PostgreSQL with proper indexing
- Regular backups and monitoring
- Connection pooling for performance

### Security
- HTTPS enforcement
- Environment variable security
- Regular dependency updates
- API rate limiting

### Performance
- Database query optimization
- Frontend code splitting
- CDN for static assets
- Server-side caching where appropriate

## External API Integrations

### Asaas Payment Processing
- Sandbox environment for development
- Production environment for live payments
- Webhook handling for payment status updates
- Support for PIX, Credit Card, and Boleto payments

### Anthropic Claude AI
- Context-aware patient interactions
- Medical history integration
- Configurable response templates
- Usage monitoring and limits

## Troubleshooting Common Issues

### Database Connection Issues
- Verify PostgreSQL service is running
- Check environment variables
- Confirm network connectivity
- Review connection pool settings

### Authentication Problems
- Verify session configuration
- Check cookie settings
- Confirm password hashing
- Review middleware order

### API Integration Failures
- Validate API keys
- Check network connectivity
- Review rate limiting
- Confirm request format

## Contributing Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write descriptive commit messages
- Include proper JSDoc comments

### Pull Request Process
1. Create feature branch from main
2. Implement changes with tests
3. Update documentation if needed
4. Submit PR with clear description
5. Address review feedback

### Documentation Updates
- Keep README current with changes
- Update API documentation
- Include migration notes for breaking changes
- Document new environment variables

This documentation provides a comprehensive foundation for developers to understand and contribute to the Taskmed healthcare management platform.