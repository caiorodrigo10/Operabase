interface EvolutionMediaPayload {
  number: string;
  mediaMessage: {
    mediaType: 'image' | 'video' | 'document' | 'audio';
    fileName?: string;
    caption?: string;
    media: string;
  };
  options?: {
    delay?: number;
    presence?: 'composing' | 'recording';
  };
}

interface EvolutionResponse {
  key?: {
    id: string;
    remoteJid: string;
    fromMe: boolean;
  };
  message?: any;
  messageTimestamp?: string;
  status?: string;
}

export class EvolutionAPIService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.EVOLUTION_URL || '';
    this.apiKey = process.env.EVOLUTION_API_KEY || '';
    
    if (!this.baseUrl || !this.apiKey) {
      console.warn('⚠️ Evolution API not configured properly');
    }
  }

  async sendMedia(instanceId: string, payload: EvolutionMediaPayload): Promise<EvolutionResponse> {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error('Evolution API not configured');
    }

    console.log(`📡 Sending media via Evolution API to instance ${instanceId}:`);
    console.log('📡 Full payload received:', JSON.stringify(payload, null, 2));
    console.log('📡 Payload details:', {
      hasNumber: !!payload?.number,
      number: payload?.number,
      hasMediaMessage: !!payload?.mediaMessage,
      mediaType: payload?.mediaMessage?.mediaType,
      hasCaption: !!payload?.mediaMessage?.caption
    });

    try {
      const response = await fetch(`${this.baseUrl}/message/sendMedia/${instanceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Evolution API error ${response.status}:`, errorText);
        throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
      }

      const result: EvolutionResponse = await response.json();
      console.log('✅ Evolution API response:', {
        messageId: result.key?.id,
        status: result.status
      });

      return result;

    } catch (error) {
      console.error('❌ Evolution API request failed:', error);
      throw error;
    }
  }

  async sendText(instanceId: string, number: string, text: string): Promise<EvolutionResponse> {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error('Evolution API not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/message/sendText/${instanceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        },
        body: JSON.stringify({
          number,
          text
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('❌ Evolution API text send failed:', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return !!(this.baseUrl && this.apiKey);
  }
}