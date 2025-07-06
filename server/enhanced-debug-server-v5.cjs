const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

// GitHub Actions Deploy Trigger - v5.1
const app = express();
const PORT = process.env.PORT || 8080;

// Configurações do Supabase - APENAS variáveis de ambiente
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validação obrigatória das variáveis de ambiente
if (!SUPABASE_URL) {
  console.error('❌ SUPABASE_URL is required');
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

// Configuração do CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://operabase-main.vercel.app',
    'https://operabase-main-git-main-caioapfelbaums-projects.vercel.app',
    'https://operabase-main-caioapfelbaums-projects.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Função para fazer queries no Supabase
async function supabaseQuery(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  
  // Prioriza service_role se disponível
  const apiKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  const keyType = SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON';
  
  console.log(`[${new Date().toISOString()}] 🔍 Supabase query (${keyType}): ${url}`);
  
  const headers = {
    'apikey': apiKey,
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[${new Date().toISOString()}] ❌ Supabase error: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`Supabase error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[${new Date().toISOString()}] ✅ Supabase data received: ${data.length} records`);
    return data;
  } catch (error) {
    console.log(`[${new Date().toISOString()}] ❌ Supabase error: ${error.message}`);
    throw error;
  }
}

// Middleware de logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] 📥 ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  const healthInfo = {
    status: 'ok',
    message: 'Enhanced Debug Server v5 is running!',
    timestamp: new Date().toISOString(),
    version: 'enhanced-debug-v5.0',
    port: PORT,
    env: process.env.NODE_ENV || 'production',
    pid: process.pid,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: process.platform,
    arch: process.arch,
    node_version: process.version,
    features: ['appointments', 'contacts', 'calendar', 'supabase', 'service-role', 'real-data'],
    service_role_available: !!SUPABASE_SERVICE_ROLE_KEY
  };
  
  console.log(`[${new Date().toISOString()}] ✅ Health check respondido: ${JSON.stringify(healthInfo)}`);
  res.json(healthInfo);
});

// Rota de appointments
app.get('/api/appointments', async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] 📅 Buscando appointments (REAL DATA)...`);
    
    const { clinic_id } = req.query;
    let endpoint = 'appointments?select=*';
    
    if (clinic_id) {
      endpoint += `&clinic_id=eq.${clinic_id}`;
    }
    
    const appointments = await supabaseQuery(endpoint);
    
    console.log(`[${new Date().toISOString()}] ✅ Appointments encontrados (REAL): ${appointments.length}`);
    res.json(appointments);
  } catch (error) {
    console.log(`[${new Date().toISOString()}] ❌ Erro ao buscar appointments: ${error.message}`);
    res.status(500).json({ error: 'Erro ao buscar appointments', details: error.message });
  }
});

// Rota de contacts
app.get('/api/contacts', async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] 👥 Buscando contacts (REAL DATA)...`);
    
    const { clinic_id } = req.query;
    let endpoint = 'contacts?select=*';
    
    if (clinic_id) {
      endpoint += `&clinic_id=eq.${clinic_id}`;
    }
    
    const contacts = await supabaseQuery(endpoint);
    
    console.log(`[${new Date().toISOString()}] ✅ Contacts encontrados (REAL): ${contacts.length}`);
    res.json(contacts);
  } catch (error) {
    console.log(`[${new Date().toISOString()}] ❌ Erro ao buscar contacts: ${error.message}`);
    res.status(500).json({ error: 'Erro ao buscar contacts', details: error.message });
  }
});

