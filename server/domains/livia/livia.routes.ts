import { Router } from 'express';
import { z } from 'zod';
import { insertLiviaConfigurationSchema, updateLiviaConfigurationSchema } from '../../../shared/schema';
import { IStorage } from '../../storage';
import { isAuthenticated } from '../../auth';
import { tenantContext } from '../../shared/tenant-context.provider';

export function createLiviaRoutes(storage: IStorage): Router {
  const router = Router();

  // Test endpoint (no auth required)
  router.get('/livia/test', async (req, res) => {
    res.json({ message: 'Livia routes working', timestamp: new Date().toISOString() });
  });

  // GET /api/livia/config - Get current Livia configuration for the clinic
  router.get('/livia/config', isAuthenticated, async (req, res) => {
    try {
      const context = tenantContext.getContext();
      const clinicId = context?.clinicId || (req.user as any)?.clinic_id || 1;
      
      const config = await storage.getLiviaConfiguration(clinicId);
      
      if (!config) {
        return res.status(404).json({ 
          error: 'Configuração da Livia não encontrada' 
        });
      }
      
      res.json(config);
    } catch (error) {
      console.error('Error getting Livia configuration:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor ao buscar configuração da Livia' 
      });
    }
  });

  // POST /api/livia/config - Create new Livia configuration
  router.post('/livia/config', isAuthenticated, async (req, res) => {
    try {
      const context = tenantContext.getContext();
      const clinicId = context?.clinicId || (req.user as any)?.clinic_id || 1;
      
      // Validate request body
      const validatedData = insertLiviaConfigurationSchema.parse({
        ...req.body,
        clinic_id: clinicId
      });
      
      // Check if configuration already exists
      const existingConfig = await storage.getLiviaConfiguration(clinicId);
      if (existingConfig) {
        return res.status(409).json({ 
          error: 'Configuração da Livia já existe para esta clínica' 
        });
      }
      
      const config = await storage.createLiviaConfiguration(validatedData);
      
      res.status(201).json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Dados inválidos',
          details: error.errors 
        });
      }
      
      console.error('Error creating Livia configuration:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor ao criar configuração da Livia' 
      });
    }
  });

  // PUT /api/livia/config - Update Livia configuration
  router.put('/livia/config', isAuthenticated, async (req, res) => {
    try {
      const context = tenantContext.getContext();
      const clinicId = context?.clinicId || (req.user as any)?.clinic_id || 1;
      
      // Validate request body
      const validatedData = updateLiviaConfigurationSchema.parse(req.body);
      
      const config = await storage.updateLiviaConfiguration(clinicId, validatedData);
      
      if (!config) {
        return res.status(404).json({ 
          error: 'Configuração da Livia não encontrada' 
        });
      }
      
      res.json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Dados inválidos',
          details: error.errors 
        });
      }
      
      console.error('Error updating Livia configuration:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor ao atualizar configuração da Livia' 
      });
    }
  });

  // DELETE /api/livia/config - Delete Livia configuration
  router.delete('/livia/config', isAuthenticated, async (req, res) => {
    try {
      const context = tenantContext.getContext();
      const clinicId = context?.clinicId || (req.user as any)?.clinic_id || 1;
      
      const deleted = await storage.deleteLiviaConfiguration(clinicId);
      
      if (!deleted) {
        return res.status(404).json({ 
          error: 'Configuração da Livia não encontrada' 
        });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting Livia configuration:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor ao deletar configuração da Livia' 
      });
    }
  });

  // GET /api/livia/config/n8n - Special endpoint for N8N integration with enhanced data
  router.get('/livia/config/n8n', isAuthenticated, async (req, res) => {
    try {
      const context = tenantContext.getContext();
      const clinicId = context?.clinicId || (req.user as any)?.clinic_id || 1;
      
      const config = await storage.getLiviaConfigurationForN8N(clinicId);
      
      if (!config) {
        return res.status(404).json({ 
          error: 'Configuração da Livia não encontrada' 
        });
      }
      
      res.json(config);
    } catch (error) {
      console.error('Error getting Livia configuration for N8N:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor ao buscar configuração da Livia para N8N' 
      });
    }
  });

  return router;
}