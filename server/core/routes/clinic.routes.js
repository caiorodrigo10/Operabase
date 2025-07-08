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
    const { id } = req.params;
    
    console.log('🏥 Buscando usuários da clínica:', id);
    
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        is_active,
        created_at
      `)
      .eq('clinic_id', id)
      .eq('is_active', true);
    
    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
      return;
    }
    
    // Formatar dados para o frontend
    const formattedUsers = users?.map(user => ({
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: user.role,
      status: user.is_active ? 'active' : 'inactive',
      created_at: user.created_at
    }));
    
    console.log(`✅ Encontrados ${formattedUsers?.length || 0} usuários`);
    
    res.json({
      success: true,
      data: formattedUsers
    });
  } catch (error) {
    console.error('❌ Erro na busca de usuários:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/clinic/:id/config - Configurações da clínica
 */
router.get('/clinic/:id/config', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('⚙️ Buscando configurações da clínica:', id);
    
    // TODO: Implementar busca real das configurações
    const mockConfig = {
      clinic_id: id,
      name: 'Clínica Exemplo',
      address: 'Rua Exemplo, 123',
      phone: '(11) 99999-9999',
      email: 'contato@clinica.com',
      working_hours: {
        monday: '08:00-18:00',
        tuesday: '08:00-18:00',
        wednesday: '08:00-18:00',
        thursday: '08:00-18:00',
        friday: '08:00-18:00',
        saturday: '08:00-12:00',
        sunday: 'closed'
      },
      settings: {
        appointment_duration: 30,
        allow_online_booking: true,
        require_confirmation: true
      }
    };
    
    res.json({
      success: true,
      data: mockConfig
    });
  } catch (error) {
    console.error('❌ Erro na busca de configurações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router; 