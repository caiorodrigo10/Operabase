import { Request, Response } from 'express';
import { isAuthenticated } from './auth';
import { IStorage } from './storage';
import { WhatsAppEvolutionService } from './whatsapp-evolution-service';

export function setupWhatsAppRoutes(app: any, storage: IStorage) {
  const whatsappService = new WhatsAppEvolutionService(storage);

  // Get WhatsApp configuration
  app.get('/api/whatsapp/config', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get user's clinic
      const userProfile = await storage.getUserProfile(userId);
      if (!userProfile?.clinic_id) {
        return res.status(404).json({ error: 'User clinic not found' });
      }

      const config = await storage.getClinicSettings(userProfile.clinic_id, [
        'whatsapp_evolution_api_key',
        'whatsapp_evolution_base_url',
        'whatsapp_instance_name',
        'whatsapp_status'
      ]) as Record<string, string>;

      // Don't expose the actual API key, just indicate if it's configured
      const response = {
        configured: !!config.whatsapp_evolution_api_key,
        base_url: config.whatsapp_evolution_base_url || '',
        instance_name: config.whatsapp_instance_name || '',
        status: config.whatsapp_status || 'disconnected'
      };

      res.json(response);
    } catch (error) {
      console.error('❌ Error getting WhatsApp config:', error);
      res.status(500).json({ error: 'Failed to get WhatsApp configuration' });
    }
  });

  // Save WhatsApp configuration
  app.post('/api/whatsapp/config', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { api_key, base_url, instance_name } = req.body;

      if (!api_key) {
        return res.status(400).json({ error: 'API Key is required' });
      }

      // Get user's clinic
      const userProfile = await storage.getUserProfile(userId);
      if (!userProfile?.clinic_id) {
        return res.status(404).json({ error: 'User clinic not found' });
      }

      // Save configuration
      await storage.setClinicSetting(userProfile.clinic_id, 'whatsapp_evolution_api_key', api_key, 'string');
      
      if (base_url) {
        await storage.setClinicSetting(userProfile.clinic_id, 'whatsapp_evolution_base_url', base_url, 'string');
      }
      
      if (instance_name) {
        await storage.setClinicSetting(userProfile.clinic_id, 'whatsapp_instance_name', instance_name, 'string');
      }

      await storage.setClinicSetting(userProfile.clinic_id, 'whatsapp_status', 'configured', 'string');

      res.json({ success: true, message: 'WhatsApp configuration saved successfully' });
    } catch (error) {
      console.error('❌ Error saving WhatsApp config:', error);
      res.status(500).json({ error: 'Failed to save WhatsApp configuration' });
    }
  });

  // Test WhatsApp connection
  app.post('/api/whatsapp/test-connection', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get user's clinic
      const userProfile = await storage.getUserProfile(userId);
      if (!userProfile?.clinic_id) {
        return res.status(404).json({ error: 'User clinic not found' });
      }

      const result = await whatsappService.testConnection(userProfile.clinic_id);
      
      if (result.success) {
        await storage.setClinicSetting(userProfile.clinic_id, 'whatsapp_status', 'connected', 'string');
      } else {
        await storage.setClinicSetting(userProfile.clinic_id, 'whatsapp_status', 'error', 'string');
      }

      res.json(result);
    } catch (error) {
      console.error('❌ Error testing WhatsApp connection:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to test connection',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get WhatsApp instance status
  app.get('/api/whatsapp/status', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get user's clinic
      const userProfile = await storage.getUserProfile(userId);
      if (!userProfile?.clinic_id) {
        return res.status(404).json({ error: 'User clinic not found' });
      }

      const status = await whatsappService.getInstanceStatus(userProfile.clinic_id);
      res.json(status);
    } catch (error) {
      console.error('❌ Error getting WhatsApp status:', error);
      res.status(500).json({ error: 'Failed to get WhatsApp status' });
    }
  });

  // Create WhatsApp instance
  app.post('/api/whatsapp/create-instance', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get user's clinic
      const userProfile = await storage.getUserProfile(userId);
      if (!userProfile?.clinic_id) {
        return res.status(404).json({ error: 'User clinic not found' });
      }

      const result = await whatsappService.createInstance(userProfile.clinic_id);
      res.json(result);
    } catch (error) {
      console.error('❌ Error creating WhatsApp instance:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create instance',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Generate QR Code for WhatsApp connection
  app.get('/api/whatsapp/qr-code', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get user's clinic
      const userProfile = await storage.getUserProfile(userId);
      if (!userProfile?.clinic_id) {
        return res.status(404).json({ error: 'User clinic not found' });
      }

      const qrCode = await whatsappService.getQRCode(userProfile.clinic_id);
      res.json(qrCode);
    } catch (error) {
      console.error('❌ Error getting QR code:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get QR code',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Send WhatsApp message
  app.post('/api/whatsapp/send-message', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { phone, message, contact_id } = req.body;

      if (!phone || !message) {
        return res.status(400).json({ error: 'Phone and message are required' });
      }

      // Get user's clinic
      const userProfile = await storage.getUserProfile(userId);
      if (!userProfile?.clinic_id) {
        return res.status(404).json({ error: 'User clinic not found' });
      }

      const result = await whatsappService.sendMessage(userProfile.clinic_id, {
        phone,
        message,
        contact_id
      });

      res.json(result);
    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send message',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Webhook endpoint for receiving WhatsApp messages
  app.post('/api/whatsapp/webhook', async (req: Request, res: Response) => {
    try {
      console.log('📱 WhatsApp webhook received:', req.body);
      
      // Process the webhook
      await whatsappService.processWebhook(req.body);
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ Error processing WhatsApp webhook:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  });
}