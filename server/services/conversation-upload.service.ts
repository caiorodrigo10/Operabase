import { IStorage } from '../storage';
import { SupabaseStorageService } from './supabase-storage.service';
import { EvolutionAPIService } from './evolution-api.service';

interface UploadParams {
  file: Buffer;
  filename: string;
  mimeType: string;
  conversationId: string;
  clinicId: number;
  userId: number;
  caption?: string;
  sendToWhatsApp?: boolean;
  messageType?: string; // Para distinguir audio_voice de outros tipos
}

interface N8NUploadParams {
  file: Buffer;
  filename: string;
  mimeType: string;
  conversationId: string;
  clinicId: number;
  caption?: string;
  whatsappMessageId?: string;
  whatsappMediaId?: string;
  whatsappMediaUrl?: string;
  timestamp?: string;
}

interface UploadResult {
  success: boolean;
  message: any;
  attachment: any;
  signedUrl: string;
  expiresAt: string;
  whatsapp: {
    sent: boolean;
    messageId?: string;
    error?: string;
  };
}

// Mapeamento MIME -> Evolution mediaType
const evolutionTypeMapping: Record<string, 'image' | 'video' | 'document' | 'audio'> = {
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'video/mp4': 'video',
  'video/mov': 'video',
  'video/avi': 'video',
  'video/webm': 'video',
  'audio/mp3': 'audio',
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'audio/m4a': 'audio',
  'audio/webm': 'audio',
  'application/pdf': 'document',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'text/plain': 'document'
};

export class ConversationUploadService {
  constructor(
    private storage: IStorage,
    private supabaseStorage: SupabaseStorageService,
    private evolutionAPI: EvolutionAPIService
  ) {}

