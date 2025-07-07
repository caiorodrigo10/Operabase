# Arquitetura do Frontend - Operabase

## 📋 Visão Geral

Este documento descreve a arquitetura completa do frontend da Operabase, um sistema de gestão para clínicas médicas construído com **React 18**, **Vite**, **TypeScript**, **TanStack Query** e **Tailwind CSS**.

## 🌐 Conectividade Frontend-Backend

### Arquitetura de Deploy
- **Frontend**: Vercel (HTTPS) - `https://operabase.vercel.app`
- **Backend**: AWS Elastic Beanstalk (HTTP) - `http://operabase-backend-mvp-env-1.sa-east-1.elasticbeanstalk.com`
- **Proxy System**: Vercel proxies para resolver Mixed Content Error

### Problema Resolvido: Mixed Content Error

#### 🚨 Problema Original
```javascript
// ❌ ERRO: HTTPS → HTTP bloqueado pelo navegador
fetch('http://operabase-backend-mvp-env-1.sa-east-1.elasticbeanstalk.com/api/appointments')
// SecurityError: Mixed Content: The page was loaded over HTTPS, but requested an insecure HTTP resource
```

#### ✅ Solução: Sistema de Proxy HTTPS
```javascript
// ✅ SOLUÇÃO: HTTPS → HTTPS Proxy → HTTP Backend
fetch('/api/appointments') // Roteado via proxy Vercel
```

## 🏗️ Stack Tecnológico

### Core Technologies
- **Runtime**: Node.js 18.x
- **Build Tool**: Vite 5.4.19
- **Framework**: React 18.x
- **Language**: TypeScript 5.x
- **State Management**: TanStack Query v4
- **Styling**: Tailwind CSS 3.x
- **UI Components**: Shadcn/UI + Radix UI
- **Routing**: React Router DOM v6

### Development Tools
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Hot Reload**: Vite HMR
- **Package Manager**: npm/pnpm

## 🏗️ Estrutura de Diretórios

```
src/
├── components/                # Componentes reutilizáveis
│   ├── ui/                   # Componentes base (Shadcn/UI)
│   ├── features/             # Componentes específicos por feature
│   ├── editor2/              # Sistema de editor visual
│   └── [shared components]   # Componentes compartilhados
├── contexts/                 # React Contexts
├── hooks/                    # Custom hooks
├── lib/                      # Utilitários e configurações
├── pages/                    # Páginas da aplicação
├── stores/                   # Zustand stores
├── types/                    # Definições TypeScript
├── utils/                    # Funções utilitárias
└── styles/                   # Estilos globais
```

## 🔌 Sistema de Conectividade

### API Client Configuration

#### buildApiUrl() - Roteamento Inteligente
```typescript
// src/lib/api.ts
function buildApiUrl(endpoint: string): string {
  // Desenvolvimento: usar proxy do Vite
  if (import.meta.env.DEV) {
    return `/api${endpoint}`;
  }
  
  // Produção: SEMPRE usar proxy do Vercel
  // Isso previne Mixed Content Error forçando HTTPS
  return `/api${endpoint}`;
}
```

#### Configuração de Ambiente
```typescript
// vite.config.ts - Proxy para desenvolvimento
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
```

### Sistema de Fetch Padronizado

#### API Base Functions
```typescript
// src/lib/api.ts
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(endpoint);
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Funções específicas por domínio
export const appointmentsApi = {
  getAll: (clinicId: number) => 
    apiRequest<Appointment[]>(`/appointments?clinic_id=${clinicId}`),
  
  create: (data: CreateAppointmentData) =>
    apiRequest<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  update: (id: number, data: UpdateAppointmentData) =>
    apiRequest<Appointment>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
};

export const contactsApi = {
  getAll: (clinicId: number) =>
    apiRequest<Contact[]>(`/contacts?clinic_id=${clinicId}`),
    
  create: (data: CreateContactData) =>
    apiRequest<Contact>('/contacts', {
      method: 'POST',
      body: JSON.stringify(data)
    })
};
```

