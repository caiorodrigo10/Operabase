// Railway Unified Server - Operabase v2.0 (Supabase REST API)
// Frontend + Backend unificado para Railway usando Supabase REST API

// Carregar variáveis de ambiente primeiro
import 'dotenv/config';

// NODE_ENV será definido pelo Railway automaticamente
// Manter flexibilidade para desenvolvimento local
const isProduction = process.env.NODE_ENV === 'production';

import express, { type Request, Response, NextFunction } from "express";
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3000;

// Log de inicialização
console.log('🚀 Iniciando Operabase Railway Unified Server (Supabase REST API)...');
console.log('📍 NODE_ENV:', process.env.NODE_ENV);
console.log('📍 PORT:', PORT);
console.log('📍 SUPABASE_URL:', process.env.SUPABASE_URL ? 'configurado' : 'não configurado');
console.log('📍 SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configurado' : 'não configurado');

// ============ SUPABASE SETUP ============

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
  process.exit(1);
}

// Create Supabase admin client (usando as chaves corretas)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('🔌 Configurando Supabase Admin client...');

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    console.log('🔍 Testando conexão com Supabase...');
    console.log('🔍 URL:', process.env.SUPABASE_URL);
    console.log('🔍 Service Role Key length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);
    
    // Test with a simple query - try different approaches
    console.log('🔍 Testando query simples...');
    const { data, error } = await supabaseAdmin
      .from('contacts')
      .select('count', { count: 'exact' });
    
    if (error) {
      console.error('❌ Erro ao conectar com Supabase:', error);
      
      // Try with different client config
      console.log('🔍 Tentando com configuração alternativa...');
      const altClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      const { data: altData, error: altError } = await altClient
        .from('contacts')
        .select('count', { count: 'exact' });
      
      if (altError) {
        console.error('❌ Erro com configuração alternativa:', altError);
        return false;
      } else {
        console.log('✅ Conexão alternativa funcionou!');
        return true;
      }
    }
    
    console.log('✅ Conexão com Supabase estabelecida');
    console.log('📊 Total de contatos:', data);
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error);
    return false;
  }
}

// ============ MIDDLEWARE ============

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware - Configuração para produção e desenvolvimento
app.use((req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = isProduction 
    ? [process.env.FRONTEND_URL || 'https://operabase.railway.app'] 
    : ['http://localhost:5173', 'http://localhost:3000'];
  
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Simple auth middleware (for development)
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // For development, allow all requests
  next();
};

// ============ API ROUTES ============

// Health check - Expandido para Railway
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Test database connection
    const { data: dbTest, error: dbError } = await supabaseAdmin
      .from('contacts')
      .select('count', { count: 'exact' })
      .limit(1);
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        type: 'supabase-rest-api',
        connected: !dbError,
        error: dbError?.message || null
      },
      server: {
        port: PORT,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    };
    
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API info
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'Operabase Railway API v2.0 (Supabase REST)',
    endpoints: {
      health: '/health',
      contacts: '/api/contacts',
      appointments: '/api/appointments',
      auth: '/api/auth/*'
    }
  });
});

// Debug endpoint (temporary)
app.get('/api/debug', (req: Request, res: Response) => {
  res.json({
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL?.substring(0, 30) + '...',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 30) + '...',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY?.substring(0, 30) + '...',
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT
    },
    keys_length: {
      SUPABASE_URL: process.env.SUPABASE_URL?.length,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY?.length
    }
  });
});

// ============ CONTACTS API (Usando Supabase REST API) ============

