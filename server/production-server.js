// Production Server for Operabase - v1.1.0
// Optimized for AWS Elastic Beanstalk deployment with real Supabase data
// Updated: 2025-07-05 - Fixed S3 bucket auto-detection
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 8080;

// Configurações do Supabase - APENAS variáveis de ambiente
const SUPABASE_URL = process.env.SUPABASE_URL;
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

// Logging utility
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Supabase query utility function
async function supabaseQuery(endpoint) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    log(`❌ Supabase query error for ${endpoint}: ${error.message}`);
    throw error;
  }
}

// CORS configuration para Vercel frontend
app.use(cors({
  origin: [
    'https://operabase.vercel.app',
    'https://operabase-main.vercel.app',
    'https://operabase-main-git-main-caioapfelbaums-projects.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

log(`🚀 Starting Operabase Production Server`);
log(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);
log(`📍 Port: ${PORT}`);
log(`📍 Service Role Available: ${!!SUPABASE_SERVICE_ROLE_KEY}`);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    supabase_configured: !!SUPABASE_URL,
    service_role_configured: !!SUPABASE_SERVICE_ROLE_KEY
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Operabase Backend API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API is working',
    timestamp: new Date().toISOString(),
    supabase_url: SUPABASE_URL ? 'configured' : 'missing',
    environment: process.env.NODE_ENV || 'production'
  });
});

// Get appointments with filters
app.get('/api/appointments', async (req, res) => {
  try {
    const { clinic_id, status, date_from, date_to, contact_id, user_id } = req.query;
    
    if (!clinic_id) {
      return res.status(400).json({ error: 'clinic_id is required' });
    }

    let query = `select=*&clinic_id=eq.${clinic_id}`;
    
    if (status) query += `&status=eq.${status}`;
    if (contact_id) query += `&contact_id=eq.${contact_id}`;
    if (user_id) query += `&user_id=eq.${user_id}`;
    if (date_from) query += `&scheduled_date=gte.${date_from}`;
    if (date_to) query += `&scheduled_date=lte.${date_to}`;
    
    query += '&order=scheduled_date.desc';

    const appointments = await supabaseQuery(`appointments?${query}`);
    
    log(`📅 Retrieved ${appointments.length} appointments for clinic ${clinic_id}`);
    res.json(appointments);
  } catch (error) {
    log(`❌ Error getting appointments: ${error.message}`);
    res.status(500).json({ error: 'Failed to get appointments' });
  }
});

// Get calendar events (formatted for calendar display)
app.get('/api/calendar/events', async (req, res) => {
  try {
    const { clinic_id, start_date, end_date } = req.query;
    
    if (!clinic_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'clinic_id, start_date and end_date are required' });
    }

    let query = `select=*&clinic_id=eq.${clinic_id}`;
    query += `&scheduled_date=gte.${start_date}`;
    query += `&scheduled_date=lte.${end_date}`;
    query += '&order=scheduled_date.asc';

    const appointments = await supabaseQuery(`appointments?${query}`);
    
    // Format appointments as calendar events
    const events = appointments.map(appointment => ({
      id: appointment.id,
      title: `${appointment.doctor_name || 'Dr.'} - ${appointment.specialty || 'Consulta'}`,
      start: appointment.scheduled_date,
      end: appointment.scheduled_date, // You might want to add duration logic here
      extendedProps: {
        contactId: appointment.contact_id,
        userId: appointment.user_id,
        status: appointment.status,
        appointmentType: appointment.appointment_type,
        duration: appointment.duration_minutes || 60,
        notes: appointment.session_notes
      },
      backgroundColor: getEventColor(appointment.status),
      borderColor: getEventColor(appointment.status)
    }));
    
    log(`📅 Formatted ${events.length} calendar events for clinic ${clinic_id}`);
    res.json(events);
  } catch (error) {
    log(`❌ Error getting calendar events: ${error.message}`);
    res.status(500).json({ error: 'Failed to get calendar events' });
  }
});

// Get contacts
app.get('/api/contacts', async (req, res) => {
  try {
    const { clinic_id, status, search } = req.query;
    
    log(`🔍 CONTACTS DEBUG: Received request with clinic_id=${clinic_id}, status=${status}, search=${search}`);
    
    if (!clinic_id) {
      log(`❌ CONTACTS ERROR: clinic_id is required`);
      return res.status(400).json({ error: 'clinic_id is required' });
    }

    let query = `select=*&clinic_id=eq.${clinic_id}`;
    
    if (status) query += `&status=eq.${status}`;
    if (search) query += `&name=ilike.*${search}*`;
    
    log(`🔍 CONTACTS DEBUG: Executing Supabase query: contacts?${query}`);
    
    const contacts = await supabaseQuery(`contacts?${query}`);
    
    log(`👥 Retrieved ${contacts.length} contacts for clinic ${clinic_id}`);
    log(`🔍 CONTACTS DEBUG: First contact sample:`, contacts[0] ? JSON.stringify(contacts[0], null, 2) : 'No contacts found');
    
    res.json(contacts);
  } catch (error) {
    log(`❌ Error getting contacts: ${error.message}`);
    log(`❌ CONTACTS ERROR STACK: ${error.stack}`);
    log(`❌ CONTACTS ERROR DETAILS: ${JSON.stringify(error, null, 2)}`);
    res.status(500).json({ 
      error: 'Failed to get contacts',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get clinic users (for user management)
app.get('/api/clinic/:clinic_id/users/management', async (req, res) => {
  try {
    const { clinic_id } = req.params;
    
    const query = `select=*&clinic_id=eq.${clinic_id}&is_active=eq.true&order=created_at.desc`;
    const clinicUsers = await supabaseQuery(`clinic_users?${query}`);
    
    log(`👨‍⚕️ Retrieved ${clinicUsers.length} clinic users for clinic ${clinic_id}`);
    res.json(clinicUsers);
  } catch (error) {
    log(`❌ Error getting clinic users: ${error.message}`);
    res.status(500).json({ error: 'Failed to get clinic users' });
  }
});

// Get clinic configuration
app.get('/api/clinic/:clinic_id/config', async (req, res) => {
  try {
    const { clinic_id } = req.params;
    
    const query = `select=*&id=eq.${clinic_id}`;
    const clinics = await supabaseQuery(`clinics?${query}`);
    
    if (clinics.length === 0) {
      return res.status(404).json({ error: 'Clinic not found' });
    }
    
    log(`🏥 Retrieved clinic config for clinic ${clinic_id}`);
    res.json(clinics[0]);
  } catch (error) {
    log(`❌ Error getting clinic config: ${error.message}`);
    res.status(500).json({ error: 'Failed to get clinic config' });
  }
});

// Utility function to get event colors based on status
function getEventColor(status) {
  const colors = {
    'agendada': '#3788d8',
    'confirmada': '#28a745',
    'em_atendimento': '#ffc107',
    'finalizada': '#6c757d',
    'cancelada': '#dc3545',
    'faltou': '#fd7e14'
  };
  return colors[status] || '#3788d8';
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  log(`🚀 Operabase Production Server started successfully`);
  log(`📍 Server running on port ${PORT}`);
  log(`🌐 Health check: http://localhost:${PORT}/health`);
  log(`📊 API Base: http://localhost:${PORT}/api`);
  log(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);
  log(`📍 Supabase URL: ${SUPABASE_URL ? 'configured' : 'missing'}`);
  log(`📍 Service Role Key: ${SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing'}`);
  log(`⏰ Started at: ${new Date().toISOString()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app; 