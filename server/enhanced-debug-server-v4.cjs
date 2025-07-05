const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware para parsing JSON
app.use(express.json());

// CORS configuration for Vercel frontend (same as working servers)
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://operabase-frontend.vercel.app',
    'https://operabase-main.vercel.app',
    'https://operabase-main-git-main-caioapfelbaums-projects.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Logging function
function logMessage(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  console.log(logEntry);
  
  try {
    fs.appendFileSync('/tmp/debug.log', logEntry + '\n');
  } catch (err) {
    // Ignore write errors
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logMessage('🛑 SIGTERM recebido, fechando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logMessage('🛑 SIGINT recebido, fechando servidor...');
  process.exit(0);
});

// Supabase configuration
const SUPABASE_URL = 'https://lkwrevhxugaxfpwiktdy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrd3Jldmh4dWdheGZwd2lrdGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4Mjg0NjMsImV4cCI6MjA2NTQwNDQ2M30.sWOsGKa_PWfjth6iaXcTpyGa95xmGZO_vnBnrFnK-sc';

// Supabase client function
async function supabaseQuery(table, filters = {}) {
  try {
    let url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
    
    // Add filters
    Object.keys(filters).forEach(key => {
      url += `&${key}=eq.${filters[key]}`;
    });
    
    logMessage(`🔍 Supabase query: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logMessage(`❌ Supabase error: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`Supabase error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    logMessage(`✅ Supabase data received: ${data.length} records`);
    return data;
  } catch (error) {
    logMessage(`❌ Supabase error: ${error.message}`);
    throw error;
  }
}

// Mock data for RLS-blocked tables
const mockAppointments = [
  {
    id: 1,
    clinic_id: 1,
    contact_id: 1,
    user_id: 1,
    scheduled_date: '2025-01-08T10:00:00Z',
    duration_minutes: 60,
    status: 'scheduled',
    doctor_name: 'Dr. Silva',
    notes: 'Consulta de rotina',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 2,
    clinic_id: 1,
    contact_id: 2,
    user_id: 1,
    scheduled_date: '2025-01-08T14:00:00Z',
    duration_minutes: 45,
    status: 'confirmed',
    doctor_name: 'Dr. Santos',
    notes: 'Consulta de acompanhamento',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 3,
    clinic_id: 1,
    contact_id: 3,
    user_id: 2,
    scheduled_date: '2025-01-09T09:00:00Z',
    duration_minutes: 60,
    status: 'scheduled',
    doctor_name: 'Dr. Oliveira',
    notes: 'Primeira consulta',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 4,
    clinic_id: 1,
    contact_id: 4,
    user_id: 1,
    scheduled_date: '2025-01-09T16:00:00Z',
    duration_minutes: 30,
    status: 'completed',
    doctor_name: 'Dr. Silva',
    notes: 'Consulta finalizada',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 5,
    clinic_id: 1,
    contact_id: 5,
    user_id: 2,
    scheduled_date: '2025-01-10T11:00:00Z',
    duration_minutes: 60,
    status: 'scheduled',
    doctor_name: 'Dr. Oliveira',
    notes: 'Consulta de retorno',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

const mockContacts = [
  {
    id: 1,
    clinic_id: 1,
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '(11) 99999-1111',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 2,
    clinic_id: 1,
    name: 'Maria Santos',
    email: 'maria@email.com',
    phone: '(11) 99999-2222',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 3,
    clinic_id: 1,
    name: 'Pedro Oliveira',
    email: 'pedro@email.com',
    phone: '(11) 99999-3333',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 4,
    clinic_id: 1,
    name: 'Ana Costa',
    email: 'ana@email.com',
    phone: '(11) 99999-4444',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 5,
    clinic_id: 1,
    name: 'Carlos Ferreira',
    email: 'carlos@email.com',
    phone: '(11) 99999-5555',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

const mockClinics = [
  {
    id: 1,
    name: 'Clínica Operabase',
    email: 'contato@operabase.com',
    phone: '(11) 3333-4444',
    address: 'Rua das Flores, 123',
    city: 'São Paulo',
    state: 'SP',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

// Health check
app.get('/health', (req, res) => {
  const healthData = {
    status: 'ok',
    message: 'Enhanced Debug Server v4 is running!',
    timestamp: new Date().toISOString(),
    version: 'enhanced-debug-v4.0',
    port: PORT,
    env: process.env.NODE_ENV || 'production',
    pid: process.pid,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: process.platform,
    arch: process.arch,
    node_version: process.version,
    features: ['appointments', 'contacts', 'calendar', 'supabase', 'mock-data', 'rls-workaround']
  };
  
  logMessage(`✅ Health check respondido: ${JSON.stringify(healthData)}`);
  res.json(healthData);
});

// Test endpoint
app.get('/api/test', (req, res) => {
  logMessage('🧪 Test endpoint chamado');
  res.json({
    message: 'Enhanced Debug API v4 is working!',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    query: req.query,
    features: ['appointments', 'contacts', 'calendar', 'mock-data']
  });
});

// ===== ROTAS ESSENCIAIS COM MOCK DATA =====

// 1. APPOINTMENTS - Rota principal para o calendário (usa mock data)
app.get('/api/appointments', async (req, res) => {
  try {
    logMessage('📅 Buscando appointments (MOCK DATA)...');
    
    const clinicId = req.query.clinic_id;
    let appointments = mockAppointments;
    
    // Filter by clinic_id if provided
    if (clinicId) {
      appointments = appointments.filter(apt => apt.clinic_id === parseInt(clinicId));
    }
    
    logMessage(`✅ Appointments encontrados (MOCK): ${appointments.length}`);
    res.json(appointments);
  } catch (error) {
    logMessage(`❌ Erro ao buscar appointments: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch appointments',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 2. CONTACTS - Rota para buscar contatos (usa mock data)
app.get('/api/contacts', async (req, res) => {
  try {
    logMessage('👥 Buscando contacts (MOCK DATA)...');
    
    const clinicId = req.query.clinic_id;
    let contacts = mockContacts;
    
    // Filter by clinic_id if provided
    if (clinicId) {
      contacts = contacts.filter(contact => contact.clinic_id === parseInt(clinicId));
    }
    
    logMessage(`✅ Contacts encontrados (MOCK): ${contacts.length}`);
    res.json(contacts);
  } catch (error) {
    logMessage(`❌ Erro ao buscar contacts: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch contacts',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 3. CLINIC USERS - Para buscar profissionais (usa dados reais - sem RLS)
app.get('/api/clinic/:clinicId/users/management', async (req, res) => {
  try {
    logMessage('👨‍⚕️ Buscando clinic users (REAL DATA)...');
    
    const clinicId = req.params.clinicId;
    const users = await supabaseQuery('clinic_users', { clinic_id: clinicId });
    
    logMessage(`✅ Clinic users encontrados (REAL): ${users.length}`);
    res.json(users);
  } catch (error) {
    logMessage(`❌ Erro ao buscar clinic users: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch clinic users',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 4. CLINIC CONFIG - Para configuração da clínica (usa mock data)
app.get('/api/clinic/:clinicId/config', async (req, res) => {
  try {
    logMessage('🏥 Buscando clinic config (MOCK DATA)...');
    
    const clinicId = req.params.clinicId;
    const clinic = mockClinics.find(c => c.id === parseInt(clinicId));
    
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }
    
    logMessage(`✅ Clinic config encontrado (MOCK): ${clinic.name}`);
    res.json(clinic);
  } catch (error) {
    logMessage(`❌ Erro ao buscar clinic config: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch clinic config',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 5. CALENDAR EVENTS - Para eventos do calendário (usa mock data)
app.get('/api/calendar/events', async (req, res) => {
  try {
    logMessage('📆 Buscando calendar events (MOCK DATA)...');
    
    const clinicId = req.query.clinic_id;
    let appointments = mockAppointments;
    
    // Filter by clinic_id if provided
    if (clinicId) {
      appointments = appointments.filter(apt => apt.clinic_id === parseInt(clinicId));
    }
    
    // Converte appointments para formato de eventos
    const events = appointments.map(apt => ({
      id: apt.id,
      title: `${apt.doctor_name} - ${apt.notes}`,
      start: apt.scheduled_date,
      duration: apt.duration_minutes || 60,
      status: apt.status,
      contact_id: apt.contact_id,
      user_id: apt.user_id
    }));
    
    logMessage(`✅ Calendar events encontrados (MOCK): ${events.length}`);
    res.json(events);
  } catch (error) {
    logMessage(`❌ Erro ao buscar calendar events: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch calendar events',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug logs endpoint
app.get('/debug/logs', (req, res) => {
  try {
    const logs = fs.readFileSync('/tmp/debug.log', 'utf8');
    res.setHeader('Content-Type', 'text/plain');
    res.send(logs);
  } catch (err) {
    res.json({ error: 'Logs não encontrados', message: err.message });
  }
});

// Startup
logMessage('🚀 Enhanced Debug Server v4 iniciando...');
logMessage(`📍 PORT: ${PORT}`);
logMessage(`📍 NODE_ENV: ${process.env.NODE_ENV}`);
logMessage(`📍 Process PID: ${process.pid}`);

app.listen(PORT, () => {
  logMessage('✅ Enhanced Debug Server v4 configurado e aguardando conexões...');
  logMessage(`🚀 Enhanced Debug Server v4 rodando na porta ${PORT}`);
  logMessage(`📍 Ambiente: ${process.env.NODE_ENV || 'production'}`);
  logMessage(`📍 Commit: 420a879 - Versão funcionando + rotas essenciais + MOCK DATA`);
  logMessage(`📍 Features: appointments, contacts, calendar, supabase, mock-data`);
  logMessage(`📍 RLS Workaround: Mock data para tabelas bloqueadas, dados reais para clinic_users`);
  logMessage(`⏰ Iniciado em: ${new Date().toISOString()}`);
}); 