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

// JWT Service Role Key (bypasses RLS)
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrd3Jldmh4dWdheGZwd2lrdGR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTgyODQ2MywiZXhwIjoyMDY1NDA0NDYzfQ.Hzqr8mVPnJvwKGjQF-LlKzKqXlqKXxnKQJ8PZB7wqWU';

// Enhanced Supabase client that bypasses RLS using JWT service_role
async function supabaseQuery(table, filters = {}) {
  try {
    let url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
    
    // Add filters
    Object.keys(filters).forEach(key => {
      url += `&${key}=eq.${filters[key]}`;
    });
    
    logMessage(`🔍 Supabase query (JWT SERVICE_ROLE): ${url}`);
    
    // Use JWT service_role key to bypass RLS
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logMessage(`❌ JWT SERVICE_ROLE error: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`Supabase error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    logMessage(`✅ Supabase data received (JWT SERVICE_ROLE): ${data.length} records`);
    return data;
  } catch (error) {
    logMessage(`❌ Supabase error: ${error.message}`);
    
    // Fallback to anon key if service key fails
    logMessage(`🔄 Tentando fallback com chave anônima...`);
    try {
      let url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
      Object.keys(filters).forEach(key => {
        url += `&${key}=eq.${filters[key]}`;
      });
      
      const fallbackResponse = await fetch(url, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        logMessage(`✅ Fallback successful: ${fallbackData.length} records`);
        return fallbackData;
      } else {
        const fallbackErrorText = await fallbackResponse.text();
        logMessage(`❌ Fallback error: ${fallbackResponse.status} ${fallbackResponse.statusText} - ${fallbackErrorText}`);
        throw new Error(`Fallback failed: ${fallbackResponse.status} ${fallbackResponse.statusText}`);
      }
    } catch (fallbackError) {
      logMessage(`❌ Fallback também falhou: ${fallbackError.message}`);
      throw fallbackError;
    }
  }
}

// Health check
app.get('/health', (req, res) => {
  const healthData = {
    status: 'ok',
    message: 'Enhanced Debug Server v3 is running!',
    timestamp: new Date().toISOString(),
    version: 'enhanced-debug-v3.0',
    port: PORT,
    env: process.env.NODE_ENV || 'production',
    pid: process.pid,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: process.platform,
    arch: process.arch,
    node_version: process.version,
    features: ['appointments', 'contacts', 'calendar', 'supabase', 'jwt-service-role', 'rls-bypass']
  };
  
  logMessage(`✅ Health check respondido: ${JSON.stringify(healthData)}`);
  res.json(healthData);
});

// Test endpoint
app.get('/api/test', (req, res) => {
  logMessage('🧪 Test endpoint chamado');
  res.json({
    message: 'Enhanced Debug API v3 is working!',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    query: req.query,
    features: ['appointments', 'contacts', 'calendar', 'jwt-service-role']
  });
});

// ===== ROTAS ESSENCIAIS COM JWT SERVICE_ROLE =====

// 1. APPOINTMENTS - Rota principal para o calendário
app.get('/api/appointments', async (req, res) => {
  try {
    logMessage('📅 Buscando appointments...');
    
    const clinicId = req.query.clinic_id;
    const filters = clinicId ? { clinic_id: clinicId } : {};
    const appointments = await supabaseQuery('appointments', filters);
    
    logMessage(`✅ Appointments encontrados: ${appointments.length}`);
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

// 2. CONTACTS - Rota para buscar contatos
app.get('/api/contacts', async (req, res) => {
  try {
    logMessage('👥 Buscando contacts...');
    
    const clinicId = req.query.clinic_id;
    const filters = clinicId ? { clinic_id: clinicId } : {};
    const contacts = await supabaseQuery('contacts', filters);
    
    logMessage(`✅ Contacts encontrados: ${contacts.length}`);
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

// 3. CLINIC USERS - Para buscar profissionais
app.get('/api/clinic/:clinicId/users/management', async (req, res) => {
  try {
    logMessage('👨‍⚕️ Buscando clinic users...');
    
    const clinicId = req.params.clinicId;
    const users = await supabaseQuery('clinic_users', { clinic_id: clinicId });
    
    logMessage(`✅ Clinic users encontrados: ${users.length}`);
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

// 4. CLINIC CONFIG - Para configuração da clínica
app.get('/api/clinic/:clinicId/config', async (req, res) => {
  try {
    logMessage('🏥 Buscando clinic config...');
    
    const clinicId = req.params.clinicId;
    const clinics = await supabaseQuery('clinics', { id: clinicId });
    
    if (clinics.length === 0) {
      return res.status(404).json({ error: 'Clinic not found' });
    }
    
    const clinic = clinics[0];
    logMessage(`✅ Clinic config encontrado para: ${clinic.name}`);
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

// 5. CALENDAR EVENTS - Para eventos do calendário
app.get('/api/calendar/events', async (req, res) => {
  try {
    logMessage('📆 Buscando calendar events...');
    
    const clinicId = req.query.clinic_id;
    const filters = clinicId ? { clinic_id: clinicId } : {};
    const appointments = await supabaseQuery('appointments', filters);
    
    // Converte appointments para formato de eventos
    const events = appointments.map(apt => ({
      id: apt.id,
      title: `${apt.doctor_name || 'Consulta'}`,
      start: apt.scheduled_date,
      duration: apt.duration_minutes || 60,
      status: apt.status,
      contact_id: apt.contact_id,
      user_id: apt.user_id
    }));
    
    logMessage(`✅ Calendar events encontrados: ${events.length}`);
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
logMessage('🚀 Enhanced Debug Server v3 iniciando...');
logMessage(`📍 PORT: ${PORT}`);
logMessage(`📍 NODE_ENV: ${process.env.NODE_ENV}`);
logMessage(`📍 Process PID: ${process.pid}`);

app.listen(PORT, () => {
  logMessage('✅ Enhanced Debug Server v3 configurado e aguardando conexões...');
  logMessage(`🚀 Enhanced Debug Server v3 rodando na porta ${PORT}`);
  logMessage(`📍 Ambiente: ${process.env.NODE_ENV || 'production'}`);
  logMessage(`📍 Commit: 420a879 - Versão funcionando + rotas essenciais + JWT SERVICE_ROLE`);
  logMessage(`📍 Features: appointments, contacts, calendar, supabase, jwt-service-role`);
  logMessage(`⏰ Iniciado em: ${new Date().toISOString()}`);
}); 