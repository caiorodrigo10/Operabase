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
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Função de log (mantém o padrão existente)
function logMessage(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  
  console.log(logEntry.trim());
  
  try {
    fs.appendFileSync('/tmp/debug.log', logEntry);
  } catch (err) {
    console.error('Erro ao escrever log:', err);
  }
}

logMessage('🚀 Enhanced Debug Server iniciando...');
logMessage(`📍 PORT: ${PORT}`);
logMessage(`📍 NODE_ENV: ${process.env.NODE_ENV}`);
logMessage(`📍 Process PID: ${process.pid}`);

// Middleware básico (mantém o padrão existente)
app.use((req, res, next) => {
  logMessage(`📥 ${req.method} ${req.url} - ${req.ip}`);
  next();
});

// Supabase configuration
const SUPABASE_URL = 'https://lkwrevhxugaxfpwiktdy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrd3Jldmh4dWdheGZwd2lrdGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4Mjg0NjMsImV4cCI6MjA2NTQwNDQ2M30.sWOsGKa_PWfjth6iaXcTpyGa95xmGZO_vnBnrFnK-sc';

// Simple Supabase client using fetch (no dependencies)
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
      throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    logMessage(`✅ Supabase data received: ${data.length} records`);
    return data;
  } catch (error) {
    logMessage(`❌ Supabase error: ${error.message}`);
    throw error;
  }
}

// Health check (mantém o padrão existente)
app.get('/health', (req, res) => {
  const healthData = {
    status: 'ok',
    message: 'Enhanced Debug Server is running!',
    timestamp: new Date().toISOString(),
    version: 'enhanced-debug-v1.1',
    port: PORT,
    env: process.env.NODE_ENV || 'production',
    pid: process.pid,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: process.platform,
    arch: process.arch,
    node_version: process.version,
    features: ['appointments', 'contacts', 'calendar', 'supabase']
  };
  
  logMessage(`✅ Health check respondido: ${JSON.stringify(healthData)}`);
  res.json(healthData);
});

// Test endpoint (mantém o padrão existente)
app.get('/api/test', (req, res) => {
  logMessage('🧪 Test endpoint chamado');
  res.json({
    message: 'Enhanced Debug API is working!',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    query: req.query,
    features: ['appointments', 'contacts', 'calendar']
  });
});

// ===== NOVAS ROTAS ESSENCIAIS =====

// 1. APPOINTMENTS - Rota principal para o calendário
app.get('/api/appointments', async (req, res) => {
  try {
    logMessage('📅 Buscando appointments...');
    
    const clinicId = req.query.clinic_id || '1';
    const appointments = await supabaseQuery('appointments', { clinic_id: clinicId });
    
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
    
    const clinicId = req.query.clinic_id || '1';
    const contacts = await supabaseQuery('contacts', { clinic_id: clinicId });
    
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
    
    // Por enquanto, retorna os appointments como eventos
    const clinicId = req.query.clinic_id || '1';
    const appointments = await supabaseQuery('appointments', { clinic_id: clinicId });
    
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

// Debug logs endpoint (mantém o padrão existente)
app.get('/debug/logs', (req, res) => {
  try {
    const logs = fs.readFileSync('/tmp/debug.log', 'utf8');
    res.setHeader('Content-Type', 'text/plain');
    res.send(logs);
  } catch (err) {
    res.json({ error: 'Logs não encontrados', message: err.message });
  }
});

// Catch all (atualiza com novas rotas)
app.get('*', (req, res) => {
  logMessage(`❌ Rota não encontrada: ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    url: req.url,
    available_routes: [
      '/health',
      '/api/test',
      '/api/appointments',
      '/api/contacts',
      '/api/clinic/:clinicId/users/management',
      '/api/clinic/:clinicId/config',
      '/api/calendar/events',
      '/debug/logs'
    ],
    timestamp: new Date().toISOString()
  });
});

// Error handler (mantém o padrão existente)
app.use((err, req, res, next) => {
  logMessage(`💥 Erro capturado: ${err.message}`);
  logMessage(`💥 Stack: ${err.stack}`);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server (mantém o padrão existente)
const server = app.listen(PORT, () => {
  logMessage(`🚀 Enhanced Debug Server rodando na porta ${PORT}`);
  logMessage(`📍 Ambiente: ${process.env.NODE_ENV || 'production'}`);
  logMessage(`📍 Commit: 420a879 - Versão funcionando + rotas essenciais`);
  logMessage(`📍 Features: appointments, contacts, calendar, supabase`);
  logMessage(`⏰ Iniciado em: ${new Date().toISOString()}`);
});

// Graceful shutdown (mantém o padrão existente)
process.on('SIGTERM', () => {
  logMessage('🛑 SIGTERM recebido, fechando servidor...');
  server.close(() => {
    logMessage('🛑 Servidor fechado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logMessage('🛑 SIGINT recebido, fechando servidor...');
  server.close(() => {
    logMessage('🛑 Servidor fechado');
    process.exit(0);
  });
});

// Uncaught exception handler (mantém o padrão existente)
process.on('uncaughtException', (err) => {
  logMessage(`💥 Uncaught Exception: ${err.message}`);
  logMessage(`💥 Stack: ${err.stack}`);
  process.exit(1);
});

// Unhandled rejection handler (mantém o padrão existente)
process.on('unhandledRejection', (reason, promise) => {
  logMessage(`💥 Unhandled Rejection: ${reason}`);
  logMessage(`💥 Promise: ${promise}`);
  process.exit(1);
});

logMessage('✅ Enhanced Debug Server configurado e aguardando conexões...'); 