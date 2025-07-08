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
import multer from 'multer';

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

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Tipos MIME permitidos
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/mov', 'video/avi', 'video/webm',
      'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/webm', 'audio/mp4',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype}`));
    }
  }
});

// Helper functions for upload system
const sanitizeFilename = (filename: string): string => {
  if (!filename) return 'unnamed-file';
  
  console.log('🔧 Sanitizing filename:', filename);
  
  // Character mapping for special characters
  const characterMap: { [key: string]: string } = {
    // Uppercase accents
    'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Æ': 'AE',
    'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
    'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O', 'Ø': 'O',
    'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
    'Ç': 'C', 'Ñ': 'N', 'Ý': 'Y',
    
    // Lowercase accents
    'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae',
    'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
    'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
    'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o',
    'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
    'ç': 'c', 'ñ': 'n', 'ý': 'y', 'ÿ': 'y',
    
    // Special characters
    ' ': '_', '\t': '_', '\n': '_', '\r': '_',
    '!': '', '?': '', '@': '', '#': '', '$': '', '%': '', '&': '', '*': '',
    '(': '', ')': '', '[': '', ']': '', '{': '', '}': '', '|': '', '\\': '',
    '/': '_', ':': '', ';': '', '<': '', '>': '', '=': '', '+': '', '~': '',
    '`': '', "'": '', '"': '', ',': '', '^': ''
  };
  
  // Apply character mapping
  let sanitized = filename
    .split('')
    .map(char => {
      if (characterMap.hasOwnProperty(char)) {
        return characterMap[char];
      }
      // Keep ASCII basic allowed characters (a-z, A-Z, 0-9, ., -, _)
      const code = char.charCodeAt(0);
      if ((code >= 48 && code <= 57) ||  // 0-9
          (code >= 65 && code <= 90) ||  // A-Z
          (code >= 97 && code <= 122) || // a-z
          code === 46 ||                 // .
          code === 45 ||                 // -
          code === 95) {                 // _
        return char;
      }
      return '';
    })
    .join('')
    .replace(/_{2,}/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^[._-]+|[._-]+$/g, '')
    .toLowerCase();
  
  // Ensure some content exists
  if (!sanitized || sanitized.length === 0 || sanitized === '.' || sanitized === '_') {
    const timestamp = Date.now();
    const extension = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() || 'file' : 'file';
    sanitized = `arquivo_${timestamp}.${extension}`;
  }
  
  // Final validation
  const validPattern = /^[a-zA-Z0-9._-]+$/;
  if (!validPattern.test(sanitized)) {
    console.warn('🚨 Filename still contains invalid characters, using fallback');
    const timestamp = Date.now();
    const extension = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() || 'file' : 'file';
    sanitized = `arquivo_${timestamp}.${extension}`;
  }
  
  console.log('✅ Sanitized filename:', sanitized);
  return sanitized;
};

const getMimeToMessageType = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio_file';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf' || 
      mimeType.includes('document') || 
      mimeType.includes('text/') ||
      mimeType.includes('application/')) return 'document';
  return 'document';
};

const getCategoryFromMime = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'images';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'videos';
  return 'documents';
};

const getEvolutionMediaType = (mimeType: string): 'image' | 'video' | 'document' | 'audio' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
};

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

