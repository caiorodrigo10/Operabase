// Carregar variáveis de ambiente
require('dotenv').config({ path: '../../.env' });

import { createExpressApp, serverConfig, logServerConfig } from './config/app.config';
import { testSupabaseConnection, createSupabaseClient } from './config/database.config';
import healthRoutes from './routes/health.routes';
import * as path from 'path';
import { authMiddleware } from './middleware/auth.middleware';

// Usar caminhos absolutos baseados na localização do arquivo
const currentDir = path.dirname(__filename);
const contactsRoutes = require(path.join(currentDir, 'routes', 'contacts.routes.js'));
const appointmentsRoutes = require(path.join(currentDir, 'routes', 'appointments.routes.js'));
const authRoutes = require(path.join(currentDir, 'routes', 'auth.routes.js'));
const audioRoutes = require(path.join(currentDir, 'routes', 'audio.routes.js'));
const clinicRoutes = require(path.join(currentDir, 'routes', 'clinic.routes.js'));
const conversationsRoutes = require(path.join(currentDir, 'routes', 'conversations.routes.js'));
const { setupStaticFiles } = require(path.join(currentDir, 'middleware', 'static.middleware.js'));

/**
 * Servidor Principal Refatorado
 * Módulo: Core Server
 * 
 * Estrutura modular baseada no railway-server.ts original
 */
async function startServer() {
  try {
    // Log de configuração
    logServerConfig();

    // Criar app Express
    const app = createExpressApp();
    
    // Middleware de debug para todas as requisições
    app.use((req: any, res: any, next: any) => {
      console.log(`🔍 ${req.method} ${req.path} - ${new Date().toISOString()}`);
      next();
    });

    // Testar conexão com Supabase
    console.log('🔍 Testando conexões...');
    const supabaseConnected = await testSupabaseConnection();
    
    if (!supabaseConnected) {
      console.log('⚠️  Servidor iniciado sem conexão com Supabase');
    }

    // Registrar rotas
    console.log('🔗 Registrando rotas...');
    app.use('/', healthRoutes);
    console.log('✅ Health routes registradas');
    app.use('/api', contactsRoutes);
    console.log('✅ Contacts routes registradas');
    app.use('/api', appointmentsRoutes);
    console.log('✅ Appointments routes registradas');
    app.use('/api', authRoutes);
    console.log('✅ Auth routes registradas');
    app.use('/api', audioRoutes);
    console.log('✅ Audio routes registradas');
    app.use('/api', clinicRoutes);
    console.log('✅ Clinic routes registradas');
    app.use('/api', conversationsRoutes);
    console.log('✅ Conversations routes registradas');

    // WhatsApp Numbers API
    app.get('/api/whatsapp/numbers', authMiddleware, async (req: any, res: any) => {
      try {
        const clinic_id = req.user?.clinic_id || 1;
        console.log('🔍 Buscando números WhatsApp para clinic_id:', clinic_id);
        const supabaseAdmin = createSupabaseClient();
        const { data: numbers, error } = await supabaseAdmin
          .from('whatsapp_numbers')
          .select('*')
          .eq('clinic_id', clinic_id)
          .eq('is_deleted', false)
          .order('id', { ascending: true });
        if (error) {
          console.error('❌ Erro ao buscar números WhatsApp:', error);
          res.status(500).json({ error: 'Erro ao buscar números WhatsApp', details: error.message });
          return;
        }
        res.json(numbers || []);
      } catch (error) {
        console.error('❌ Erro inesperado ao buscar números WhatsApp:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    // Configurar arquivos estáticos (deve ser por último)
    setupStaticFiles(app);

    // Iniciar servidor
    const server = app.listen(serverConfig.port, () => {
      console.log('🚀 Servidor iniciado com sucesso!');
      console.log(`📡 Rodando na porta: ${serverConfig.port}`);
      console.log(`🌍 Ambiente: ${serverConfig.isProduction ? 'production' : 'development'}`);
      console.log('');
      console.log('📋 Endpoints disponíveis:');
      console.log('   GET  /health - Health check');
      console.log('   GET  /api - API info');
      console.log('   GET  /api/debug - Debug info');
      console.log('   GET  /api/contacts - List contacts');
      console.log('   GET  /api/contacts/:id - Get contact');
      console.log('   POST /api/contacts - Create contact');
      console.log('   GET  /api/appointments - List appointments');
      console.log('   POST /api/appointments - Create appointment');
      console.log('   GET  /api/auth/profile - User profile');
      console.log('   POST /api/auth/login - Login');
      console.log('   POST /api/auth/logout - Logout');
      console.log('   POST /api/audio/voice-message/:conversationId - Audio upload');
      console.log('   GET  /api/clinic/:id/users/management - Clinic users');
      console.log('   GET  /api/clinic/:id/config - Clinic config');
      console.log('   GET  /api/conversations-simple - List conversations');
      console.log('   GET  /api/conversations-simple/:id - Get conversation');
      console.log('   GET  /api/conversations-simple/:id/messages - Get messages');
      console.log('   POST /api/conversations-simple - Create conversation');
      console.log('   POST /api/conversations-simple/:id/messages - Add message');
      console.log('   GET  /api/messages - List all messages');
      console.log('   GET  /api/whatsapp/numbers - List WhatsApp numbers');
      console.log('');
      console.log('✅ Servidor pronto para receber requisições!');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('📴 Recebido SIGTERM, encerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor encerrado com sucesso');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('📴 Recebido SIGINT, encerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor encerrado com sucesso');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor se este arquivo for executado diretamente
if (require.main === module) {
  startServer();
}

export { startServer }; 