// Rota de calendar events
app.get('/api/calendar/events', async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] 📆 Buscando calendar events (REAL DATA)...`);
    
    const { clinic_id } = req.query;
    let endpoint = 'appointments?select=*';
    
    if (clinic_id) {
      endpoint += `&clinic_id=eq.${clinic_id}`;
    }
    
    const appointments = await supabaseQuery(endpoint);
    
    // Transformar appointments em eventos de calendário
    const events = appointments.map(appointment => ({
      id: appointment.id,
      title: `${appointment.doctor_name || 'Consulta'} - ${appointment.status}`,
      start: appointment.scheduled_date,
      end: appointment.scheduled_date,
      duration: appointment.duration_minutes,
      status: appointment.status,
      doctor: appointment.doctor_name,
      notes: appointment.notes,
      contact_id: appointment.contact_id,
      clinic_id: appointment.clinic_id
    }));
    
    console.log(`[${new Date().toISOString()}] ✅ Calendar events encontrados (REAL): ${events.length}`);
    res.json(events);
  } catch (error) {
    console.log(`[${new Date().toISOString()}] ❌ Erro ao buscar calendar events: ${error.message}`);
    res.status(500).json({ error: 'Erro ao buscar calendar events', details: error.message });
  }
});

// Rota de clinic users (já funcionava antes)
app.get('/api/clinic/:clinicId/users/management', async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] 👨‍⚕️ Buscando clinic users (REAL DATA)...`);
    
    const { clinicId } = req.params;
    const endpoint = `clinic_users?select=*&clinic_id=eq.${clinicId}`;
    
    const users = await supabaseQuery(endpoint);
    
    console.log(`[${new Date().toISOString()}] ✅ Clinic users encontrados (REAL): ${users.length}`);
    res.json(users);
  } catch (error) {
    console.log(`[${new Date().toISOString()}] ❌ Erro ao buscar clinic users: ${error.message}`);
    res.status(500).json({ error: 'Erro ao buscar clinic users', details: error.message });
  }
});

// Rota de clinic config
app.get('/api/clinic/:clinicId/config', async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] 🏥 Buscando clinic config (REAL DATA)...`);
    
    const { clinicId } = req.params;
    const endpoint = `clinics?select=*&id=eq.${clinicId}`;
    
    const clinics = await supabaseQuery(endpoint);
    
    console.log(`[${new Date().toISOString()}] ✅ Clinic config encontrado (REAL): ${clinics.length}`);
    res.json(clinics[0] || {});
  } catch (error) {
    console.log(`[${new Date().toISOString()}] ❌ Erro ao buscar clinic config: ${error.message}`);
    res.status(500).json({ error: 'Erro ao buscar clinic config', details: error.message });
  }
});

// Rota de teste
app.get('/api/test', (req, res) => {
  console.log(`[${new Date().toISOString()}] 🧪 Test endpoint chamado`);
  res.json({ 
    message: 'Enhanced Debug Server v5 funcionando!',
    timestamp: new Date().toISOString(),
    service_role_available: !!SUPABASE_SERVICE_ROLE_KEY
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ❌ Erro no servidor:`, err);
  res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
});

// Inicialização do servidor
console.log(`[${new Date().toISOString()}] 🚀 Enhanced Debug Server v5 iniciando...`);
console.log(`[${new Date().toISOString()}] 📍 PORT: ${PORT}`);
console.log(`[${new Date().toISOString()}] 📍 NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[${new Date().toISOString()}] 📍 Process PID: ${process.pid}`);
console.log(`[${new Date().toISOString()}] 📍 Service Role Available: ${!!SUPABASE_SERVICE_ROLE_KEY}`);

const server = app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] ✅ Enhanced Debug Server v5 configurado e aguardando conexões...`);
  console.log(`[${new Date().toISOString()}] 🚀 Enhanced Debug Server v5 rodando na porta ${PORT}`);
  console.log(`[${new Date().toISOString()}] 📍 Ambiente: ${process.env.NODE_ENV || 'production'}`);
  console.log(`[${new Date().toISOString()}] 📍 Commit: 420a879 - Versão funcionando + rotas essenciais + SERVICE_ROLE REAL DATA`);
  console.log(`[${new Date().toISOString()}] 📍 Features: appointments, contacts, calendar, supabase, service-role, real-data`);
  console.log(`[${new Date().toISOString()}] ⏰ Iniciado em: ${new Date().toISOString()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log(`[${new Date().toISOString()}] 🛑 SIGTERM recebido, fechando servidor...`);
  server.close(() => {
    console.log(`[${new Date().toISOString()}] 🛑 Servidor fechado`);
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log(`[${new Date().toISOString()}] 🛑 SIGINT recebido, fechando servidor...`);
  server.close(() => {
    console.log(`[${new Date().toISOString()}] 🛑 Servidor fechado`);
    process.exit(0);
  });
}); 