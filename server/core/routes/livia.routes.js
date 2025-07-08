const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Configurar Supabase Admin Client
function createSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// Middleware de autenticação simplificado
const authMiddleware = (req, res, next) => {
  // Para desenvolvimento: bypass de autenticação
  req.user = {
    id: 4,
    name: 'Caio Rodrigo',
    email: 'cr@caiorodrigo.com.br',
    role: 'super_admin',
    clinic_id: 1
  };
  next();
};

/**
 * GET /api/livia/config - Configurações da Livia
 */
router.get('/livia/config', authMiddleware, async (req, res) => {
  try {
    const clinic_id = req.user?.clinic_id || 1;
    
    console.log('🔍 Buscando configurações da Livia para clinic_id:', clinic_id);
    
    const supabaseAdmin = createSupabaseClient();
    const { data: config, error } = await supabaseAdmin
      .from('livia_configurations')
      .select('*')
      .eq('clinic_id', clinic_id)
      .single();
    
    if (error) {
      console.error('❌ Erro ao buscar configurações da Livia:', error);
      if (error.code === 'PGRST116') {
        // Não encontrou configuração, criar uma padrão
        const defaultConfig = {
          clinic_id: clinic_id,
          general_prompt: `Você é Livia, assistente virtual especializada da nossa clínica médica. Seja sempre empática, profissional e prestativa.

Suas principais responsabilidades:
- Responder dúvidas sobre procedimentos e horários
- Auxiliar no agendamento de consultas
- Fornecer informações gerais sobre a clínica
- Identificar situações de urgência

Mantenha um tom acolhedor e use linguagem simples. Em caso de dúvidas médicas específicas, sempre oriente a procurar um profissional.`,
          whatsapp_number_id: null,
          off_duration: 30,
          off_unit: 'minutos',
          selected_professional_ids: [],
          connected_knowledge_base_ids: [],
          is_active: true
        };
        
        console.log('⚠️ Configuração não encontrada, retornando configuração padrão');
        res.json({
          success: true,
          data: defaultConfig
        });
        return;
      }
      res.status(500).json({ error: 'Erro ao buscar configurações da Livia', details: error.message });
      return;
    }
    
    console.log('✅ Configurações da Livia encontradas:', config?.general_prompt?.substring(0, 50) + '...');
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar configurações da Livia:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * PUT /api/livia/config - Atualizar configurações da Livia
 */
router.put('/livia/config', authMiddleware, async (req, res) => {
  try {
    const clinic_id = req.user?.clinic_id || 1;
    const updateData = req.body;
    
    console.log('🔧 Atualizando configurações da Livia para clinic_id:', clinic_id);
    console.log('📝 Dados para atualização:', JSON.stringify(updateData, null, 2));
    
    const supabaseAdmin = createSupabaseClient();
    
    // Primeiro, verificar se existe configuração
    const { data: existingConfig } = await supabaseAdmin
      .from('livia_configurations')
      .select('id')
      .eq('clinic_id', clinic_id)
      .single();
    
    let result;
    
    if (existingConfig) {
      // Atualizar configuração existente
      const { data: updatedConfig, error } = await supabaseAdmin
        .from('livia_configurations')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('clinic_id', clinic_id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Erro ao atualizar configurações da Livia:', error);
        res.status(500).json({ error: 'Erro ao atualizar configurações', details: error.message });
        return;
      }
      
      result = updatedConfig;
    } else {
      // Criar nova configuração
      const { data: createdConfig, error } = await supabaseAdmin
        .from('livia_configurations')
        .insert({
          clinic_id: clinic_id,
          ...updateData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Erro ao criar configurações da Livia:', error);
        res.status(500).json({ error: 'Erro ao criar configurações', details: error.message });
        return;
      }
      
      result = createdConfig;
    }
    
    console.log('✅ Configurações da Livia atualizadas com sucesso');
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Erro inesperado ao atualizar configurações da Livia:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/livia/config - Criar configurações da Livia
 */
router.post('/livia/config', authMiddleware, async (req, res) => {
  try {
    const clinic_id = req.user?.clinic_id || 1;
    const configData = req.body;
    
    console.log('📝 Criando configurações da Livia para clinic_id:', clinic_id);
    console.log('📝 Dados da configuração:', JSON.stringify(configData, null, 2));
    
    const supabaseAdmin = createSupabaseClient();
    
    // Verificar se já existe configuração
    const { data: existingConfig } = await supabaseAdmin
      .from('livia_configurations')
      .select('id')
      .eq('clinic_id', clinic_id)
      .single();
    
    if (existingConfig) {
      res.status(409).json({ error: 'Configuração da Livia já existe para esta clínica' });
      return;
    }
    
    const { data: config, error } = await supabaseAdmin
      .from('livia_configurations')
      .insert({
        clinic_id: clinic_id,
        ...configData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar configurações da Livia:', error);
      res.status(500).json({ error: 'Erro ao criar configurações', details: error.message });
      return;
    }
    
    console.log('✅ Configurações da Livia criadas com sucesso');
    res.status(201).json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('❌ Erro inesperado ao criar configurações da Livia:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/livia/config - Deletar configurações da Livia
 */
router.delete('/livia/config', authMiddleware, async (req, res) => {
  try {
    const clinic_id = req.user?.clinic_id || 1;
    
    console.log('🗑️ Deletando configurações da Livia para clinic_id:', clinic_id);
    
    const supabaseAdmin = createSupabaseClient();
    const { error } = await supabaseAdmin
      .from('livia_configurations')
      .delete()
      .eq('clinic_id', clinic_id);
    
    if (error) {
      console.error('❌ Erro ao deletar configurações da Livia:', error);
      res.status(500).json({ error: 'Erro ao deletar configurações', details: error.message });
      return;
    }
    
    console.log('✅ Configurações da Livia deletadas com sucesso');
    res.status(204).send();
  } catch (error) {
    console.error('❌ Erro inesperado ao deletar configurações da Livia:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/whatsapp/numbers - Números WhatsApp disponíveis
 */
router.get('/whatsapp/numbers', authMiddleware, async (req, res) => {
  try {
    const supabaseAdmin = createSupabaseClient();
    
    console.log('📱 Buscando números WhatsApp...');
    
    // Buscar números WhatsApp da tabela whatsapp_numbers
    const { data: numbers, error } = await supabaseAdmin
      .from('whatsapp_numbers')
      .select('*')
      .eq('clinic_id', 1); // Filtrar pela clínica atual
    
    if (error) {
      console.error('❌ Erro ao buscar números WhatsApp:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar números WhatsApp', 
        details: error.message 
      });
      return;
    }
    
    console.log('✅ Números WhatsApp encontrados:', numbers?.length || 0);
    
    res.json({
      success: true,
      data: numbers || []
    });
    
  } catch (error) {
    console.error('❌ Erro no endpoint de números WhatsApp:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor', 
      details: error.message 
    });
  }
});

/**
 * GET /api/clinic/:id/professionals - Profissionais da clínica
 */
router.get('/clinic/:id/professionals', authMiddleware, async (req, res) => {
  try {
    const supabaseAdmin = createSupabaseClient();
    const { id: clinic_id } = req.params;
    
    console.log('👥 Buscando profissionais da clínica:', clinic_id);
    
    // Buscar profissionais da tabela users
    const { data: professionals, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role')
      .in('role', ['dentist', 'professional', 'admin']); // Filtrar apenas profissionais
    
    if (error) {
      console.error('❌ Erro ao buscar profissionais:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar profissionais', 
        details: error.message 
      });
      return;
    }
    
    console.log('✅ Profissionais encontrados:', professionals?.length || 0);
    
    res.json({
      success: true,
      data: professionals || []
    });
    
  } catch (error) {
    console.error('❌ Erro no endpoint de profissionais:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor', 
      details: error.message 
    });
  }
});

/**
 * GET /api/rag/knowledge-bases - Bases de conhecimento
 */
router.get('/rag/knowledge-bases', authMiddleware, async (req, res) => {
  try {
    const supabaseAdmin = createSupabaseClient();
    
    console.log('📚 Buscando bases de conhecimento...');
    
    // Buscar bases de conhecimento da tabela knowledge_bases
    const { data: knowledgeBases, error } = await supabaseAdmin
      .from('knowledge_bases')
      .select('*')
      .eq('clinic_id', 1); // Filtrar pela clínica atual
    
    if (error) {
      console.error('❌ Erro ao buscar bases de conhecimento:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar bases de conhecimento', 
        details: error.message 
      });
      return;
    }
    
    console.log('✅ Bases de conhecimento encontradas:', knowledgeBases?.length || 0);
    
    res.json({
      success: true,
      data: knowledgeBases || []
    });
    
  } catch (error) {
    console.error('❌ Erro no endpoint de bases de conhecimento:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor', 
      details: error.message 
    });
  }
});

module.exports = router; 