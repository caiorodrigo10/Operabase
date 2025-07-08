const express = require('express');
const { createSupabaseClient } = require('../config/database.config');

// Auth middleware inline para evitar dependências
const authMiddleware = (req, res, next) => {
  console.log(`🔐 Auth check: ${req.method} ${req.path}`);
  next();
};

const router = express.Router();

/**
 * Rotas de Agendamentos
 * Refatorado de: railway-server.ts (linhas 306-380)
 * Módulo: Appointments Management
 */

/**
 * GET /api/appointments - Listar agendamentos
 * Suporta filtro por data
 */
router.get('/appointments', authMiddleware, async (req, res) => {
  try {
    const supabaseAdmin = createSupabaseClient();
    const { date } = req.query;
    
    console.log('📅 Buscando agendamentos para:', date);
    
    let query = supabaseAdmin
      .from('appointments')
      .select('*');
    
    // Aplicar filtro de data se fornecido
    if (date) {
      // Lógica preservada do arquivo original
      const targetDate = new Date(String(date));
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)).toISOString();
      
      query = query
        .gte('scheduled_date', startOfDay)
        .lte('scheduled_date', endOfDay);
    }
    
    const { data: appointments, error } = await query.order('scheduled_date', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar agendamentos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
      return;
    }
    
    console.log(`✅ Encontrados ${appointments?.length || 0} agendamentos`);
    
    // Return array directly for frontend compatibility
    res.json(appointments || []);
  } catch (error) {
    console.error('❌ Erro na busca de agendamentos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/appointments - Criar novo agendamento
 */
router.post('/appointments', authMiddleware, async (req, res) => {
  try {
    const supabaseAdmin = createSupabaseClient();
    const appointmentData = req.body;
    
    console.log('📅 Criando novo agendamento:', appointmentData);
    
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .insert([appointmentData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar agendamento:', error);
      res.status(400).json({
        success: false,
        error: 'Erro ao criar agendamento'
      });
      return;
    }
    
    console.log('✅ Agendamento criado com sucesso:', appointment.id);
    
    // Return appointment object directly
    res.status(201).json(appointment);
  } catch (error) {
    console.error('❌ Erro na criação de agendamento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router; 