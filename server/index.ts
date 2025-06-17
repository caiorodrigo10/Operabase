import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";
import { createApiRouter } from "./api/v1";
import { createStorage } from "./storage-factory";
import { setupAuth } from "./auth";
import { tenantIsolationMiddleware } from "./shared/tenant-isolation.middleware";
import { cacheInterceptorMiddleware, cacheInvalidationMiddleware } from "./shared/cache-interceptor.middleware";
import { observabilityMiddleware, medicalComplianceMiddleware, errorTrackingMiddleware, correlationMiddleware } from "./shared/observability-middleware";
import { performanceMonitor } from "./shared/performance-monitor";
import { cacheService } from "./shared/redis-cache.service";
import { tenantContext } from "./shared/tenant-context.provider";
import http from "http";

const app = express();
app.use(express.json());
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
  
  // Apply comprehensive middleware chain to all API routes
  app.use('/api', correlationMiddleware);
  app.use('/api', observabilityMiddleware);
  app.use('/api', medicalComplianceMiddleware);
  app.use('/api', cacheInterceptorMiddleware as any);
  app.use('/api', tenantIsolationMiddleware as any);
  app.use('/api', cacheInvalidationMiddleware as any);
  
  // Setup API routes
  const apiRouter = createApiRouter(storage);
  app.use('/api', apiRouter);
  
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
  app.use(errorTrackingMiddleware);

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