app.get('/api/contacts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { clinic_id = 1, search } = req.query;
    
    console.log('🔍 Buscando contatos para clinic_id:', clinic_id);
    
    // Build query using Supabase REST API
    let query = supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('clinic_id', Number(clinic_id));
    
    // Add search filter if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    // Execute query
    const { data: contacts, error } = await query.order('first_contact', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar contatos:', error);
      res.status(500).json({ error: 'Erro ao buscar contatos', details: error.message });
      return;
    }
    
    console.log('✅ Contatos encontrados:', contacts?.length || 0);
    res.json(contacts || []);
  } catch (error) {
    console.error('❌ Erro ao buscar contatos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/contacts/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { clinic_id = 1 } = req.query;
    
    console.log('🔍 Buscando contato individual ID:', id, 'para clinic_id:', clinic_id);
    
    // Query using Supabase REST API
    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('id', Number(id))
      .eq('clinic_id', Number(clinic_id))
      .single();
    
    if (error) {
      console.error('❌ Erro ao buscar contato:', error);
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Contato não encontrado' });
        return;
      }
      res.status(500).json({ error: 'Erro ao buscar contato', details: error.message });
      return;
    }
    
    console.log('✅ Contato encontrado:', contact?.name || 'N/A');
    res.json(contact);
  } catch (error) {
    console.error('❌ Erro ao buscar contato:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/contacts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const contactData = req.body;
    console.log('📝 Criando novo contato:', contactData);
    
    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .insert({
        ...contactData,
        clinic_id: 1, // Hardcoded for now
        status: 'lead',
        priority: 'normal',
        source: 'api'
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar contato:', error);
      res.status(500).json({ error: 'Erro ao criar contato', details: error.message });
      return;
    }
    
    console.log('✅ Contato criado:', contact);
    res.json(contact);
  } catch (error) {
    console.error('❌ Erro ao criar contato:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============ APPOINTMENTS API (Usando Supabase REST API) ============

app.get('/api/appointments', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { clinic_id = 1, contact_id, date } = req.query;
    
    console.log('🔍 Buscando agendamentos para clinic_id:', clinic_id);
    
    // Build query using Supabase REST API
    let query = supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('clinic_id', Number(clinic_id));
    
    // Add filters if provided
    if (contact_id) {
      query = query.eq('contact_id', Number(contact_id));
    }
    
    if (date) {
      const targetDate = new Date(String(date));
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)).toISOString();
      
      query = query.gte('scheduled_date', startOfDay).lte('scheduled_date', endOfDay);
    }
    
    // Execute query
    const { data: appointments, error } = await query.order('scheduled_date', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar agendamentos:', error);
      res.status(500).json({ error: 'Erro ao buscar agendamentos', details: error.message });
      return;
    }
    
    console.log('✅ Agendamentos encontrados:', appointments?.length || 0);
    res.json(appointments || []);
  } catch (error) {
    console.error('❌ Erro ao buscar agendamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/appointments', authMiddleware, async (req: Request, res: Response) => {
  try {
    const appointmentData = req.body;
    console.log('📝 Criando novo agendamento:', appointmentData);
    
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .insert({
        ...appointmentData,
        clinic_id: 1, // Hardcoded for now
        user_id: 4, // Hardcoded for now
        status: 'agendada',
        payment_status: 'pendente'
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar agendamento:', error);
      res.status(500).json({ error: 'Erro ao criar agendamento', details: error.message });
      return;
    }
    
    console.log('✅ Agendamento criado:', appointment);
    res.json(appointment);
  } catch (error) {
    console.error('❌ Erro ao criar agendamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============ AUTH API (Simplificado) ============

app.get('/api/auth/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Return mock profile for development
    const profile = {
      id: '3cd96e6d-81f2-4c8a-a54d-3abac77b37a4',
      name: 'Caio Rodrigo',
      email: 'cr@caiorodrigo.com.br',
      role: 'super_admin',
      clinic_id: 1
    };
    
    res.json(profile);
  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Simplified login for development
    if (email && password) {
      const user = {
        id: '3cd96e6d-81f2-4c8a-a54d-3abac77b37a4',
        name: 'Caio Rodrigo',
        email: email,
        role: 'super_admin',
        clinic_id: 1
      };
      
      res.json({ success: true, user });
    } else {
      res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.json({ success: true });
});

// ============ CLINIC MANAGEMENT API ============

// GET /api/clinic/:id/users/management - List clinic users
app.get('/api/clinic/:id/users/management', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: clinic_id } = req.params;
    
    console.log('🔍 Buscando usuários para clinic_id:', clinic_id);
    
    // Query real data from database
    const { data: users, error } = await supabaseAdmin
      .from('clinic_users')
      .select(`
        *,
        users!inner(name, email)
      `)
      .eq('clinic_id', Number(clinic_id))
      .eq('is_active', true)
      .order('id');
    
    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      res.status(500).json({ error: 'Erro ao buscar usuários', details: error.message });
      return;
    }
    
    // Transform data to match expected format
    const formattedUsers = users?.map(user => ({
      user_id: user.user_id,
      id: user.user_id,
      name: user.users.name,
      email: user.users.email,
      is_professional: user.is_professional,
      is_active: user.is_active,
      clinic_id: user.clinic_id,
      role: user.role
    })) || [];
    
    console.log('✅ Usuários encontrados:', formattedUsers.length);
    res.json(formattedUsers);
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/clinic/:id/config - Get clinic configuration
app.get('/api/clinic/:id/config', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: clinic_id } = req.params;
    
    console.log('🔍 Buscando configuração para clinic_id:', clinic_id);
    
    // Mock clinic configuration
    const mockConfig = {
      working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      work_start: '08:00',
      work_end: '18:00',
      lunch_start: '12:00',
      lunch_end: '13:00',
      has_lunch_break: false
    };
    
    console.log('✅ Configuração encontrada:', mockConfig);
    res.json(mockConfig);
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============ STATIC FILES ============

// Serve static files from dist directory
const distPath = path.join(__dirname, '../dist');
console.log('📁 Servindo arquivos estáticos do build:', distPath);

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // Serve index.html for all non-API routes (SPA routing)
  app.get('*', (req: Request, res: Response) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'API endpoint not found' });
      return;
    }
    
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.log('⚠️  Diretório dist não encontrado. Execute npm run build primeiro.');
  
  // Serve a simple message if build doesn't exist
  app.get('*', (req: Request, res: Response) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'API endpoint not found' });
      return;
    }
    
    res.send(`
      <html>
        <body>
          <h1>Operabase Railway Server</h1>
          <p>Frontend build não encontrado. Execute <code>npm run build</code> primeiro.</p>
          <p>API está funcionando em: <a href="/api">/api</a></p>
        </body>
      </html>
    `);
  });
}

