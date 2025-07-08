const express = require('express');
const { createSupabaseClient } = require('../config/database.config');

// Auth middleware simplificado
const authMiddleware = (req, res, next) => {
  console.log(`🔐 Auth check: ${req.method} ${req.path}`);
  next();
};

const router = express.Router();

/**
 * Rotas de Contatos
 * Refatorado de: railway-server.ts (linhas 206-305)
 * Módulo: Contacts Management
 */

/**
 * GET /api/contacts - Listar contatos
 * Suporta filtros: search, page, limit
 */
router.get('/contacts', authMiddleware, async (req, res) => {
  try {
    const supabaseAdmin = createSupabaseClient();
    const { search, clinic_id = 1 } = req.query;
    
    console.log('📞 Buscando contatos:', { search, clinic_id });
    
    let query = supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('clinic_id', Number(clinic_id));
    
    // Aplicar filtro de busca se fornecido
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    // Remover paginação para retornar TODOS os contatos da clínica
    // Isso resolve o problema de "paciente não encontrado" no calendário
    
    const { data: contacts, error } = await query.order('id', { ascending: true });
    
    if (error) {
      console.error('❌ Erro ao buscar contatos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
      return;
    }
    
    console.log(`✅ Encontrados ${contacts?.length || 0} contatos`);
    
    // Return array directly for frontend compatibility
    res.json(contacts || []);
  } catch (error) {
    console.error('❌ Erro na busca de contatos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/contacts/:id - Buscar contato específico
 */
router.get('/contacts/:id', authMiddleware, async (req, res) => {
  try {
    const supabaseAdmin = createSupabaseClient();
    const { id } = req.params;
    
    console.log('📞 Buscando contato por ID:', id);
    
    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('❌ Erro ao buscar contato:', error);
      res.status(404).json({
        success: false,
        error: 'Contato não encontrado'
      });
      return;
    }
    
    console.log('✅ Contato encontrado:', contact.name);
    
    // Return contact object directly
    res.json(contact);
  } catch (error) {
    console.error('❌ Erro na busca de contato:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/contacts - Criar novo contato
 */
router.post('/contacts', authMiddleware, async (req, res) => {
  try {
    const supabaseAdmin = createSupabaseClient();
    const contactData = req.body;
    
    console.log('📞 Criando novo contato:', contactData);
    
    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .insert([contactData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar contato:', error);
      res.status(400).json({
        success: false,
        error: 'Erro ao criar contato'
      });
      return;
    }
    
    console.log('✅ Contato criado com sucesso:', contact.id);
    
    // Return contact object directly
    res.status(201).json(contact);
  } catch (error) {
    console.error('❌ Erro na criação de contato:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router; 