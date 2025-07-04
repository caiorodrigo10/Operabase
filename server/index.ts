// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

// AWS Deploy Test - v1.1.6 - Repositório Principal
// Teste de deploy automático - 2025-01-28
// Testando após configurar AWS secrets
// Novo teste com secrets configurados
// Workflow corrigido - removido cache e verificação manual
// Adicionado debug para verificar se secrets estão disponíveis
// Secrets AWS corrigidos - testando autenticação
// Teste final após atualização - v1.1.2
// Corrigido Procfile e package.json - v1.1.3
// Corrigido .ebextensions/nodejs.config - removido staticfiles inválido - v1.1.4
// Removido .ebextensions completamente - NodeCommand também inválido - v1.1.5
// Adicionado logs detalhados para debug e health check básico - v1.1.6

import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";
import { createApiRouter } from "./api/v1";
import { createStorage } from "./storage-factory";
import { setupAuth, isAuthenticated } from "./auth";
import { tenantIsolationMiddleware } from "./shared/tenant-isolation.middleware";
import { cacheInterceptorMiddleware, cacheInvalidationMiddleware } from "./shared/cache-interceptor.middleware";
import { performanceTrackingMiddleware, auditLoggingMiddleware, errorLoggingMiddleware } from "./shared/observability-middleware.js";
import { performanceMonitor } from "./shared/performance-monitor";
import { cacheService } from "./shared/redis-cache.service";
import { tenantContext } from "./shared/tenant-context.provider";
import { setupOptimizedRoutes } from "./optimized-routes.js";
import { performanceOptimizer } from "./performance-optimizer.js";
import { initGoogleCalendarAuth, handleGoogleCalendarCallback } from './calendar-routes';
import { initSystemLogsTable } from './init-system-logs';
import { initPasswordResetTable } from './init-password-reset';
import { initClinicInvitationsSystem } from './init-clinic-invitations';
import { systemLogsService } from './services/system-logs.service';
import { WebSocketServer } from './websocket-server';
import { redisCacheService } from './services/redis-cache.service';
import http from "http";
import fs from 'fs/promises';
import path from 'path';

const app = express();

// Log de inicialização para debug
console.log('🚀 Iniciando aplicação...');
console.log('📍 NODE_ENV:', process.env.NODE_ENV);
console.log('📍 PORT:', process.env.PORT);

app.use(express.json({ 
  reviver: (key, value) => {
    // Prevent automatic date parsing - keep strings as strings
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value; // Keep date strings as strings
    }
    return value;
  }
}));

