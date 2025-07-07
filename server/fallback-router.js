// Fallback Router for Production Server
// Contains essential endpoints that were working in the original server
// Used when TypeScript domain system is not available

const express = require('express');
const fetch = require('node-fetch');

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

function createFallbackRouter() {
  const router = express.Router();
  
  log('🔧 Using fallback router with essential endpoints');

  // API test endpoint
  router.get('/test', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Fallback API is working',
      timestamp: new Date().toISOString(),
      mode: 'fallback',
      supabase_url: SUPABASE_URL ? 'configured' : 'missing',
      environment: process.env.NODE_ENV || 'production'
    });
  });

  // Get appointments with filters
  router.get('/appointments', async (req, res) => {
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
  router.get('/calendar/events', async (req, res) => {
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
  router.get('/contacts', async (req, res) => {
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
  router.get('/clinic/:clinic_id/users/management', async (req, res) => {
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
  router.get('/clinic/:clinic_id/config', async (req, res) => {
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

  // Placeholder endpoints for other domains (return appropriate messages)
  const placeholderDomains = [
    { path: '/auth/*', name: 'Authentication' },
    { path: '/anamneses/*', name: 'Anamneses' },
    { path: '/rag/*', name: 'RAG System' },
    { path: '/mara/*', name: 'MARA AI' },
    { path: '/pipeline-*', name: 'Pipeline' },
    { path: '/analytics/*', name: 'Analytics' },
    { path: '/medical-records/*', name: 'Medical Records' },
    { path: '/user/profile', name: 'User Profile' },
    { path: '/clinics/*/settings/*', name: 'Settings' },
    { path: '/clinics/*/ai-templates/*', name: 'AI Templates' },
    { path: '/clinic/*/appointment-tags/*', name: 'Appointment Tags' },
    { path: '/livia/*', name: 'Livia AI' }
  ];

  // Catch-all for unimplemented endpoints
  router.use('*', (req, res) => {
    res.status(503).json({
      error: 'Endpoint temporarily unavailable',
      message: 'This endpoint is part of the domain system which is not available in fallback mode',
      fallback_mode: true,
      available_endpoints: [
        '/api/test',
        '/api/appointments',
        '/api/calendar/events', 
        '/api/contacts',
        '/api/clinic/:id/users/management',
        '/api/clinic/:id/config'
      ],
      requested: req.originalUrl,
      timestamp: new Date().toISOString()
    });
  });

  return router;
}

module.exports = {
  createFallbackRouter
}; 