## 🔄 Gerenciamento de Estado

### TanStack Query Configuration

#### Query Client Setup
```typescript
// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Rotas da aplicação */}
        </Routes>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

#### Custom Hooks por Domínio

##### Appointments Hooks
```typescript
// src/hooks/useAppointments.ts
export function useAppointments(clinicId: number) {
  return useQuery({
    queryKey: ['appointments', clinicId],
    queryFn: () => appointmentsApi.getAll(clinicId),
    enabled: !!clinicId,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAppointmentData }) =>
      appointmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
```

##### Contacts Hooks
```typescript
// src/hooks/useContacts.ts
export function useContacts(clinicId: number) {
  return useQuery({
    queryKey: ['contacts', clinicId],
    queryFn: () => contactsApi.getAll(clinicId),
    enabled: !!clinicId,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: contactsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
```

### Zustand Stores

#### Editor Store
```typescript
// src/stores/editor2Store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface EditorState {
  selectedComponent: string | null;
  pageData: any;
  isDragging: boolean;
  
  // Actions
  setSelectedComponent: (id: string | null) => void;
  updatePageData: (data: any) => void;
  setDragging: (isDragging: boolean) => void;
}

export const useEditor2Store = create<EditorState>()(
  devtools(
    (set) => ({
      selectedComponent: null,
      pageData: null,
      isDragging: false,
      
      setSelectedComponent: (id) => set({ selectedComponent: id }),
      updatePageData: (data) => set({ pageData: data }),
      setDragging: (isDragging) => set({ isDragging }),
    }),
    { name: 'editor2-store' }
  )
);
```

## 🎨 Sistema de UI

### Shadcn/UI Components

#### Base Components
```typescript
// src/components/ui/button.tsx
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
```

#### Composite Components
```typescript
// src/components/AppointmentCard.tsx
interface AppointmentCardProps {
  appointment: Appointment;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function AppointmentCard({ appointment, onEdit, onDelete }: AppointmentCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{appointment.contact_name}</span>
          <Badge variant={getStatusVariant(appointment.status)}>
            {appointment.status}
          </Badge>
        </CardTitle>
        <CardDescription>
          {format(new Date(appointment.datetime), 'PPP')} às {format(new Date(appointment.datetime), 'HH:mm')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {appointment.professional_name}
        </p>
        {appointment.notes && (
          <p className="text-sm mt-2">{appointment.notes}</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(appointment.id)}>
          Editar
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(appointment.id)}>
          Excluir
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### Tailwind CSS Configuration

#### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

## 📱 Páginas e Roteamento

### Estrutura de Páginas

#### Main Pages
```typescript
// src/pages/appointments.tsx
export default function AppointmentsPage() {
  const { data: user } = useAuth();
  const { data: appointments, isLoading } = useAppointments(user?.clinic_id);
  const createAppointment = useCreateAppointment();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Agendamentos</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          Novo Agendamento
        </Button>
      </div>
      
      <div className="grid gap-4">
        {appointments?.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
      
      <CreateAppointmentModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={createAppointment.mutate}
      />
    </div>
  );
}
```

#### Contacts Page
```typescript
// src/pages/contacts.tsx
export default function ContactsPage() {
  const { data: user } = useAuth();
  const { data: contacts, isLoading } = useContacts(user?.clinic_id);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = contacts?.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contatos</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          Novo Contato
        </Button>
      </div>
      
      <div className="mb-4">
        <Input
          placeholder="Buscar contatos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <ContactsTable contacts={filteredContacts} />
    </div>
  );
}
```

### Router Configuration
```typescript
// src/main.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'appointments', element: <AppointmentsPage /> },
      { path: 'contacts', element: <ContactsPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'conversations', element: <ConversationsPage /> },
      { path: 'pipeline', element: <PipelinePage /> },
      { path: 'medical-records', element: <MedicalRecordsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'admin', element: <AdminLayout />, children: [
        { path: 'clinics', element: <AdminClinicsPage /> },
        { path: 'users', element: <AdminUsersPage /> },
      ]},
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/anamnese-publica/:id', element: <PublicAnamnesePage /> },
]);
```

## 🔐 Autenticação Frontend

### Auth Context
```typescript
// src/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const userData = await response.json();
    setUser(userData);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Protected Routes
```typescript
// src/components/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'professional' | 'patient';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <div>Acesso negado</div>;
  }

  return <>{children}</>;
}
```

## 🎯 Features Específicas

### Editor Visual (Editor2)

#### Editor Context
```typescript
// src/contexts/EditorContext.tsx
export interface EditorContextType {
  selectedComponent: string | null;
  pageData: any;
  setSelectedComponent: (id: string | null) => void;
  updateComponent: (id: string, props: any) => void;
  addComponent: (type: string, props: any) => void;
  removeComponent: (id: string) => void;
}

export const EditorContext = createContext<EditorContextType | null>(null);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [pageData, setPageData] = useState<any>(null);

  const updateComponent = (id: string, props: any) => {
    setPageData((prev: any) => ({
      ...prev,
      components: prev.components.map((comp: any) =>
        comp.id === id ? { ...comp, props: { ...comp.props, ...props } } : comp
      ),
    }));
  };

  const addComponent = (type: string, props: any) => {
    const newComponent = {
      id: generateId(),
      type,
      props,
    };
    
    setPageData((prev: any) => ({
      ...prev,
      components: [...(prev.components || []), newComponent],
    }));
  };

  const removeComponent = (id: string) => {
    setPageData((prev: any) => ({
      ...prev,
      components: prev.components.filter((comp: any) => comp.id !== id),
    }));
  };

  return (
    <EditorContext.Provider
      value={{
        selectedComponent,
        pageData,
        setSelectedComponent,
        updateComponent,
        addComponent,
        removeComponent,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}
```

### Conversas (WhatsApp Integration)

#### Conversation Hooks
```typescript
// src/hooks/useConversations.ts
export function useConversations(clinicId: number) {
  return useQuery({
    queryKey: ['conversations', clinicId],
    queryFn: () => apiRequest<Conversation[]>(`/conversations?clinic_id=${clinicId}`),
    enabled: !!clinicId,
  });
}

export function useMessages(conversationId: number) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => apiRequest<Message[]>(`/conversations/${conversationId}/messages`),
    enabled: !!conversationId,
    refetchInterval: 5000, // Polling para novas mensagens
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: number; content: string }) =>
      apiRequest(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });
}
```

## 📊 Monitoramento e Debug

### Error Boundary
```typescript
// src/components/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Enviar erro para serviço de monitoramento
    if (import.meta.env.PROD) {
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService(error: Error, errorInfo: React.ErrorInfo) {
    // Implementar logging para produção
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      }),
    }).catch(console.error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Algo deu errado</CardTitle>
              <CardDescription>
                Ocorreu um erro inesperado. Por favor, recarregue a página.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.reload()}>
                Recarregar Página
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Performance Monitoring
```typescript
// src/hooks/usePerformanceMonitor.ts
export function usePerformanceMonitor() {
  useEffect(() => {
    // Monitorar Core Web Vitals
    if ('web-vital' in window) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log);
        getFID(console.log);
        getFCP(console.log);
        getLCP(console.log);
        getTTFB(console.log);
      });
    }

    // Monitorar erros não capturados
    const handleError = (event: ErrorEvent) => {
      console.error('Unhandled error:', event.error);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);
}
```

