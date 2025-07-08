const express = require('express');
const { createSupabaseClient } = require('../config/database.config');

// Auth middleware inline para evitar dependências
const authMiddleware = (req, res, next) => {
  console.log(`🔐 Auth check: ${req.method} ${req.path}`);
  next();
};

const router = express.Router();

/**
 * Rotas de Clínica
 * Refatorado de: railway-server.ts (linhas 430-500)
 * Módulo: Clinic Management
 */

/**
 * GET /api/clinic/:id/users/management - Listar usuários da clínica
 */
router.get('/clinic/:id/users/management', authMiddleware, async (req, res) => {
  try {
    const supabaseAdmin = createSupabaseClient();
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

/**
 * GET /api/clinic/:id/config - Configurações da clínica
 */
router.get('/clinic/:id/config', authMiddleware, async (req, res) => {
  try {
    const supabaseAdmin = createSupabaseClient();
    const { id: clinic_id } = req.params;
    
    console.log('⚙️ Buscando configurações da clínica:', clinic_id);
    
    // Buscar dados reais da clínica no banco
    const { data: clinic, error } = await supabaseAdmin
      .from('clinics')
      .select('*')
      .eq('id', Number(clinic_id))
      .single();
    
    if (error) {
      console.error('❌ Erro ao buscar configurações da clínica:', error);
      if (error.code === 'PGRST116') {
        res.status(404).json({ 
          success: false, 
          error: 'Clínica não encontrada' 
        });
        return;
      }
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar configurações', 
        details: error.message 
      });
      return;
    }
    
    console.log('✅ Configurações da clínica encontradas:', clinic?.name || 'N/A');
    res.json({
      success: true,
      data: clinic
    });
  } catch (error) {
    console.error('❌ Erro na busca de configurações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * PUT /api/clinic/:id/config - Atualizar configurações da clínica
 */
router.put('/clinic/:id/config', authMiddleware, async (req, res) => {
  try {
    const supabaseAdmin = createSupabaseClient();
    const { id: clinic_id } = req.params;
    const updateData = req.body;
    
    console.log('⚙️ Atualizando configurações da clínica:', clinic_id);
    console.log('📝 Dados para atualização:', updateData);
    
    // Atualizar dados da clínica no banco
    const { data: clinic, error } = await supabaseAdmin
      .from('clinics')
      .update(updateData)
      .eq('id', Number(clinic_id))
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao atualizar configurações da clínica:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao atualizar configurações', 
        details: error.message 
      });
      return;
    }
    
    console.log('✅ Configurações da clínica atualizadas:', clinic?.name || 'N/A');
    res.json({
      success: true,
      data: clinic
    });
  } catch (error) {
    console.error('❌ Erro na atualização de configurações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router; 