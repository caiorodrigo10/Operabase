import { IStorage } from './storage';

interface WhatsAppMessage {
  phone: string;
  message: string;
  contact_id?: number;
}

interface WhatsAppResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

interface InstanceConfig {
  instanceName: string;
  qrcode: boolean;
  integration: string;
  webhook_url?: string;
}

export class WhatsAppEvolutionService {
  private storage: IStorage;
  private baseUrl: string;
  private apiKey: string;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.baseUrl = 'https://n8n-evolution-api.4gmy9o.easypanel.host';
    this.apiKey = process.env.EVOLUTION_API_KEY || '';
  }

  private async getClinicConfig(clinicId: number) {
    const config = await this.storage.getClinicSettings(clinicId, [
      'whatsapp_evolution_api_key',
      'whatsapp_evolution_base_url',
      'whatsapp_instance_name'
    ]) as Record<string, string>;

    return {
      apiKey: config.whatsapp_evolution_api_key || this.apiKey,
      baseUrl: config.whatsapp_evolution_base_url || 'https://n8n-evolution-api.4gmy9o.easypanel.host',
      instanceName: config.whatsapp_instance_name || `taskmed_clinic_${clinicId}`
    };
  }

  private async makeRequest(
    clinicId: number,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<any> {
    const config = await this.getClinicConfig(clinicId);
    
    const url = `${config.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': config.apiKey
    };

    console.log(`🔄 Making ${method} request to Evolution API:`, url);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ Evolution API error:', responseData);
        throw new Error(responseData.message || `HTTP ${response.status}`);
      }

      console.log('✅ Evolution API response:', responseData);
      return responseData;
    } catch (error) {
      console.error('❌ Evolution API request failed:', error);
      throw error;
    }
  }

  async testConnection(clinicId: number): Promise<WhatsAppResponse> {
    try {
      const config = await this.getClinicConfig(clinicId);
      
      // Test API connection by getting manager info
      const response = await this.makeRequest(clinicId, '/manager/fetchInstances');
      
      return {
        success: true,
        data: response,
        message: 'Connection successful'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
        message: 'Unable to connect to Evolution API'
      };
    }
  }

  async createInstance(clinicId: number): Promise<WhatsAppResponse> {
    try {
      const config = await this.getClinicConfig(clinicId);
      const webhookUrl = `${process.env.REPLIT_DOMAINS || 'http://localhost:5000'}/api/whatsapp/webhook`;

      const instanceConfig: InstanceConfig = {
        instanceName: config.instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        webhook_url: webhookUrl
      };

      const response = await this.makeRequest(
        clinicId,
        '/manager/create',
        'POST',
        instanceConfig
      );

      // Save instance name in settings
      await this.storage.setClinicSetting(
        clinicId, 
        'whatsapp_instance_name', 
        config.instanceName, 
        'string'
      );

      return {
        success: true,
        data: response,
        message: 'Instance created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create instance',
        message: 'Unable to create WhatsApp instance'
      };
    }
  }

  async getInstanceStatus(clinicId: number): Promise<WhatsAppResponse> {
    try {
      const config = await this.getClinicConfig(clinicId);
      
      const response = await this.makeRequest(
        clinicId,
        `/manager/fetchInstances/${config.instanceName}`
      );

      return {
        success: true,
        data: response,
        message: 'Status retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get status',
        message: 'Unable to get instance status'
      };
    }
  }

  async getQRCode(clinicId: number): Promise<WhatsAppResponse> {
    try {
      const config = await this.getClinicConfig(clinicId);
      
      const response = await this.makeRequest(
        clinicId,
        `/manager/fetchInstances/${config.instanceName}/connect`
      );

      return {
        success: true,
        data: response,
        message: 'QR Code generated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get QR code',
        message: 'Unable to generate QR code'
      };
    }
  }

  async sendMessage(clinicId: number, messageData: WhatsAppMessage): Promise<WhatsAppResponse> {
    try {
      const config = await this.getClinicConfig(clinicId);
      
      // Format phone number for WhatsApp (remove special characters, add country code if needed)
      let formattedPhone = messageData.phone.replace(/\D/g, '');
      if (!formattedPhone.startsWith('55') && formattedPhone.length === 11) {
        formattedPhone = '55' + formattedPhone;
      }

      const payload = {
        number: formattedPhone,
        text: messageData.message
      };

      const response = await this.makeRequest(
        clinicId,
        `/message/sendText/${config.instanceName}`,
        'POST',
        payload
      );

      // Log message in database if contact_id is provided
      if (messageData.contact_id) {
        try {
          await this.storage.logWhatsAppMessage({
            contact_id: messageData.contact_id,
            clinic_id: clinicId,
            phone: messageData.phone,
            message: messageData.message,
            direction: 'outbound',
            status: 'sent',
            evolution_message_id: response.key?.id || null
          });
        } catch (logError) {
          console.error('❌ Failed to log WhatsApp message:', logError);
        }
      }

      return {
        success: true,
        data: response,
        message: 'Message sent successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
        message: 'Unable to send WhatsApp message'
      };
    }
  }

  async processWebhook(webhookData: any): Promise<void> {
    try {
      console.log('📱 Processing WhatsApp webhook:', webhookData);

      // Extract message data from webhook
      const { data, instance, event } = webhookData;

      if (event === 'messages.upsert' && data?.message) {
        const message = data.message;
        const remoteJid = data.key.remoteJid;
        
        // Extract phone number from remoteJid (format: 5511999999999@s.whatsapp.net)
        const phone = remoteJid.split('@')[0];
        
        // Skip if it's our own message
        if (data.key.fromMe) {
          return;
        }

        // Get message text
        let messageText = '';
        if (message.conversation) {
          messageText = message.conversation;
        } else if (message.extendedTextMessage?.text) {
          messageText = message.extendedTextMessage.text;
        }

        if (messageText) {
          // Find or create contact based on phone number
          const contact = await this.findOrCreateContact(phone, instance);
          
          if (contact) {
            // Log incoming message
            await this.storage.logWhatsAppMessage({
              contact_id: contact.id,
              clinic_id: contact.clinic_id,
              phone: phone,
              message: messageText,
              direction: 'inbound',
              status: 'received',
              evolution_message_id: data.key.id || null
            });

            console.log('✅ WhatsApp message logged successfully');
          }
        }
      }
    } catch (error) {
      console.error('❌ Error processing WhatsApp webhook:', error);
      throw error;
    }
  }

  private async findOrCreateContact(phone: string, instanceName: string): Promise<any> {
    try {
      // Extract clinic ID from instance name (assuming format: clinic_X)
      const clinicIdMatch = instanceName.match(/clinic_(\d+)/);
      const clinicId = clinicIdMatch ? parseInt(clinicIdMatch[1]) : 1;

      // Try to find existing contact by phone
      const existingContact = await this.storage.findContactByPhone(phone, clinicId);
      
      if (existingContact) {
        return existingContact;
      }

      // Create new contact if not found
      const newContact = await this.storage.createContact({
        clinic_id: clinicId,
        name: `WhatsApp ${phone}`,
        phone: phone,
        source: 'whatsapp'
      });

      console.log('✅ New contact created from WhatsApp:', newContact);
      return newContact;
    } catch (error) {
      console.error('❌ Error finding/creating contact:', error);
      return null;
    }
  }
}