## 🚀 Build e Deploy

### Vite Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
});
```

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "type-check": "tsc --noEmit"
  }
}
```

### Vercel Configuration
```json
// vercel.json
{
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, DELETE, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
      ]
    }
  ]
}
```

## 🔧 Configuração de Desenvolvimento

### Environment Variables
```bash
# .env.local
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Operabase
VITE_SUPABASE_URL=https://lkwrevhxugaxfpwiktdy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 📋 Checklist de Desenvolvimento

### ✅ Funcionalidades Implementadas
- ✅ **Sistema de Proxy** - Mixed Content Error resolvido
- ✅ **TanStack Query** - Gerenciamento de estado servidor
- ✅ **Shadcn/UI** - Componentes base implementados
- ✅ **Tailwind CSS** - Styling system configurado
- ✅ **TypeScript** - Type safety completo
- ✅ **React Router** - Navegação configurada
- ✅ **Auth System** - Autenticação e autorização
- ✅ **Error Boundary** - Tratamento de erros
- ✅ **Performance Monitor** - Monitoramento básico

### 🚧 Funcionalidades Pendentes
- ⏳ **Conversations** - Interface completa WhatsApp
- ⏳ **Medical Records** - CRUD completo
- ⏳ **Pipeline** - Sistema de vendas
- ⏳ **Analytics** - Dashboards e relatórios
- ⏳ **Settings** - Configurações da clínica
- ⏳ **PWA** - Progressive Web App
- ⏳ **Offline Support** - Funcionamento offline
- ⏳ **Push Notifications** - Notificações em tempo real

### 🔄 Padrões de Desenvolvimento

#### Component Pattern
```typescript
// Padrão de componente funcional
interface ComponentProps {
  // Props tipadas
}

