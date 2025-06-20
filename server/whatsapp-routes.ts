import { Router } from 'express';
import { z } from 'zod';
import { storage } from './storage';
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

// Check connection status and update database
router.post('/api/whatsapp/check-connection/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid WhatsApp number ID' });
    }

    const whatsappNumber = await storage.getWhatsAppNumber(id);
    if (!whatsappNumber) {
      return res.status(404).json({ error: 'WhatsApp number not found' });
    }

    // Check connection status with Evolution API
    const connectionResult = await evolutionApi.checkConnection(whatsappNumber.instance_name);
    
    if (!connectionResult.success) {
      return res.status(500).json({ error: connectionResult.error });
    }

    // Update database based on connection status
    if (connectionResult.connected && connectionResult.phoneNumber) {
      const updatedNumber = await storage.updateWhatsAppNumber(id, {
        phone_number: connectionResult.phoneNumber,
        status: 'connected',
        connected_at: new Date(),
        last_seen: new Date()
      });

      res.json({
        connected: true,
        phoneNumber: connectionResult.phoneNumber,
        whatsappNumber: updatedNumber
      });
    } else {
      res.json({
        connected: false,
        status: whatsappNumber.status
      });
    }
  } catch (error) {
    console.error('Error checking WhatsApp connection:', error);
    res.status(500).json({ error: 'Failed to check connection status' });
  }
});

// Disconnect and remove WhatsApp number
router.delete('/api/whatsapp/numbers/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid WhatsApp number ID' });
    }

    const whatsappNumber = await storage.getWhatsAppNumber(id);
    if (!whatsappNumber) {
      return res.status(404).json({ error: 'WhatsApp number not found' });
    }

    // Disconnect from Evolution API
    const disconnectResult = await evolutionApi.disconnectInstance(whatsappNumber.instance_name);
    
    // Remove from database regardless of API result (for cleanup)
    const deleted = await storage.deleteWhatsAppNumber(id);
    
    if (!deleted) {
      return res.status(500).json({ error: 'Failed to remove WhatsApp number from database' });
    }

    res.json({
      success: true,
      apiDisconnected: disconnectResult.success,
      message: 'WhatsApp number removed successfully'
    });
  } catch (error) {
    console.error('Error removing WhatsApp number:', error);
    res.status(500).json({ error: 'Failed to remove WhatsApp number' });
  }
});

// Send test message
router.post('/api/whatsapp/test-message/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid WhatsApp number ID' });
    }

    const whatsappNumber = await storage.getWhatsAppNumber(id);
    if (!whatsappNumber) {
      return res.status(404).json({ error: 'WhatsApp number not found' });
    }

    if (whatsappNumber.status !== 'connected') {
      return res.status(400).json({ error: 'WhatsApp number is not connected' });
    }

    // Send test message
    const result = await evolutionApi.sendTestMessage(
      whatsappNumber.instance_name, 
      whatsappNumber.phone_number
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Update last_seen
    await storage.updateWhatsAppNumber(id, {
      last_seen: new Date()
    });

    res.json({
      success: true,
      message: 'Test message sent successfully'
    });
  } catch (error) {
    console.error('Error sending test message:', error);
    res.status(500).json({ error: 'Failed to send test message' });
  }
});

// Update WhatsApp number status (for periodic health checks)
router.patch('/api/whatsapp/numbers/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid WhatsApp number ID' });
    }

    const { status } = req.body;
    if (!['connected', 'disconnected', 'error'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const updatedNumber = await storage.updateWhatsAppNumber(id, {
      status,
      last_seen: new Date()
    });

    if (!updatedNumber) {
      return res.status(404).json({ error: 'WhatsApp number not found' });
    }

    res.json(updatedNumber);
  } catch (error) {
    console.error('Error updating WhatsApp number status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;