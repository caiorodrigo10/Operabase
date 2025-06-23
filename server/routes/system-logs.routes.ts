import { Router, Request, Response } from 'express';
import { systemLogsService } from '../services/system-logs.service';
import { isAuthenticated } from '../auth';
import { tenantContext } from '../shared/tenant-context.provider';

const router = Router();

/**
 * Routes para consulta dos logs do sistema - Fase 1 MVP
 */

// Get patient timeline (logs relacionados a um contato específico)
router.get('/system-logs/patient/:contactId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const contactId = parseInt(req.params.contactId);
    const limit = parseInt(req.query.limit as string) || 50;
    const clinicId = tenantContext.getClinicId();

    if (isNaN(contactId)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }

    if (!clinicId) {
      return res.status(400).json({ error: 'Clinic context required' });
    }

    const timeline = await systemLogsService.getPatientTimeline(contactId, clinicId, limit);
    
    res.json({
      success: true,
      data: timeline,
      total: timeline.length,
      contactId,
      clinicId
    });
  } catch (error) {
    console.error('Error fetching patient timeline:', error);
    res.status(500).json({ error: 'Failed to fetch patient timeline' });
  }
});

// Get recent activity for clinic
router.get('/system-logs/recent', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const clinicId = tenantContext.getClinicId();

    if (!clinicId) {
      return res.status(400).json({ error: 'Clinic context required' });
    }

    const recentActivity = await systemLogsService.getRecentActivity(clinicId, limit);
    
    res.json({
      success: true,
      data: recentActivity,
      total: recentActivity.length,
      clinicId
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

// Get professional activity
router.get('/system-logs/professional/:professionalId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const professionalId = parseInt(req.params.professionalId);
    const limit = parseInt(req.query.limit as string) || 50;
    const clinicId = tenantContext.getClinicId();

    if (isNaN(professionalId)) {
      return res.status(400).json({ error: 'Invalid professional ID' });
    }

    if (!clinicId) {
      return res.status(400).json({ error: 'Clinic context required' });
    }

    const activity = await systemLogsService.getProfessionalActivity(clinicId, professionalId, limit);
    
    res.json({
      success: true,
      data: activity,
      total: activity.length,
      professionalId,
      clinicId
    });
  } catch (error) {
    console.error('Error fetching professional activity:', error);
    res.status(500).json({ error: 'Failed to fetch professional activity' });
  }
});

// Get activity statistics
router.get('/system-logs/stats', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const clinicId = tenantContext.getClinicId();

    if (!clinicId) {
      return res.status(400).json({ error: 'Clinic context required' });
    }

    const stats = await systemLogsService.getActivityStats(clinicId, days);
    
    res.json({
      success: true,
      data: stats,
      period: `${days} days`,
      clinicId
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({ error: 'Failed to fetch activity stats' });
  }
});

// Get logs by entity type and action
router.get('/system-logs/filter', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { entity_type, action_type, actor_type, limit } = req.query;
    const clinicId = tenantContext.getClinicId();

    if (!clinicId) {
      return res.status(400).json({ error: 'Clinic context required' });
    }

    // Simple filtering - pode ser expandido conforme necessário
    const recentLogs = await systemLogsService.getRecentActivity(clinicId, parseInt(limit as string) || 100);
    
    let filteredLogs = recentLogs;
    
    if (entity_type) {
      filteredLogs = filteredLogs.filter(log => log.entity_type === entity_type);
    }
    
    if (action_type) {
      filteredLogs = filteredLogs.filter(log => log.action_type === action_type);
    }
    
    if (actor_type) {
      filteredLogs = filteredLogs.filter(log => log.actor_type === actor_type);
    }
    
    res.json({
      success: true,
      data: filteredLogs,
      total: filteredLogs.length,
      filters: { entity_type, action_type, actor_type },
      clinicId
    });
  } catch (error) {
    console.error('Error filtering logs:', error);
    res.status(500).json({ error: 'Failed to filter logs' });
  }
});

export default router;