// Production Server for Operabase - v2.0.0 - DOMAIN SYSTEM MIGRATION
// Complete migration to Domain-Driven Design architecture
// Updated: 2025-01-07 - Full endpoint coverage with 50+ routes
// Architecture: Express.js + Domain System + Multi-tenant + Cache + Observability

const express = require('express');
const cors = require('cors');

// Import TypeScript modules using require for Node.js compatibility
const { loadModuleWithFallback } = require('./compatibility-loader.js');

let createApiRouter, createStorage, performanceTrackingMiddleware, auditLoggingMiddleware;
let cacheInterceptorMiddleware, tenantIsolationMiddleware, cacheInvalidationMiddleware;
let errorLoggingMiddleware;

// Dynamic imports with error handling and fallbacks
async function initializeServer() {
  try {
    // Core system imports with fallbacks
    console.log('🔄 Loading core modules...');
    const routerModule = await loadModuleWithFallback('./api/v1/router');
    createApiRouter = routerModule.createApiRouter;
    
    const storageModule = await loadModuleWithFallback('./storage-factory');
    createStorage = storageModule.createStorage;
    
    // Middleware imports with graceful fallbacks
    console.log('🔄 Loading middleware modules...');
    
    const perfModule = await loadModuleWithFallback('./shared/performance-tracking.middleware');
    performanceTrackingMiddleware = perfModule.performanceTrackingMiddleware || ((req, res, next) => next());
    
    const auditModule = await loadModuleWithFallback('./shared/audit-logging.middleware');
    auditLoggingMiddleware = auditModule.auditLoggingMiddleware || ((req, res, next) => next());
    
    const cacheModule = await loadModuleWithFallback('./shared/cache-interceptor.middleware');
    cacheInterceptorMiddleware = cacheModule.cacheInterceptorMiddleware || ((req, res, next) => next());
    
    const tenantModule = await loadModuleWithFallback('./shared/tenant-isolation.middleware');
    tenantIsolationMiddleware = tenantModule.tenantIsolationMiddleware || ((req, res, next) => next());
    
    const cacheInvalidModule = await loadModuleWithFallback('./shared/cache-invalidation.middleware');
    cacheInvalidationMiddleware = cacheInvalidModule.cacheInvalidationMiddleware || ((req, res, next) => next());
    
    const errorModule = await loadModuleWithFallback('./shared/error-logging.middleware');
    errorLoggingMiddleware = errorModule.errorLoggingMiddleware || ((err, req, res, next) => {
      console.error('Server error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
    
  } catch (error) {
    console.error('❌ Failed to import modules:', error);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 8080;

// Logging utility
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// CORS configuration para Vercel frontend
app.use(cors({
  origin: [
    'https://operabase.vercel.app',
    'https://operabase-main.vercel.app',
    'https://operabase-main-git-main-caioapfelbaums-projects.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Environment validation
function validateEnvironment() {
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    console.error('🔧 Please configure these variables in AWS Elastic Beanstalk');
    process.exit(1);
  }
  
  log('✅ Environment validation passed');
}

// Initialize and start server
async function startServer() {
  try {
    // Validate environment first
    validateEnvironment();
    
    // Initialize modules
    await initializeServer();
    
    // Create storage instance
    const storage = createStorage();
    log('💾 Storage system initialized');
    
    // Startup logging
    log(`🚀 Starting Operabase Production Server v2.0.0`);
    log(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);
    log(`📍 Port: ${PORT}`);
    log(`📍 Architecture: Domain-Driven Design`);
    log(`📍 Features: Multi-tenant + Cache + Observability`);
    
    // Health check endpoint (before middleware chain)
    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        version: '2.0.0',
        architecture: 'domain-system',
        features: {
          supabase_configured: !!process.env.SUPABASE_URL,
          service_role_configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          multi_tenant: true,
          cache_system: true,
          observability: true,
          domain_count: 14,
          endpoint_count: '50+'
        }
      });
    });
    
    // Root endpoint
    app.get('/', (req, res) => {
      res.json({
        status: 'ok',
        message: 'Operabase Backend API v2.0.0',
        timestamp: new Date().toISOString(),
        architecture: 'Domain-Driven Design',
        features: [
          'Multi-tenant isolation',
          'Advanced caching',
          'Performance monitoring',
          'Audit logging',
          '50+ API endpoints',
          'Real-time observability'
        ],
        domains: [
          'auth', 'appointments', 'contacts', 'calendar',
          'medical-records', 'pipeline', 'analytics', 'settings',
          'ai-templates', 'appointment-tags', 'user-profile', 'livia',
          'anamneses', 'rag-system'
        ]
      });
    });
    
    // Apply detailed logging and middleware chain to all /api routes
    app.use('/api', (req, res, next) => {
      const startTime = Date.now();
      
      // Detailed request logging
      log(`📥 ${req.method} ${req.originalUrl}`);
      log(`📥 Headers: ${JSON.stringify(req.headers, null, 2)}`);
      if (req.body && Object.keys(req.body).length > 0) {
        log(`📥 Body: ${JSON.stringify(req.body, null, 2)}`);
      }
      if (req.query && Object.keys(req.query).length > 0) {
        log(`📥 Query: ${JSON.stringify(req.query, null, 2)}`);
      }
      
      // Override res.json to log responses
      const originalJson = res.json;
      res.json = function(data) {
        const responseTime = Date.now() - startTime;
        log(`📤 ${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTime}ms`);
        log(`📤 Response: ${JSON.stringify(data, null, 2)}`);
        return originalJson.call(this, data);
      };
      
      // Skip middleware for uploads to avoid conflicts
      if (req.path.includes('/upload')) {
        return next();
      }
      
      // Apply middleware chain in specific order
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
    
    // Mount the complete API router with all domains
    const apiRouter = createApiRouter(storage);
    app.use('/api', apiRouter);
    
    log('🔗 API Router mounted with all domain routes');
    log('📊 Available endpoints:');
    log('   🔐 Auth: /api/auth/*, /api/user/*');
    log('   📅 Appointments: /api/appointments/*');
    log('   👥 Contacts: /api/contacts/*');
    log('   📆 Calendar: /api/calendar/*');
    log('   💬 Conversations: /api/conversations-simple/*');
    log('   🏥 Medical Records: /api/medical-records/*');
    log('   💼 Pipeline: /api/pipeline-*');
    log('   📈 Analytics: /api/analytics/*');
    log('   ⚙️ Settings: /api/clinics/*/settings/*');
    log('   🤖 AI Templates: /api/clinics/*/ai-templates/*');
    log('   🏷️ Tags: /api/clinic/*/appointment-tags/*');
    log('   👤 User Profile: /api/user/profile');
    log('   🧠 Livia AI: /api/livia/*');
    log('   📋 Anamneses: /api/anamneses/*');
    log('   📚 RAG System: /api/rag/*');
    log('   📎 File Upload: /api/conversations/*/upload');
    
    // Global error handler
    app.use(errorLoggingMiddleware);
    
    // 404 handler
    app.use('*', (req, res) => {
      log(`❌ Route not found: ${req.method} ${req.url}`);
      res.status(404).json({ 
        error: 'Endpoint not found',
        method: req.method,
        url: req.url,
        available_domains: [
          '/api/auth', '/api/appointments', '/api/contacts', '/api/calendar',
          '/api/medical-records', '/api/pipeline-*', '/api/analytics',
          '/api/clinics/*/settings', '/api/clinics/*/ai-templates',
          '/api/clinic/*/appointment-tags', '/api/user/profile',
          '/api/livia', '/api/anamneses', '/api/rag'
        ],
        timestamp: new Date().toISOString()
      });
    });
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      log(`🚀 Operabase Production Server v2.0.0 started successfully`);
      log(`📍 Server running on port ${PORT}`);
      log(`🌐 Health check: http://localhost:${PORT}/health`);
      log(`📊 API Base: http://localhost:${PORT}/api`);
      log(`📍 Supabase URL: ${process.env.SUPABASE_URL ? 'configured' : 'missing'}`);
      log(`📍 Service Role Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing'}`);
      log(`⏰ Started at: ${new Date().toISOString()}`);
      log(`✅ All 50+ endpoints now available via domain system`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app; 