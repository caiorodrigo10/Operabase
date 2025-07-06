// Production Server for Operabase - v1.1.0
// Optimized for AWS Elastic Beanstalk deployment with real Supabase data
// Updated: 2025-07-05 - Fixed S3 bucket auto-detection
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Logging utility
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// CORS configuration
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
app.use(express.urlencoded({ extended: false }));

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lkwrevhxugaxfpwiktdy.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrd3Jldmh4dWdheGZwd2lrdGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU5MzA5NjMsImV4cCI6MjA0MTUwNjk2M30.3zIzJjHZrCmTjJLHzBQFZXMZCJcTGQgWDq8LQlhc1Ys';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

log(`🚀 Starting Operabase Production Server`);
log(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);
log(`📍 Port: ${PORT}`);
log(`📍 Service Role Available: ${!!SUPABASE_SERVICE_ROLE_KEY}`);

// Enhanced Supabase client using service role for RLS bypass
async function supabaseQuery(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  
  // Use service role key if available, fallback to anon key
  const apiKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  const keyType = SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON';
  
  log(`🔍 Supabase query (${keyType}): ${endpoint}`);
  
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
      log(`❌ Supabase error: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    log(`✅ Supabase data received: ${data.length || 'N/A'} records`);
    return data;
  } catch (error) {
    log(`❌ Supabase error: ${error.message}`);
    throw error;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  const healthInfo = {
    status: 'ok',
    message: 'Operabase Production Server is running!',
    timestamp: new Date().toISOString(),
    version: 'production-1.0.0',
    port: PORT,
    env: process.env.NODE_ENV || 'production',
    pid: process.pid,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    features: ['appointments', 'contacts', 'calendar', 'supabase', 'real-data'],
    service_role_available: !!SUPABASE_SERVICE_ROLE_KEY
  };
  
  log(`✅ Health check responded`);
  res.json(healthInfo);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Operabase Production API',
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: 'production-1.0.0'
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
    
    if (!clinic_id) {
      return res.status(400).json({ error: 'clinic_id is required' });
    }

    let query = `select=*&clinic_id=eq.${clinic_id}`;
    
    if (status) query += `&status=eq.${status}`;
    if (search) query += `&name=ilike.*${search}*`;
    
    query += '&order=created_at.desc';

    const contacts = await supabaseQuery(`contacts?${query}`);
    
    log(`👥 Retrieved ${contacts.length} contacts for clinic ${clinic_id}`);
    res.json(contacts);
  } catch (error) {
    log(`❌ Error getting contacts: ${error.message}`);
    res.status(500).json({ error: 'Failed to get contacts' });
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
app.use((error, req, res, next) => {
  log(`❌ Unhandled error: ${error.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  log(`🚀 Operabase Production Server started successfully`);
  log(`📍 Server running on port ${PORT}`);
  log(`🌐 Health check: http://localhost:${PORT}/health`);
  log(`📊 API Base: http://localhost:${PORT}/api`);
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