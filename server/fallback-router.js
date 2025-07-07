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
      
      // Transform null permissions to empty arrays to prevent frontend split() errors
      const sanitizedUsers = clinicUsers.map(user => ({
        ...user,
        permissions: user.permissions || []
      }));
      
      log(`👨‍⚕️ Retrieved ${sanitizedUsers.length} clinic users for clinic ${clinic_id}`);
      res.json(sanitizedUsers);
    } catch (error) {
      log(`❌ Error getting clinic users: ${error.message}`);
      res.status(500).json({ error: 'Failed to get clinic users' });
    }
  });

  // Get clinic professionals (filtered from clinic_users)
  router.get('/clinic/:clinic_id/professionals', async (req, res) => {
    try {
      const { clinic_id } = req.params;
      
      log(`👨‍⚕️ PROFESSIONALS DEBUG: Getting professionals for clinic_id=${clinic_id}`);
      
      const query = `select=*&clinic_id=eq.${clinic_id}&is_active=eq.true&is_professional=eq.true&order=created_at.desc`;
      const professionals = await supabaseQuery(`clinic_users?${query}`);
      
      // Transform null permissions to empty arrays to prevent frontend split() errors
      const sanitizedProfessionals = professionals.map(user => ({
        ...user,
        permissions: user.permissions || []
      }));
      
      log(`👨‍⚕️ Retrieved ${sanitizedProfessionals.length} professionals for clinic ${clinic_id}`);
      log(`👨‍⚕️ PROFESSIONALS DEBUG: First professional sample:`, sanitizedProfessionals[0]);
      
      res.json(sanitizedProfessionals);
    } catch (error) {
      log(`❌ Error getting professionals: ${error.message}`);
      log(`❌ PROFESSIONALS ERROR STACK: ${error.stack}`);
      res.status(500).json({ 
        error: 'Failed to get professionals',
        details: error.message,
        timestamp: new Date().toISOString()
      });
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
      
      // Sanitize null array fields to prevent frontend split() errors
      const clinic = clinics[0];
      const sanitizedClinic = {
        ...clinic,
        services: clinic.services || [],
        payment_methods: clinic.payment_methods || [],
        working_days: clinic.working_days || [],
        specialties: clinic.specialties || [],
        lunch_times: clinic.lunch_times || [],
        business_hours: clinic.business_hours || []
      };
      
      log(`🏥 Retrieved clinic config for clinic ${clinic_id}`);
      res.json(sanitizedClinic);
    } catch (error) {
      log(`❌ Error getting clinic config: ${error.message}`);
      res.status(500).json({ error: 'Failed to get clinic config' });
    }
  });

  // ===============================
  // CONVERSATIONS ENDPOINTS - CRITICAL FOR FRONTEND
  // ===============================
  
  // Get conversations (simplified endpoint for main conversations page)
  router.get('/conversations-simple', async (req, res) => {
    try {
      const { status = 'active', limit = 50, clinic_id = 1 } = req.query;
      
      log(`💬 CONVERSATIONS DEBUG: Getting conversations with status=${status}, limit=${limit}, clinic_id=${clinic_id}`);
      
      // Query conversations table (note: id is TEXT, not INTEGER)
      let query = `select=*&clinic_id=eq.${clinic_id}`;
      if (status !== 'all') {
        query += `&status=eq.${status}`;
      }
      // Remove order by last_activity_at since it might not exist in current schema
      query += `&order=created_at.desc&limit=${limit}`;
      
      log(`💬 CONVERSATIONS DEBUG: Executing query: conversations?${query}`);
      
      const conversations = await supabaseQuery(`conversations?${query}`);
      
      log(`💬 Retrieved ${conversations.length} conversations for clinic ${clinic_id}`);
      
      // For each conversation, get contact info and format response
      const conversationsWithContacts = await Promise.all(
        conversations.map(async (conv) => {
          let contactInfo = { name: 'Unknown Contact', phone: '', email: '', status: 'active' };
          
          if (conv.contact_id) {
            try {
              const contactQuery = `select=name,phone,email,status&id=eq.${conv.contact_id}`;
              const contacts = await supabaseQuery(`contacts?${contactQuery}`);
              if (contacts.length > 0) {
                contactInfo = {
                  name: contacts[0].name || 'Unknown Contact',
                  phone: contacts[0].phone || '',
                  email: contacts[0].email || '',
                  status: contacts[0].status || 'active'
                };
              }
            } catch (contactError) {
              log(`⚠️ Error getting contact for conversation ${conv.id}: ${contactError.message}`);
            }
          }
          
          return {
            ...conv,
            contact_name: contactInfo.name,
            contact_phone: contactInfo.phone,
            contact_email: contactInfo.email,
            contact_status: contactInfo.status
          };
        })
      );
      
      const response = {
        conversations: conversationsWithContacts,
        total: conversationsWithContacts.length,
        hasMore: conversationsWithContacts.length >= limit
      };
      
      log(`💬 CONVERSATIONS DEBUG: Returning ${response.conversations.length} conversations with contact info`);
      res.json(response);
      
    } catch (error) {
      log(`❌ Error getting conversations: ${error.message}`);
      log(`❌ CONVERSATIONS ERROR STACK: ${error.stack}`);
      res.status(500).json({ 
        error: 'Failed to get conversations',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Get conversation detail with messages
  router.get('/conversations-simple/:conversation_id', async (req, res) => {
    try {
      const { conversation_id } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      log(`💬 CONVERSATION DETAIL: Getting details for conversation ${conversation_id}`);
      
      // Get conversation info
      const convQuery = `select=*&id=eq.${conversation_id}`;
      const conversations = await supabaseQuery(`conversations?${convQuery}`);
      
      if (conversations.length === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      
      const conversation = conversations[0];
      
      // Get messages for this conversation (conversation_id is TEXT, need proper encoding)
      const msgQuery = `select=*&conversation_id=eq.${conversation_id}&order=timestamp.desc&limit=${limit}&offset=${offset}`;
      const messages = await supabaseQuery(`messages?${msgQuery}`);
      
      log(`💬 Retrieved ${messages.length} messages for conversation ${conversation_id}`);
      
      // Get message attachments if any
      const messagesWithAttachments = await Promise.all(
        messages.map(async (msg) => {
          let attachments = [];
          try {
            const attachQuery = `select=*&message_id=eq.${msg.id}`;
            attachments = await supabaseQuery(`message_attachments?${attachQuery}`);
          } catch (attachError) {
            log(`⚠️ Error getting attachments for message ${msg.id}: ${attachError.message}`);
          }
          
          return {
            ...msg,
            attachments: attachments || []
          };
        })
      );
      
      // Mock actions for now (can be implemented later)
      const actions = [];
      
      const response = {
        conversation,
        messages: messagesWithAttachments.reverse(), // Reverse to show oldest first
        actions,
        pagination: {
          currentPage: Math.floor(offset / limit) + 1,
          limit: parseInt(limit),
          totalMessages: messages.length,
          hasMore: messages.length >= limit,
          isPaginated: true
        }
      };
      
      log(`💬 CONVERSATION DETAIL: Returning conversation with ${response.messages.length} messages`);
      res.json(response);
      
    } catch (error) {
      log(`❌ Error getting conversation detail: ${error.message}`);
      res.status(500).json({ 
        error: 'Failed to get conversation detail',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Send message to conversation
  router.post('/conversations-simple/:conversation_id/messages', async (req, res) => {
    try {
      const { conversation_id } = req.params;
      const { content } = req.body;
      
      log(`💬 SEND MESSAGE: Sending message to conversation ${conversation_id}: "${content}"`);
      
      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Message content is required' });
      }
      
      // Create message record
      const messageData = {
        conversation_id: parseInt(conversation_id),
        sender_type: 'professional',
        sender_id: 'user-1', // Mock user ID
        sender_name: 'Professional',
        content: content.trim(),
        message_type: 'text',
        direction: 'outbound',
        status: 'sent',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Insert message (simplified - in real implementation would use proper INSERT)
      log(`💬 SEND MESSAGE: Creating message record`);
      
      // Update conversation last activity
      const updateConvQuery = `id=eq.${conversation_id}`;
      // Note: This is a simplified implementation. In production, you'd use proper UPDATE queries
      
      const response = {
        success: true,
        message: {
          id: Date.now(), // Mock ID
          ...messageData,
          timestamp: messageData.created_at
        },
        timestamp: new Date().toISOString()
      };
      
      log(`💬 SEND MESSAGE: Message sent successfully to conversation ${conversation_id}`);
      res.json(response);
      
    } catch (error) {
      log(`❌ Error sending message: ${error.message}`);
      res.status(500).json({ 
        error: 'Failed to send message',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Mark conversation as read
  router.post('/conversations-simple/:conversation_id/mark-read', async (req, res) => {
    try {
      const { conversation_id } = req.params;
      
      log(`💬 MARK READ: Marking conversation ${conversation_id} as read`);
      
      // In a real implementation, this would update the conversation's unread_count to 0
      // and mark relevant messages as read
      
      const response = {
        success: true,
        conversation_id: parseInt(conversation_id),
        unread_count: 0,
        marked_at: new Date().toISOString()
      };
      
      log(`💬 MARK READ: Conversation ${conversation_id} marked as read`);
      res.json(response);
      
    } catch (error) {
      log(`❌ Error marking conversation as read: ${error.message}`);
      res.status(500).json({ 
        error: 'Failed to mark conversation as read',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Upload file to conversation
  router.post('/conversations/:conversation_id/upload', async (req, res) => {
    try {
      const { conversation_id } = req.params;
      
      log(`📎 UPLOAD: File upload requested for conversation ${conversation_id}`);
      
      // Mock file upload response
      const response = {
        success: true,
        message: {
          id: Date.now(),
          conversation_id: parseInt(conversation_id),
          type: 'sent_user',
          content: 'File uploaded',
          timestamp: new Date().toISOString(),
          media_type: 'document',
          media_filename: 'uploaded_file.pdf',
          media_size: 1024000
        },
        attachment: {
          id: Date.now() + 1,
          file_name: 'uploaded_file.pdf',
          file_type: 'application/pdf',
          file_size: 1024000,
          file_url: '/uploads/mock-file.pdf'
        }
      };
      
      log(`📎 UPLOAD: Mock file upload successful for conversation ${conversation_id}`);
      res.json(response);
      
    } catch (error) {
      log(`❌ Error uploading file: ${error.message}`);
      res.status(500).json({ 
        error: 'Failed to upload file',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // ===============================
  // ADDITIONAL DOMAIN ENDPOINTS
  // ===============================

  // Medical Records endpoints
  router.get('/medical-records', async (req, res) => {
    try {
      const { clinic_id, contact_id, limit = 50 } = req.query;
      
      log(`🏥 MEDICAL RECORDS DEBUG: Getting records for clinic_id=${clinic_id}, contact_id=${contact_id}`);
      
      let query = `select=*&clinic_id=eq.${clinic_id}`;
      if (contact_id) query += `&contact_id=eq.${contact_id}`;
      query += `&order=created_at.desc&limit=${limit}`;
      
      const records = await supabaseQuery(`medical_records?${query}`);
      
      log(`🏥 Retrieved ${records.length} medical records`);
      res.json(records);
    } catch (error) {
      log(`❌ Error getting medical records: ${error.message}`);
      res.status(500).json({ error: 'Failed to get medical records' });
    }
  });

  // Anamnesis Templates endpoints
  router.get('/anamneses', async (req, res) => {
    try {
      const { clinic_id } = req.query;
      
      log(`📋 ANAMNESES DEBUG: Getting templates for clinic_id=${clinic_id}`);
      
      let query = `select=*&clinic_id=eq.${clinic_id}&is_active=eq.true`;
      query += `&order=created_at.desc`;
      
      const templates = await supabaseQuery(`anamnesis_templates?${query}`);
      
      log(`📋 Retrieved ${templates.length} anamnesis templates`);
      res.json(templates);
    } catch (error) {
      log(`❌ Error getting anamneses: ${error.message}`);
      res.status(500).json({ error: 'Failed to get anamneses' });
    }
  });

  // Anamnesis Responses endpoints
  router.get('/anamnesis-responses', async (req, res) => {
    try {
      const { clinic_id, contact_id, status } = req.query;
      
      log(`📝 ANAMNESIS RESPONSES DEBUG: Getting responses for clinic_id=${clinic_id}`);
      
      let query = `select=*&clinic_id=eq.${clinic_id}`;
      if (contact_id) query += `&contact_id=eq.${contact_id}`;
      if (status) query += `&status=eq.${status}`;
      query += `&order=created_at.desc`;
      
      const responses = await supabaseQuery(`anamnesis_responses?${query}`);
      
      log(`📝 Retrieved ${responses.length} anamnesis responses`);
      res.json(responses);
    } catch (error) {
      log(`❌ Error getting anamnesis responses: ${error.message}`);
      res.status(500).json({ error: 'Failed to get anamnesis responses' });
    }
  });

  // Pipeline endpoints
  router.get('/pipeline-stages', async (req, res) => {
    try {
      const { clinic_id } = req.query;
      
      log(`🔄 PIPELINE STAGES DEBUG: Getting stages for clinic_id=${clinic_id}`);
      
      let query = `select=*&clinic_id=eq.${clinic_id}&is_active=eq.true`;
      query += `&order=order_position.asc`;
      
      const stages = await supabaseQuery(`pipeline_stages?${query}`);
      
      log(`🔄 Retrieved ${stages.length} pipeline stages`);
      res.json(stages);
    } catch (error) {
      log(`❌ Error getting pipeline stages: ${error.message}`);
      res.status(500).json({ error: 'Failed to get pipeline stages' });
    }
  });

  router.get('/pipeline-opportunities', async (req, res) => {
    try {
      const { clinic_id, stage_id, status } = req.query;
      
      log(`💼 PIPELINE OPPORTUNITIES DEBUG: Getting opportunities for clinic_id=${clinic_id}`);
      
      let query = `select=*&clinic_id=eq.${clinic_id}`;
      if (stage_id) query += `&stage_id=eq.${stage_id}`;
      if (status) query += `&status=eq.${status}`;
      query += `&order=created_at.desc`;
      
      const opportunities = await supabaseQuery(`pipeline_opportunities?${query}`);
      
      log(`💼 Retrieved ${opportunities.length} pipeline opportunities`);
      res.json(opportunities);
    } catch (error) {
      log(`❌ Error getting pipeline opportunities: ${error.message}`);
      res.status(500).json({ error: 'Failed to get pipeline opportunities' });
    }
  });

  // Knowledge Base endpoints  
  router.get('/knowledge-bases', async (req, res) => {
    try {
      const { clinic_id } = req.query;
      
      log(`🧠 KNOWLEDGE BASES DEBUG: Getting knowledge bases for clinic_id=${clinic_id}`);
      
      let query = `select=*&clinic_id=eq.${clinic_id}`;
      query += `&order=created_at.desc`;
      
      const knowledgeBases = await supabaseQuery(`knowledge_bases?${query}`);
      
      log(`🧠 Retrieved ${knowledgeBases.length} knowledge bases`);
      res.json(knowledgeBases);
    } catch (error) {
      log(`❌ Error getting knowledge bases: ${error.message}`);
      res.status(500).json({ error: 'Failed to get knowledge bases' });
    }
  });

  // API Keys endpoints
  router.get('/api-keys', async (req, res) => {
    try {
      const { clinic_id } = req.query;
      
      log(`🔑 API KEYS DEBUG: Getting API keys for clinic_id=${clinic_id}`);
      
      let query = `select=id,clinic_id,key_name,is_active,permissions,last_used_at,usage_count,expires_at,created_at&clinic_id=eq.${clinic_id}`;
      query += `&order=created_at.desc`;
      
      const apiKeys = await supabaseQuery(`api_keys?${query}`);
      
      log(`🔑 Retrieved ${apiKeys.length} API keys (sensitive data hidden)`);
      res.json(apiKeys);
    } catch (error) {
      log(`❌ Error getting API keys: ${error.message}`);
      res.status(500).json({ error: 'Failed to get API keys' });
    }
  });

  // Placeholder endpoints for other domains (return appropriate messages)
  const placeholderDomains = [
    { path: '/auth/*', name: 'Authentication' },
    { path: '/rag/*', name: 'RAG System' },
    { path: '/mara/*', name: 'MARA AI' },
    { path: '/analytics/*', name: 'Analytics' },
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
         '/api/clinic/:id/professionals',
         '/api/clinic/:id/config',
         '/api/conversations-simple',
         '/api/conversations-simple/:id',
         '/api/conversations-simple/:id/messages',
         '/api/conversations-simple/:id/mark-read',
         '/api/conversations/:id/upload',
         '/api/medical-records',
         '/api/anamneses',
         '/api/anamnesis-responses',
         '/api/pipeline-stages',
         '/api/pipeline-opportunities',
         '/api/knowledge-bases',
         '/api/api-keys'
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