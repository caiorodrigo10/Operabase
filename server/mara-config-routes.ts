import { Request, Response } from 'express';
import { IStorage } from './storage';
import { isAuthenticated } from './auth';
import { db } from './db';

export function setupMaraConfigRoutes(app: any, storage: IStorage) {
  
  // Get all professionals in the clinic with their Mara configurations
  app.get('/api/mara/professional-configs', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const userClinicId = (req as any).user?.clinic_id;

      if (!userClinicId) {
        return res.status(400).json({ error: 'User not associated with a clinic' });
      }

      // Get all professionals in the clinic
      const professionals = await db.execute(`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          u.is_professional
        FROM users u
        WHERE u.clinic_id = $1 
          AND u.is_professional = true
          AND u.is_active = true
        ORDER BY u.name
      `, [userClinicId]);

      // Get Mara configurations for these professionals
      const configs = await db.execute(`
        SELECT 
          mpc.professional_id,
          mpc.knowledge_base_id,
          mpc.is_active,
          kb.name as knowledge_base_name,
          (SELECT COUNT(*) FROM rag_documents WHERE knowledge_base_id = kb.id AND status = 'completed') as document_count,
          (SELECT COUNT(*) FROM rag_embeddings WHERE document_id IN (
            SELECT id FROM rag_documents WHERE knowledge_base_id = kb.id AND status = 'completed'
          )) as chunk_count,
          kb.updated_at as last_updated
        FROM mara_professional_configs mpc
        LEFT JOIN rag_knowledge_bases kb ON mpc.knowledge_base_id = kb.id
        WHERE mpc.clinic_id = $1
      `, [userClinicId]);

      // Combine professionals with their configs
      const result = professionals.rows.map(prof => {
        const config = configs.rows.find(c => c.professional_id === prof.id);
        return {
          ...prof,
          maraConfig: config ? {
            knowledgeBaseId: config.knowledge_base_id,
            knowledgeBaseName: config.knowledge_base_name,
            isActive: config.is_active,
            stats: config.knowledge_base_id ? {
              documentCount: parseInt(config.document_count) || 0,
              chunkCount: parseInt(config.chunk_count) || 0,
              lastUpdated: config.last_updated
            } : null
          } : null
        };
      });

      res.json(result);
    } catch (error) {
      console.error('Error fetching Mara professional configs:', error);
      res.status(500).json({ error: 'Failed to fetch configurations' });
    }
  });

  // Get professionals list (without configs, for dropdown)
  app.get('/api/clinic/professionals', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userClinicId = (req as any).user?.clinic_id;

      if (!userClinicId) {
        return res.status(400).json({ error: 'User not associated with a clinic' });
      }

      const professionals = await db.execute(`
        SELECT 
          id,
          name,
          email,
          role,
          is_professional
        FROM users
        WHERE clinic_id = $1 
          AND is_professional = true
          AND is_active = true
        ORDER BY name
      `, [userClinicId]);

      res.json(professionals.rows);
    } catch (error) {
      console.error('Error fetching professionals:', error);
      res.status(500).json({ error: 'Failed to fetch professionals' });
    }
  });

  // Update Mara configuration for a professional
  app.put('/api/mara/professionals/:id/config', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const professionalId = parseInt(req.params.id);
      const { knowledge_base_id } = req.body;
      const userClinicId = (req as any).user?.clinic_id;

      if (!userClinicId) {
        return res.status(400).json({ error: 'User not associated with a clinic' });
      }

      // Verify the professional belongs to the same clinic
      const professional = await db.execute(`
        SELECT id, clinic_id FROM users 
        WHERE id = $1 AND clinic_id = $2 AND is_professional = true
      `, [professionalId, userClinicId]);

      if (professional.rows.length === 0) {
        return res.status(404).json({ error: 'Professional not found or not in your clinic' });
      }

      // If knowledge_base_id is null, delete the configuration (disconnect)
      if (knowledge_base_id === null || knowledge_base_id === undefined) {
        await db.execute(`
          DELETE FROM mara_professional_configs 
          WHERE professional_id = $1 AND clinic_id = $2
        `, [professionalId, userClinicId]);
        
        res.json({ message: 'Mara configuration disconnected' });
        return;
      }

      // Verify the knowledge base exists and belongs to the user
      const knowledgeBase = await db.execute(`
        SELECT id, name FROM rag_knowledge_bases 
        WHERE id = $1 AND (external_user_id = $2 OR external_user_id IS NULL)
      `, [knowledge_base_id, (req as any).user?.id]);

      if (knowledgeBase.rows.length === 0) {
        return res.status(404).json({ error: 'Knowledge base not found or not accessible' });
      }

      // Upsert the configuration
      await db.execute(`
        INSERT INTO mara_professional_configs (clinic_id, professional_id, knowledge_base_id, is_active)
        VALUES ($1, $2, $3, true)
        ON CONFLICT (clinic_id, professional_id)
        DO UPDATE SET 
          knowledge_base_id = $3,
          is_active = true,
          updated_at = NOW()
      `, [userClinicId, professionalId, knowledge_base_id]);

      res.json({ 
        message: 'Mara configuration updated successfully',
        knowledgeBaseName: knowledgeBase.rows[0].name
      });
    } catch (error) {
      console.error('Error updating Mara configuration:', error);
      res.status(500).json({ error: 'Failed to update configuration' });
    }
  });

  // Get Mara configuration for a specific professional (used by Mara AI service)
  app.get('/api/mara/config/:professionalId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const professionalId = parseInt(req.params.professionalId);
      const userClinicId = (req as any).user?.clinic_id;

      const config = await db.execute(`
        SELECT 
          mpc.knowledge_base_id,
          mpc.is_active,
          kb.name as knowledge_base_name
        FROM mara_professional_configs mpc
        LEFT JOIN rag_knowledge_bases kb ON mpc.knowledge_base_id = kb.id
        WHERE mpc.professional_id = $1 AND mpc.clinic_id = $2 AND mpc.is_active = true
      `, [professionalId, userClinicId]);

      if (config.rows.length === 0) {
        res.json({ hasConfig: false });
        return;
      }

      res.json({
        hasConfig: true,
        knowledgeBaseId: config.rows[0].knowledge_base_id,
        knowledgeBaseName: config.rows[0].knowledge_base_name,
        isActive: config.rows[0].is_active
      });
    } catch (error) {
      console.error('Error fetching Mara config for professional:', error);
      res.status(500).json({ error: 'Failed to fetch configuration' });
    }
  });
}