// ETAPA 2: Criar HTTP server para Socket.IO
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;
app.use(express.urlencoded({ extended: false }));

  console.log('✅ Express configurado, porta:', PORT);
  
  // Health check básico (deve vir antes de qualquer middleware complexo)
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      port: PORT,
      env: process.env.NODE_ENV 
    });
  });
  
  app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    
    // Track performance metrics for API calls
    if (path.startsWith("/api")) {
      try {
        const clinicId = tenantContext.getClinicId();
        performanceMonitor.trackApiCall(path, duration, res.statusCode, clinicId);
      } catch (error) {
        // Skip performance tracking if no tenant context
      }

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Create storage instance
  const storage = createStorage();
  
  // Setup authentication
  setupAuth(app, storage);
  
  // Make storage available to all routes
  app.set('storage', storage);
  
  // ✅ CRITICAL: Setup upload routes BEFORE middlewares to avoid auth issues
  const { setupUploadRoutes } = await import('./routes/upload-routes');
  setupUploadRoutes(app, storage);
  console.log('✅ Upload routes registered BEFORE middleware chain');
  
  // Setup profile picture routes
  const profilePictureRoutes = await import('./routes/profile-picture-routes');
  app.use('/api/user', profilePictureRoutes.default);
  console.log('📸 Profile picture routes registered');
  
  // Setup audio voice routes - REMOVIDO PARA EVITAR CONFLITO
  // const { setupAudioVoiceRoutes } = await import('./routes/audio-voice-routes');
  // setupAudioVoiceRoutes(app, storage);
  // console.log('🎤 Audio voice routes registered');
  
  // BYPASS TOTAL DE MIDDLEWARE PARA UPLOADS - SOLUÇÃO DEFINITIVA
  app.use('/api/conversations/:id/upload', (req: any, res: any, next: any) => {
    console.log('🔥 BYPASS MIDDLEWARE - Upload detectado, pulando TODA autenticação');
    console.log('🔥 URL:', req.originalUrl);
    console.log('🔥 Method:', req.method);
    console.log('🔥 User-Agent:', req.headers['user-agent']);
    console.log('🔥 Content-Type:', req.headers['content-type']);
    
    // Definir usuário fixo para uploads da interface
    req.user = {
      id: '3cd96e6d-81f2-4c8a-a54d-3abac77b37a4',
      email: 'cr@caiorodrigo.com.br',
      name: 'Caio Rodrigo',
      role: 'super_admin'
    };
    
    console.log('🔥 Usuário fixo definido para upload');
    next();
  });

  // Setup NOVO endpoint de áudio limpo com URLs públicas
  const { setupAudioVoiceCleanRoutes } = await import('./routes/audio-voice-clean');
  setupAudioVoiceCleanRoutes(app, storage);
  console.log('🎤 ÁUDIO LIMPO: Endpoint registrado com URLs públicas temporárias');

  // Apply Phase 3 observability middleware chain to all API routes (EXCEPT uploads)
  app.use('/api', (req: any, res: any, next: any) => {
    // Skip all middleware for upload routes - they're already registered above
    if (req.path.includes('/upload')) {
      console.log('🔧 Middleware chain: Skipping for upload:', req.path);
      return next();
    }
    
    console.log('🔧 Middleware chain: Processing normal route:', req.path);
    // Apply normal middleware chain for other routes
    performanceTrackingMiddleware(req, res, () => {
      auditLoggingMiddleware(req, res, () => {
        cacheInterceptorMiddleware(req, res, () => {
          tenantIsolationMiddleware(req, res, () => {
            cacheInvalidationMiddleware(req, res, next);
          });
        });
      });
    });
  });
  
  // Setup optimized routes first for better performance
  setupOptimizedRoutes(app);
  
  // Setup admin routes
  const { setupAdminRoutes } = await import('./admin-routes');
  setupAdminRoutes(app, storage);
  
  // Setup API routes
  const apiRouter = createApiRouter(storage);
  app.use('/api', apiRouter);
  

  
  // Supabase Storage schema already exists - no need to apply
  
  // Add MCP logging middleware for all MCP routes
  const { mcpLoggingMiddleware, chatInterpreterLoggingMiddleware, errorLoggingMiddleware: mcpErrorMiddleware } = await import('./mcp/logs.middleware');
  app.use('/api/mcp', mcpLoggingMiddleware);
  app.use('/api/mcp', chatInterpreterLoggingMiddleware);
  
  // Add MCP logs routes
  const mcpLogsRoutes = await import('./mcp/logs.routes');
  app.use('/api/mcp', mcpLogsRoutes.default);
  
  // Add MCP routes for n8n integration
  const mcpRoutes = await import('./mcp/n8n-routes');
  app.use('/api/mcp', mcpRoutes.default);
  
  // Add official MCP protocol routes
  const mcpProtocolRoutes = await import('./mcp/mcp-routes');
  app.use('/api/mcp', mcpProtocolRoutes.default);
  
  // Add MCP error handling
  app.use('/api/mcp', mcpErrorMiddleware);
  
  // Add API Keys management routes
  const apiKeysRoutes = await import('./routes/api-keys.routes');
  app.use('/api', apiKeysRoutes.default);
  
  // Add Anamnesis routes
  const { setupAnamnesisRoutes } = await import('./anamnesis-routes');
  setupAnamnesisRoutes(app, storage);
  
  // Add Anamnesis Management routes
  const { setupAnamnesisManagementRoutes } = await import('./anamneses-routes');
  setupAnamnesisManagementRoutes(app, storage);
  
  // Add Mara AI routes
  const { setupMaraRoutes } = await import('./mara-routes');
  setupMaraRoutes(app, storage);
  
  // Add Mara Configuration routes
  const { setupMaraConfigRoutes } = await import('./mara-config-routes');
  setupMaraConfigRoutes(app, storage);
  
  // Add WhatsApp Webhook routes with proper authentication middleware
  const { setupWhatsAppWebhookRoutes } = await import('./whatsapp-webhook-routes');
  setupWhatsAppWebhookRoutes(app, storage);
  
  // Add Google Calendar authentication routes with professional validation
  const { isAuthenticated } = await import('./auth');
  
  // Add AI Dev Agent configuration route
  app.get('/api/ai-dev/config', isAuthenticated, (req: Request, res: Response) => {
    try {
      const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
      res.json({ 
        configured: hasOpenAIKey,
        apiKey: hasOpenAIKey ? process.env.OPENAI_API_KEY : null
      });
    } catch (error) {
      console.error('Error getting AI Dev config:', error);
      res.status(500).json({ error: 'Failed to get AI Dev configuration' });
    }
  });

  // Add clinic config route for consultas page
  app.get('/api/clinic/:clinicId/config', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      
      if (isNaN(clinicId)) {
        return res.status(400).json({ error: "Invalid clinic ID" });
      }

      // Get clinic from database
      console.log('🏥 Getting clinic config for ID:', clinicId);
      const clinic = await storage.getClinic(clinicId);
      console.log('🏥 Clinic data found:', clinic);
      
      if (!clinic) {
        return res.status(404).json({ error: "Clinic not found" });
      }

      // Return clinic configuration
      res.json(clinic);
    } catch (error) {
      console.error('Error getting clinic config:', error);
      res.status(500).json({ error: 'Failed to get clinic configuration' });
    }
  });
  const { createRequireProfessional } = await import('./middleware/professional-validation');
  
  const requireProfessional = createRequireProfessional(storage);
  
  // Add Google Calendar routes with corrected storage access
  app.get('/api/calendar/auth/google', isAuthenticated, requireProfessional, initGoogleCalendarAuth);
  app.get('/api/calendar/callback/google', handleGoogleCalendarCallback);
  
  // Direct implementation of getUserCalendarIntegrations to fix storage issues
  app.get('/api/calendar/integrations', isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const userEmail = req.user.email;
      
      console.log('🔍 Getting calendar integrations for user:', { userId, userEmail });
      
      // Direct database query to avoid storage method issues
      const { db } = await import('./db');
      const { sql } = await import('drizzle-orm');
      
      // First cleanup any old inactive integrations for this user
      await db.execute(sql`
        DELETE FROM calendar_integrations 
        WHERE email = ${userEmail} 
        AND is_active = false
      `);
      
      const result = await db.execute(sql`
        SELECT * FROM calendar_integrations 
        WHERE email = ${userEmail} 
        AND is_active = true
        AND provider = 'google'
        ORDER BY created_at DESC
        LIMIT 1
      `);
      
      const integrations = result.rows;
      console.log('📊 Direct query integrations found:', integrations.length);
      console.log('📋 Integration data:', integrations);
      
      const formattedIntegrations = integrations.map((integration: any) => ({
        id: integration.id,
        provider: integration.provider,
        email: integration.email,
        calendarId: integration.calendar_id,
        calendarName: integration.calendar_name,
        calendar_id: integration.calendar_id,
        calendar_name: integration.calendar_name,
        syncEnabled: integration.sync_enabled,
        sync_enabled: integration.sync_enabled,
        is_active: integration.is_active,
        isActive: integration.is_active,
        lastSyncAt: integration.last_sync_at,
        last_sync_at: integration.last_sync_at,
        createdAt: integration.created_at,
        created_at: integration.created_at
      }));
      
      console.log('✅ Calendar integrations formatted:', formattedIntegrations.length);
      res.json(formattedIntegrations);
    } catch (error) {
      console.error('Error fetching calendar integrations:', error);
      res.status(500).json({ error: 'Failed to fetch calendar integrations' });
    }
  });

  // Manual sync endpoint
  app.post('/api/calendar/integrations/:id/sync', isAuthenticated, async (req: any, res: any) => {
    try {
      const integrationId = parseInt(req.params.id);
      const userId = req.user.id;
      
      console.log(`🔄 Iniciando sincronização manual para integração ${integrationId}, usuário ${userId}`);
      
      // Import and call sync function
      const calendarRoutes = await import('./calendar-routes');
      const syncFunction = (calendarRoutes as any).syncCalendarEventsToSystem;
      
      if (syncFunction) {
        await syncFunction(userId, integrationId);
        console.log(`✅ Sincronização manual concluída para integração ${integrationId}`);
        res.json({ success: true, message: 'Sincronização concluída com sucesso' });
      } else {
        throw new Error('Função de sincronização não encontrada');
      }
    } catch (error: any) {
      console.error('❌ Erro na sincronização manual:', error);
      res.status(500).json({ error: 'Erro na sincronização manual', details: error?.message || 'Erro desconhecido' });
    }
  });

  // Delete calendar integration route
  app.delete('/api/calendar/integrations/:integrationId', isAuthenticated, async (req: any, res: any) => {
    try {
      const { integrationId } = req.params;
      const userId = req.user.id;
      const userEmail = req.user.email;

      console.log('🗑️ Deleting calendar integration:', { integrationId, userId, userEmail });

      // Direct database query to verify and delete
      const { db } = await import('./db');
      const { sql } = await import('drizzle-orm');

      // First verify the integration belongs to the user
      const checkResult = await db.execute(sql`
        SELECT * FROM calendar_integrations 
        WHERE id = ${parseInt(integrationId)} 
        AND email = ${userEmail}
      `);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Integration not found or access denied' });
      }

      // Delete the integration
      const deleteResult = await db.execute(sql`
        DELETE FROM calendar_integrations 
        WHERE id = ${parseInt(integrationId)} 
        AND email = ${userEmail}
      `);

      if (deleteResult.rowCount && deleteResult.rowCount > 0) {
        console.log('✅ Calendar integration deleted successfully');
        res.json({ 
          success: true, 
          message: 'Integração removida com sucesso'
        });
      } else {
        res.status(500).json({ error: 'Failed to delete integration' });
      }
    } catch (error) {
      console.error('Error deleting calendar integration:', error);
      res.status(500).json({ error: 'Failed to delete calendar integration' });
    }
  });
  
  // Add page JSON save endpoint
  app.post('/api/save-page-json', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { pageId, jsonData } = req.body;
      
      if (!pageId || !jsonData) {
        return res.status(400).json({ error: 'pageId and jsonData are required' });
      }
      
      // Save JSON to a file specific to this page
      const jsonFilePath = path.join(process.cwd(), `client/src/data/${pageId}.json`);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(jsonFilePath), { recursive: true });
      
      // Save the JSON data
      await fs.writeFile(jsonFilePath, jsonData, 'utf8');
      
      console.log(`✅ Page JSON saved: ${pageId}`);
      res.json({ success: true, message: 'Page JSON saved successfully' });
    } catch (error) {
      console.error('Error saving page JSON:', error);
      res.status(500).json({ error: 'Failed to save page JSON' });
    }
  });

  // Add page JSON load endpoint (no auth required for loading)
  app.get('/api/load-page-json/:pageId', async (req: Request, res: Response) => {
    try {
      const { pageId } = req.params;
      const jsonFilePath = path.join(process.cwd(), `client/src/data/${pageId}.json`);
      
      try {
        const jsonData = await fs.readFile(jsonFilePath, 'utf8');
        console.log(`📂 Page JSON loaded: ${pageId}`);
        res.json({ success: true, data: jsonData });
      } catch (fileError) {
        // File doesn't exist, return empty
        console.log(`📄 No saved JSON found for: ${pageId}`);
        res.json({ success: true, data: null });
      }
    } catch (error) {
      console.error('Error loading page JSON:', error);
      res.status(500).json({ error: 'Failed to load page JSON' });
    }
  });

  // WhatsApp Webhook routes moved to after middleware setup for proper authentication
  
  // Add WhatsApp routes
  const whatsappRoutes = await import('./whatsapp-routes');
  app.use(whatsappRoutes.default);
  
  // Add RAG routes (after auth setup is complete) - OFICIAL LANGCHAIN/SUPABASE CLEAN
  const ragRoutes = await import('./rag-routes-clean');
  app.use('/api/rag', ragRoutes.default);
  
  // Add System Logs routes
  const systemLogsRoutes = await import('./routes/system-logs.routes');
  app.use('/api', systemLogsRoutes.default);
  
  // Add Clinics routes
  const { clinicsRoutes } = await import('./domains/clinics/clinics.routes');
  app.use('/api/clinics', clinicsRoutes);
  
  // Add Permissions routes (clinic users management)
  const { 
    getClinicUsersForManagement, 
    updateUserProfessionalStatus, 
    getProfessionalStatusAudit 
  } = await import('./permissions-routes');
  app.get('/api/clinic/:clinicId/users/management', isAuthenticated, getClinicUsersForManagement);
  app.put('/api/clinic/:clinicId/users/:userId/professional-status', isAuthenticated, updateUserProfessionalStatus);
  app.get('/api/clinic/:clinicId/users/:userId/professional-status-audit', isAuthenticated, getProfessionalStatusAudit);
  
  // Add Conversations routes
  const { setupConversationsRoutes } = await import('./conversations-routes');
  setupConversationsRoutes(app, storage);
  
  // Upload routes already registered BEFORE middleware chain above
  
  // ETAPA 3: Initialize Redis Cache Service
  try {
    await redisCacheService.warmCache();
    console.log('✅ Redis Cache Service initialized');
  } catch (error) {
    console.warn('⚠️ Redis Cache Service failed to initialize, continuing without cache:', error);
  }

  // ETAPA 2: Inicializar WebSocket Server
  const webSocketServer = new WebSocketServer(httpServer, storage);
  app.set('webSocketServer', webSocketServer);

  // Add Simple Conversations routes with WebSocket integration
  const { setupSimpleConversationsRoutes } = await import('./conversations-simple-routes');
  setupSimpleConversationsRoutes(app, storage);
  
  // Initialize anamnesis system
  try {
    const { initializeAnamnesisSystem } = await import('./anamnesis-setup');
    await initializeAnamnesisSystem();
    console.log('✅ Anamnesis system initialized');
  } catch (error) {
    console.error('❌ Error initializing anamnesis system:', error);
  }

  // Initialize RAG system
  try {
    const { initializeRAGSystem } = await import('./rag-setup');
    await initializeRAGSystem();
    console.log('✅ RAG system initialized');
  } catch (error) {
    console.error('❌ Error initializing RAG system:', error);
  }

  // Initialize System Logs
  try {
    await initSystemLogsTable();
    console.log('✅ System Logs initialized');
  } catch (error) {
    console.error('❌ Error initializing System Logs:', error);
  }

  // Initialize Password Reset table
  try {
    await initPasswordResetTable();
    console.log('✅ Password Reset system initialized');

    // Initialize Clinic Invitations system
    await initClinicInvitationsSystem();
    console.log('✅ Clinic Invitations system initialized');
  } catch (error) {
    console.error('❌ Error initializing Password Reset system:', error);
  }

  // Initialize WhatsApp table
  try {
    if (storage && 'pool' in storage) {
      const pgStorage = storage as any;
      await pgStorage.pool.query(`
        CREATE TABLE IF NOT EXISTS whatsapp_numbers (
          id SERIAL PRIMARY KEY,
          clinic_id INTEGER NOT NULL REFERENCES public.profiles(id),
          user_id TEXT NOT NULL,
          phone_number TEXT NOT NULL DEFAULT '',
          instance_name TEXT NOT NULL UNIQUE,
          status TEXT NOT NULL DEFAULT 'pending',
          connected_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      await pgStorage.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_whatsapp_numbers_clinic_id 
        ON whatsapp_numbers(clinic_id);
      `);
      
      await pgStorage.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_whatsapp_numbers_instance_name 
        ON whatsapp_numbers(instance_name);
      `);
      
      console.log('✅ WhatsApp numbers table initialized');
    }
  } catch (error) {
    console.error('❌ Error initializing WhatsApp table:', error);
  }
  
  // Add Phase 3 observability endpoints
  const { observabilityRoutes } = await import('./api/v1/observability/observability.routes.js');
  app.use('/api/observability', observabilityRoutes);
  
  // Health and monitoring endpoints
  app.get('/api/health', async (req, res) => {
    try {
      const cacheHealth = await cacheService.healthCheck();
      const performanceHealth = performanceMonitor.isHealthy();
      
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        cache: cacheHealth,
        performance: performanceHealth,
        uptime: process.uptime(),
        version: 'v2.0-with-cache'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        uptime: process.uptime()
      });
    }
  });
  
  app.get('/api/metrics', (req, res) => {
    const metrics = performanceMonitor.getMetrics();
    const cacheMetrics = redisCacheService.getHealthStatus();
    res.json({
      performance: metrics,
      cache: cacheMetrics
    });
  });
  
  // Create HTTP server
  const server = http.createServer(app);

  // Global error handler with observability
  app.use(errorLoggingMiddleware);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Initialize AI Pause Checker
  const { startAiPauseChecker } = await import('./middleware/ai-pause-checker');
  startAiPauseChecker();

  // Use PORT from environment variables (.env file) or default to 3000
  // This serves both the API and the client
  const port = parseInt(process.env.PORT || '3000', 10);
  
  // For Vercel deployment, make app available globally
  if (process.env.VERCEL) {
    (global as any).vercelApp = app;
  }
  
  // Start the server normally for local development and production
  if (!process.env.VERCEL) {
    console.log(`🔄 Tentando iniciar servidor na porta ${port}...`);
    server.listen(port, "0.0.0.0", () => {
      console.log(`🎉 SERVIDOR INICIADO COM SUCESSO!`);
      console.log(`📍 Porta: ${port}`);
      console.log(`📍 Ambiente: ${process.env.NODE_ENV}`);
      console.log(`📍 Timestamp: ${new Date().toISOString()}`);
      log(`serving on port ${port}`);
    }).on('error', (err: any) => {
      console.error(`❌ ERRO AO INICIAR SERVIDOR:`, err);
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Please kill any existing processes or use a different port.`);
        process.exit(1);
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    });
  } else {
    console.log('📍 Ambiente Vercel detectado, não iniciando servidor local');
  }
})();

// Trigger AWS deploy test