app.put('/api/contacts/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'ID do contato inválido' });
    }
    
    console.log(`📝 Atualizando contato ID: ${id}`, updateData);
    
    // Remove campos que não devem ser atualizados
    const { id: _, clinic_id, created_at, updated_at, ...cleanData } = updateData;
    
    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .update({
        ...cleanData,
        updated_at: new Date().toISOString()
      })
      .eq('id', parseInt(id))
      .eq('clinic_id', updateData.clinic_id || 1)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Contato não encontrado' });
      }
      console.error('❌ Erro ao atualizar contato:', error);
      return res.status(500).json({ error: 'Erro ao atualizar contato', details: error.message });
    }
    
    console.log('✅ Contato atualizado:', contact.name);
    res.json(contact);
  } catch (error) {
    console.error('❌ Erro ao atualizar contato:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/contacts/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { clinic_id = 1 } = req.query;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'ID do contato inválido' });
    }
    
    console.log(`🗑️ Removendo contato ID: ${id} para clinic_id: ${clinic_id}`);
    
    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .delete()
      .eq('id', parseInt(id))
      .eq('clinic_id', parseInt(clinic_id as string))
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Contato não encontrado' });
      }
      console.error('❌ Erro ao remover contato:', error);
      return res.status(500).json({ error: 'Erro ao remover contato', details: error.message });
    }
    
    console.log('✅ Contato removido:', contact.name);
    res.json({ success: true, message: 'Contato removido com sucesso', contact });
  } catch (error) {
    console.error('❌ Erro ao remover contato:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/contacts/:contactId/appointments - Agendamentos de um contato
app.get('/api/contacts/:contactId/appointments', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params;
    const { clinic_id = 1 } = req.query;
    
    if (!contactId || isNaN(parseInt(contactId))) {
      return res.status(400).json({ error: 'ID do contato inválido' });
    }
    
    console.log(`🔍 Buscando agendamentos do contato ID: ${contactId} para clinic_id: ${clinic_id}`);
    
    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('contact_id', parseInt(contactId))
      .eq('clinic_id', parseInt(clinic_id as string))
      .order('scheduled_date', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar agendamentos do contato:', error);
      return res.status(500).json({ error: 'Erro ao buscar agendamentos', details: error.message });
    }
    
    console.log(`✅ Agendamentos encontrados para contato ${contactId}:`, appointments.length);
    res.json(appointments);
  } catch (error) {
    console.error('❌ Erro ao buscar agendamentos do contato:', error);
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

app.get('/api/appointments/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { clinic_id = 1 } = req.query;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'ID do agendamento inválido' });
    }
    
    console.log(`🔍 Buscando agendamento ID: ${id} para clinic_id: ${clinic_id}`);
    
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', parseInt(id))
      .eq('clinic_id', parseInt(clinic_id as string))
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }
      console.error('❌ Erro ao buscar agendamento:', error);
      return res.status(500).json({ error: 'Erro ao buscar agendamento', details: error.message });
    }
    
    console.log('✅ Agendamento encontrado:', appointment.id);
    res.json(appointment);
  } catch (error) {
    console.error('❌ Erro ao buscar agendamento:', error);
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

app.put('/api/appointments/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'ID do agendamento inválido' });
    }
    
    console.log(`📝 Atualizando agendamento ID: ${id}`, updateData);
    
    // Remove campos que não devem ser atualizados
    const { id: _, clinic_id, created_at, updated_at, ...cleanData } = updateData;
    
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .update({
        ...cleanData,
        updated_at: new Date().toISOString()
      })
      .eq('id', parseInt(id))
      .eq('clinic_id', updateData.clinic_id || 1)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }
      console.error('❌ Erro ao atualizar agendamento:', error);
      return res.status(500).json({ error: 'Erro ao atualizar agendamento', details: error.message });
    }
    
    console.log('✅ Agendamento atualizado:', appointment.id);
    res.json(appointment);
  } catch (error) {
    console.error('❌ Erro ao atualizar agendamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/appointments/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { clinic_id = 1 } = req.query;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'ID do agendamento inválido' });
    }
    
    console.log(`🗑️ Removendo agendamento ID: ${id} para clinic_id: ${clinic_id}`);
    
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .delete()
      .eq('id', parseInt(id))
      .eq('clinic_id', parseInt(clinic_id as string))
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }
      console.error('❌ Erro ao remover agendamento:', error);
      return res.status(500).json({ error: 'Erro ao remover agendamento', details: error.message });
    }
    
    console.log('✅ Agendamento removido:', appointment.id);
    res.json({ success: true, message: 'Agendamento removido com sucesso', appointment });
  } catch (error) {
    console.error('❌ Erro ao remover agendamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============ AVAILABILITY API (Verificação de Disponibilidade) ============

app.post('/api/appointments/availability/check', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { startDateTime, endDateTime, professionalId, excludeAppointmentId } = req.body;
    
    console.log('🔍 Verificando disponibilidade:', {
      startDateTime,
      endDateTime,
      professionalId,
      excludeAppointmentId
    });
    
    if (!startDateTime || !endDateTime) {
      return res.status(400).json({ error: 'startDateTime e endDateTime são obrigatórios' });
    }
    
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Formato de data inválido' });
    }
    
    // Check if the appointment time is in the past
    const now = new Date();
         if (startDate <= now) {
       res.json({
         available: false,
         conflict: true,
         conflictType: 'appointment',
         conflictDetails: {
           id: 'past-time',
           title: 'Horário já passou',
           startTime: startDate.toISOString(),
           endTime: endDate.toISOString()
         }
       });
       return;
     }
    
    // Get all appointments for conflict checking
    let query = supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('clinic_id', 1)
      .not('status', 'in', '(cancelled,no_show,cancelada,cancelada_paciente,cancelada_dentista)');
    
    // Filter by professional if specified
    if (professionalId) {
      query = query.eq('user_id', professionalId);
    }
    
    // Get appointments that might overlap
    query = query
      .lt('scheduled_date', endDate.toISOString())
      .gte('scheduled_date', new Date(startDate.getTime() - 4 * 60 * 60 * 1000).toISOString()); // 4 hours before
    
    const { data: appointments, error } = await query;
    
    if (error) {
      console.error('❌ Erro ao buscar agendamentos para verificação:', error);
      return res.status(500).json({ error: 'Erro ao verificar disponibilidade' });
    }
    
    console.log(`📊 Verificando conflitos em ${appointments?.length || 0} agendamentos`);
    
    // Check for conflicts
    const conflictingAppointments = appointments?.filter(apt => {
      // Skip if this is the appointment being updated
      if (excludeAppointmentId && apt.id === excludeAppointmentId) {
        return false;
      }
      
      const aptStart = new Date(apt.scheduled_date);
      const aptEnd = new Date(aptStart.getTime() + (apt.duration_minutes || 60) * 60000);
      
      // Check for overlap
      const overlaps = startDate < aptEnd && endDate > aptStart;
      
      if (overlaps) {
        console.log(`🚨 Conflito detectado com agendamento ${apt.id}:`, {
          existing: `${aptStart.toISOString()} - ${aptEnd.toISOString()}`,
          requested: `${startDate.toISOString()} - ${endDate.toISOString()}`
        });
      }
      
      return overlaps;
    }) || [];
    
    if (conflictingAppointments.length > 0) {
      const conflict = conflictingAppointments[0];
      
      // Get contact name for better conflict message
      const { data: contact } = await supabaseAdmin
        .from('contacts')
        .select('name')
        .eq('id', conflict.contact_id)
        .single();
      
      const aptStart = new Date(conflict.scheduled_date);
      const aptEnd = new Date(aptStart.getTime() + (conflict.duration_minutes || 60) * 60000);
      
             res.json({
         available: false,
         conflict: true,
         conflictType: 'appointment',
         conflictDetails: {
           id: conflict.id.toString(),
           title: `${conflict.doctor_name || 'Profissional'} - ${contact?.name || 'Paciente'}`,
           startTime: aptStart.toISOString(),
           endTime: aptEnd.toISOString()
         }
       });
       return;
    }
    
    console.log('✅ Horário disponível');
    res.json({
      available: true,
      conflict: false
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar disponibilidade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/appointments/availability/find-slots', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { date, duration = 60, workingHours = { start: '08:00', end: '18:00' }, professionalId } = req.body;
    
    console.log('🔍 Buscando horários disponíveis:', {
      date,
      duration,
      workingHours,
      professionalId
    });
    
    if (!date) {
      return res.status(400).json({ error: 'Data é obrigatória' });
    }
    
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: 'Formato de data inválido' });
    }
    
    // Set up start and end of working day
    const dayStart = new Date(targetDate);
    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    dayStart.setHours(startHour, startMinute, 0, 0);
    
    const dayEnd = new Date(targetDate);
    const [endHour, endMinute] = workingHours.end.split(':').map(Number);
    dayEnd.setHours(endHour, endMinute, 0, 0);
    
    // Get appointments for the day
    let query = supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('clinic_id', 1)
      .not('status', 'in', '(cancelled,no_show,cancelada,cancelada_paciente,cancelada_dentista)')
      .gte('scheduled_date', dayStart.toISOString())
      .lt('scheduled_date', dayEnd.toISOString());
    
    if (professionalId) {
      query = query.eq('user_id', professionalId);
    }
    
    const { data: appointments, error } = await query.order('scheduled_date');
    
    if (error) {
      console.error('❌ Erro ao buscar agendamentos do dia:', error);
      return res.status(500).json({ error: 'Erro ao buscar horários disponíveis' });
    }
    
    console.log(`📊 Encontrados ${appointments?.length || 0} agendamentos para o dia`);
    
    // Convert appointments to busy blocks
    const busyBlocks = (appointments || []).map(apt => {
      const start = new Date(apt.scheduled_date);
      const end = new Date(start.getTime() + (apt.duration_minutes || 60) * 60000);
      return {
        start,
        end,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        type: 'appointment',
        title: `${apt.doctor_name || 'Profissional'} - Consulta`
      };
    });
    
    // Sort busy blocks by start time
    busyBlocks.sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // Find available slots
    const availableSlots = [];
    const slotDuration = duration * 60000; // Convert to milliseconds
    
    // For today, start from current time if it's later than work start
    let currentTime = new Date(dayStart);
    const now = new Date();
    const isToday = targetDate.toDateString() === now.toDateString();
    
    if (isToday && now > dayStart) {
      // Round up to next 30-minute slot
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const nextSlotMinutes = Math.ceil(currentMinutes / 30) * 30;
      const nextSlotTime = new Date(targetDate);
      nextSlotTime.setHours(Math.floor(nextSlotMinutes / 60), nextSlotMinutes % 60, 0, 0);
      
      currentTime = nextSlotTime > dayStart ? nextSlotTime : dayStart;
    }
    
    // Find gaps between busy blocks
    for (const block of busyBlocks) {
      // Check if there's a gap before this block
      if (currentTime < block.start) {
        // Create slots in this gap
        let slotStart = new Date(currentTime);
        while (slotStart.getTime() + slotDuration <= block.start.getTime()) {
          const slotEnd = new Date(slotStart.getTime() + slotDuration);
          availableSlots.push({
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            duration
          });
          slotStart = new Date(slotStart.getTime() + 30 * 60000); // 30-minute intervals
        }
      }
      
      // Update current time to after this block
      currentTime = new Date(Math.max(currentTime.getTime(), block.end.getTime()));
    }
    
    // Check for slots after the last block until end of day
    if (currentTime < dayEnd) {
      let slotStart = new Date(currentTime);
      while (slotStart.getTime() + slotDuration <= dayEnd.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + slotDuration);
        availableSlots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          duration
        });
        slotStart = new Date(slotStart.getTime() + 30 * 60000); // 30-minute intervals
      }
    }
    
    console.log(`✅ Encontrados ${availableSlots.length} horários disponíveis`);
    
    res.json({
      date: targetDate.toISOString().split('T')[0],
      duration,
      workingHours,
      availableSlots,
      busyBlocks: busyBlocks.map(block => ({
        startTime: block.startTime,
        endTime: block.endTime,
        type: block.type,
        title: block.title
      }))
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar horários disponíveis:', error);
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
    
    // Query real data from database with JOIN manual
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
    
    console.log('🔍 Buscando configuração da clínica ID:', clinic_id);
    
    const { data: clinic, error } = await supabaseAdmin
      .from('clinics')
      .select('*')
      .eq('id', Number(clinic_id))
      .single();
    
    if (error) {
      console.error('❌ Erro ao buscar configuração da clínica:', error);
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Clínica não encontrada' });
        return;
      }
      res.status(500).json({ error: 'Erro ao buscar configuração', details: error.message });
      return;
    }
    
    console.log('✅ Configuração da clínica encontrada:', clinic?.name || 'N/A');
    res.json(clinic);
  } catch (error) {
    console.error('❌ Erro ao buscar configuração da clínica:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/clinic/:id/config - Update clinic configuration completely
app.put('/api/clinic/:id/config', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: clinic_id } = req.params;
    const updateData = req.body;
    
    console.log('📝 Atualizando configuração da clínica ID:', clinic_id);
    console.log('📋 Dados recebidos:', Object.keys(updateData));
    
    const { data: updatedClinic, error } = await supabaseAdmin
      .from('clinics')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', Number(clinic_id))
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao atualizar configuração da clínica:', error);
      res.status(500).json({ error: 'Erro ao atualizar configuração', details: error.message });
      return;
    }
    
    console.log('✅ Configuração da clínica atualizada:', updatedClinic?.name || 'N/A');
    res.json(updatedClinic);
  } catch (error) {
    console.error('❌ Erro ao atualizar configuração da clínica:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/clinic/:id/config - Update clinic configuration partially
app.patch('/api/clinic/:id/config', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: clinic_id } = req.params;
    const updateData = req.body;
    
    console.log('🔧 Atualizando parcialmente clínica ID:', clinic_id);
    console.log('📋 Campos a atualizar:', Object.keys(updateData));
    
    const { data: updatedClinic, error } = await supabaseAdmin
      .from('clinics')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', Number(clinic_id))
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao atualizar clínica:', error);
      res.status(500).json({ error: 'Erro ao atualizar clínica', details: error.message });
      return;
    }
    
    console.log('✅ Configuração da clínica atualizada parcialmente:', updatedClinic?.name || 'N/A');
    res.json(updatedClinic);
  } catch (error) {
    console.error('❌ Erro ao atualizar clínica:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/clinic - Create new clinic
app.post('/api/clinic', authMiddleware, async (req: Request, res: Response) => {
  try {
    const clinicData = req.body;
    
    console.log('🏗️ Criando nova clínica:', clinicData.name);
    
    const { data: newClinic, error } = await supabaseAdmin
      .from('clinics')
      .insert({
        ...clinicData,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar clínica:', error);
      res.status(500).json({ error: 'Erro ao criar clínica', details: error.message });
      return;
    }
    
    console.log('✅ Clínica criada com sucesso:', newClinic?.name || 'N/A');
    res.json(newClinic);
  } catch (error) {
    console.error('❌ Erro ao criar clínica:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/clinic/:id - Soft delete clinic (deactivate)
app.delete('/api/clinic/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: clinic_id } = req.params;
    
    console.log('🗑️ Desativando clínica ID:', clinic_id);
    
    const { data: deactivatedClinic, error } = await supabaseAdmin
      .from('clinics')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', Number(clinic_id))
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao desativar clínica:', error);
      res.status(500).json({ error: 'Erro ao desativar clínica', details: error.message });
      return;
    }
    
    console.log('✅ Clínica desativada:', deactivatedClinic?.name || 'N/A');
    res.json({ message: 'Clínica desativada com sucesso', clinic: deactivatedClinic });
  } catch (error) {
    console.error('❌ Erro ao desativar clínica:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/clinics - List clinics (admin function)
app.get('/api/clinics', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { status = 'active', limit = 10 } = req.query;
    
    console.log('🔍 Listando clínicas - Status:', status, 'Limit:', limit);
    
    let query = supabaseAdmin
      .from('clinics')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (status && status !== 'all') {
      query = query.eq('status', String(status));
    }
    
    if (limit) {
      query = query.limit(Number(limit));
    }
    
    const { data: clinics, error } = await query;
    
    if (error) {
      console.error('❌ Erro ao listar clínicas:', error);
      res.status(500).json({ error: 'Erro ao listar clínicas', details: error.message });
      return;
    }
    
    console.log('✅ Clínicas encontradas:', clinics?.length || 0);
    res.json({ clinics: clinics || [], total: clinics?.length || 0 });
  } catch (error) {
    console.error('❌ Erro ao listar clínicas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============ CONVERSATIONS/MESSAGES API ============

// GET /api/conversations-simple - List conversations
app.get('/api/conversations-simple', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { clinic_id = 1, status = 'active', limit = 50 } = req.query;
    
    console.log('💬 Buscando conversas para clinic_id:', clinic_id, 'status:', status);
    
    // Query conversations with existing fields only
    let query = supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('clinic_id', Number(clinic_id));
    
    if (status && status !== 'all') {
      query = query.eq('status', String(status));
    }
    
    if (limit) {
      query = query.limit(Number(limit));
    }
    
    const { data: conversations, error } = await query.order('updated_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar conversas:', error);
      res.status(500).json({ error: 'Erro ao buscar conversas', details: error.message });
      return;
    }
    
    console.log('✅ Conversas encontradas:', conversations?.length || 0);
    
    // If no conversations exist, return empty array
    if (!conversations || conversations.length === 0) {
      res.json({ conversations: [] });
      return;
    }
    
    // Get contact info and last message for each conversation
    const conversationsWithContacts = await Promise.all(
      conversations.map(async (conv) => {
        let contactInfo = { name: 'Contato Desconhecido', phone: '', email: '' };
        
        if (conv.contact_id) {
          const { data: contact } = await supabaseAdmin
            .from('contacts')
            .select('name, phone, email')
            .eq('id', conv.contact_id)
            .single();
          
          if (contact) {
            contactInfo = {
              name: contact.name || 'Contato Desconhecido',
              phone: contact.phone || '',
              email: contact.email || ''
            };
          }
        }
        
        // Get last message for this conversation
        let lastMessage = 'Toque para ver a conversa';
        try {
          const { data: lastMsgData } = await supabaseAdmin
            .from('messages')
            .select('content, timestamp')
            .eq('conversation_id', conv.id)
            .order('timestamp', { ascending: false })
            .limit(1);
          
          if (lastMsgData && lastMsgData.length > 0 && lastMsgData[0]?.content) {
            const content = lastMsgData[0].content;
            lastMessage = content.length > 50 
              ? content.substring(0, 50) + '...'
              : content;
          }
        } catch (msgError) {
          console.warn('⚠️ Erro ao buscar última mensagem para conversa', conv.id, msgError);
        }
        
        return {
          id: conv.id,
          contact_id: conv.contact_id,
          contact_name: contactInfo.name,
          patient_name: contactInfo.name,
          patient_avatar: null,
          last_message: lastMessage,
          last_message_at: conv.updated_at || conv.created_at,
          timestamp: conv.updated_at || conv.created_at,
          updated_at: conv.updated_at,
          unread_count: 0,
          status: conv.status || 'active',
          ai_active: conv.ai_active !== undefined ? conv.ai_active : true,
          ai_pause_reason: conv.ai_pause_reason || null,
          ai_paused_until: conv.ai_paused_until || null,
          ai_paused_by_user_id: conv.ai_paused_by_user_id || null
        };
      })
    );
    
    console.log('✅ Conversas formatadas:', conversationsWithContacts.length);
    res.json({ conversations: conversationsWithContacts });
  } catch (error) {
    console.error('❌ Erro ao buscar conversas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/conversations-simple/:id - Get conversation detail with messages
app.get('/api/conversations-simple/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: conversation_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    console.log('💬 Buscando detalhes da conversa ID:', conversation_id);
    
    // Get conversation info
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversation_id)
      .single();
    
    if (convError) {
      console.error('❌ Erro ao buscar conversa:', convError);
      if (convError.code === 'PGRST116') {
        res.status(404).json({ error: 'Conversa não encontrada' });
        return;
      }
      res.status(500).json({ error: 'Erro ao buscar conversa', details: convError.message });
      return;
    }
    
    // Get contact info
    let contactInfo = { name: 'Contato Desconhecido', phone: '', email: '' };
    if (conversation.contact_id) {
      const { data: contact } = await supabaseAdmin
        .from('contacts')
        .select('name, phone, email')
        .eq('id', conversation.contact_id)
        .single();
      
      if (contact) {
        contactInfo = {
          name: contact.name || 'Contato Desconhecido',
          phone: contact.phone || '',
          email: contact.email || ''
        };
      }
    }
    
    // Get messages for this conversation - usando apenas campos básicos primeiro
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('messages')
      .select('conversation_id, sender_type, content, timestamp, message_type')
      .eq('conversation_id', conversation_id)
      .order('timestamp', { ascending: true })
      .range(Number(offset), Number(offset) + Number(limit) - 1);
    
    let formattedMessages;
    if (msgError) {
      console.error('❌ Erro ao buscar mensagens:', msgError);
      formattedMessages = [];
    } else {
      // Transform messages to match frontend format
      formattedMessages = messages?.map((msg, index) => ({
        id: `msg_${conversation_id}_${index}`,
        conversation_id: msg.conversation_id,
        sender_type: msg.sender_type,
        sender_name: msg.sender_type === 'ai' ? 'Mara AI' : 
                     msg.sender_type === 'professional' ? 'Profissional' : 
                     msg.sender_type === 'patient' ? contactInfo.name : 'Sistema',
        content: msg.content,
        message_type: msg.message_type || 'text',
        timestamp: msg.timestamp,
        created_at: msg.timestamp,
        status: 'sent',
        direction: msg.sender_type === 'patient' ? 'inbound' : 'outbound',
        ai_generated: msg.sender_type === 'ai',
        evolution_status: 'sent',
        attachments: []
      })) || [];
    }
    
    // Try to get conversation actions (notifications) - may not exist
    let formattedActions = [];
    try {
      const { data: actions } = await supabaseAdmin
        .from('conversation_actions')
        .select('*')
        .eq('conversation_id', conversation_id)
        .order('created_at', { ascending: true });
      
      formattedActions = actions?.map(action => ({
        id: action.id,
        action_type: action.action_type,
        title: action.title,
        description: action.description,
        metadata: action.metadata,
        timestamp: action.created_at
      })) || [];
    } catch (actionsError) {
      console.warn('⚠️ Tabela conversation_actions não existe:', actionsError);
    }
    
    const response = {
      conversation: {
        id: conversation.id,
        contact_id: conversation.contact_id,
        patient_name: contactInfo.name,
        status: conversation.status || 'active',
        ai_active: conversation.ai_active !== undefined ? conversation.ai_active : true,
        priority: 'normal',
        title: null,
        professional_id: null,
        unread_count: 0,
        total_messages: formattedMessages.length,
        last_message_at: conversation.updated_at,
        last_activity_at: conversation.updated_at || conversation.created_at
      },
      messages: formattedMessages,
      actions: formattedActions,
      pagination: {
        currentPage: Math.floor(Number(offset) / Number(limit)) + 1,
        limit: Number(limit),
        totalMessages: formattedMessages.length,
        hasMore: formattedMessages.length >= Number(limit),
        isPaginated: true
      }
    };
    
    console.log('✅ Conversa encontrada com', formattedMessages.length, 'mensagens');
    res.json(response);
  } catch (error) {
    console.error('❌ Erro ao buscar detalhes da conversa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/conversations-simple/:id/messages - Send message to conversation
app.post('/api/conversations-simple/:id/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: conversation_id } = req.params;
    const { content, message_type = 'text', sender_name = 'Professional' } = req.body;
    
    console.log('💬 Enviando mensagem para conversa ID:', conversation_id);
    
    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Conteúdo da mensagem é obrigatório' });
      return;
    }
    
    // Create message record - usando apenas campos que existem na tabela public.messages
    // Função para obter timestamp no horário de Brasília
    const getBrasiliaTimestamp = () => {
      const now = new Date();
      const brasiliaOffset = -3 * 60; // GMT-3 em minutos
      const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
      const brasiliaTime = new Date(utcTime + (brasiliaOffset * 60000));
      return brasiliaTime.toISOString();
    };

    const { data: newMessage, error: msgError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversation_id,
        sender_type: 'professional',
        content: content.trim(),
        timestamp: getBrasiliaTimestamp(),
        device_type: 'system', // system para mensagens do chat web
        message_type: message_type || 'text',
        evolution_status: 'pending'
      })
      .select()
      .single();
    
    if (msgError) {
      console.error('❌ Erro ao criar mensagem:', msgError);
      res.status(500).json({ error: 'Erro ao enviar mensagem', details: msgError.message });
      return;
    }
    
    console.log('✅ Mensagem criada com ID:', newMessage.id);
    
    // 🤖 SISTEMA DE PAUSA AUTOMÁTICA DA IA
    console.log('🤖 AI PAUSE: Iniciando processo de pausa automática...');
    
    try {
      const { AiPauseService } = await import('./services/ai-pause.service');
      const aiPauseService = AiPauseService.getInstance();
      
      // Buscar estado atual da conversa antes de processar pausa
      const { data: currentConversation } = await supabaseAdmin
        .from('conversations')
        .select('ai_active, ai_pause_reason')
        .eq('id', conversation_id)
        .single();
      
      console.log('🤖 AI PAUSE: Estado atual da conversa:', {
        conversationId: conversation_id,
        ai_active: currentConversation?.ai_active,
        ai_pause_reason: currentConversation?.ai_pause_reason
      });
      
      // Buscar configuração da Lívia
      const { data: liviaConfig } = await supabaseAdmin
        .from('livia_configurations')
        .select('*')
        .eq('clinic_id', 1)
        .single();
      
      console.log('🤖 AI PAUSE: Configuração Lívia:', liviaConfig);
      
      const aiPauseContext = {
        conversationId: Number(conversation_id),
        clinicId: 1,
        senderId: '4', // Professional ID
        senderType: 'professional' as const,
        deviceType: 'system' as const,
        messageContent: content.trim(),
        timestamp: new Date()
      };
      
      if (!liviaConfig) {
        console.log('⚠️ AI PAUSE: Configuração da Lívia não encontrada, usando padrões');
        const defaultConfig = {
          off_duration: 30,
          off_unit: 'minutes'
        };
        
        const pauseResult = await aiPauseService.processMessage(
          aiPauseContext, 
          defaultConfig as any,
          currentConversation?.ai_active,
          currentConversation?.ai_pause_reason
        );
        console.log('🤖 AI PAUSE: Resultado da análise (config padrão):', pauseResult);
        
        if (pauseResult.shouldPause) {
          const { error: updateError } = await supabaseAdmin
            .from('conversations')
            .update({
              ai_active: false,
              ai_paused_until: pauseResult.pausedUntil?.toISOString(),
              ai_paused_by_user_id: pauseResult.pausedByUserId,
              ai_pause_reason: pauseResult.pauseReason
            })
            .eq('id', conversation_id);
          
          if (updateError) {
            console.error('❌ AI PAUSE: Erro ao aplicar pausa no banco:', updateError);
          } else {
            console.log('✅ AI PAUSE: Pausa automática aplicada com sucesso!');
          }
        }
      } else {
        const pauseResult = await aiPauseService.processMessage(
          aiPauseContext, 
          liviaConfig,
          currentConversation?.ai_active,
          currentConversation?.ai_pause_reason
        );
        console.log('🤖 AI PAUSE: Resultado da análise:', pauseResult);
        
        if (pauseResult.shouldPause) {
          const { error: updateError } = await supabaseAdmin
            .from('conversations')
            .update({
              ai_active: false,
              ai_paused_until: pauseResult.pausedUntil?.toISOString(),
              ai_paused_by_user_id: pauseResult.pausedByUserId,
              ai_pause_reason: pauseResult.pauseReason
            })
            .eq('id', conversation_id);
          
          if (updateError) {
            console.error('❌ AI PAUSE: Erro ao aplicar pausa no banco:', updateError);
          } else {
            console.log('✅ AI PAUSE: Pausa automática aplicada com sucesso!');
          }
        }
      }
      
    } catch (pauseError: any) {
      console.error('❌ AI PAUSE: Erro no sistema de pausa automática:', {
        error: pauseError.message,
        conversationId: conversation_id
      });
      // Não interrompe o fluxo - sistema de pausa é opcional
    }
    
    // Update conversation last activity
    const { error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', conversation_id);
    
    if (updateError) {
      console.warn('⚠️ Erro ao atualizar última atividade da conversa:', updateError);
    }
    
    console.log('✅ Mensagem enviada com sucesso para conversa', conversation_id);
    res.json({
      success: true,
      message: {
        id: newMessage.id,
        conversation_id: newMessage.conversation_id,
        sender_type: newMessage.sender_type,
        content: newMessage.content,
        timestamp: newMessage.timestamp,
        evolution_status: newMessage.evolution_status,
        status: 'sent'
      }
    });
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/conversations - Create new conversation
app.post('/api/conversations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { contact_id, clinic_id = 1, professional_id, title } = req.body;
    
    console.log('💬 Criando nova conversa para contato ID:', contact_id);
    
    if (!contact_id) {
      res.status(400).json({ error: 'contact_id é obrigatório' });
      return;
    }
    
    const { data: newConversation, error } = await supabaseAdmin
      .from('conversations')
      .insert({
        clinic_id: Number(clinic_id),
        contact_id: Number(contact_id),
        professional_id: professional_id ? Number(professional_id) : null,
        title: title || null,
        status: 'active',
        priority: 'normal',
        ai_active: true,
        total_messages: 0,
        unread_count: 0,
        last_activity_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar conversa:', error);
      res.status(500).json({ error: 'Erro ao criar conversa', details: error.message });
      return;
    }
    
    console.log('✅ Conversa criada com sucesso ID:', newConversation.id);
    res.json(newConversation);
  } catch (error) {
    console.error('❌ Erro ao criar conversa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/conversations/:id/ai-toggle - Toggle AI active status
app.patch('/api/conversations/:id/ai-toggle', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: conversation_id } = req.params;
    const { ai_active } = req.body;
    
    console.log('🤖 Alterando status da IA para conversa ID:', conversation_id, 'ai_active:', ai_active);
    
    if (typeof ai_active !== 'boolean') {
      res.status(400).json({ error: 'ai_active deve ser um boolean' });
      return;
    }
    
    // Preparar dados de atualização com override manual
    let updateData: any = { 
      ai_active: ai_active, 
      updated_at: new Date().toISOString() 
    };
    
    if (ai_active === true) {
      // 🔥 OVERRIDE MANUAL: Limpar pausa automática quando ativando IA manualmente
      updateData.ai_paused_until = null;
      updateData.ai_pause_reason = null;
      updateData.ai_paused_by_user_id = null;
      console.log('🔥 Manual override - clearing automatic pause and activating AI');
    }

    const { data: updatedConversation, error } = await supabaseAdmin
      .from('conversations')
      .update(updateData)
      .eq('id', conversation_id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao alterar status da IA:', error);
      res.status(500).json({ error: 'Erro ao alterar status da IA', details: error.message });
      return;
    }
    
    console.log('✅ Status da IA alterado para conversa', conversation_id);
    res.json({
      success: true,
      ai_active: updatedConversation.ai_active,
      conversation_id: updatedConversation.id
    });
  } catch (error) {
    console.error('❌ Erro ao alterar status da IA:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/conversations/:id - Update conversation
app.put('/api/conversations/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: conversation_id } = req.params;
    const updateData = req.body;
    
    console.log('📝 Atualizando conversa ID:', conversation_id);
    
    const { data: updatedConversation, error } = await supabaseAdmin
      .from('conversations')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', Number(conversation_id))
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao atualizar conversa:', error);
      res.status(500).json({ error: 'Erro ao atualizar conversa', details: error.message });
      return;
    }
    
    console.log('✅ Conversa atualizada:', conversation_id);
    res.json(updatedConversation);
  } catch (error) {
    console.error('❌ Erro ao atualizar conversa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/conversations/:id - Archive conversation (soft delete)
app.delete('/api/conversations/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: conversation_id } = req.params;
    
    console.log('🗑️ Arquivando conversa ID:', conversation_id);
    
    const { data: archivedConversation, error } = await supabaseAdmin
      .from('conversations')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString()
      })
      .eq('id', Number(conversation_id))
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao arquivar conversa:', error);
      res.status(500).json({ error: 'Erro ao arquivar conversa', details: error.message });
      return;
    }
    
    console.log('✅ Conversa arquivada:', conversation_id);
    res.json({ message: 'Conversa arquivada com sucesso', conversation: archivedConversation });
  } catch (error) {
    console.error('❌ Erro ao arquivar conversa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/messages/:id - Get specific message
app.get('/api/messages/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: message_id } = req.params;
    
    console.log('💬 Buscando mensagem ID:', message_id);
    
    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .select(`
        *,
        message_attachments(*)
      `)
      .eq('id', Number(message_id))
      .single();
    
    if (error) {
      console.error('❌ Erro ao buscar mensagem:', error);
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Mensagem não encontrada' });
        return;
      }
      res.status(500).json({ error: 'Erro ao buscar mensagem', details: error.message });
      return;
    }
    
    console.log('✅ Mensagem encontrada:', message_id);
    res.json({
      ...message,
      attachments: message.message_attachments || []
    });
  } catch (error) {
    console.error('❌ Erro ao buscar mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/messages/:id - Update message
app.put('/api/messages/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: message_id } = req.params;
    const updateData = req.body;
    
    console.log('📝 Atualizando mensagem ID:', message_id);
    
    const { data: updatedMessage, error } = await supabaseAdmin
      .from('messages')
      .update(updateData)
      .eq('id', Number(message_id))
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao atualizar mensagem:', error);
      res.status(500).json({ error: 'Erro ao atualizar mensagem', details: error.message });
      return;
    }
    
    console.log('✅ Mensagem atualizada:', message_id);
    res.json(updatedMessage);
  } catch (error) {
    console.error('❌ Erro ao atualizar mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/messages/:id - Delete message
app.delete('/api/messages/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: message_id } = req.params;
    
    console.log('🗑️ Removendo mensagem ID:', message_id);
    
    const { error } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('id', Number(message_id));
    
    if (error) {
      console.error('❌ Erro ao remover mensagem:', error);
      res.status(500).json({ error: 'Erro ao remover mensagem', details: error.message });
      return;
    }
    
    console.log('✅ Mensagem removida:', message_id);
    res.json({ message: 'Mensagem removida com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao remover mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/conversations/:id/actions - Create conversation action/notification
app.post('/api/conversations/:id/actions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: conversation_id } = req.params;
    const { action_type, title, description, metadata, related_entity_type, related_entity_id } = req.body;
    
    console.log('📝 Criando ação para conversa ID:', conversation_id, 'tipo:', action_type);
    
    const { data: newAction, error } = await supabaseAdmin
      .from('conversation_actions')
      .insert({
        clinic_id: 1, // TODO: Get from auth context
        conversation_id: Number(conversation_id),
        action_type: action_type,
        title: title,
        description: description,
        metadata: metadata || {},
        related_entity_type: related_entity_type || null,
        related_entity_id: related_entity_id || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar ação:', error);
      res.status(500).json({ error: 'Erro ao criar ação', details: error.message });
      return;
    }
    
    console.log('✅ Ação criada com sucesso:', newAction.id);
    res.json(newAction);
  } catch (error) {
    console.error('❌ Erro ao criar ação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============ UPLOAD & MEDIA ENDPOINTS ============

// POST /api/conversations/:id/upload - Upload documents/images/videos
app.post('/api/conversations/:id/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const conversationId = req.params.id;
    const { caption, sendToWhatsApp = 'true', messageType } = req.body;
    
    console.log('📤 Upload request for conversation:', conversationId);
    console.log('📁 File info:', req.file ? {
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    } : 'No file');

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
      return;
    }

    // Validate file
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (req.file.size > maxSize) {
      res.status(400).json({
        success: false,
        error: `Arquivo muito grande. Máximo: ${Math.round(maxSize / 1024 / 1024)}MB`
      });
      return;
    }

    // Validate conversation exists
    console.log('🔍 Validating conversation exists...');
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, contact_id, clinic_id')
      .eq('id', conversationId)
      .eq('clinic_id', 1) // For now, hardcode clinic_id
      .single();

    if (convError || !conversation) {
      console.error('❌ Conversation not found:', convError);
      res.status(404).json({
        success: false,
        error: `Conversa ${conversationId} não encontrada`
      });
      return;
    }

    console.log('✅ Conversation found:', { id: conversation.id, contact_id: conversation.contact_id });

    // Sanitize filename and prepare upload
    const sanitizedFilename = sanitizeFilename(req.file.originalname);
    const timestamp = Date.now();
    const category = getCategoryFromMime(req.file.mimetype);
    const storagePath = `clinic-1/conversation-${conversationId}/${category}/${timestamp}-${sanitizedFilename}`;

    console.log('📤 Uploading to Supabase Storage:', storagePath);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('conversation-attachments')
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      res.status(500).json({
        success: false,
        error: `Erro no upload: ${uploadError.message}`
      });
      return;
    }

    console.log('✅ Upload successful:', uploadData.path);

    // Create signed URL (24 hours)
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from('conversation-attachments')
      .createSignedUrl(storagePath, 86400);

    if (signedError) {
      console.error('❌ Error creating signed URL:', signedError);
      res.status(500).json({
        success: false,
        error: `Erro ao gerar URL: ${signedError.message}`
      });
      return;
    }

    console.log('✅ Signed URL created');

    // Create message in database
    const messageContent = caption && caption.trim() ? caption.trim() : '';
    const finalMessageType = messageType || getMimeToMessageType(req.file.mimetype);

    const { data: newMessage, error: msgError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: parseInt(conversationId),
        sender_type: 'professional',
        content: messageContent,
        message_type: finalMessageType,
        device_type: 'system',
        evolution_status: 'pending'
      })
      .select()
      .single();

    if (msgError) {
      console.error('❌ Error creating message:', msgError);
      res.status(500).json({
        success: false,
        error: 'Erro ao criar mensagem'
      });
      return;
    }

    console.log('✅ Message created:', newMessage.id);

    // Create attachment record
    const { data: attachment, error: attachError } = await supabaseAdmin
      .from('message_attachments')
      .insert({
        message_id: newMessage.id,
        clinic_id: conversation.clinic_id,
        file_name: req.file.originalname,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        file_url: signedData.signedUrl
      })
      .select()
      .single();

    if (attachError) {
      console.error('❌ Error creating attachment:', attachError);
      res.status(500).json({
        success: false,
        error: 'Erro ao criar anexo'
      });
      return;
    }

    console.log('✅ Attachment created:', attachment.id);

    // Send to WhatsApp if requested
    let whatsappResult = { sent: false, messageId: undefined, error: undefined };
    
    if (sendToWhatsApp === 'true') {
      console.log('📱 Sending to WhatsApp...');
      
      try {
        // Get active WhatsApp instance
        const { data: instanceArray, error: instanceError } = await supabaseAdmin
          .from('whatsapp_numbers')
          .select('*')
          .eq('clinic_id', conversation.clinic_id)
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(1);

        if (instanceError || !instanceArray?.[0]) {
          console.error('❌ No active WhatsApp instance found');
          whatsappResult.error = 'Nenhuma instância WhatsApp ativa encontrada';
        } else {
          const activeInstance = instanceArray[0];
          console.log('✅ WhatsApp instance found:', activeInstance.instance_name);

          // Get contact phone
          const { data: contact, error: contactError } = await supabaseAdmin
            .from('contacts')
            .select('phone')
            .eq('id', conversation.contact_id)
            .single();

          if (contactError || !contact?.phone) {
            console.error('❌ Contact phone not found');
            whatsappResult.error = 'Telefone do contato não encontrado';
          } else {
            console.log('📞 Contact phone:', contact.phone);

            // Send media via Evolution API
            const evolutionUrl = process.env.EVOLUTION_API_URL;
            const evolutionApiKey = process.env.EVOLUTION_API_KEY;
            
            if (!evolutionUrl || !evolutionApiKey) {
              console.error('❌ Evolution API credentials not configured');
              whatsappResult.error = 'API Evolution não configurada';
            } else {
              const mediaType = getEvolutionMediaType(req.file.mimetype);
              const evolutionPayload: any = {
                number: contact.phone,
                [mediaType]: signedData.signedUrl,
                delay: 1000
              };

              // Add caption for non-audio files
              if (mediaType !== 'audio' && caption) {
                evolutionPayload.caption = caption;
              }

              // Add filename for documents
              if (mediaType === 'document') {
                evolutionPayload.fileName = req.file.originalname;
              }

              console.log('🚀 Sending to Evolution API:', {
                instance: activeInstance.instance_name,
                mediaType,
                phone: contact.phone
              });

              const evolutionResponse = await fetch(
                `${evolutionUrl}/message/send${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}/${activeInstance.instance_name}`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': evolutionApiKey
                  },
                  body: JSON.stringify(evolutionPayload)
                }
              );

              if (evolutionResponse.ok) {
                const evolutionResult = await evolutionResponse.json();
                console.log('✅ WhatsApp sent successfully');
                whatsappResult = {
                  sent: true,
                  messageId: evolutionResult.key?.id
                };

                // Update message status
                await supabaseAdmin
                  .from('messages')
                  .update({ evolution_status: 'sent' })
                  .eq('id', newMessage.id);
              } else {
                const errorText = await evolutionResponse.text();
                console.error('❌ Evolution API error:', errorText);
                whatsappResult.error = `Erro da API Evolution: ${evolutionResponse.status}`;
                
                await supabaseAdmin
                  .from('messages')
                  .update({ evolution_status: 'failed' })
                  .eq('id', newMessage.id);
              }
            }
          }
        }
      } catch (whatsappError: any) {
        console.error('❌ WhatsApp sending failed:', whatsappError);
        whatsappResult.error = whatsappError.message || 'Erro desconhecido';
        
        await supabaseAdmin
          .from('messages')
          .update({ evolution_status: 'failed' })
          .eq('id', newMessage.id);
      }
    }

    // Apply AI Pause system
    try {
      console.log('🤖 Applying AI Pause system...');
      const aiPauseService = await import('./services/ai-pause.service');
      const aiPause = aiPauseService.AiPauseService.getInstance();
      
      // Get current conversation state
      const { data: currentConv } = await supabaseAdmin
        .from('conversations')
        .select('ai_active, ai_pause_reason')
        .eq('id', conversationId)
        .single();

      // Get Lívia configuration
      const { data: liviaConfig } = await supabaseAdmin
        .from('livia_configurations')
        .select('*')
        .eq('clinic_id', conversation.clinic_id)
        .single();

      const pauseContext = {
        conversationId: conversationId,
        clinicId: conversation.clinic_id,
        senderId: '4', // Default professional ID
        senderType: 'professional' as const,
        deviceType: 'manual' as const,
        messageContent: `[Arquivo: ${req.file.originalname}]`,
        timestamp: new Date()
      };

      const pauseResult = await aiPause.processMessage(
        pauseContext,
        liviaConfig || { off_duration: 30, off_unit: 'minutes' },
        currentConv?.ai_active,
        currentConv?.ai_pause_reason
      );

      if (pauseResult.shouldPause) {
        await supabaseAdmin
          .from('conversations')
          .update({
            ai_active: false,
            ai_paused_until: pauseResult.pausedUntil?.toISOString(),
            ai_paused_by_user_id: pauseResult.pausedByUserId,
            ai_pause_reason: pauseResult.pauseReason
          })
          .eq('id', conversationId);

        console.log('✅ AI Pause applied successfully');
      }
    } catch (aiPauseError) {
      console.error('❌ AI Pause error:', aiPauseError);
      // Don't block upload for AI Pause errors
    }

    console.log('🎉 Upload complete!');
    res.json({
      success: true,
      data: {
        message: newMessage,
        attachment,
        signedUrl: signedData.signedUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        whatsapp: whatsappResult
      }
    });

  } catch (error: any) {
    console.error('💥 Upload failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

// AUDIO ENDPOINT REMOVIDO - Implementação duplicada removida para evitar conflitos
  try {
    const conversationId = req.params.conversationId;
    const { caption, sendToWhatsApp = 'true', messageType } = req.body;
    
    console.log('📤 Upload request for conversation:', conversationId);
    console.log('📁 File info:', req.file ? {
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    } : 'No file');

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/mov', 'video/avi', 'video/webm',
      'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/webm', 'audio/mp4',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
      res.status(400).json({
        success: false,
        error: `Tipo de arquivo não suportado: ${req.file.mimetype}`
      });
      return;
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (req.file.size > maxSize) {
      res.status(400).json({
        success: false,
        error: `Arquivo muito grande. Máximo: ${Math.round(maxSize / 1024 / 1024)}MB`
      });
      return;
    }

    // Sanitize filename
    const sanitizeFilename = (filename: string): string => {
      if (!filename) return 'unnamed-file';
      
      const characterMap: { [key: string]: string } = {
        'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Æ': 'AE',
        'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
        'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
        'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O', 'Ø': 'O',
        'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
        'Ç': 'C', 'Ñ': 'N', 'Ý': 'Y',
        'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae',
        'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
        'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
        'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o',
        'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
        'ç': 'c', 'ñ': 'n', 'ý': 'y', 'ÿ': 'y',
        ' ': '_', '\t': '_', '\n': '_', '\r': '_',
        '!': '', '?': '', '@': '', '#': '', '$': '', '%': '', '&': '', '*': '',
        '(': '', ')': '', '[': '', ']': '', '{': '', '}': '', '|': '', '\\': '',
        '/': '_', ':': '', ';': '', '<': '', '>': '', '=': '', '+': '', '~': '',
        '`': '', "'": '', '"': '', ',': '', '^': ''
      };
      
      let sanitized = filename
        .split('')
        .map(char => {
          if (characterMap.hasOwnProperty(char)) {
            return characterMap[char];
          }
          const code = char.charCodeAt(0);
          if ((code >= 48 && code <= 57) ||  // 0-9
              (code >= 65 && code <= 90) ||  // A-Z
              (code >= 97 && code <= 122) || // a-z
              code === 46 ||                 // .
              code === 45 ||                 // -
              code === 95) {                 // _
            return char;
          }
          return '';
        })
        .join('')
        .replace(/_{2,}/g, '_')
        .replace(/\.{2,}/g, '.')
        .replace(/^[._-]+|[._-]+$/g, '')
        .toLowerCase();
      
      if (!sanitized || sanitized.length === 0 || sanitized === '.' || sanitized === '_') {
        const timestamp = Date.now();
        const extension = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() || 'file' : 'file';
        sanitized = `arquivo_${timestamp}.${extension}`;
      }
      
      return sanitized;
    };

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const sanitizedFilename = sanitizeFilename(req.file.originalname);
    const category = req.file.mimetype.startsWith('image/') ? 'images' :
                    req.file.mimetype.startsWith('audio/') ? 'audio' :
                    req.file.mimetype.startsWith('video/') ? 'videos' : 'documents';
    const storagePath = `clinic-1/conversation-${conversationId}/${category}/${timestamp}-${sanitizedFilename}`;

    console.log('📤 Uploading to Supabase Storage:', storagePath);

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('conversation-attachments')
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        duplex: 'half'
      });

    if (uploadError) {
      console.error('❌ Supabase upload error:', uploadError);
      res.status(500).json({
        success: false,
        error: 'Erro no upload para Supabase Storage'
      });
      return;
    }

    console.log('✅ Upload completed:', uploadData.path);

    // Create signed URL (24 hours)
    const { data: signedUrl, error: urlError } = await supabaseAdmin.storage
      .from('conversation-attachments')
      .createSignedUrl(storagePath, 86400);

    if (urlError) {
      console.error('❌ Error creating signed URL:', urlError);
      res.status(500).json({
        success: false,
        error: 'Erro ao criar URL de acesso'
      });
      return;
    }

    console.log('✅ Signed URL created');

    // Map MIME type to message type
    const getMessageType = (mimeType: string): string => {
      if (mimeType.startsWith('image/')) return 'image';
      if (mimeType.startsWith('audio/')) return 'audio_file';
      if (mimeType.startsWith('video/')) return 'video';
      return 'document';
    };

    // Create message
    const messageContent = caption && caption.trim() ? caption.trim() : '';
    const finalMessageType = messageType || getMessageType(req.file.mimetype);

    const { data: newMessage, error: msgError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'professional',
        content: messageContent,
        timestamp: new Date().toISOString(),
        device_type: 'manual',
        message_type: finalMessageType,
        evolution_status: 'pending'
      })
      .select()
      .single();

    if (msgError) {
      console.error('❌ Error creating message:', msgError);
      res.status(500).json({
        success: false,
        error: 'Erro ao criar mensagem'
      });
      return;
    }

    // Create attachment
    const { data: newAttachment, error: attachError } = await supabaseAdmin
      .from('message_attachments')
      .insert({
        message_id: newMessage.id,
        clinic_id: 1,
        file_name: req.file.originalname,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        file_url: signedUrl.signedUrl
      })
      .select()
      .single();

    if (attachError) {
      console.error('❌ Error creating attachment:', attachError);
      res.status(500).json({
        success: false,
        error: 'Erro ao criar anexo'
      });
      return;
    }

    console.log('✅ Message and attachment created');

    // AI Pause System for uploads (background)
    setImmediate(async () => {
      try {
        const { AiPauseService } = await import('./services/ai-pause.service');
        const aiPauseService = AiPauseService.getInstance();
        
        const { data: currentConversation } = await supabaseAdmin
          .from('conversations')
          .select('ai_active, ai_pause_reason')
          .eq('id', conversationId)
          .single();
        
        const { data: liviaConfig } = await supabaseAdmin
          .from('livia_configurations')
          .select('*')
          .eq('clinic_id', 1)
          .single();
        
        const aiPauseContext = {
          conversationId: Number(conversationId),
          clinicId: 1,
          senderId: '4',
          senderType: 'professional' as const,
          deviceType: 'manual' as const,
          messageContent: `[Arquivo: ${req.file!.originalname}]`,
          timestamp: new Date()
        };
        
        const config = liviaConfig || { off_duration: 30, off_unit: 'minutes' };
        const pauseResult = await aiPauseService.processMessage(
          aiPauseContext,
          config as any,
          currentConversation?.ai_active,
          currentConversation?.ai_pause_reason
        );
        
        if (pauseResult.shouldPause) {
          await supabaseAdmin
            .from('conversations')
            .update({
              ai_active: false,
              ai_paused_until: pauseResult.pausedUntil?.toISOString(),
              ai_paused_by_user_id: pauseResult.pausedByUserId,
              ai_pause_reason: pauseResult.pauseReason
            })
            .eq('id', conversationId);
          
          console.log('✅ AI Pause applied for upload');
        }
      } catch (error) {
        console.error('❌ AI Pause error for upload:', error);
      }
    });

    // Send to WhatsApp (background)
    if (sendToWhatsApp === 'true') {
      setImmediate(async () => {
        try {
          console.log('📱 Sending file to WhatsApp via Evolution API...');
          
          // Get active WhatsApp instance
          const { data: activeInstance } = await supabaseAdmin
            .from('whatsapp_numbers')
            .select('*')
            .eq('clinic_id', 1)
            .eq('status', 'open')
            .limit(1)
            .single();

          if (!activeInstance) {
            console.log('❌ No active WhatsApp instance found');
            await supabaseAdmin
              .from('messages')
              .update({ evolution_status: 'failed' })
              .eq('id', newMessage.id);
            return;
          }

          // Get conversation contact
          const { data: conversation } = await supabaseAdmin
            .from('conversations')
            .select(`
              id,
              contacts (phone)
            `)
            .eq('id', conversationId)
            .single();

          if (!conversation?.contacts?.phone) {
            console.log('❌ No contact phone found');
            await supabaseAdmin
              .from('messages')
              .update({ evolution_status: 'failed' })
              .eq('id', newMessage.id);
            return;
          }

          // Download file and convert to base64
          const response = await fetch(signedUrl.signedUrl);
          if (!response.ok) {
            throw new Error(`Failed to download file: ${response.status}`);
          }
          
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64File = buffer.toString('base64');

          // Send to Evolution API
          const evolutionUrl = process.env.EVOLUTION_API_URL || 'https://n8n-evolution-api.4gmy9o.easypanel.host';
          const evolutionApiKey = process.env.EVOLUTION_API_KEY;

          let evolutionEndpoint;
          let payload: any;

          if (req.file!.mimetype.startsWith('image/')) {
            evolutionEndpoint = `/message/sendMedia/${activeInstance.instance_name}`;
            payload = {
              number: conversation.contacts.phone,
              mediatype: 'image',
              media: base64File,
              caption: caption || ''
            };
          } else if (req.file!.mimetype.startsWith('audio/')) {
            evolutionEndpoint = `/message/sendWhatsAppAudio/${activeInstance.instance_name}`;
            payload = {
              number: conversation.contacts.phone,
              audio: base64File
            };
          } else if (req.file!.mimetype.startsWith('video/')) {
            evolutionEndpoint = `/message/sendMedia/${activeInstance.instance_name}`;
            payload = {
              number: conversation.contacts.phone,
              mediatype: 'video',
              media: base64File,
              caption: caption || ''
            };
          } else {
            // Document
            evolutionEndpoint = `/message/sendMedia/${activeInstance.instance_name}`;
            payload = {
              number: conversation.contacts.phone,
              mediatype: 'document',
              media: base64File,
              fileName: req.file!.originalname,
              caption: caption || ''
            };
          }

          const evolutionResponse = await fetch(`${evolutionUrl}${evolutionEndpoint}`, {
            method: 'POST',
            headers: {
              'apikey': evolutionApiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          if (evolutionResponse.ok) {
            const result = await evolutionResponse.json();
            console.log('✅ File sent to WhatsApp successfully');
            
            await supabaseAdmin
              .from('messages')
              .update({ evolution_status: 'sent' })
              .eq('id', newMessage.id);
          } else {
            console.error('❌ Evolution API error:', evolutionResponse.status);
            await supabaseAdmin
              .from('messages')
              .update({ evolution_status: 'failed' })
              .eq('id', newMessage.id);
          }
        } catch (error) {
          console.error('❌ WhatsApp sending error:', error);
          await supabaseAdmin
            .from('messages')
            .update({ evolution_status: 'failed' })
            .eq('id', newMessage.id);
        }
      });
    }

    res.json({
      success: true,
      data: {
        message: newMessage,
        attachment: newAttachment,
        signedUrl: signedUrl.signedUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        whatsapp: {
          queued: sendToWhatsApp === 'true'
        }
      }
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/audio/voice-message/:conversationId - Audio recording upload
app.post('/api/audio/voice-message/:conversationId', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const conversationId = req.params.conversationId;
    
    console.log('🎤 Audio voice message upload for conversation:', conversationId);
    
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'Arquivo de áudio não encontrado'
      });
      return;
    }

    console.log('🎤 Audio file info:', {
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    });

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const fileName = `voice_${timestamp}_${req.file.originalname}`;
    const filePath = `clinic-1/conversation-${conversationId}/audio/${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('conversation-attachments')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        duplex: 'half'
      });
    
    if (uploadError) {
      console.error('❌ Audio upload error:', uploadError);
      res.status(500).json({
        success: false,
        error: 'Falha no upload do áudio'
      });
      return;
    }
    
    console.log('✅ Audio uploaded to Supabase Storage');
    
    // Create signed URL (1 hour for audio)
    const { data: publicUrl, error: urlError } = await supabaseAdmin.storage
      .from('conversation-attachments')
      .createSignedUrl(filePath, 3600);
    
    if (urlError) {
      console.error('❌ Error creating audio URL:', urlError);
      res.status(500).json({
        success: false,
        error: 'Falha ao criar URL do áudio'
      });
      return;
    }
    
    console.log('✅ Audio URL created');
    
    // Create message
    const { data: newMessage, error: msgError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'professional',
        content: 'Mensagem de voz',
        timestamp: new Date().toISOString(),
        device_type: 'manual',
        message_type: 'audio_voice',
        evolution_status: 'pending'
      })
      .select()
      .single();
    
    if (msgError) {
      console.error('❌ Error creating audio message:', msgError);
      res.status(500).json({
        success: false,
        error: 'Erro ao criar mensagem de áudio'
      });
      return;
    }
    
    // Create attachment
    const { data: newAttachment, error: attachError } = await supabaseAdmin
      .from('message_attachments')
      .insert({
        message_id: newMessage.id,
        clinic_id: 1,
        file_name: req.file.originalname,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        file_url: publicUrl.signedUrl
      })
      .select()
      .single();
    
    if (attachError) {
      console.error('❌ Error creating audio attachment:', attachError);
      res.status(500).json({
        success: false,
        error: 'Erro ao criar anexo de áudio'
      });
      return;
    }
    
    console.log('✅ Audio message and attachment created');

    // Send to WhatsApp (background)
    setImmediate(async () => {
      try {
        console.log('🎤 Sending audio to WhatsApp...');
        
        // Get active instance and conversation
        const { data: activeInstance } = await supabaseAdmin
          .from('whatsapp_numbers')
          .select('*')
          .eq('clinic_id', 1)
          .eq('status', 'open')
          .limit(1)
          .single();

        if (!activeInstance) {
          console.log('❌ No active WhatsApp instance');
          return;
        }

        const { data: conversation } = await supabaseAdmin
          .from('conversations')
          .select(`
            id,
            contacts (phone)
          `)
          .eq('id', conversationId)
          .single();

        if (!conversation?.contacts?.phone) {
          console.log('❌ No contact phone for audio');
          return;
        }

        // Download and convert to base64
        const response = await fetch(publicUrl.signedUrl);
        if (!response.ok) {
          throw new Error(`Failed to download audio: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Audio = buffer.toString('base64');

        // Send to Evolution API
        const evolutionUrl = process.env.EVOLUTION_API_URL || 'https://n8n-evolution-api.4gmy9o.easypanel.host';
        const evolutionApiKey = process.env.EVOLUTION_API_KEY;

        const audioPayload = {
          number: conversation.contacts.phone,
          audio: base64Audio,
          delay: 1000
        };
        
        const evolutionResponse = await fetch(`${evolutionUrl}/message/sendWhatsAppAudio/${activeInstance.instance_name}`, {
          method: 'POST',
          headers: {
            'apikey': evolutionApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(audioPayload)
        });

        if (evolutionResponse.ok) {
          console.log('✅ Audio sent to WhatsApp successfully');
          await supabaseAdmin
            .from('messages')
            .update({ evolution_status: 'sent' })
            .eq('id', newMessage.id);
        } else {
          console.error('❌ Audio Evolution API error:', evolutionResponse.status);
          await supabaseAdmin
            .from('messages')
            .update({ evolution_status: 'failed' })
            .eq('id', newMessage.id);
        }
      } catch (error) {
        console.error('❌ Audio WhatsApp error:', error);
        await supabaseAdmin
          .from('messages')
          .update({ evolution_status: 'failed' })
          .eq('id', newMessage.id);
      }
    });

    res.json({
      success: true,
      data: {
        message: newMessage,
        attachment: newAttachment,
        whatsapp: {
          queued: true
        }
      },
      message: 'Áudio enviado com sucesso'
    });

  } catch (error) {
    console.error('❌ Audio upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/audio-proxy/:storagePath - Serve audio files publicly
app.get('/api/audio-proxy/:storagePath(*)', async (req: Request, res: Response) => {
  try {
    const storagePath = decodeURIComponent(req.params.storagePath);
    console.log('🔗 Audio proxy request for:', storagePath);
    
    // Download from Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('conversation-attachments')
      .download(storagePath);
    
    if (error) {
      console.error('❌ Error downloading audio:', error);
      res.status(404).json({ error: 'Audio file not found' });
      return;
    }
    
    // Serve file with correct headers
    res.setHeader('Content-Type', 'audio/webm');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // Convert Blob to Buffer and send
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('✅ Audio proxy serving file:', storagePath, 'Size:', buffer.length);
    res.send(buffer);
    
  } catch (error) {
    console.error('❌ Audio proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ STATIC FILES ============

// Serve static files from dist directory
// When compiled, server is in dist/server/, so frontend is in dist/ (go up one level)
const distPath = path.join(__dirname, '..');
console.log('📁 Verificando diretório de build:', distPath);
console.log('📁 Diretório atual do servidor:', __dirname);

// Check if dist directory exists and log its contents
if (fs.existsSync(distPath)) {
  console.log('✅ Diretório dist encontrado!');
  
  try {
    const distContents = fs.readdirSync(distPath);
    console.log('📂 Conteúdo do dist:', distContents);
    
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log('✅ index.html encontrado no dist');
    } else {
      console.log('❌ index.html NÃO encontrado no dist');
    }
  } catch (error) {
    console.error('❌ Erro ao ler conteúdo do dist:', error);
  }
  
  app.use(express.static(distPath));
  
  // Serve index.html for all non-API routes (SPA routing)
  app.get('*', (req: Request, res: Response) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'API endpoint not found' });
      return;
    }
    
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(500).send(`
        <html>
          <body>
            <h1>Operabase Railway Server</h1>
            <p>❌ index.html não encontrado em: ${indexPath}</p>
            <p>API está funcionando em: <a href="/api">/api</a></p>
          </body>
        </html>
      `);
    }
  });
} else {
  console.log('❌ Diretório dist não encontrado:', distPath);
  console.log('📁 Listando diretório pai:', path.join(__dirname, '..'));
  
  try {
    const parentContents = fs.readdirSync(path.join(__dirname, '..'));
    console.log('📂 Conteúdo do diretório pai:', parentContents);
  } catch (error) {
    console.error('❌ Erro ao ler diretório pai:', error);
  }
  
  // Serve a detailed message if build doesn't exist
  app.get('*', (req: Request, res: Response) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'API endpoint not found' });
      return;
    }
    
    res.send(`
      <html>
        <head>
          <title>Operabase Railway Server</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .error { color: #d32f2f; background: #ffebee; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .info { color: #1976d2; background: #e3f2fd; padding: 15px; border-radius: 4px; margin: 20px 0; }
            code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
            a { color: #1976d2; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚀 Operabase Railway Server</h1>
            
            <div class="error">
              <strong>❌ Frontend Build Não Encontrado</strong><br>
              O diretório <code>dist/</code> não foi encontrado no servidor.
            </div>
            
            <div class="info">
              <strong>🔧 Como resolver:</strong><br>
              1. Verificar se o build do frontend está sendo executado no Railway<br>
              2. Comando esperado: <code>npm run build:railway</code><br>
              3. Deve gerar a pasta <code>dist/</code> com os arquivos do React
            </div>
            
            <h3>✅ API Backend Funcionando:</h3>
            <ul>
              <li><a href="/api">/api</a> - Informações da API</li>
              <li><a href="/health">/health</a> - Health check</li>
              <li><a href="/api/contacts">/api/contacts</a> - Lista contatos</li>
              <li><a href="/api/appointments">/api/appointments</a> - Lista agendamentos</li>
            </ul>
            
            <h3>📋 Debug Info:</h3>
            <ul>
              <li><strong>Diretório servidor:</strong> <code>${__dirname}</code></li>
              <li><strong>Diretório dist esperado:</strong> <code>${distPath}</code></li>
              <li><strong>NODE_ENV:</strong> <code>${process.env.NODE_ENV || 'undefined'}</code></li>
              <li><strong>PORT:</strong> <code>${PORT}</code></li>
            </ul>
          </div>
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
    
    // Initialize AI Pause Checker
    try {
      const { initializeAiPauseChecker } = await import('./middleware/ai-pause-checker');
      initializeAiPauseChecker();
      console.log('✅ AI Pause Checker inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar AI Pause Checker:', error);
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