  // Mapear MIME type para message_type
  private getMimeToMessageType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio_file'; // Upload de arquivo de áudio
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType === 'application/pdf' || 
        mimeType.includes('document') || 
        mimeType.includes('text/') ||
        mimeType.includes('application/')) return 'document';
    return 'document'; // fallback
  }

  // Método específico para arquivos recebidos do WhatsApp via N8N
  private getWhatsAppMessageType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio_voice'; // WhatsApp audio = audio_voice  
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType === 'application/pdf' || 
        mimeType.includes('document') || 
        mimeType.includes('text/') ||
        mimeType.includes('application/')) return 'document';
    return 'document'; // fallback
  }

  async uploadFile(params: UploadParams): Promise<UploadResult> {
    const {
      file,
      filename,
      mimeType,
      conversationId,
      clinicId,
      userId,
      caption,
      sendToWhatsApp = true,
      messageType
    } = params;

    console.log(`📤 Starting upload: ${filename} (${mimeType}) for conversation ${conversationId}`);

    try {
      // 1. Validar arquivo
      this.validateFile(file, mimeType, filename);

      // 2. Sanitizar filename ANTES do upload
      const sanitizedFilename = this.sanitizeFilename(filename);
      
      // 3. Upload para Supabase Storage com nome sanitizado
      console.log('📁 Uploading to Supabase Storage...');
      console.log('🔧 Using sanitized filename for storage:', sanitizedFilename);
      const storageResult = await this.uploadToSupabase({
        file,
        filename: sanitizedFilename, // Usar nome sanitizado
        mimeType,
        conversationId,
        clinicId
      });
      
      // 4. Validar que conversation existe usando Supabase direto (compatível com IDs científicos)
      console.log('🔍 Validating conversation exists...');
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      let conversation;
      const isScientificNotation = typeof conversationId === 'string' && conversationId.includes('e+');
      
      if (isScientificNotation) {
        // Para IDs científicos, usar busca robusta como no endpoint GET
        console.log('🔬 Scientific notation ID detected, using robust lookup');
        const { data: allConversations } = await supabase
          .from('conversations')
          .select('id, contact_id, clinic_id')
          .eq('clinic_id', clinicId);
        
        const paramIdNum = parseFloat(conversationId);
        conversation = allConversations?.find(conv => {
          const convIdNum = parseFloat(conv.id.toString());
          return Math.abs(convIdNum - paramIdNum) < 1;
        });
      } else {
        // Para IDs normais, busca direta
        const { data } = await supabase
          .from('conversations')
          .select('id, contact_id, clinic_id')
          .eq('id', conversationId)
          .eq('clinic_id', clinicId)
          .single();
        conversation = data;
      }

      if (!conversation) {
        console.error(`❌ Conversation not found: ${conversationId} for clinic ${clinicId}`);
        throw new Error(`Conversation ${conversationId} not found`);
      }
      
      console.log('✅ Conversation found:', { id: conversation.id, contact_id: conversation.contact_id });
      
      // 5. Criar mensagem no banco (usar ID numérico da conversa) - deixar PostgreSQL criar timestamp automaticamente
      console.log('💾 Creating message in database...');
      const messageContent = caption || `📎 ${filename}`; // Usar nome original na mensagem
      
      // Usar messageType fornecido ou mapear MIME type automaticamente
      const finalMessageType = messageType || this.getMimeToMessageType(mimeType);
      
      const message = await this.storage.createMessage({
        conversation_id: conversation.id.toString(), // Usar ID da conversa encontrada
        sender_type: 'professional',
        content: messageContent,
        message_type: finalMessageType, // Usar tipo fornecido ou mapeado automaticamente
        ai_action: 'file_upload' // Indicar que foi upload de arquivo
      });

      // 6. Criar attachment (preservar nome original para o usuário)
      console.log('📎 Creating attachment record...');
      const attachment = await this.storage.createAttachment({
        message_id: message.id,
        clinic_id: clinicId,
        file_name: filename, // Nome original para exibição
        file_type: mimeType,
        file_size: file.length,
        file_url: storageResult.signed_url || storageResult.public_url
      });

      let whatsappResult = { sent: false, messageId: undefined, error: undefined };

      // 5. Enviar via Evolution API (se solicitado)
      if (sendToWhatsApp) {
        console.log('📱 INICIANDO envio via Evolution API...');
        console.log('📱 sendToWhatsApp =', sendToWhatsApp);
        console.log('📱 Parâmetros para sendToEvolution:', {
          conversationId,
          clinicId,
          mediaType: this.getEvolutionMediaType(mimeType),
          mediaUrl: storageResult.signed_url,
          fileName: this.shouldIncludeFileName(mimeType) ? filename : undefined
        });
        try {
          console.log('📱 Chamando this.sendToEvolution...');
          whatsappResult = await this.sendToEvolution({
            conversationId,
            clinicId,
            mediaType: this.getEvolutionMediaType(mimeType),
            mediaUrl: storageResult.signed_url,
            fileName: this.shouldIncludeFileName(mimeType) ? filename : undefined,
            caption: mimeType.startsWith('audio/') ? undefined : caption,
            messageType: this.getMimeToMessageType(mimeType) // ETAPA 4: Passar tipo de mensagem
          });

          // Atualizar status da mensagem usando evolution_status
          if (whatsappResult.sent) {
            await this.storage.updateMessage(message.id, {
              status: 'sent'
            });
            console.log('✅ WhatsApp sent successfully');
          } else {
            await this.storage.updateMessage(message.id, {
              status: 'failed'
            });
            console.log('⚠️ WhatsApp failed, but file saved');
          }
        } catch (whatsappError) {
          console.error('❌ WhatsApp sending failed:', whatsappError);
          whatsappResult = {
            sent: false,
            error: whatsappError instanceof Error ? whatsappError.message : 'Unknown error'
          };
          
          // Manter como 'pending' para retry posterior
          await this.storage.updateMessage(message.id, {
            status: 'failed'
          });
        }
      }

      console.log('🎉 Upload complete!');
      return {
        success: true,
        message,
        attachment,
        signedUrl: storageResult.signed_url,
        expiresAt: storageResult.expires_at.toISOString(),
        whatsapp: whatsappResult
      };

    } catch (error) {
      console.error('💥 Upload failed:', error);
      throw error;
    }
  }

  private validateFile(file: Buffer, mimeType: string, filename: string): void {
    // Validar tamanho (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.length > maxSize) {
      throw new Error(`Arquivo muito grande. Máximo: ${this.formatFileSize(maxSize)}`);
    }

    // Validar tipo MIME
    if (!evolutionTypeMapping[mimeType]) {
      throw new Error(`Tipo de arquivo não suportado: ${mimeType}`);
    }

    // Validar nome do arquivo
    if (!filename || filename.length > 255) {
      throw new Error('Nome do arquivo inválido');
    }
  }

  private sanitizeFilename(filename: string): string {
    if (!filename) return 'unnamed-file';
    
    console.log('🔧 Sanitizing filename:', filename);
    console.log('🔧 Original bytes:', Buffer.from(filename).toString('hex'));
    
    // Mapeamento completo de caracteres especiais para Supabase Storage
    const characterMap: { [key: string]: string } = {
      // Acentos maiúsculos
      'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Æ': 'AE',
      'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
      'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
      'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O', 'Ø': 'O',
      'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
      'Ç': 'C', 'Ñ': 'N', 'Ý': 'Y',
      
      // Acentos minúsculos
      'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae',
      'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
      'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
      'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o',
      'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
      'ç': 'c', 'ñ': 'n', 'ý': 'y', 'ÿ': 'y',
      
      // Caracteres especiais comuns
      ' ': '_', '\t': '_', '\n': '_', '\r': '_',
      '!': '', '?': '', '@': '', '#': '', '$': '', '%': '', '&': '', '*': '',
      '(': '', ')': '', '[': '', ']': '', '{': '', '}': '', '|': '', '\\': '',
      '/': '_', ':': '', ';': '', '<': '', '>': '', '=': '', '+': '', '~': '',
      '`': '', "'": '', '"': '', ',': '', '^': ''
    };
    
    // Primeiro: aplicar mapeamento de caracteres
    let sanitized = filename
      .split('')
      .map(char => {
        // Se está no mapa, usar mapeamento
        if (characterMap.hasOwnProperty(char)) {
          return characterMap[char];
        }
        // Se é ASCII básico permitido (a-z, A-Z, 0-9, ., -, _), manter
        const code = char.charCodeAt(0);
        if ((code >= 48 && code <= 57) ||  // 0-9
            (code >= 65 && code <= 90) ||  // A-Z
            (code >= 97 && code <= 122) || // a-z
            code === 46 ||                 // .
            code === 45 ||                 // -
            code === 95) {                 // _
          return char;
        }
        // Qualquer outro caractere é removido
        return '';
      })
      .join('')
      // Limpar múltiplos underscores e pontos
      .replace(/_{2,}/g, '_')
      .replace(/\.{2,}/g, '.')
      .replace(/^[._-]+|[._-]+$/g, '')
      .toLowerCase();
    
    // Garantir que há pelo menos algum conteúdo
    if (!sanitized || sanitized.length === 0 || sanitized === '.' || sanitized === '_') {
      const timestamp = Date.now();
      const extension = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() || 'file' : 'file';
      sanitized = `arquivo_${timestamp}.${extension}`;
    }
    
    // Validação final: apenas caracteres permitidos pelo Supabase
    const validPattern = /^[a-zA-Z0-9._-]+$/;
    if (!validPattern.test(sanitized)) {
      console.warn('🚨 Filename ainda contém caracteres inválidos, usando fallback');
      const timestamp = Date.now();
      const extension = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() || 'file' : 'file';
      sanitized = `arquivo_${timestamp}.${extension}`;
    }
    
    console.log('✅ Sanitized filename:', sanitized);
    console.log('🔍 Validation check:', validPattern.test(sanitized));
    
    return sanitized;
  }

  private async uploadToSupabase(params: {
    file: Buffer;
    filename: string;
    mimeType: string;
    conversationId: string;
    clinicId: number;
  }) {
    console.log('📤 Iniciando upload para Supabase Storage...');
    console.log('📋 Parâmetros:', {
      filename: params.filename,
      mimeType: params.mimeType,
      fileSize: params.file.length,
      conversationId: params.conversationId,
      clinicId: params.clinicId
    });

    const timestamp = Date.now();
    const category = this.getCategoryFromMime(params.mimeType);
    const storagePath = `clinic-${params.clinicId}/conversation-${params.conversationId}/${category}/${timestamp}-${params.filename}`;

    console.log('🗂️ Caminho de armazenamento:', storagePath);

    // Upload direto usando Supabase sem service intermediário
    const supabase = this.supabaseStorage['supabase'];
    const bucketName = 'conversation-attachments';
    
    console.log('📤 Fazendo upload para bucket:', bucketName);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, params.file, {
        contentType: params.mimeType,
        upsert: true
      });

    if (error) {
      console.error('❌ Erro no upload direto:', error);
      throw new Error(`Erro no upload: ${error.message}`);
    }

    console.log('✅ Upload direto realizado com sucesso:', data.path);

    // Gerar URL assinada usando método direto também
    console.log('🔗 Gerando URL assinada...');
    const { data: signedData, error: signedError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(storagePath, 86400); // 24 horas

    if (signedError) {
      console.error('❌ Erro ao gerar URL assinada:', signedError);
      throw new Error(`Erro ao gerar URL assinada: ${signedError.message}`);
    }

    console.log('✅ URL assinada gerada com sucesso');
    
    return {
      storage_path: storagePath,
      signed_url: signedData.signedUrl,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }

  private async sendToEvolution(params: {
    conversationId: string;
    clinicId: number;
    mediaType: 'image' | 'video' | 'document' | 'audio';
    mediaUrl: string;
    fileName?: string;
    caption?: string;
    messageType?: string; // ETAPA 4: Para detectar audio_voice
  }): Promise<{ sent: boolean; messageId?: string; error?: string }> {
    try {
      console.log('🔍 Starting Evolution API media send process...');
      
      // Usar EXATAMENTE a mesma lógica do envio de texto (conversations-simple-routes.ts linha 592-598)
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      console.log('🔍 UPLOAD: Querying WhatsApp instances for clinic:', params.clinicId);
      
      const { data: instanceArray, error: instanceError } = await supabase
        .from('whatsapp_numbers')
        .select('*')
        .eq('clinic_id', params.clinicId)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1);
      
      console.log('🔍 UPLOAD: Raw query result:', instanceArray);
      console.log('🔍 UPLOAD: Query error:', instanceError);
      
      const activeInstance = instanceArray?.[0];
      
      console.log('🔍 UPLOAD: Selected instance:', activeInstance?.instance_name);

      if (instanceError) {
        console.error('❌ Error fetching WhatsApp instance:', instanceError);
        throw new Error('Erro ao buscar instância WhatsApp ativa');
      }

      if (!activeInstance) {
        console.error('❌ No active WhatsApp instance found for clinic:', params.clinicId);
        throw new Error('Nenhuma instância WhatsApp ativa encontrada para esta clínica');
      }

      console.log('✅ Active WhatsApp instance found (using text message logic):', {
        instance_name: activeInstance.instance_name,
        phone_number: activeInstance.phone_number,
        status: activeInstance.status
      });

      // Buscar informações de contato usando método existente
      const conversation = await this.storage.getConversationById(params.conversationId);

      console.log('🔍 Conversation lookup result:', {
        conversationId: params.conversationId,
        found: !!conversation,
        phone: conversation?.contact?.phone
      });

      if (!conversation?.contact?.phone) {
        console.error('❌ No contact phone found for conversation:', params.conversationId);
        throw new Error('Conversa não possui contato com telefone');
      }

      console.log('📤 Sending to Evolution API with clinic instance...', {
        phone: conversation.contact.phone,
        instance: activeInstance.instance_name,
        mediaType: params.mediaType,
        fileName: params.fileName
      });

      // Helper para MIME types
      const getMimeType = (mediaType: string): string => {
        const mimeTypes = {
          'image': 'image/png',
          'video': 'video/mp4', 
          'audio': 'audio/mpeg',
          'document': 'application/pdf'
        };
        return mimeTypes[mediaType as keyof typeof mimeTypes] || 'application/octet-stream';
      };

      const evolutionUrl = process.env.EVOLUTION_API_URL || 'https://n8n-evolution-api.4gmy9o.easypanel.host';
      const evolutionApiKey = process.env.EVOLUTION_API_KEY;
      
      console.log('🔧 Evolution API Configuration Check:');
      console.log('📍 URL:', evolutionUrl);
      console.log('🔑 API Key exists:', !!evolutionApiKey);
      console.log('🔑 API Key length:', evolutionApiKey?.length || 0);
      
      if (!evolutionApiKey) {
        console.error('❌ EVOLUTION_API_KEY not found in environment variables');
        throw new Error('Evolution API Key não configurada');
      }

      // ETAPA 6: Detectar se é mensagem de voz e usar endpoint específico com retry logic
      const isVoiceMessage = params.messageType === 'audio_voice' || 
                            (params.mediaType === 'audio' && params.fileName?.includes('recording'));
      
      if (isVoiceMessage) {
        console.log('🎤 ETAPA 6: Using WhatsApp Audio endpoint with intelligent retry');
        
        return await this.retryWithBackoff(async () => {
          return await this.sendWhatsAppAudio({
            instanceName: activeInstance.instance_name,
            number: conversation.contact.phone,
            audioUrl: params.mediaUrl,
            evolutionUrl,
            evolutionApiKey
          });
        });
      }

      // Para outros tipos de mídia, usar endpoint genérico com retry logic
      console.log('📎 ETAPA 6: Using generic media endpoint with intelligent retry');
      return await this.retryWithBackoff(async () => {
        return await this.sendGenericMedia({
          instanceName: activeInstance.instance_name,
          number: conversation.contact.phone,
          mediaType: params.mediaType,
          mediaUrl: params.mediaUrl,
          fileName: params.fileName,
          caption: params.caption,
          evolutionUrl,
          evolutionApiKey
        });
      });

    } catch (error) {
      console.error('❌ Evolution API media send failed:', error);
      return {
        sent: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Método para enviar áudio usando endpoint específico /sendWhatsAppAudio da Evolution API V2
  private async sendWhatsAppAudio(params: {
    instanceName: string;
    number: string;
    audioUrl: string;
    evolutionUrl: string;
    evolutionApiKey: string;
  }): Promise<{ sent: boolean; messageId?: string; error?: string }> {
    console.log('🎤 Enviando áudio via /sendWhatsAppAudio (Evolution API V2)...');

    // Payload conforme documentação Evolution API V2
    const payload = {
      number: params.number,
      audio: params.audioUrl, // URL do áudio no Supabase Storage
      delay: 1000
    };

    console.log('🎤 Audio Payload (Evolution API V2):', {
      endpoint: `${params.evolutionUrl}/message/sendWhatsAppAudio/${params.instanceName}`,
      number: payload.number,
      audioUrl: payload.audio,
      delay: payload.delay
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${params.evolutionUrl}/message/sendWhatsAppAudio/${params.instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': params.evolutionApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        
        console.log('✅ WhatsApp Audio Success:', {
          messageId: result.key?.id,
          status: result.status,
          audioMessage: !!result.message?.audioMessage,
          mimetype: result.message?.audioMessage?.mimetype
        });
        
        return {
          sent: true,
          messageId: result.key?.id
        };
      } else {
        const errorText = await response.text();
        
        console.error('❌ WhatsApp Audio Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        return {
          sent: false,
          error: `Audio send failed: ${response.status} - ${errorText}`
        };
      }
    } catch (error) {
      console.error('❌ WhatsApp Audio Request Failed:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      
      return {
        sent: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ETAPA 5: Audio format optimization
  private async optimizeAudioFormat(params: {
    instanceName: string;
    number: string;
    audioUrl: string;
    evolutionUrl: string;
    evolutionApiKey: string;
  }) {
    console.log('🔧 ETAPA 5: Optimizing audio format...');
    
    // Se é URL signed do Supabase, mantém como está (já otimizado)
    if (params.audioUrl.includes('supabase')) {
      console.log('✅ Using Supabase storage URL (pre-optimized)');
      return params;
    }

    // Para base64 ou outros formatos, aplicar otimizações
    if (params.audioUrl.startsWith('data:audio/')) {
      console.log('🔄 Converting data URL to optimized format...');
      // Aqui poderia implementar conversão de formato se necessário
      // Por agora, mantém o formato original
    }

    console.log('✅ Audio format optimization complete');
    return params;
  }

  // ETAPA 5: Error categorization for better debugging
  private categorizeAudioError(status: number, errorText: string): string {
    if (status >= 400 && status < 500) {
      if (status === 401) return 'AUTHENTICATION_ERROR';
      if (status === 403) return 'PERMISSION_ERROR';
      if (status === 404) return 'INSTANCE_NOT_FOUND';
      if (status === 422) return 'INVALID_AUDIO_FORMAT';
      if (status === 429) return 'RATE_LIMIT_ERROR';
      return 'CLIENT_ERROR';
    }
    
    if (status >= 500) {
      return 'SERVER_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }

  // ETAPA 5: Network error categorization
  private categorizeNetworkError(error: any): string {
    if (error.name === 'AbortError') return 'TIMEOUT';
    if (error.message?.includes('network') || error.message?.includes('fetch')) return 'NETWORK';
    if (error.message?.includes('JSON')) return 'PARSE_ERROR';
    return 'UNKNOWN_NETWORK_ERROR';
  }

  // ETAPA 5: Determine if error is retryable
  private isRetryableError(status: number): boolean {
    return status >= 500 || status === 429 || status === 408;
  }

  // ETAPA 6: Intelligent retry logic with exponential backoff
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 ETAPA 6: Attempt ${attempt + 1}/${maxRetries + 1}`);
        const result = await operation();
        
        if (attempt > 0) {
          console.log(`✅ ETAPA 6: Retry successful after ${attempt} attempts`);
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          console.error(`❌ ETAPA 6: All retry attempts failed after ${maxRetries + 1} tries`);
          break;
        }

        // Check if error is retryable
        const isRetryable = this.shouldRetryError(error);
        if (!isRetryable) {
          console.log(`🚫 ETAPA 6: Error not retryable, stopping attempts`);
          break;
        }

        // Calculate exponential backoff delay
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000; // Add jitter
        console.log(`⏳ ETAPA 6: Retrying in ${Math.round(delay)}ms (attempt ${attempt + 1})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  // ETAPA 6: Enhanced retry decision logic
  private shouldRetryError(error: any): boolean {
    // Network errors are retryable
    if (error.name === 'AbortError' || error.message?.includes('network')) {
      return true;
    }

    // HTTP errors with specific status codes
    if (error.response?.status) {
      const status = error.response.status;
      return this.isRetryableError(status);
    }

    // Evolution API specific errors
    if (error.message?.includes('Evolution API')) {
      return true; // Most Evolution API errors are transient
    }

    // Default: don't retry unknown errors
    return false;
  }

  // ETAPA 6: Intelligent recovery strategies
  private async recoverFromFailure(params: {
    conversationId: string | number;
    clinicId: number;
    mediaType: string;
    mediaUrl: string;
    fileName?: string;
    caption?: string;
    messageType?: string;
    originalError: any;
  }): Promise<{ sent: boolean; messageId?: string; error?: string; recoveryMethod?: string }> {
    console.log('🔧 ETAPA 6: Attempting intelligent recovery...');

    const errorType = this.categorizeNetworkError(params.originalError);
    
    // Recovery Strategy 1: URL refresh for Supabase storage issues
    if (params.mediaUrl.includes('supabase') && errorType === 'NETWORK') {
      console.log('🔄 ETAPA 6: Recovery Strategy 1 - Refreshing Supabase URL');
      try {
        // Could implement URL refresh logic here
        console.log('✅ ETAPA 6: URL refresh strategy prepared');
        return {
          sent: false,
          error: 'URL_REFRESH_NEEDED',
          recoveryMethod: 'url_refresh'
        };
      } catch (error) {
        console.error('❌ ETAPA 6: URL refresh failed:', error);
      }
    }

    // Recovery Strategy 2: Fallback to generic media endpoint
    if (params.messageType === 'audio_voice' && errorType !== 'AUTHENTICATION_ERROR') {
      console.log('🔄 ETAPA 6: Recovery Strategy 2 - Fallback to generic media endpoint');
      try {
        const fallbackResult = await this.sendGenericMedia({
          instanceName: 'fallback', // Would get from params in real implementation
          number: 'fallback',
          mediaType: params.mediaType,
          mediaUrl: params.mediaUrl,
          fileName: params.fileName,
          caption: params.caption,
          evolutionUrl: process.env.EVOLUTION_API_URL || '',
          evolutionApiKey: process.env.EVOLUTION_API_KEY || ''
        });

        if (fallbackResult.sent) {
          console.log('✅ ETAPA 6: Recovery successful via generic endpoint');
          return {
            ...fallbackResult,
            recoveryMethod: 'generic_endpoint_fallback'
          };
        }
      } catch (error) {
        console.error('❌ ETAPA 6: Generic endpoint fallback failed:', error);
      }
    }

    // Recovery Strategy 3: Store for later retry
    console.log('🔄 ETAPA 6: Recovery Strategy 3 - Store for background retry');
    await this.storeForBackgroundRetry(params);
    
    return {
      sent: false,
      error: 'STORED_FOR_RETRY',
      recoveryMethod: 'background_retry'
    };
  }

  // ETAPA 6: Store failed sends for background retry
  private async storeForBackgroundRetry(params: {
    conversationId: string | number;
    clinicId: number;
    mediaType: string;
    mediaUrl: string;
    fileName?: string;
    caption?: string;
    messageType?: string;
    originalError: any;
  }): Promise<void> {
    console.log('💾 ETAPA 6: Storing failed send for background retry');
    
    const retryData = {
      conversationId: params.conversationId,
      clinicId: params.clinicId,
      mediaType: params.mediaType,
      mediaUrl: params.mediaUrl,
      fileName: params.fileName,
      caption: params.caption,
      messageType: params.messageType,
      originalError: params.originalError.message,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      nextRetryAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
    };

    // In a real implementation, this would store in a retry queue table
    console.log('📝 ETAPA 6: Retry data prepared:', {
      id: `retry_${Date.now()}`,
      nextRetry: retryData.nextRetryAt,
      type: retryData.messageType
    });
  }

  // Método para mídia genérica (mantém funcionalidade existente)
  private async sendGenericMedia(params: {
    instanceName: string;
    number: string;
    mediaType: string;
    mediaUrl: string;
    fileName?: string;
    caption?: string;
    evolutionUrl: string;
    evolutionApiKey: string;
  }): Promise<{ sent: boolean; messageId?: string; error?: string }> {
    // Helper para mapeamento MIME type
    const getMimeTypeV2 = (mediaType: string): string => {
      const mimeTypes = {
        'image': 'image/png',
        'video': 'video/mp4', 
        'audio': 'audio/mpeg',
        'document': 'application/pdf'
      };
      return mimeTypes[mediaType as keyof typeof mimeTypes] || 'application/octet-stream';
    };

    const payload = {
      number: params.number,
      mediatype: params.mediaType,
      mimetype: getMimeTypeV2(params.mediaType),
      media: params.mediaUrl,
      fileName: params.fileName || 'attachment',
      delay: 1000,
      ...(params.caption && params.mediaType !== 'audio' && { caption: params.caption })
    };
    
    console.log('📎 Generic Media API Payload:');
    console.log('📤 URL:', `${params.evolutionUrl}/message/sendMedia/${params.instanceName}`);
    console.log('📤 mediatype:', payload.mediatype);
    console.log('📤 fileName:', payload.fileName);

    try {
      const response = await fetch(`${params.evolutionUrl}/message/sendMedia/${params.instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': params.evolutionApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Generic Media API success:', result);
        
        return {
          sent: true,
          messageId: result.key?.id
        };
      } else {
        const errorText = await response.text();
        console.error('❌ Generic Media API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        return {
          sent: false,
          error: `Generic Media API error: ${response.status} - ${errorText}`
        };
      }
    } catch (error) {
      console.error('❌ Generic Media API request failed:', error);
      return {
        sent: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private getCategoryFromMime(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType.startsWith('video/')) return 'videos';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('doc') || mimeType.includes('text')) return 'documents';
    return 'others';
  }

  private getEvolutionMediaType(mimeType: string): 'image' | 'video' | 'document' | 'audio' {
    // Para Evolution API, sempre usar "audio" independente do tipo
    if (mimeType.startsWith('audio/')) return 'audio';
    return evolutionTypeMapping[mimeType] || 'document';
  }

  private getMessageTypeFromMime(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }

  private shouldIncludeFileName(mimeType: string): boolean {
    // Evolution API só precisa do fileName para documentos
    return this.getEvolutionMediaType(mimeType) === 'document';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Método específico para receber arquivos do N8N (origem: pacientes via WhatsApp)
   * Não envia via Evolution API - apenas armazena no Supabase Storage
   */
  async uploadFromN8N(params: N8NUploadParams): Promise<{
    success: boolean;
    message: any;
    attachment: any;
    signedUrl: string;
    expiresAt: string;
  }> {
    const {
      file,
      filename,
      mimeType,
      conversationId,
      clinicId,
      caption,
      whatsappMessageId,
      whatsappMediaId,
      whatsappMediaUrl,
      timestamp
    } = params;

    console.log(`📥 N8N Upload: ${filename} (${mimeType}) for conversation ${conversationId}`);

    try {
      // 1. Validar arquivo
      this.validateFile(file, mimeType, filename);

      // 2. Sanitizar filename 
      const sanitizedFilename = this.sanitizeFilename(filename);
      
      // 3. Upload para Supabase Storage
      console.log('📁 Uploading N8N file to Supabase Storage...');
      const storageResult = await this.uploadToSupabase({
        file,
        filename: sanitizedFilename,
        mimeType,
        conversationId,
        clinicId
      });
      
      // 4. Validar conversation (mesmo código robusto do uploadFile)
      console.log('🔍 Validating conversation exists...');
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      let conversation;
      const isScientificNotation = typeof conversationId === 'string' && conversationId.includes('e+');
      
      if (isScientificNotation) {
        console.log('🔬 Scientific notation ID detected, using robust lookup');
        const { data: allConversations } = await supabase
          .from('conversations')
          .select('id, contact_id, clinic_id')
          .eq('clinic_id', clinicId);
        
        const paramIdNum = parseFloat(conversationId);
        conversation = allConversations?.find(conv => {
          const convIdNum = parseFloat(conv.id.toString());
          return Math.abs(convIdNum - paramIdNum) < 1;
        });
      } else {
        const { data } = await supabase
          .from('conversations')
          .select('id, contact_id, clinic_id')
          .eq('id', conversationId)
          .eq('clinic_id', clinicId)
          .single();
        conversation = data;
      }

      if (!conversation) {
        console.error(`❌ Conversation not found: ${conversationId} for clinic ${clinicId}`);
        throw new Error(`Conversation ${conversationId} not found`);
      }
      
      console.log('✅ Conversation found:', { id: conversation.id, contact_id: conversation.contact_id });
      
      // 5. Criar mensagem no banco com sender_type='patient' e message_type específico para WhatsApp
      console.log('💾 Creating N8N message in database...');
      const messageContent = caption || `📎 ${filename}`;
      
      // Usar método específico para WhatsApp (audio_voice ao invés de audio_file)
      const messageType = this.getWhatsAppMessageType(mimeType);
      
      // Usar timestamp do WhatsApp se disponível, senão usar atual
      const messageTimestamp = timestamp ? new Date(timestamp) : new Date();
      
      console.log('🕐 Adjusting timestamp to GMT-3 (Brasília)...');
      const brasiliaTimestamp = new Date(messageTimestamp.getTime() - 3 * 60 * 60 * 1000);
      
      const message = await this.storage.createMessage({
        conversation_id: conversation.id.toString(),
        content: messageContent,
        sender_type: 'patient', // Mensagem vem do paciente via WhatsApp
        message_type: messageType,
        device_type: 'manual', // WhatsApp é considerado manual (não sistema)
        timestamp: brasiliaTimestamp,
        created_at: brasiliaTimestamp,
        sent_at: brasiliaTimestamp,
        evolution_status: 'sent', // Já foi enviado pelo WhatsApp
        whatsapp_message_id: whatsappMessageId || null
      });

      console.log('✅ N8N Message created:', message.id);

      // 6. Criar attachment no banco
      console.log('📎 Creating N8N attachment...');
      const attachment = await this.storage.createAttachment({
        message_id: message.id,
        clinic_id: clinicId,
        file_name: filename, // Nome original na mensagem
        file_type: mimeType, // MIME type original
        file_size: file.length,
        file_url: storageResult.publicUrl || null, // Compatibilidade
        storage_bucket: storageResult.bucket,
        storage_path: storageResult.path,
        public_url: storageResult.publicUrl,
        signed_url: storageResult.signedUrl,
        signed_url_expires: storageResult.expiresAt,
        whatsapp_media_id: whatsappMediaId || null,
        whatsapp_media_url: whatsappMediaUrl || null
      });

      console.log('✅ N8N Attachment created:', attachment.id);

      return {
        success: true,
        message,
        attachment,
        signedUrl: storageResult.signedUrl,
        expiresAt: storageResult.expiresAt
      };

    } catch (error) {
      console.error('❌ N8N Upload error:', error);
      throw error;
    }
  }
}