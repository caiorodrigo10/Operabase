import { Router, Request, Response } from 'express';
import { structuredLogger, LogCategory } from '../../../shared/structured-logger.service.js';
import { medicalAudit } from '../../../shared/medical-audit.service.js';
import { smartAlerts } from '../../../shared/smart-alerts.service.js';
import { performanceMonitor } from '../../../shared/performance-monitor.js';
import { cacheService } from '../../../shared/redis-cache.service.js';
import { tenantContext } from '../../../shared/tenant-context.provider.js';
import { isAuthenticated, hasClinicAccess } from '../../../auth.js';

/**
 * Observability routes for comprehensive system monitoring
 */
export function createObservabilityRoutes(): Router {
  const router = Router();

  // Apply authentication to all observability routes
  router.use(isAuthenticated);

  /**
   * GET /api/v1/observability/health
   * Comprehensive system health check
   */
  router.get('/health', async (req: Request, res: Response) => {
    try {
      const context = tenantContext.getContext();
      const cacheHealth = await cacheService.healthCheck();
      const performanceHealth = performanceMonitor.isHealthy();
      const alertSummary = smartAlerts.getAlertSummary();

      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: 'v3.0-observability',
        uptime: process.uptime(),
        tenant: {
          clinic_id: context?.clinicId,
          user_id: context?.userId,
          user_role: context?.userRole
        },
        services: {
          cache: {
            healthy: cacheHealth.healthy,
            message: cacheHealth.message,
            status: cacheHealth.healthy ? 'operational' : 'degraded'
          },
          performance: {
            healthy: performanceHealth.healthy,
            issues: performanceHealth.issues,
            status: performanceHealth.healthy ? 'operational' : 'degraded'
          },
          alerts: {
            total_active: alertSummary.total,
            critical_count: alertSummary.by_severity.CRITICAL,
            recent_count: alertSummary.recent_count,
            status: alertSummary.by_severity.CRITICAL > 0 ? 'critical' : 
                   alertSummary.by_severity.HIGH > 0 ? 'warning' : 'operational'
          },
          logging: {
            healthy: true,
            status: 'operational'
          }
        },
        overall_status: determineOverallHealth(cacheHealth, performanceHealth, alertSummary)
      };

      // Log health check access
      structuredLogger.info(
        LogCategory.API,
        'health_check_accessed',
        {
          clinic_id: context?.clinicId,
          user_id: context?.userId,
          overall_status: healthStatus.overall_status
        }
      );

      const statusCode = healthStatus.overall_status === 'healthy' ? 200 : 
                        healthStatus.overall_status === 'degraded' ? 503 : 500;

      res.status(statusCode).json(healthStatus);

    } catch (error) {
      structuredLogger.error(
        LogCategory.API,
        'health_check_failed',
        { error: (error as Error).message }
      );

      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: (error as Error).message
      });
    }
  });

  /**
   * GET /api/v1/observability/metrics
   * Comprehensive performance and system metrics
   */
  router.get('/metrics', async (req: Request, res: Response) => {
    try {
      const context = tenantContext.getContext();
      const performanceMetrics = performanceMonitor.getMetrics();
      const cacheStats = cacheService.getStats();
      const alertSummary = smartAlerts.getAlertSummary();
      const currentTenantMetrics = performanceMonitor.getCurrentTenantMetrics();

      const metrics = {
        timestamp: new Date().toISOString(),
        tenant: {
          clinic_id: context?.clinicId,
          current_metrics: currentTenantMetrics
        },
        performance: {
          api: performanceMetrics.api,
          response_times: performanceMetrics.performance,
          tenant_breakdown: performanceMetrics.tenants
        },
        cache: {
          stats: cacheStats,
          efficiency: {
            hit_rate_numeric: parseFloat(cacheStats.hitRate.replace('%', '')),
            total_operations: cacheStats.total,
            operations_breakdown: {
              hits: cacheStats.hits,
              misses: cacheStats.misses,
              sets: cacheStats.sets,
              deletes: cacheStats.deletes
            }
          }
        },
        alerts: {
          summary: alertSummary,
          active_alerts: smartAlerts.getActiveAlerts(10)
        },
        system: {
          uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
          cpu_usage: process.cpuUsage()
        }
      };

      // Log metrics access
      structuredLogger.info(
        LogCategory.API,
        'metrics_accessed',
        {
          clinic_id: context?.clinicId,
          user_id: context?.userId,
          metric_types: ['performance', 'cache', 'alerts', 'system']
        }
      );

      res.json(metrics);

    } catch (error) {
      structuredLogger.error(
        LogCategory.API,
        'metrics_retrieval_failed',
        { error: (error as Error).message }
      );

      res.status(500).json({
        error: 'Failed to retrieve metrics',
        message: (error as Error).message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /api/v1/observability/logs
   * Filtered logs for current tenant
   */
  router.get('/logs', async (req: Request, res: Response) => {
    try {
      const context = tenantContext.getContext();
      if (!context?.clinicId) {
        return res.status(400).json({ error: 'Tenant context required' });
      }

      const {
        category = undefined,
        limit = 100,
        level = undefined,
        hours = 24
      } = req.query;

      const logCategory = category ? category as LogCategory : undefined;
      const logLimit = Math.min(parseInt(limit as string) || 100, 1000);

      // Get logs for the current tenant
      const logs = await structuredLogger.getLogsByTenant(
        context.clinicId,
        logCategory,
        logLimit
      );

      // Filter by log level if specified
      const filteredLogs = level ? 
        logs.filter(log => log.level === level) : 
        logs;

      // Filter by time range
      const hoursNum = parseInt(hours as string) || 24;
      const cutoffTime = new Date(Date.now() - hoursNum * 60 * 60 * 1000);
      const timeLimitedLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) > cutoffTime
      );

      // Log access to logs (meta-logging)
      structuredLogger.info(
        LogCategory.API,
        'logs_accessed',
        {
          clinic_id: context.clinicId,
          user_id: context.userId,
          requested_category: category,
          requested_level: level,
          requested_limit: logLimit,
          returned_count: timeLimitedLogs.length
        }
      );

      res.json({
        logs: timeLimitedLogs,
        metadata: {
          total_returned: timeLimitedLogs.length,
          filters_applied: {
            category: logCategory,
            level: level,
            hours: hoursNum,
            clinic_id: context.clinicId
          },
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      structuredLogger.error(
        LogCategory.API,
        'logs_retrieval_failed',
        { error: (error as Error).message }
      );

      res.status(500).json({
        error: 'Failed to retrieve logs',
        message: (error as Error).message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /api/v1/observability/audit/:patient_id
   * Medical audit trail for specific patient
   */
  router.get('/audit/:patient_id', hasClinicAccess(), async (req: Request, res: Response) => {
    try {
      const patientId = parseInt(req.params.patient_id);
      if (isNaN(patientId)) {
        return res.status(400).json({ error: 'Invalid patient ID' });
      }

      const context = tenantContext.getContext();
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);

      // Get audit trail for the patient
      const auditTrail = await medicalAudit.getPatientAuditTrail(patientId, limit);

      // Log audit access (this is itself an auditable event)
      medicalAudit.auditPatientAccess(patientId, 'view', {
        audit_trail_requested: true,
        returned_entries: auditTrail.length,
        requested_by: context?.userId
      });

      res.json({
        patient_id: patientId,
        audit_trail: auditTrail,
        metadata: {
          total_entries: auditTrail.length,
          clinic_id: context?.clinicId,
          accessed_by: context?.userId,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      structuredLogger.error(
        LogCategory.AUDIT,
        'audit_trail_access_failed',
        { 
          patient_id: req.params.patient_id,
          error: (error as Error).message 
        }
      );

      res.status(500).json({
        error: 'Failed to retrieve audit trail',
        message: (error as Error).message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /api/v1/observability/alerts
   * Active alerts for current tenant
   */
  router.get('/alerts', async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const severity = req.query.severity as string;
      const category = req.query.category as string;

      let activeAlerts = smartAlerts.getActiveAlerts(limit * 2); // Get more to filter

      // Apply filters
      if (severity) {
        activeAlerts = activeAlerts.filter(alert => 
          alert.severity.toLowerCase() === severity.toLowerCase()
        );
      }

      if (category) {
        activeAlerts = activeAlerts.filter(alert => 
          alert.category.toLowerCase() === category.toLowerCase()
        );
      }

      // Apply final limit
      activeAlerts = activeAlerts.slice(0, limit);

      const summary = smartAlerts.getAlertSummary();
      const context = tenantContext.getContext();

      // Log alerts access
      structuredLogger.info(
        LogCategory.API,
        'alerts_accessed',
        {
          clinic_id: context?.clinicId,
          user_id: context?.userId,
          filters: { severity, category, limit },
          returned_count: activeAlerts.length
        }
      );

      res.json({
        alerts: activeAlerts,
        summary: summary,
        filters_applied: {
          severity: severity || 'all',
          category: category || 'all',
          limit
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      structuredLogger.error(
        LogCategory.API,
        'alerts_retrieval_failed',
        { error: (error as Error).message }
      );

      res.status(500).json({
        error: 'Failed to retrieve alerts',
        message: (error as Error).message,
        timestamp: new Date().toISOString()
      });
    }
  });

  return router;
}

/**
 * Helper function to determine overall system health
 */
function determineOverallHealth(
  cacheHealth: any,
  performanceHealth: any,
  alertSummary: any
): 'healthy' | 'degraded' | 'critical' {
  // Critical if there are critical alerts
  if (alertSummary.by_severity.CRITICAL > 0) {
    return 'critical';
  }

  // Degraded if cache is unhealthy or performance issues exist
  if (!cacheHealth.healthy || !performanceHealth.healthy || alertSummary.by_severity.HIGH > 2) {
    return 'degraded';
  }

  return 'healthy';
}