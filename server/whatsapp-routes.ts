import { Router } from 'express';
import { z } from 'zod';
import { getStorage } from './storage';
import { evolutionApi } from './whatsapp-evolution-service';
import { insertWhatsAppNumberSchema } from '@shared/schema';

const router = Router();

// Get all WhatsApp numbers for a clinic
router.get('/api/whatsapp/numbers/:clinicId', async (req, res) => {
  try {
    const clinicId = parseInt(req.params.clinicId);
    if (isNaN(clinicId)) {
      return res.status(400).json({ error: 'Invalid clinic ID' });
    }

    const storage = await getStorage();
    const numbers = await storage.getWhatsAppNumbers(clinicId);
    res.json(numbers);
  } catch (error) {
    console.error('Error fetching WhatsApp numbers:', error);
    res.status(500).json({ error: 'Failed to fetch WhatsApp numbers' });
  }
});

// Start WhatsApp connection process
router.post('/api/whatsapp/connect', async (req, res) => {
  try {
    const { clinicId, userId } = req.body;
    
    if (!clinicId || !userId) {
      return res.status(400).json({ error: 'Clinic ID and User ID are required' });
    }

    // Start the connection process with Evolution API
    const result = await evolutionApi.startConnection(clinicId, userId);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Create a temporary record in database with connecting status
    const storage = await getStorage();
    const whatsappNumber = await storage.createWhatsAppNumber({
      clinic_id: clinicId,
      user_id: userId,
      phone_number: '', // Will be updated when connection is confirmed
      instance_name: result.instanceName!,
      status: 'connecting'
    });

    res.json({
      id: whatsappNumber.id,
      instanceName: result.instanceName,
      qrCode: result.qrCode,
      status: 'connecting'
    });
  } catch (error) {
    console.error('Error starting WhatsApp connection:', error);
    res.status(500).json({ error: 'Failed to start WhatsApp connection' });
  }
});

// Get QR code for instance connection
router.get('/api/whatsapp/qr/:instanceName', async (req, res) => {
  try {
    const instanceName = req.params.instanceName;
    
    // Get QR code from Evolution API
    const qrResult = await evolutionApi.getQRCode(instanceName);
    
    if (!qrResult.success) {
      return res.status(404).json({ error: qrResult.error });
    }

    // Update database status to connecting
    const storage = await getStorage();
    const whatsappNumber = await storage.getWhatsAppNumberByInstance(instanceName);
    if (whatsappNumber) {
      await storage.updateWhatsAppNumberStatus(whatsappNumber.id, 'connecting');
    }

    res.json({ qrCode: qrResult.qrCode });
  } catch (error) {
    console.error('Error getting QR code:', error);
    res.status(500).json({ error: 'Failed to get QR code' });
  }
});

// Check connection status
router.get('/api/whatsapp/status/:instanceName', async (req, res) => {
  try {
    const instanceName = req.params.instanceName;
    
    // Check status with Evolution API
    const statusResult = await evolutionApi.getConnectionStatus(instanceName);
    
    if (!statusResult.success) {
      return res.status(404).json({ error: statusResult.error });
    }

    // Update database if connected
    const storage = await getStorage();
    const whatsappNumber = await storage.getWhatsAppNumberByInstance(instanceName);
    if (whatsappNumber && statusResult.connected && statusResult.phoneNumber) {
      await storage.updateWhatsAppNumber(whatsappNumber.id, {
        phone_number: statusResult.phoneNumber,
        status: 'connected',
        connected_at: new Date()
      });
    }

    res.json({
      connected: statusResult.connected,
      phoneNumber: statusResult.phoneNumber,
      status: statusResult.connected ? 'connected' : 'disconnected'
    });
  } catch (error) {
    console.error('Error checking connection status:', error);
    res.status(500).json({ error: 'Failed to check connection status' });
  }
});

// Webhook endpoint for Evolution API status updates
router.post('/api/whatsapp/webhook/:instanceName', async (req, res) => {
  try {
    const instanceName = req.params.instanceName;
    const { event, data } = req.body;

    console.log(`WhatsApp webhook for ${instanceName}:`, event, data);

    const storage = await getStorage();
    const whatsappNumber = await storage.getWhatsAppNumberByInstance(instanceName);
    
    if (!whatsappNumber) {
      return res.status(404).json({ error: 'WhatsApp number not found' });
    }

    // Handle different webhook events
    switch (event) {
      case 'connection.update':
        if (data.state === 'open' && data.phoneNumber) {
          await storage.updateWhatsAppNumber(whatsappNumber.id, {
            phone_number: data.phoneNumber,
            status: 'connected',
            connected_at: new Date()
          });
        } else if (data.state === 'close') {
          await storage.updateWhatsAppNumberStatus(whatsappNumber.id, 'disconnected');
        }
        break;
      
      case 'qr.update':
        // QR code updated, status remains connecting
        break;
        
      default:
        console.log('Unhandled webhook event:', event);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Disconnect WhatsApp number
router.post('/api/whatsapp/disconnect/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid WhatsApp number ID' });
    }

    const storage = await getStorage();
    const whatsappNumber = await storage.getWhatsAppNumber(id);
    
    if (!whatsappNumber) {
      return res.status(404).json({ error: 'WhatsApp number not found' });
    }

    // Disconnect from Evolution API
    const disconnectResult = await evolutionApi.disconnectInstance(whatsappNumber.instance_name);
    
    if (!disconnectResult.success) {
      return res.status(500).json({ error: disconnectResult.error });
    }

    // Update status in database
    await storage.updateWhatsAppNumberStatus(id, 'disconnected');

    res.json({ success: true, message: 'WhatsApp disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting WhatsApp:', error);
    res.status(500).json({ error: 'Failed to disconnect WhatsApp' });
  }
});

// Delete WhatsApp number
router.delete('/api/whatsapp/numbers/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid WhatsApp number ID' });
    }

    const storage = await getStorage();
    const whatsappNumber = await storage.getWhatsAppNumber(id);
    
    if (!whatsappNumber) {
      return res.status(404).json({ error: 'WhatsApp number not found' });
    }

    // Delete instance from Evolution API
    await evolutionApi.deleteInstance(whatsappNumber.instance_name);

    // Delete from database
    await storage.deleteWhatsAppNumber(id);

    res.json({ success: true, message: 'WhatsApp number deleted successfully' });
  } catch (error) {
    console.error('Error deleting WhatsApp number:', error);
    res.status(500).json({ error: 'Failed to delete WhatsApp number' });
  }
});

export default router;