export function Component({ ...props }: ComponentProps) {
  // Hooks no topo
  const { data, isLoading } = useQuery(...);
  const mutation = useMutation(...);
  
  // Event handlers
  const handleAction = useCallback(() => {
    // Logic
  }, []);
  
  // Early returns
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;
  
  // Main render
  return (
    <div className="container">
      {/* JSX */}
    </div>
  );
}
```

#### Hook Pattern
```typescript
// Padrão de custom hook
export function useFeature(params: FeatureParams) {
  // State
  const [state, setState] = useState(initialState);
  
  // Queries
  const query = useQuery({
    queryKey: ['feature', params.id],
    queryFn: () => api.getFeature(params.id),
  });
  
  // Mutations
  const mutation = useMutation({
    mutationFn: api.updateFeature,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature'] });
    },
  });
  
  // Return interface
  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    update: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}
```

## 🎯 Próximos Passos

### Prioridade Alta
1. **Implementar Conversations** - Interface completa de WhatsApp
2. **Medical Records CRUD** - Sistema completo de prontuários
3. **Pipeline System** - Funil de vendas
4. **Real-time Updates** - WebSockets ou Server-Sent Events

### Prioridade Média
1. **PWA Configuration** - Service Worker e App Manifest
2. **Offline Support** - Cache de dados críticos
3. **Performance Optimization** - Code splitting e lazy loading
4. **Analytics Dashboard** - Relatórios e métricas

### Prioridade Baixa
1. **Dark Mode** - Tema escuro
2. **Internationalization** - Suporte a múltiplos idiomas
3. **Accessibility** - Melhorias de acessibilidade
4. **Testing** - Testes unitários e E2E

---

## 📞 Suporte e Recursos

### Documentação
- **Backend**: `/docs/BACKEND-ARCHITECTURE.md`
- **API Guide**: `/docs/API-RESOLUTION-GUIDE.md`
- **Components**: Storybook (futuro)

### Ferramentas de Debug
- **React DevTools** - Extensão do navegador
- **TanStack Query DevTools** - Integrado no desenvolvimento
- **Vite DevTools** - Hot reload e debugging

### Comandos Úteis
```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Lint e type check
npm run lint
npm run type-check

# Análise de bundle
npm run build && npx vite-bundle-analyzer dist
```

---

*Documentação atualizada em: Janeiro 2025*
*Versão: v1.0*
*Status: ✅ Produção* 