import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";
import { createApiRouter } from "./api/v1";
import { createStorage } from "./storage-factory";
import { setupAuth } from "./auth";
import { tenantIsolationMiddleware } from "./shared/tenant-isolation.middleware";
import { cacheInterceptorMiddleware, cacheInvalidationMiddleware } from "./shared/cache-interceptor.middleware";
import { performanceTrackingMiddleware, auditLoggingMiddleware, errorLoggingMiddleware } from "./shared/observability-middleware.js";
import { performanceMonitor } from "./shared/performance-monitor";
import { cacheService } from "./shared/redis-cache.service";
import { tenantContext } from "./shared/tenant-context.provider";
import { setupOptimizedRoutes } from "./optimized-routes.js";
import { performanceOptimizer } from "./performance-optimizer.js";
import http from "http";

const app = express();
app.use(express.json({ 
  reviver: (key, value) => {
    // Prevent automatic date parsing - keep strings as strings
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value; // Keep date strings as strings
    }
    return value;
  }
}));
app.use(express.urlencoded({ extended: false }));

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
  
  // Apply Phase 3 observability middleware chain to all API routes
  app.use('/api', performanceTrackingMiddleware);
  app.use('/api', auditLoggingMiddleware);
  app.use('/api', cacheInterceptorMiddleware as any);
  app.use('/api', tenantIsolationMiddleware as any);
  app.use('/api', cacheInvalidationMiddleware as any);
  
  // Setup optimized routes first for better performance
  setupOptimizedRoutes(app);
  
  // Setup admin routes
  const { setupAdminRoutes } = await import('./admin-routes');
  setupAdminRoutes(app, storage);
  
  // Setup API routes
  const apiRouter = createApiRouter(storage);
  app.use('/api', apiRouter);
  
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
  
  // Add WhatsApp routes
  const whatsappRoutes = await import('./whatsapp-routes');
  app.use(whatsappRoutes.default);
  
  // Initialize anamnesis system
  try {
    const { initializeAnamnesisSystem } = await import('./anamnesis-setup');
    await initializeAnamnesisSystem();
    console.log('✅ Anamnesis system initialized');
  } catch (error) {
    console.error('❌ Error initializing anamnesis system:', error);
  }

  // Initialize WhatsApp table
  try {
    const storage = await getStorage() as any;
    if (storage.pool) {
      await storage.pool.query(`
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
      
      await storage.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_whatsapp_numbers_clinic_id 
        ON whatsapp_numbers(clinic_id);
      `);
      
      await storage.pool.query(`
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
    res.json(metrics);
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

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Please kill any existing processes or use a different port.`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
})();
