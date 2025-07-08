const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * Rotas de Autenticação
 * Refatorado de: railway-server.ts (linhas 381-428)
 * Módulo: Authentication Routes
 */

/**
 * GET /api/auth/profile - Perfil do usuário
 */
router.get('/auth/profile', authMiddleware, async (req, res) => {
  try {
    console.log('👤 Solicitação de perfil do usuário');
    
    // TODO: Implementar busca real do perfil
    const mockProfile = {
      id: 1,
      name: 'Usuário Teste',
      email: 'usuario@teste.com',
      role: 'admin'
    };
    
    res.json({
      success: true,
      data: mockProfile
    });
  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/auth/login - Login do usuário
 */
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Tentativa de login:', email);
    
    // TODO: Implementar autenticação real
    if (email && password) {
      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        token: 'mock-jwt-token'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios'
      });
    }
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/auth/logout - Logout do usuário
 */
router.post('/auth/logout', (req, res) => {
  try {
    console.log('🚪 Logout do usuário');
    
    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro no logout:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router; 