// ============ START SERVER ============

async function startServer() {
  try {
    // Test Supabase connection first
    const supabaseConnected = await testSupabaseConnection();
    if (!supabaseConnected) {
      console.log('⚠️  Aviso: Conexão com Supabase falhou, mas servidor continuará funcionando');
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log('🚀 Operabase Railway Unified Server started successfully!');
      console.log('📍 Server running on port', PORT);
      console.log('🌐 Frontend: Static files');
      console.log('🔗 Health check: http://localhost:' + PORT + '/health');
      console.log('🔌 API base: http://localhost:' + PORT + '/api');
        console.log('📋 API endpoints:');
  console.log('   GET  /health - Health check');
  console.log('   GET  /api - API info');
  console.log('   GET  /api/appointments - List appointments');
  console.log('   POST /api/appointments - Create appointment');
  console.log('   GET  /api/contacts - List contacts');
  console.log('   GET  /api/contacts/:id - Get specific contact');
  console.log('   POST /api/contacts - Create contact');
  console.log('   GET  /api/auth/profile - User profile');
  console.log('   POST /api/auth/login - Login');
  console.log('   POST /api/auth/logout - Logout');
  console.log('   GET  /api/clinic/:id/users/management - List clinic users');
  console.log('   GET  /api/clinic/:id/config - Get clinic config');
    });
  } catch (error) {
    console.error('❌ Erro fatal ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Start the server
startServer(); 